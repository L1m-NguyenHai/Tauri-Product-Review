from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Optional
from models.schemas import (
    CategoryCreate, CategoryUpdate, CategoryResponse
)
from auth.security import get_current_admin_user
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging
import uuid
import re

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/categories", tags=["Categories"])

def create_slug(name: str) -> str:
    """Create URL-friendly slug from category name"""
    slug = re.sub(r'[^\w\s-]', '', name.lower())
    slug = re.sub(r'[\s_-]+', '-', slug)
    return slug.strip('-')

@router.get("/", response_model=List[CategoryResponse])
def list_categories(
    limit: int = Query(100, ge=1, le=1000),
    offset: int = Query(0, ge=0)
):
    """Get all categories"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT * FROM categories
                ORDER BY name
                LIMIT %s OFFSET %s
            """, (limit, offset))
            
            return cur.fetchall()
            
    except Exception as e:
        logger.exception("Error listing categories: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/{category_id}", response_model=CategoryResponse)
def get_category(category_id: str):
    """Get category by ID"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
            
            category = cur.fetchone()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            return category
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting category: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/slug/{slug}", response_model=CategoryResponse)
def get_category_by_slug(slug: str):
    """Get category by slug"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT * FROM categories WHERE slug = %s", (slug,))
            
            category = cur.fetchone()
            if not category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            return category
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting category by slug: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/{category_id}/products")
def get_category_products(
    category_id: str,
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0)
):
    """Get products in a specific category"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify category exists
            cur.execute("SELECT id FROM categories WHERE id = %s", (category_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            # Get products
            cur.execute("""
                SELECT 
                    p.*,
                    c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.category_id = %s AND p.status = 'active'
                ORDER BY p.created_at DESC
                LIMIT %s OFFSET %s
            """, (category_id, limit, offset))
            
            products = cur.fetchall()
            
            # Get total count
            cur.execute("""
                SELECT COUNT(*) as total
                FROM products
                WHERE category_id = %s AND status = 'active'
            """, (category_id,))
            
            total = cur.fetchone()["total"]
            
            return {
                "items": products,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_next": offset + limit < total,
                "has_prev": offset > 0
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting category products: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Admin routes
@router.post("/", response_model=CategoryResponse)
def create_category(
    category: CategoryCreate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Create new category (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if category name already exists
            cur.execute("SELECT id FROM categories WHERE name = %s", (category.name,))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category name already exists"
                )
            
            # Generate slug if not provided or check uniqueness
            slug = category.slug if category.slug else create_slug(category.name)
            
            # Check if slug already exists
            cur.execute("SELECT id FROM categories WHERE slug = %s", (slug,))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Category slug already exists"
                )
            
            # Create category
            category_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO categories (id, name, slug, description)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """, (category_id, category.name, slug, category.description))
            
            new_category = cur.fetchone()
            conn.commit()
            
            return new_category
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error creating category: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/{category_id}", response_model=CategoryResponse)
def update_category(
    category_id: str,
    category_update: CategoryUpdate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Update category (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if category exists
            cur.execute("SELECT * FROM categories WHERE id = %s", (category_id,))
            existing_category = cur.fetchone()
            if not existing_category:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            update_fields = []
            values = []
            
            if category_update.name is not None:
                # Check if new name conflicts with existing categories
                cur.execute(
                    "SELECT id FROM categories WHERE name = %s AND id != %s", 
                    (category_update.name, category_id)
                )
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Category name already exists"
                    )
                update_fields.append("name = %s")
                values.append(category_update.name)
            
            if category_update.slug is not None:
                # Check if new slug conflicts with existing categories
                cur.execute(
                    "SELECT id FROM categories WHERE slug = %s AND id != %s", 
                    (category_update.slug, category_id)
                )
                if cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Category slug already exists"
                    )
                update_fields.append("slug = %s")
                values.append(category_update.slug)
            
            if category_update.description is not None:
                update_fields.append("description = %s")
                values.append(category_update.description)
            
            if not update_fields:
                return existing_category
            
            values.append(category_id)
            
            query = f"""
                UPDATE categories 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(query, values)
            updated_category = cur.fetchone()
            conn.commit()
            
            return updated_category
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating category: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/{category_id}")
def delete_category(
    category_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete category (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if category has products
            cur.execute(
                "SELECT COUNT(*) as count FROM products WHERE category_id = %s", 
                (category_id,)
            )
            product_count = cur.fetchone()["count"]
            
            if product_count > 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Cannot delete category with {product_count} products. Move or delete products first."
                )
            
            # Delete category
            cur.execute("DELETE FROM categories WHERE id = %s RETURNING id", (category_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Category not found"
                )
            
            conn.commit()
            return {"message": "Category deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting category: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)