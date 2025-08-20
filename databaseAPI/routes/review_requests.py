from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from models.schemas import (
    ReviewRequestCreate, ReviewRequestUpdate, ReviewRequestResponse
)
from auth.security import get_current_user, get_current_admin_user
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging
import uuid

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/review-requests", tags=["Review Requests"])

@router.get("/", response_model=List[ReviewRequestResponse])
def list_review_requests(
    current_user: dict = Depends(get_current_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None)
):
    """List user's review requests"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            where_conditions = ["rr.user_id = %s"]
            params = [current_user["id"]]
            
            if status:
                where_conditions.append("rr.status = %s")
                params.append(status)
            
            where_clause = "WHERE " + " AND ".join(where_conditions)
            params.extend([limit, offset])
            
            cur.execute(f"""
                SELECT 
                    rr.*,
                    u.name as user_name,
                    c.name as category_name
                FROM review_requests rr
                JOIN users u ON rr.user_id = u.id
                LEFT JOIN categories c ON rr.category_id = c.id
                {where_clause}
                ORDER BY rr.created_at DESC
                LIMIT %s OFFSET %s
            """, params)
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing review requests: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/{request_id}", response_model=ReviewRequestResponse)
def get_review_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Get review request details"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    rr.*,
                    u.name as user_name,
                    c.name as category_name
                FROM review_requests rr
                JOIN users u ON rr.user_id = u.id
                LEFT JOIN categories c ON rr.category_id = c.id
                WHERE rr.id = %s
            """, (request_id,))
            
            request = cur.fetchone()
            if not request:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review request not found"
                )
            
            # Check if user owns this request or is admin
            if str(request["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this review request"
                )
            
            return request
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting review request: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/", response_model=ReviewRequestResponse)
def create_review_request(
    request: ReviewRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Submit new review request"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify category exists if provided
            if request.category_id:
                cur.execute("SELECT id FROM categories WHERE id = %s", (request.category_id,))
                if not cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Category not found"
                    )
            
            # Create review request
            request_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO review_requests (
                    id, user_id, product_name, manufacturer, category_id,
                    product_url, price, availability, description,
                    reasoning, contact_email, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                request_id, current_user["id"], request.product_name,
                request.manufacturer, request.category_id, request.product_url,
                request.price, request.availability, request.description,
                request.reasoning, request.contact_email, "pending"
            ))
            
            new_request = cur.fetchone()
            conn.commit()
            
            # Get additional info
            cur.execute("""
                SELECT 
                    rr.*,
                    u.name as user_name,
                    c.name as category_name
                FROM review_requests rr
                JOIN users u ON rr.user_id = u.id
                LEFT JOIN categories c ON rr.category_id = c.id
                WHERE rr.id = %s
            """, (request_id,))
            
            return cur.fetchone()
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error creating review request: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/{request_id}", response_model=ReviewRequestResponse)
def update_review_request(
    request_id: str,
    request_update: ReviewRequestCreate,
    current_user: dict = Depends(get_current_user)
):
    """Update review request (only if pending)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get existing request
            cur.execute("SELECT * FROM review_requests WHERE id = %s", (request_id,))
            existing_request = cur.fetchone()
            
            if not existing_request:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review request not found"
                )
            
            # Check ownership
            if str(existing_request["user_id"]) != str(current_user["id"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this review request"
                )
            
            # Check if still pending
            if existing_request["status"] != "pending":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Can only update pending review requests"
                )
            
            # Verify category exists if provided
            if request_update.category_id:
                cur.execute("SELECT id FROM categories WHERE id = %s", (request_update.category_id,))
                if not cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Category not found"
                    )
            
            # Update request
            cur.execute("""
                UPDATE review_requests 
                SET 
                    product_name = %s, manufacturer = %s, category_id = %s,
                    product_url = %s, price = %s, availability = %s,
                    description = %s, reasoning = %s, contact_email = %s,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING *
            """, (
                request_update.product_name, request_update.manufacturer,
                request_update.category_id, request_update.product_url,
                request_update.price, request_update.availability,
                request_update.description, request_update.reasoning,
                request_update.contact_email, request_id
            ))
            
            updated_request = cur.fetchone()
            conn.commit()
            
            # Get additional info
            cur.execute("""
                SELECT 
                    rr.*,
                    u.name as user_name,
                    c.name as category_name
                FROM review_requests rr
                JOIN users u ON rr.user_id = u.id
                LEFT JOIN categories c ON rr.category_id = c.id
                WHERE rr.id = %s
            """, (request_id,))
            
            return cur.fetchone()
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating review request: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/{request_id}")
def delete_review_request(
    request_id: str,
    current_user: dict = Depends(get_current_user)
):
    """Delete review request (only if pending)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get existing request
            cur.execute("SELECT * FROM review_requests WHERE id = %s", (request_id,))
            existing_request = cur.fetchone()
            
            if not existing_request:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review request not found"
                )
            
            # Check ownership or admin
            if str(existing_request["user_id"]) != str(current_user["id"]) and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this review request"
                )
            
            # Check if still pending (unless admin)
            if existing_request["status"] != "pending" and current_user["role"] != "admin":
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Can only delete pending review requests"
                )
            
            cur.execute("DELETE FROM review_requests WHERE id = %s", (request_id,))
            conn.commit()
            
            return {"message": "Review request deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting review request: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Admin routes
@router.get("/admin/all", response_model=List[ReviewRequestResponse])
def list_all_review_requests(
    current_admin: dict = Depends(get_current_admin_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None)
):
    """List all review requests (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            where_conditions = []
            params = []
            
            if status:
                where_conditions.append("rr.status = %s")
                params.append(status)
            
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            params.extend([limit, offset])
            
            cur.execute(f"""
                SELECT 
                    rr.*,
                    u.name as user_name,
                    c.name as category_name
                FROM review_requests rr
                JOIN users u ON rr.user_id = u.id
                LEFT JOIN categories c ON rr.category_id = c.id
                {where_clause}
                ORDER BY rr.created_at DESC
                LIMIT %s OFFSET %s
            """, params)
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing all review requests: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/admin/pending", response_model=List[ReviewRequestResponse])
def list_pending_review_requests(
    current_admin: dict = Depends(get_current_admin_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List pending review requests (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT 
                    rr.*,
                    u.name as user_name,
                    c.name as category_name
                FROM review_requests rr
                JOIN users u ON rr.user_id = u.id
                LEFT JOIN categories c ON rr.category_id = c.id
                WHERE rr.status = 'pending'
                ORDER BY rr.created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing pending review requests: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/admin/{request_id}/approve")
def approve_review_request(
    request_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Approve review request (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE review_requests 
                SET status = 'approved', updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id
            """, (request_id,))
            
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pending review request not found"
                )
            
            conn.commit()
            return {"message": "Review request approved successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error approving review request: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/admin/{request_id}/reject")
