from fastapi import APIRouter, HTTPException, Query, Depends, status, File, UploadFile, Form
from typing import List, Optional
import tempfile
import os
import shutil
from models.schemas import (
    ProductCreate, ProductUpdate, ProductResponse, ProductFilter,
    ProductFeatureCreate, ProductFeatureResponse,
    ProductImageCreate, ProductImageResponse,
    ProductSpecificationCreate, ProductSpecificationResponse,
    StoreLinkCreate, StoreLinkResponse,
    PaginatedProductsResponse
)
from auth.security import get_current_admin_user
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging
import uuid
from decimal import Decimal

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("/", response_model=PaginatedProductsResponse)
def list_products(
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
    category_id: Optional[str] = Query(None),
    manufacturer: Optional[str] = Query(None),
    min_price: Optional[float] = Query(None),
    max_price: Optional[float] = Query(None),
    min_rating: Optional[float] = Query(None),
    status: Optional[str] = Query("active"),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    search: Optional[str] = Query(None)
):
    """List products with filtering and sorting"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Build WHERE clause
            where_conditions = []
            params = []
            
            if category_id:
                where_conditions.append("p.category_id = %s")
                params.append(category_id)
            
            if manufacturer:
                where_conditions.append("LOWER(p.manufacturer) LIKE LOWER(%s)")
                params.append(f"%{manufacturer}%")
            
            if min_price is not None:
                where_conditions.append("p.price >= %s")
                params.append(min_price)
            
            if max_price is not None:
                where_conditions.append("p.price <= %s")
                params.append(max_price)
            
            if min_rating is not None:
                where_conditions.append("p.average_rating >= %s")
                params.append(min_rating)
            
            if status:
                where_conditions.append("p.status = %s")
                params.append(status)
            
            if search:
                where_conditions.append("""
                    (LOWER(p.name) LIKE LOWER(%s) OR 
                     LOWER(p.description) LIKE LOWER(%s) OR 
                     LOWER(p.manufacturer) LIKE LOWER(%s))
                """)
                search_term = f"%{search}%"
                params.extend([search_term, search_term, search_term])
            
            where_clause = ""
            if where_conditions:
                where_clause = "WHERE " + " AND ".join(where_conditions)
            
            # Build ORDER BY clause
            valid_sort_fields = ["name", "price", "average_rating", "review_count", "created_at"]
            if sort_by not in valid_sort_fields:
                sort_by = "created_at"
            
            sort_order = "DESC" if sort_order.lower() == "desc" else "ASC"
            
            # Add pagination parameters
            params.extend([limit, offset])
            
            query = f"""
                SELECT 
                    p.*,
                    c.name AS category_name,
                    p.display_image
                FROM products_with_image p
                LEFT JOIN categories c ON p.category_id = c.id
                {where_clause}
                ORDER BY p.{sort_by} {sort_order}
                LIMIT %s OFFSET %s
            """
            
            cur.execute(query, params)
            products = cur.fetchall()
            
            # Get total count for pagination
            count_params = params[:-2]  # Remove limit and offset
            count_query = f"""
                SELECT COUNT(*) as total
                FROM products_with_image p
                LEFT JOIN categories c ON p.category_id = c.id
                {where_clause}
            """
            
            cur.execute(count_query, count_params)
            total = cur.fetchone()["total"]
            
            return {
                "items": products,
                "total": total,
                "limit": limit,
                "offset": offset,
                "has_next": offset + limit < total,
                "has_prev": offset > 0
            }
            
    except Exception as e:
        logger.exception("Error listing products: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/{product_id}", response_model=dict)
def get_product(product_id: str):
    """Get detailed product information including features, images, specs, and store links"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get product details
            cur.execute("""
                SELECT 
                    p.*,
                    c.name AS category_name
                FROM products_with_image p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.id = %s
            """, (product_id,))
            
            product = cur.fetchone()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            # Get product features
            cur.execute("""
                SELECT * FROM product_features 
                WHERE product_id = %s 
                ORDER BY sort_order
            """, (product_id,))
            features = cur.fetchall()
            
            # Get product images
            cur.execute("""
                SELECT * FROM product_images 
                WHERE product_id = %s 
                ORDER BY sort_order, is_primary DESC
            """, (product_id,))
            images = cur.fetchall()
            
            # Get product specifications
            cur.execute("""
                SELECT * FROM product_specifications 
                WHERE product_id = %s 
                ORDER BY spec_name
            """, (product_id,))
            specifications = cur.fetchall()
            
            # Get store links
            cur.execute("""
                SELECT * FROM store_links 
                WHERE product_id = %s 
                ORDER BY is_official DESC, store_name
            """, (product_id,))
            store_links = cur.fetchall()
            
            return {
                **dict(product),
                "features": features,
                "images": images,
                "specifications": specifications,
                "store_links": store_links
            }
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error getting product %s: %s", product_id, e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/", response_model=ProductResponse)
def create_product(
    product: ProductCreate
):
    """Create new product (no admin required)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify category exists if provided
            if product.category_id:
                cur.execute("SELECT id FROM categories WHERE id = %s", (str(product.category_id),))
                if not cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Category not found"
                    )
            
            # Create product
            product_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO products (
                    id, name, description, category_id, manufacturer, 
                    price, product_url, availability, status
                )
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (
                product_id, product.name, product.description, str(product.category_id) if product.category_id else None,
                product.manufacturer, product.price, 
                product.product_url, product.availability, product.status
            ))
            
            new_product = cur.fetchone()
            conn.commit()
            
            # Get category name
            if new_product["category_id"]:
                cur.execute("SELECT name FROM categories WHERE id = %s", (str(new_product["category_id"]),))
                category = cur.fetchone()
                new_product["category_name"] = category["name"] if category else None
            
            return new_product
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error creating product: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: str,
    product_update: ProductUpdate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Update product (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if product exists
            cur.execute("SELECT * FROM products WHERE id = %s", (product_id,))
            existing_product = cur.fetchone()
            if not existing_product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            # Verify category exists if provided
            if product_update.category_id:
                cur.execute("SELECT id FROM categories WHERE id = %s", (str(product_update.category_id),))
                if not cur.fetchone():
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail="Category not found"
                    )
            
            # Build update query
            update_fields = []
            values = []
            
            for field, value in product_update.dict(exclude_unset=True).items():
                if value is not None:
                    update_fields.append(f"{field} = %s")
                    # Convert UUID to string if needed
                    if field == 'category_id' and hasattr(value, '__str__'):
                        values.append(str(value))
                    else:
                        values.append(value)
            
            if not update_fields:
                return existing_product
            
            update_fields.append("updated_at = CURRENT_TIMESTAMP")
            values.append(product_id)
            
            query = f"""
                UPDATE products 
                SET {', '.join(update_fields)}
                WHERE id = %s
                RETURNING *
            """
            
            cur.execute(query, values)
            updated_product = cur.fetchone()
            conn.commit()
            
            # Get category name
            if updated_product["category_id"]:
                cur.execute("SELECT name FROM categories WHERE id = %s", (str(updated_product["category_id"]),))
                category = cur.fetchone()
                updated_product["category_name"] = category["name"] if category else None
            
            return updated_product
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating product: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/{product_id}")
def delete_product(
    product_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete product (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("DELETE FROM products WHERE id = %s RETURNING id", (product_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            conn.commit()
            return {"message": "Product deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting product: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Product Features
@router.post("/{product_id}/features", response_model=ProductFeatureResponse)
def add_product_feature(
    product_id: str,
    feature: ProductFeatureCreate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Add feature to product (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            feature_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO product_features (id, product_id, feature_text, sort_order)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """, (feature_id, product_id, feature.feature_text, feature.sort_order))
            
            new_feature = cur.fetchone()
            conn.commit()
            return new_feature
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding product feature: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/features/{feature_id}")
def delete_product_feature(
    feature_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete product feature (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("DELETE FROM product_features WHERE id = %s RETURNING id", (feature_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Feature not found"
                )
            
            conn.commit()
            return {"message": "Feature deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting feature: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Product Images
@router.post("/{product_id}/images/upload")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    is_primary: bool = Form(False),
    sort_order: int = Form(0)
):
    """Upload image file for product (supports Discord upload)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="File must be an image"
                )
            
            # Save file temporarily
            temp_file_path = None
            image_url = None
            
            try:
                # Create temporary file
                with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.filename)[1]) as temp_file:
                    temp_file_path = temp_file.name
                    shutil.copyfileobj(file.file, temp_file)
                
                # Try Discord upload first
                try:
                    from discord_media import upload_media_to_discord
                    logger.info("Attempting Discord upload for product image...")
                    image_url = await upload_media_to_discord(temp_file_path)
                    logger.info(f"Discord upload successful for product image, URL: {image_url}")
                except Exception as discord_error:
                    logger.warning(f"Discord upload failed for product image: {discord_error}")
                    # Fallback: save locally
                    filename = f"{uuid.uuid4()}{os.path.splitext(file.filename)[1]}"
                    upload_dir = "uploads/products"
                    os.makedirs(upload_dir, exist_ok=True)
                    local_path = os.path.join(upload_dir, filename)
                    shutil.move(temp_file_path, local_path)
                    image_url = f"/uploads/products/{filename}"
                    temp_file_path = None  # File moved, don't delete
                    
            finally:
                # Clean up temporary file if it still exists
                if temp_file_path and os.path.exists(temp_file_path):
                    os.unlink(temp_file_path)
            
            # If this is set as primary, remove primary from other images
            if is_primary:
                cur.execute("""
                    UPDATE product_images 
                    SET is_primary = FALSE 
                    WHERE product_id = %s
                """, (product_id,))
            
            image_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (image_id, product_id, image_url, is_primary, sort_order))
            
            new_image = cur.fetchone()
            conn.commit()
            return new_image
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error uploading product image: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/{product_id}/images", response_model=ProductImageResponse)
def add_product_image(
    product_id: str,
    image: ProductImageCreate
):
    """Add image to product via URL (no admin required)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            # If this is set as primary, remove primary from other images
            if image.is_primary:
                cur.execute("""
                    UPDATE product_images 
                    SET is_primary = FALSE 
                    WHERE product_id = %s
                """, (product_id,))
            
            image_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO product_images (id, product_id, image_url, is_primary, sort_order)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
            """, (image_id, product_id, image.image_url, image.is_primary, image.sort_order))
            
            new_image = cur.fetchone()
            conn.commit()
            return new_image
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding product image: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/images/{image_id}")
def delete_product_image(
    image_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete product image (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("DELETE FROM product_images WHERE id = %s RETURNING id", (image_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Image not found"
                )
            
            conn.commit()
            return {"message": "Image deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting image: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Product Specifications
@router.post("/{product_id}/specifications", response_model=ProductSpecificationResponse)
def add_product_specification(
    product_id: str,
    spec: ProductSpecificationCreate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Add specification to product (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            spec_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO product_specifications (id, product_id, spec_name, spec_value)
                VALUES (%s, %s, %s, %s)
                RETURNING *
            """, (spec_id, product_id, spec.spec_name, spec.spec_value))
            
            new_spec = cur.fetchone()
            conn.commit()
            return new_spec
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding product specification: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/specifications/{spec_id}")
def delete_product_specification(
    spec_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete product specification (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("DELETE FROM product_specifications WHERE id = %s RETURNING id", (spec_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Specification not found"
                )
            
            conn.commit()
            return {"message": "Specification deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting specification: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Store Links
@router.post("/{product_id}/store-links", response_model=StoreLinkResponse)
def add_store_link(
    product_id: str,
    store_link: StoreLinkCreate,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Add store link to product (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Verify product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            
            link_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO store_links (id, product_id, store_name, price, url, is_official)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (link_id, product_id, store_link.store_name, store_link.price, 
                  store_link.url, store_link.is_official))
            
            new_link = cur.fetchone()
            conn.commit()
            return new_link
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding store link: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/store-links/{link_id}")
def delete_store_link(
    link_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete store link (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("DELETE FROM store_links WHERE id = %s RETURNING id", (link_id,))
            deleted = cur.fetchone()
            
            if not deleted:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Store link not found"
                )
            
            conn.commit()
            return {"message": "Store link deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting store link: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)