from fastapi import APIRouter, HTTPException, status, Depends, Query
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
            cur.execute("SELECT id FROM products WHERE id = %s", (review.product_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Product not found"
                )
            
            # Check if user already reviewed this product
            cur.execute("""
                SELECT id FROM reviews 
                WHERE user_id = %s AND product_id = %s
            """, (current_user["id"], review.product_id))
            
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="You have already reviewed this product"
                )
            
            # Create review
            review_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO reviews (
                    id, user_id, product_id, rating, title, content, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                review_id, current_user["id"], review.product_id,
                review.rating, review.title, review.content, "pending"
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
    """Add media to review"""
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
            
            media_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO review_media (id, review_id, media_url, media_type, sort_order)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (media_id, review_id, media.media_url, media.media_type, media.sort_order))
            
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