def reject_review_request(
    request_id: str,
    admin_notes: ReviewRequestUpdate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Reject review request with admin notes (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE review_requests 
                SET status = 'rejected', admin_notes = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'pending'
                RETURNING id
            """, (admin_notes.admin_notes, request_id))
            
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Pending review request not found"
                )
            
            conn.commit()
            return {"message": "Review request rejected successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error rejecting review request: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/admin/{request_id}/complete")
def complete_review_request(
    request_id: str,
    admin_notes: ReviewRequestUpdate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Mark review request as completed (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE review_requests 
                SET status = 'completed', admin_notes = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s AND status = 'approved'
                RETURNING id
            """, (admin_notes.admin_notes, request_id))
            
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Approved review request not found"
                )
            
            conn.commit()
            return {"message": "Review request marked as completed"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error completing review request: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/admin/{request_id}/notes")
def update_admin_notes(
    request_id: str,
    admin_notes: ReviewRequestUpdate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Update admin notes for review request (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE review_requests 
                SET admin_notes = %s, updated_at = CURRENT_TIMESTAMP
                WHERE id = %s
                RETURNING id
            """, (admin_notes.admin_notes, request_id))
            
            updated = cur.fetchone()
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review request not found"
                )
            
            conn.commit()
            return {"message": "Admin notes updated successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating admin notes: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)