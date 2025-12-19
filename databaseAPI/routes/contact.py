from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from models.schemas import (
    ContactMessageCreate, ContactMessageUpdate, ContactMessageResponse
)
from auth.security import get_current_admin_user
from database.connection import get_read_conn, get_write_conn, put_read_conn, put_write_conn, safe_rollback
from psycopg2.extras import RealDictCursor
import logging
import uuid

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/contact", tags=["Contact"])

@router.post("/", response_model=ContactMessageResponse)
def submit_contact_message(message: ContactMessageCreate):
    """Submit contact message (public endpoint)"""
    conn = get_write_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            message_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO contact_messages (id, name, email, subject, message, status)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                message_id, message.name, message.email,
                message.subject, message.message, "unread"
            ))
            
            new_message = cur.fetchone()
            conn.commit()
            
            return new_message
            
    except Exception as e:
        safe_rollback(conn)
        logger.exception("Error submitting contact message: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_write_conn(conn)

# Admin routes
@router.get("/", response_model=List[ContactMessageResponse])
def list_contact_messages(
    current_admin: dict = Depends(get_current_admin_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    status: Optional[str] = Query(None)
):
    """List contact messages (admin only)"""
    conn = get_read_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            where_conditions = []
            params = []
            
            if status:
                where_conditions.append("status = %s")
                params.append(status)
            
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            params.extend([limit, offset])
            
            cur.execute(f"""
                SELECT * FROM contact_messages
                {where_clause}
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, params)
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing contact messages: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_read_conn(conn)

@router.get("/unread", response_model=List[ContactMessageResponse])
def list_unread_contact_messages(
    current_admin: dict = Depends(get_current_admin_user),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """List unread contact messages (admin only)"""
    conn = get_read_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM contact_messages
                WHERE status = 'unread'
                ORDER BY created_at DESC
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing unread contact messages: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_read_conn(conn)

@router.get("/{message_id}", response_model=ContactMessageResponse)
def get_contact_message(
    message_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get contact message details (admin only)"""
    conn = get_read_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM contact_messages WHERE id = %s", (message_id,))
            
            message = cur.fetchone()
            if not message:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Contact message not found"
                )
            
            return message
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting contact message: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_read_conn(conn)

@router.put("/{message_id}/mark-read", response_model=ContactMessageResponse)
def mark_message_as_read(
    message_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Mark contact message as read (admin only)"""
    conn = get_write_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE contact_messages 
                SET status = 'read'
                WHERE id = %s AND status = 'unread'
                RETURNING *
            """, (message_id,))
            
            updated_message = cur.fetchone()
            if not updated_message:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Unread contact message not found"
                )
            
            conn.commit()
            return updated_message
            
    except HTTPException:
        raise
    except Exception as e:
        safe_rollback(conn)
        logger.exception("Error marking message as read: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_write_conn(conn)

@router.put("/{message_id}/mark-replied", response_model=ContactMessageResponse)
def mark_message_as_replied(
    message_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Mark contact message as replied (admin only)"""
    conn = get_write_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE contact_messages 
                SET status = 'replied'
                WHERE id = %s AND status IN ('unread', 'read')
                RETURNING *
            """, (message_id,))
            
            updated_message = cur.fetchone()
            if not updated_message:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Contact message not found or already replied"
                )
            
            conn.commit()
            return updated_message
            
    except HTTPException:
        raise
    except Exception as e:
        safe_rollback(conn)
        logger.exception("Error marking message as replied: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_write_conn(conn)

@router.put("/{message_id}/status", response_model=ContactMessageResponse)
def update_message_status(
    message_id: str,
    status_update: ContactMessageUpdate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Update contact message status (admin only)"""
    conn = get_write_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                UPDATE contact_messages 
                SET status = %s
                WHERE id = %s
                RETURNING *
            """, (status_update.status, message_id))
            
            updated_message = cur.fetchone()
            if not updated_message:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Contact message not found"
                )
            
            conn.commit()
            return updated_message
            
    except HTTPException:
        raise
    except Exception as e:
        safe_rollback(conn)
        logger.exception("Error updating message status: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_write_conn(conn)

@router.delete("/{message_id}")
def delete_contact_message(
    message_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete contact message (admin only)"""
    conn = get_write_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("DELETE FROM contact_messages WHERE id = %s RETURNING id", (message_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Contact message not found"
                )
            
            conn.commit()
            return {"message": "Contact message deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        safe_rollback(conn)
        logger.exception("Error deleting contact message: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_write_conn(conn)

@router.get("/stats/summary")
def get_contact_stats(
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get contact message statistics (admin only)"""
    conn = get_read_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get counts by status
            cur.execute("""
                SELECT 
                    status,
                    COUNT(*) as count
                FROM contact_messages
                GROUP BY status
            """)
            status_counts = cur.fetchall()
            
            # Get total count
            cur.execute("SELECT COUNT(*) as total FROM contact_messages")
            total = cur.fetchone()["total"]
            
            # Get recent messages count (last 7 days)
            cur.execute("""
                SELECT COUNT(*) as recent_count
                FROM contact_messages
                WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
            """)
            recent_count = cur.fetchone()["recent_count"]
            
            return {
                "total_messages": total,
                "recent_messages": recent_count,
                "status_breakdown": {row["status"]: row["count"] for row in status_counts}
            }
            
    except Exception as e:
        logger.exception("Error getting contact stats: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_read_conn(conn)