from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from models.schemas import (
    UserResponse, UserUpdate, UserFollowCreate, UserFollowResponse,
    PaginationParams
)
from auth.security import get_current_user, get_current_admin_user
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging
import uuid

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/users", tags=["Users"])

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
                SELECT id, email, name, avatar, role, created_at, updated_at
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