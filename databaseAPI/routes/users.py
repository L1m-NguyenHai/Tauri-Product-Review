from fastapi import APIRouter, HTTPException, status, Depends, Query, File, UploadFile, Form
from pydantic import BaseModel
from typing import List, Optional
import tempfile
import os
import shutil
from models.schemas import (
    UserResponse, UserUpdate, UserFollowCreate, UserFollowResponse,
    PaginationParams, UserRoleUpdate
)
from auth.security import get_current_user, get_current_admin_user
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging
import uuid

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/users", tags=["Users"])

@router.get("/profile/stats")
def get_user_stats(current_user: dict = Depends(get_current_user)):
    """Get current user's statistics"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get total reviews count
            cur.execute("""
                SELECT COUNT(*) as total_reviews
                FROM reviews
                WHERE user_id = %s AND status = 'published'
            """, (current_user["id"],))
            reviews_count = cur.fetchone()["total_reviews"]
            
            # Get average rating
            cur.execute("""
                SELECT AVG(rating) as avg_rating
                FROM reviews
                WHERE user_id = %s AND status = 'published'
            """, (current_user["id"],))
            avg_rating_result = cur.fetchone()["avg_rating"]
            avg_rating = float(avg_rating_result) if avg_rating_result else 0
            
            # Get helpful votes count (count of helpful votes received on user's reviews)
            cur.execute("""
                SELECT COUNT(*) as helpful_votes
                FROM review_helpful_votes rhv
                JOIN reviews r ON rhv.review_id = r.id
                WHERE r.user_id = %s
            """, (current_user["id"],))
            helpful_votes = cur.fetchone()["helpful_votes"]
            
            # Get followers count
            cur.execute("""
                SELECT COUNT(*) as followers
                FROM user_follows
                WHERE followed_id = %s
            """, (current_user["id"],))
            followers_count = cur.fetchone()["followers"]
            
            return {
                "total_reviews": reviews_count,
                "avg_rating": round(avg_rating, 1),
                "helpful_votes": helpful_votes,
                "followers": followers_count
            }
            
    except Exception as e:
        logger.exception("Error getting user stats: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/profile/avatar", response_model=UserResponse)
async def update_user_avatar(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile picture"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only image files are allowed"
        )
    
    # Validate file size (max 5MB)
    if file.size and file.size > 5 * 1024 * 1024:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File size must be less than 5MB"
        )
    
    conn = get_conn()
    try:
        # Save file temporarily
        temp_file_path = None
        avatar_url = None
        
        try:
            # Get file extension
            file_ext = ""
            if file.filename and "." in file.filename:
                file_ext = "." + file.filename.split(".")[-1]
            
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_ext) as temp_file:
                content = await file.read()
                temp_file.write(content)
                temp_file_path = temp_file.name
            
            logger.info(f"Avatar file saved to temp path: {temp_file_path}")
            
            # Try Discord upload first
            try:
                from utils.discord_media import upload_media_to_discord
                logger.info("Attempting Discord upload for avatar...")
                avatar_url = await upload_media_to_discord(temp_file_path)
                logger.info(f"Discord upload successful for avatar, URL: {avatar_url}")
            except Exception as discord_error:
                logger.warning(f"Discord upload failed for avatar: {discord_error}")
                
                # Fallback: Create a local storage path
                uploads_dir = os.path.join(os.path.dirname(__file__), "..", "uploads", "avatars")
                os.makedirs(uploads_dir, exist_ok=True)
                
                # Generate unique filename
                import time
                timestamp = int(time.time())
                safe_filename = f"{current_user['id']}_{timestamp}_{file.filename}" if file.filename else f"{current_user['id']}_{timestamp}{file_ext}"
                final_path = os.path.join(uploads_dir, safe_filename)
                
                # Copy temp file to uploads directory
                shutil.copy2(temp_file_path, final_path)
                
                # Create a local URL
                avatar_url = f"http://127.0.0.1:8000/uploads/avatars/{safe_filename}"
                logger.info(f"Fallback local storage successful for avatar, URL: {avatar_url}")
            
            # Update user avatar in database
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute("""
                    UPDATE users 
                    SET avatar = %s, updated_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                    RETURNING *
                """, (avatar_url, current_user["id"]))
                
                updated_user = cur.fetchone()
                conn.commit()
                
                logger.info(f"Avatar updated for user {current_user['id']}")
                return updated_user
                
        finally:
            # Clean up temporary file
            if temp_file_path and os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                logger.info("Temporary avatar file cleaned up")
                
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating user avatar: %s", e)
        raise HTTPException(status_code=500, detail=f"Avatar upload failed: {str(e)}")
    finally:
        put_conn(conn)

@router.get("/profile", response_model=UserResponse)
def get_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user's profile"""
    return current_user

