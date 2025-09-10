from fastapi import APIRouter, HTTPException, status, Depends, Query, UploadFile, File, Form
from typing import List, Optional
from models.schemas import (
    ReviewCreate, ReviewUpdate, ReviewResponse, ReviewFilter,
    ReviewProCreate, ReviewProResponse,
    ReviewConCreate, ReviewConResponse,
    ReviewMediaCreate, ReviewMediaResponse,
    ReviewHelpfulVoteCreate, ReviewHelpfulVoteResponse
)
from auth.security import get_current_user, get_current_admin_user
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging
import uuid
import tempfile
import os
import shutil
import requests

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/reviews", tags=["Reviews"])

@router.get("/", response_model=List[ReviewResponse])
def list_reviews(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    product_id: Optional[str] = Query(None),
    user_id: Optional[str] = Query(None),
    rating: Optional[int] = Query(None),
    status: str = Query("published"),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc")
):
    """List reviews with filtering"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if product_id:
                where_conditions.append("r.product_id = %s")
                params.append(product_id)
            
            if user_id:
                where_conditions.append("r.user_id = %s")
                params.append(user_id)
            
            if rating:
                where_conditions.append("r.rating = %s")
                params.append(rating)
            
            if status:
                where_conditions.append("r.status = %s")
                params.append(status)
            
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            # Build ORDER BY clause
            valid_sort_fields = ["rating", "helpful_count", "created_at"]
            if sort_by not in valid_sort_fields:
                sort_by = "created_at"
            
            sort_order = "DESC" if sort_order.lower() == "desc" else "ASC"
            
            # Add pagination parameters
            params.extend([limit, offset])
            
            query = f"""
                SELECT 
                    r.*,
                    u.name as user_name,
                    u.role as user_role,
                    p.name as product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                {where_clause}
                ORDER BY r.{sort_by} {sort_order}
                LIMIT %s OFFSET %s
            """
            
            cur.execute(query, params)
            reviews = cur.fetchall()
            
            return reviews
            
    except Exception as e:
        logger.exception("Error listing reviews: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/{review_id}", response_model=dict)
def get_review(review_id: str):
    """Get detailed review information including pros, cons, and media"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get review details
            cur.execute("""
                SELECT 
                    r.*,
                    u.name as user_name,
                    u.role as user_role,
                    p.name as product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                WHERE r.id = %s
            """, (review_id,))
            
            review = cur.fetchone()
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            
            # Get review pros
            cur.execute("""
                SELECT * FROM review_pros 
                WHERE review_id = %s 
                ORDER BY sort_order
            """, (review_id,))
            pros = cur.fetchall()
            
            # Get review cons
            cur.execute("""
                SELECT * FROM review_cons 
                WHERE review_id = %s 
                ORDER BY sort_order
            """, (review_id,))
            cons = cur.fetchall()
            
            # Get review media
            cur.execute("""
                SELECT * FROM review_media 
                WHERE review_id = %s 
                ORDER BY sort_order
            """, (review_id,))
            media = cur.fetchall()
            
            return {
                **dict(review),
                "pros": pros,
                "cons": cons,
                "media": media
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting review %s: %s", review_id, e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/", response_model=ReviewResponse)
def create_review(
    review: ReviewCreate,
    current_user: dict = Depends(get_current_user)
):
    """Create new review"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (str(review.product_id),))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Product not found"
                )
            
            # Check if user already reviewed this product
            cur.execute("""
                SELECT id FROM reviews 
                WHERE user_id = %s AND product_id = %s
            """, (str(current_user["id"]), str(review.product_id)))
            
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already reviewed this product"
                )
            
            # Determine initial status based on user role
            # Reviewers get auto-published, regular users need approval
            initial_status = "published" if current_user.get("role") == "reviewer" else "pending"
            
            # Create review
            review_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO reviews (
                    id, user_id, product_id, rating, title, content, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                review_id, str(current_user["id"]), str(review.product_id),
                review.rating, review.title, review.content, initial_status
            ))
            
            new_review = cur.fetchone()
            conn.commit()
            
            # Get additional info
            cur.execute("""
                SELECT 
                    r.*,
                    u.name as user_name,
                    p.name as product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                WHERE r.id = %s
            """, (review_id,))
            
            return cur.fetchone()
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error creating review: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/{review_id}", response_model=ReviewResponse)
def update_review(
    review_id: str,
    review_update: ReviewUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update review (owner or admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get existing review
            cur.execute("SELECT * FROM reviews WHERE id = %s", (review_id,))
            existing_review = cur.fetchone()
            
            if not existing_review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            
            # Check ownership or admin
            if str(existing_review["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this review"
                )
            
            # Build update query
            update_fields = []
            values = []
            
            for field, value in review_update.dict(exclude_unset=True).items():
                if value is not None:
                    update_fields.append(f"{field} = %s")
                    values.append(value)
            
            if not update_fields:
                return existing_review
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(review_id)
            
            query = f"""
                UPDATE reviews 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(query, values)
            updated_review = cur.fetchone()
            conn.commit()
            
            # Get additional info
            cur.execute("""
                SELECT 
                    r.*,
                    u.name as user_name,
                    p.name as product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                WHERE r.id = %s
            """, (review_id,))
            
            return cur.fetchone()
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating review: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/{review_id}")
def delete_review(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete review (owner or admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get existing review
            cur.execute("SELECT * FROM reviews WHERE id = %s", (review_id,))
            existing_review = cur.fetchone()
            
            if not existing_review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            
            # Check ownership or admin
            if str(existing_review["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this review"
                )
            
            cur.execute("DELETE FROM reviews WHERE id = %s", (review_id,))
            conn.commit()
            
            return {"message": "Review deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting review: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Review Pros
@router.post("/{review_id}/pros", response_model=ReviewProResponse)
def add_review_pro(
    review_id: str,
    pro: ReviewProCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add pro to review"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check review ownership
            cur.execute("SELECT user_id FROM reviews WHERE id = %s", (review_id,))
            review = cur.fetchone()
            
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            
            if str(review["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this review"
                )
            
            pro_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO review_pros (id, review_id, pro_text, sort_order)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """, (pro_id, review_id, pro.pro_text, pro.sort_order))
            
            new_pro = cur.fetchone()
            conn.commit()
            return new_pro
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding review pro: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Review Cons
@router.post("/{review_id}/cons", response_model=ReviewConResponse)
def add_review_con(
    review_id: str,
    con: ReviewConCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add con to review"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check review ownership
            cur.execute("SELECT user_id FROM reviews WHERE id = %s", (review_id,))
            review = cur.fetchone()
            
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            
            if str(review["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this review"
                )
            
            con_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO review_cons (id, review_id, con_text, sort_order)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """, (con_id, review_id, con.con_text, con.sort_order))
            
            new_con = cur.fetchone()
            conn.commit()
            return new_con
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding review con: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Review Media
@router.post("/{review_id}/media", response_model=ReviewMediaResponse)
def add_review_media(
    review_id: str,
    media: ReviewMediaCreate,
    current_user: dict = Depends(get_current_user)
):
    """Add media to review (JSON with media_url)"""
    from discord_media import discord_client
    import re
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check review ownership
            cur.execute("SELECT user_id FROM reviews WHERE id = %s", (review_id,))
            review = cur.fetchone()
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            if str(review["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this review"
                )
            # Nếu media.media_url không phải là URL, upload lên Discord
            url_pattern = re.compile(r"^https?://")
            media_url = media.media_url
            if not url_pattern.match(media_url):
                # Upload file lên Discord, lấy URL trả về
                import asyncio
                loop = asyncio.get_event_loop()
                media_url = loop.run_until_complete(discord_client.upload_media(media_url))
            media_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO review_media (id, review_id, media_url, media_type, sort_order)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (media_id, review_id, media_url, media.media_type, media.sort_order))
            new_media = cur.fetchone()
            conn.commit()
            return new_media
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding review media: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/{review_id}/media/upload", response_model=ReviewMediaResponse)
async def upload_review_media(
    review_id: str,
    file: UploadFile = File(...),
    media_type: str = Form(...),
    sort_order: int = Form(0),
    current_user: dict = Depends(get_current_user)
):
    """Upload media file to review (via Discord bot or local storage fallback)"""
    logger.info(f"Starting media upload for review {review_id}, file: {file.filename}, type: {media_type}")
    
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check review ownership
            cur.execute("SELECT user_id FROM reviews WHERE id = %s", (review_id,))
            review = cur.fetchone()
            if not review:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            if str(review["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to modify this review"
                )
            
            # Validate file type and map MIME type to database type
            db_media_type = None
            if media_type.startswith('image/'):
                db_media_type = 'image'
            elif media_type.startswith('video/'):
                db_media_type = 'video'
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Only image and video files are allowed"
                )
            
            logger.info(f"File validation passed, saving temporarily...")
            
            # Save file temporarily
            temp_file_path = None
            media_url = None
            
            try:
                # Get file extension
                file_ext = ""
                if file.filename and "." in file.filename:
                    file_ext = "." + file.filename.split(".")[-1]
                
                with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                    content = await file.read()
                    temp_file.write(content)
                    temp_file_path = temp_file.name
                
                logger.info(f"File saved to temp path: {temp_file_path}")
                
                # Try Discord upload first
                try:
                    from discord_media import upload_media_to_discord
                    logger.info("Attempting Discord upload...")
                    media_url = await upload_media_to_discord(temp_file_path)
                    logger.info(f"Discord upload successful, URL: {media_url}")
                except Exception as discord_error:
                    logger.warning(f"Discord upload failed: {discord_error}")
                    
                    # Fallback: Create a local storage path
                    # In production, you'd upload to a cloud storage service here
                    uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads")
                    os.makedirs(uploads_dir, exist_ok=True)
                    
                    # Generate unique filename
                    import time
                    timestamp = int(time.time())
                    safe_filename = f"{timestamp}_{file.filename}" if file.filename else f"{timestamp}{file_ext}"
                    final_path = os.path.join(uploads_dir, safe_filename)
                    
                    # Copy temp file to uploads directory
                    import shutil
                    shutil.copy2(temp_file_path, final_path)
                    
                    # Create a local URL (you should replace this with your actual server URL)
                    media_url = f"http://127.0.0.1:8000/uploads/{safe_filename}"
                    logger.info(f"Fallback local storage successful, URL: {media_url}")
                
                # Save to database - use the mapped media type
                media_id = str(uuid.uuid4())
                cur.execute("""
                    INSERT INTO review_media (id, review_id, media_url, media_type, sort_order)
                    VALUES (%s, %s, %s, %s, %s)
                    RETURNING *
                """, (media_id, review_id, media_url, db_media_type, sort_order))
                new_media = cur.fetchone()
                conn.commit()
                
                logger.info(f"Media saved to database with ID: {media_id}")
                return new_media
                
            finally:
                # Clean up temporary file
                if temp_file_path and os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
                    logger.info("Temporary file cleaned up")
                    
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error uploading review media: %s", e)
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
    finally:
        put_conn(conn)

# Review Helpful Votes
@router.post("/{review_id}/helpful", response_model=ReviewHelpfulVoteResponse)
def vote_review_helpful(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Vote review as helpful"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if review exists
            cur.execute("SELECT id FROM reviews WHERE id = %s", (review_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            
            # Check if user already voted
            cur.execute("""
                SELECT id FROM review_helpful_votes 
                WHERE review_id = %s AND user_id = %s
            """, (review_id, current_user["id"]))
            
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already voted this review as helpful"
                )
            
            vote_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO review_helpful_votes (id, review_id, user_id)
                VALUES (%s, %s, %s)
                RETURNING *
            """, (vote_id, review_id, current_user["id"]))
            
            new_vote = cur.fetchone()
            conn.commit()
            return new_vote
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error voting review helpful: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/{review_id}/helpful")
def remove_helpful_vote(
    review_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Remove helpful vote from review"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                DELETE FROM review_helpful_votes 
                WHERE review_id = %s AND user_id = %s
                RETURNING id
            """, (review_id, current_user["id"]))
            
            deleted = cur.fetchone()
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Helpful vote not found"
                )
            
            conn.commit()
            return {"message": "Helpful vote removed successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error removing helpful vote: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Admin routes
@router.get("/pending", response_model=List[ReviewResponse])
def list_pending_reviews(
    current_admin: dict = Depends(get_current_admin_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List pending reviews (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    r.*,
                    u.name as user_name,
                    p.name as product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                WHERE r.status = 'pending'
                ORDER BY r.created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing pending reviews: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/{review_id}/approve")
def approve_review(
    review_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Approve review (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE reviews 
                SET status = 'published', updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id
            """, (review_id,))
            
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pending review not found"
                )
            
            conn.commit()
            return {"message": "Review approved successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error approving review: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/{review_id}/reject")
def reject_review(
    review_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Reject review (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE reviews 
                SET status = 'rejected', updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id
            """, (review_id,))
            
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pending review not found"
                )
            
            conn.commit()
            return {"message": "Review rejected successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error rejecting review: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Review Comments
@router.get("/{review_id}/comments", response_model=List[dict])
def list_review_comments(
    review_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: str = Query("visible")
):
    """List comments for a review"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                """
                SELECT 
                    c.*, 
                    u.name as user_name, 
                    u.avatar as user_avatar,
                    u.role as user_role
                FROM review_comments c
                JOIN users u ON c.user_id = u.id
                WHERE c.review_id = %s AND c.status = %s
                ORDER BY c.created_at DESC
                LIMIT %s OFFSET %s
                """,
                (review_id, status, limit, offset)
            )
            comments = cur.fetchall()
            return comments
    except Exception as e:
        logger.exception("Error listing review comments: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/{review_id}/comments", response_model=dict)
def create_review_comment(
    review_id: str,
    comment: dict,
    current_user: dict = Depends(get_current_user)
):
    """Create a comment for a review"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # --- Call clean-comment API trước khi lưu ---
            try:
                api_url = "http://127.0.0.1:8001/clean-comment"  # endpoint FastAPI (đã đổi sang port 8001)
                payload = {"text": comment["content"]}
                response = requests.post(api_url, json=payload, timeout=5)
                response.raise_for_status()
                masked_content = response.json()["masked"]
            except Exception as e:
                # Nếu API fail, fallback dùng content gốc
                logger.warning("Clean comment API failed, using original content: %s", e)
                masked_content = comment["content"]

            comment_id = str(uuid.uuid4())
            cur.execute(
                """
                INSERT INTO review_comments (
                    id, review_id, user_id, parent_id, content, status
                )
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    comment_id, review_id, str(current_user["id"]),
                    comment.get("parent_id"), masked_content, "visible"
                )
            )
            new_comment = cur.fetchone()
            conn.commit()
            return new_comment
    except Exception as e:
        conn.rollback()
        logger.exception("Error creating review comment: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/comments/{comment_id}", response_model=dict)
def update_review_comment(
    comment_id: str,
    comment_update: dict,
    current_user: dict = Depends(get_current_user)
):
    """Update a comment (owner or admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM review_comments WHERE id = %s", (comment_id,))
            existing_comment = cur.fetchone()

            if not existing_comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comment not found"
                )

            if (
                str(existing_comment["user_id"]) != str(current_user["id"])
                and current_user["role"] != "admin"
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this comment"
                )

            update_fields = []
            values = []

            for field, value in comment_update.items():
                if value is not None:
                    update_fields.append(f"{field} = %s")
                    values.append(value)

            if not update_fields:
                return existing_comment

            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(comment_id)

            query = f"""
                UPDATE review_comments
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """

            cur.execute(query, values)
            updated_comment = cur.fetchone()
            conn.commit()
            return updated_comment
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating review comment: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/comments/{comment_id}")
def delete_review_comment(
    comment_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete a comment (owner or admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM review_comments WHERE id = %s", (comment_id,))
            existing_comment = cur.fetchone()

            if not existing_comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comment not found"
                )

            if (
                str(existing_comment["user_id"]) != str(current_user["id"])
                and current_user["role"] != "admin"
            ):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this comment"
                )

            cur.execute("DELETE FROM review_comments WHERE id = %s", (comment_id,))
            conn.commit()
            return {"message": "Comment deleted successfully"}
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting review comment: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)