@router.put("/profile", response_model=UserResponse)
def update_user_profile(
    user_update: UserUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update current user's profile"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            update_fields = []
            values = []
            
            if user_update.name is not None:
                update_fields.append("name = %s")
                values.append(user_update.name)
            
            if user_update.avatar is not None:
                update_fields.append("avatar = %s")
                values.append(user_update.avatar)
            
            if not update_fields:
                return current_user
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(current_user["id"])
            
            query = f"""
                UPDATE users 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(query, values)
            updated_user = cur.fetchone()
            conn.commit()
            
            return updated_user
            
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating user profile: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(user_id: str):
    """Get user by ID (public profile)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, email, name, avatar, role, email_verified, created_at, updated_at
                FROM users 
                WHERE id = %s
            """, (user_id,))
            
            user = cur.fetchone()
            if not user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            return user
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting user: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/{user_id}/reviews")
def get_user_reviews(
    user_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get user's reviews"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    r.*,
                    p.name as product_name,
                    u.name as user_name
                FROM reviews r
                JOIN products p ON r.product_id = p.id
                JOIN users u ON r.user_id = u.id
                WHERE r.user_id = %s AND r.status = 'published'
                ORDER BY r.created_at DESC
                LIMIT %s OFFSET %s
            """, (user_id, limit, offset))
            
            reviews = cur.fetchall()
            
            # Get total count
            cur.execute("""
                SELECT COUNT(*) as total
                FROM reviews
                WHERE user_id = %s AND status = 'published'
            """, (user_id,))
            
            total = cur.fetchone()["total"]
            
            return {
                "items": reviews,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_next": offset + limit < total,
                "has_prev": offset > 0
            }
            
    except Exception as e:
        logger.exception("Error getting user reviews: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/follow", response_model=UserFollowResponse)
def follow_user(
    follow_data: UserFollowCreate,
    current_user: dict = Depends(get_current_user)
):
    """Follow another user"""
    if str(current_user["id"]) == str(follow_data.followed_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot follow yourself"
        )
    
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if follow relationship already exists
            cur.execute("""
                SELECT id FROM user_follows 
                WHERE follower_id = %s AND followed_id = %s
            """, (current_user["id"], follow_data.followed_id))
            
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Already following this user"
                )
            
            # Check if followed user exists
            cur.execute("SELECT id FROM users WHERE id = %s", (follow_data.followed_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User to follow not found"
                )
            
            # Create follow relationship
            follow_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO user_follows (id, follower_id, followed_id)
                VALUES (%s, %s, %s)
                RETURNING *
            """, (follow_id, current_user["id"], follow_data.followed_id))
            
            follow = cur.fetchone()
            conn.commit()
            
            # Get user names
            cur.execute("""
                SELECT 
                    uf.*,
                    follower.name as follower_name,
                    followed.name as followed_name
                FROM user_follows uf
                JOIN users follower ON uf.follower_id = follower.id
                JOIN users followed ON uf.followed_id = followed.id
                WHERE uf.id = %s
            """, (follow["id"],))
            
            return cur.fetchone()
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error following user: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/unfollow/{followed_id}")
def unfollow_user(
    followed_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Unfollow a user"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                DELETE FROM user_follows 
                WHERE follower_id = %s AND followed_id = %s
                RETURNING id
            """, (current_user["id"], followed_id))
            
            deleted = cur.fetchone()
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Follow relationship not found"
                )
            
            conn.commit()
            return {"message": "Unfollowed successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error unfollowing user: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/followers", response_model=List[UserFollowResponse])
def get_user_followers(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get current user's followers"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    uf.*,
                    follower.name as follower_name,
                    followed.name as followed_name
                FROM user_follows uf
                JOIN users follower ON uf.follower_id = follower.id
                JOIN users followed ON uf.followed_id = followed.id
                WHERE uf.followed_id = %s
                ORDER BY uf.created_at DESC
                LIMIT %s OFFSET %s
            """, (current_user["id"], limit, offset))
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error getting followers: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/following", response_model=List[UserFollowResponse])
def get_user_following(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get users that current user is following"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    uf.*,
                    follower.name as follower_name,
                    followed.name as followed_name
                FROM user_follows uf
                JOIN users follower ON uf.follower_id = follower.id
                JOIN users followed ON uf.followed_id = followed.id
                WHERE uf.follower_id = %s
                ORDER BY uf.created_at DESC
                LIMIT %s OFFSET %s
            """, (current_user["id"], limit, offset))
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error getting following: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Admin routes
@router.get("/", response_model=List[UserResponse])
def list_all_users(
    current_admin: dict = Depends(get_current_admin_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List all users (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM users
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing users: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

class RoleUpdateRequest(BaseModel):
    role: str

@router.put("/{user_id}/role")
def update_user_role(
    user_id: str,
    role_update: RoleUpdateRequest,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Update user role (admin only)"""
    if str(current_admin["id"]) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )
    
    role = role_update.role
    
    # Validate role
    valid_roles = ["user", "reviewer"]
    if role not in valid_roles:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
        )
    
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            logger.info(f"Updating user {user_id} role to {role}")
            
            # First check if user exists
            cur.execute("SELECT id, role FROM users WHERE id = %s", (user_id,))
            existing_user = cur.fetchone()
            
            if not existing_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            logger.info(f"Found user {user_id}, current role: {existing_user['role']}")
            
            # Update the role
            cur.execute("""
                UPDATE users 
                SET role = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (role, user_id))
            
            updated_user = cur.fetchone()
            conn.commit()
            
            logger.info(f"Successfully updated user {user_id} role to {role}")
            return updated_user
            
    except HTTPException:
        conn.rollback()
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating user role: %s", e)
        raise HTTPException(status_code=500, detail=f"Failed to update user role: {str(e)}")
    finally:
        put_conn(conn)

@router.delete("/{user_id}")
def delete_user(
    user_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete user (admin only)"""
    if str(current_admin["id"]) == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete yourself"
        )
    
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("DELETE FROM users WHERE id = %s RETURNING id", (user_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="User not found"
                )
            
            conn.commit()
            return {"message": "User deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting user: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)