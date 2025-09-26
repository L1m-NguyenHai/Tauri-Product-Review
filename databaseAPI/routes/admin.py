from fastapi import APIRouter, HTTPException, status, Depends, Query
from typing import List, Dict, Any
from models.schemas import DashboardStats
from auth.security import get_current_admin_user
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/admin", tags=["Admin Dashboard"])

@router.get("/dashboard", response_model=DashboardStats)
def get_dashboard_stats(current_admin: dict = Depends(get_current_admin_user)):
    """Get dashboard statistics (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get total users
            cur.execute("SELECT COUNT(*) as total FROM users")
            total_users = cur.fetchone()["total"]
            
            # Get total products
            cur.execute("SELECT COUNT(*) as total FROM products")
            total_products = cur.fetchone()["total"]
            
            # Get total reviews
            cur.execute("SELECT COUNT(*) as total FROM reviews")
            total_reviews = cur.fetchone()["total"]
            
            # Get pending reviews
            cur.execute("SELECT COUNT(*) as total FROM reviews WHERE status = 'pending'")
            pending_reviews = cur.fetchone()["total"]
            
            # Get pending review requests
            cur.execute("SELECT COUNT(*) as total FROM review_requests WHERE status = 'pending'")
            pending_review_requests = cur.fetchone()["total"]
            
            # Get unread messages
            cur.execute("SELECT COUNT(*) as total FROM contact_messages WHERE status = 'unread'")
            unread_messages = cur.fetchone()["total"]
            
            return DashboardStats(
                total_users=total_users,
                total_products=total_products,
                total_reviews=total_reviews,
                pending_reviews=pending_reviews,
                pending_review_requests=pending_review_requests,
                unread_messages=unread_messages
            )
            
    except Exception as e:
        logger.exception("Error getting dashboard stats: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/analytics/products")
def get_product_analytics(
    current_admin: dict = Depends(get_current_admin_user),
    days: int = Query(30, ge=1, le=365)
):
    """Get product analytics (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Products by category
            cur.execute("""
                SELECT 
                    c.name as category_name,
                    COUNT(p.id) as product_count
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id
                GROUP BY c.id, c.name
                ORDER BY product_count DESC
            """)
            products_by_category = cur.fetchall()
            
            # Top rated products
            cur.execute("""
                SELECT 
                    p.name,
                    p.average_rating,
                    p.review_count
                FROM products p
                WHERE p.review_count > 0
                ORDER BY p.average_rating DESC, p.review_count DESC
                LIMIT 10
            """)
            top_rated_products = cur.fetchall()
            
            # Most reviewed products
            cur.execute("""
                SELECT 
                    p.name,
                    p.average_rating,
                    p.review_count
                FROM products p
                WHERE p.review_count > 0
                ORDER BY p.review_count DESC
                LIMIT 10
            """)
            most_reviewed_products = cur.fetchall()
            
            # Recent products
            cur.execute("""
                SELECT 
                    p.name,
                    p.created_at,
                    c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.created_at >= CURRENT_DATE - INTERVAL '%s days'
                ORDER BY p.created_at DESC
                LIMIT 10
            """, (days,))
            recent_products = cur.fetchall()
            
            return {
                "products_by_category": products_by_category,
                "top_rated_products": top_rated_products,
                "most_reviewed_products": most_reviewed_products,
                "recent_products": recent_products
            }
            
    except Exception as e:
        logger.exception("Error getting product analytics: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/analytics/reviews")
def get_review_analytics(
    current_admin: dict = Depends(get_current_admin_user),
    days: int = Query(30, ge=1, le=365)
):
    """Get review analytics (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Reviews by status
            cur.execute("""
                SELECT 
                    status,
                    COUNT(*) as count
                FROM reviews
                GROUP BY status
            """)
            reviews_by_status = cur.fetchall()
            
            # Reviews by rating
            cur.execute("""
                SELECT 
                    rating,
                    COUNT(*) as count
                FROM reviews
                WHERE status = 'published'
                GROUP BY rating
                ORDER BY rating
            """)
            reviews_by_rating = cur.fetchall()
            
            # Recent reviews
            cur.execute("""
                SELECT 
                    r.title,
                    r.rating,
                    r.created_at,
                    u.name as user_name,
                    p.name as product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                WHERE r.created_at >= CURRENT_DATE - INTERVAL '%s days'
                ORDER BY r.created_at DESC
                LIMIT 10
            """, (days,))
            recent_reviews = cur.fetchall()
            
            # Most helpful reviews
            cur.execute("""
                SELECT 
                    r.title,
                    r.helpful_count,
                    u.name as user_name,
                    p.name as product_name
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                WHERE r.status = 'published' AND r.helpful_count > 0
                ORDER BY r.helpful_count DESC
                LIMIT 10
            """)
            most_helpful_reviews = cur.fetchall()
            
            # Reviews over time (last 30 days)
            cur.execute("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM reviews
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date
            """)
            reviews_over_time = cur.fetchall()
            
            return {
                "reviews_by_status": reviews_by_status,
                "reviews_by_rating": reviews_by_rating,
                "recent_reviews": recent_reviews,
                "most_helpful_reviews": most_helpful_reviews,
                "reviews_over_time": reviews_over_time
            }
            
    except Exception as e:
        logger.exception("Error getting review analytics: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/analytics/users")
def get_user_analytics(
    current_admin: dict = Depends(get_current_admin_user),
    days: int = Query(30, ge=1, le=365)
):
    """Get user analytics (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Users by role
            cur.execute("""
                SELECT 
                    role,
                    COUNT(*) as count
                FROM users
                GROUP BY role
            """)
            users_by_role = cur.fetchall()
            
            # New users over time (last 30 days)
            cur.execute("""
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM users
                WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
                GROUP BY DATE(created_at)
                ORDER BY date
            """)
            new_users_over_time = cur.fetchall()
            
            # Most active reviewers
            cur.execute("""
                SELECT 
                    u.name,
                    u.email,
                    COUNT(r.id) as review_count
                FROM users u
                LEFT JOIN reviews r ON u.id = r.user_id AND r.status = 'published'
                GROUP BY u.id, u.name, u.email
                HAVING COUNT(r.id) > 0
                ORDER BY review_count DESC
                LIMIT 10
            """)
            most_active_reviewers = cur.fetchall()
            
            # Recent registrations
            cur.execute("""
                SELECT 
                    name,
                    email,
                    created_at
                FROM users
                WHERE created_at >= CURRENT_DATE - INTERVAL '%s days'
                ORDER BY created_at DESC
                LIMIT 10
            """, (days,))
            recent_registrations = cur.fetchall()
            
            return {
                "users_by_role": users_by_role,
                "new_users_over_time": new_users_over_time,
                "most_active_reviewers": most_active_reviewers,
                "recent_registrations": recent_registrations
            }
            
    except Exception as e:
        logger.exception("Error getting user analytics: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/analytics/engagement")
def get_engagement_analytics(
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get engagement analytics (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Average rating by category
            cur.execute("""
                SELECT 
                    c.name as category_name,
                    AVG(p.average_rating) as avg_rating,
                    COUNT(p.id) as product_count
                FROM categories c
                LEFT JOIN products p ON c.id = p.category_id
                WHERE p.review_count > 0
                GROUP BY c.id, c.name
                ORDER BY avg_rating DESC
            """)
            avg_rating_by_category = cur.fetchall()
            
            # Review engagement stats
            cur.execute("""
                SELECT 
                    AVG(helpful_count) as avg_helpful_count,
                    MAX(helpful_count) as max_helpful_count,
                    COUNT(*) as total_reviews,
                    SUM(helpful_count) as total_helpful_votes
                FROM reviews
                WHERE status = 'published'
            """)
            review_engagement = cur.fetchone()
            
            # User follow statistics
            cur.execute("""
                SELECT 
                    COUNT(*) as total_follows,
                    COUNT(DISTINCT follower_id) as users_following,
                    COUNT(DISTINCT followed_id) as users_followed
                FROM user_follows
            """)
            follow_stats = cur.fetchone()
            
            # Product popularity (views proxy using review count)
            cur.execute("""
                SELECT 
                    p.name,
                    p.review_count,
                    p.average_rating,
                    c.name as category_name
                FROM products p
                LEFT JOIN categories c ON p.category_id = c.id
                WHERE p.review_count > 0
                ORDER BY p.review_count DESC
                LIMIT 20
            """)
            popular_products = cur.fetchall()
            
            return {
                "avg_rating_by_category": avg_rating_by_category,
                "review_engagement": review_engagement,
                "follow_stats": follow_stats,
                "popular_products": popular_products
            }
            
    except Exception as e:
        logger.exception("Error getting engagement analytics: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/system/health")
def system_health_check(current_admin: dict = Depends(get_current_admin_user)):
    """System health check (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Database connection test
            cur.execute("SELECT 1")
            
            # Check for orphaned records
            orphaned_checks = {}
            
            # Check for reviews without users or products
            cur.execute("""
                SELECT COUNT(*) as count
                FROM reviews r
                LEFT JOIN users u ON r.user_id = u.id
                LEFT JOIN products p ON r.product_id = p.id
                WHERE u.id IS NULL OR p.id IS NULL
            """)
            orphaned_checks["orphaned_reviews"] = cur.fetchone()["count"]
            
            # Check for product features without products
            cur.execute("""
                SELECT COUNT(*) as count
                FROM product_features pf
                LEFT JOIN products p ON pf.product_id = p.id
                WHERE p.id IS NULL
            """)
            orphaned_checks["orphaned_product_features"] = cur.fetchone()["count"]
            
            # Check for user follows with missing users
            cur.execute("""
                SELECT COUNT(*) as count
                FROM user_follows uf
                LEFT JOIN users u1 ON uf.follower_id = u1.id
                LEFT JOIN users u2 ON uf.followed_id = u2.id
                WHERE u1.id IS NULL OR u2.id IS NULL
            """)
            orphaned_checks["orphaned_follows"] = cur.fetchone()["count"]
            
            # Database size info
            cur.execute("""
                SELECT 
                    schemaname,
                    tablename,
                    attname,
                    n_distinct,
                    correlation
                FROM pg_stats
                WHERE schemaname = 'public'
                LIMIT 10
            """)
            db_stats = cur.fetchall()
            
            return {
                "database_status": "healthy",
                "orphaned_records": orphaned_checks,
                "database_stats": db_stats
            }
            
    except Exception as e:
        logger.exception("Error checking system health: %s", e)
        return {
            "database_status": "error",
            "error": str(e)
        }
    finally:
        put_conn(conn)

@router.post("/maintenance/cleanup-orphaned")
def cleanup_orphaned_records(current_admin: dict = Depends(get_current_admin_user)):
    """Clean up orphaned records (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cleanup_results = {}
            
            # Clean up orphaned reviews
            cur.execute("""
                DELETE FROM reviews
                WHERE user_id NOT IN (SELECT id FROM users)
                   OR product_id NOT IN (SELECT id FROM products)
            """)
            cleanup_results["orphaned_reviews_deleted"] = cur.rowcount
            
            # Clean up orphaned product features
            cur.execute("""
                DELETE FROM product_features
                WHERE product_id NOT IN (SELECT id FROM products)
            """)
            cleanup_results["orphaned_features_deleted"] = cur.rowcount
            
            # Clean up orphaned user follows
            cur.execute("""
                DELETE FROM user_follows
                WHERE follower_id NOT IN (SELECT id FROM users)
                   OR followed_id NOT IN (SELECT id FROM users)
            """)
            cleanup_results["orphaned_follows_deleted"] = cur.rowcount
            
            conn.commit()
            
            return {
                "message": "Cleanup completed successfully",
                "results": cleanup_results
            }
            
    except Exception as e:
        conn.rollback()
        logger.exception("Error during cleanup: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.get("/logs/recent")
def get_recent_activity(
    current_admin: dict = Depends(get_current_admin_user),
    limit: int = Query(50, ge=1, le=200)
):
    """Get recent system activity (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Recent user registrations
            cur.execute("""
                SELECT 
                    'user_registration' as activity_type,
                    name as description,
                    created_at as timestamp
                FROM users
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit // 4,))
            user_activities = cur.fetchall()
            
            # Recent reviews
            cur.execute("""
                SELECT 
                    'review_submitted' as activity_type,
                    CONCAT('Review for ', p.name, ' by ', u.name) as description,
                    r.created_at as timestamp
                FROM reviews r
                JOIN users u ON r.user_id = u.id
                JOIN products p ON r.product_id = p.id
                ORDER BY r.created_at DESC
                LIMIT %s
            """, (limit // 4,))
            review_activities = cur.fetchall()
            
            # Recent products
            cur.execute("""
                SELECT 
                    'product_added' as activity_type,
                    CONCAT('Product added: ', name) as description,
                    created_at as timestamp
                FROM products
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit // 4,))
            product_activities = cur.fetchall()
            
            # Recent contact messages
            cur.execute("""
                SELECT 
                    'contact_message' as activity_type,
                    CONCAT('Contact: ', subject, ' from ', name) as description,
                    created_at as timestamp
                FROM contact_messages
                ORDER BY created_at DESC
                LIMIT %s
            """, (limit // 4,))
            contact_activities = cur.fetchall()
            
            # Combine and sort all activities
            all_activities = (
                user_activities + review_activities + 
                product_activities + contact_activities
            )
            
            # Sort by timestamp descending
            all_activities.sort(key=lambda x: x['timestamp'], reverse=True)
            
            return all_activities[:limit]
            
    except Exception as e:
        logger.exception("Error getting recent activity: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

# Store Links Management
@router.get("/products/{product_id}/store-links")
def get_product_store_links(
    product_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Get all store links for a product (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("""
                SELECT id, product_id, store_name, price, url, is_official, created_at
                FROM store_links 
                WHERE product_id = %s
                ORDER BY created_at DESC
            """, (product_id,))
            
            store_links = cur.fetchall()
            return {"store_links": [dict(link) for link in store_links]}
            
    except Exception as e:
        logger.exception("Error getting store links: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/products/{product_id}/store-links")
def add_store_link(
    product_id: str,
    store_link_data: dict,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Add a new store link for a product (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Validate product exists
            cur.execute("SELECT id FROM products WHERE id = %s", (product_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Product not found")
            
            # Insert new store link
            cur.execute("""
                INSERT INTO store_links (product_id, store_name, price, url, is_official)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING id, product_id, store_name, price, url, is_official, created_at
            """, (
                product_id,
                store_link_data.get("store_name"),
                store_link_data.get("price"),
                store_link_data.get("url"),
                store_link_data.get("is_official", False)
            ))
            
            new_link = cur.fetchone()
            conn.commit()
            
            return {"message": "Store link added successfully", "store_link": dict(new_link)}
            
    except Exception as e:
        conn.rollback()
        logger.exception("Error adding store link: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.put("/store-links/{link_id}")
def update_store_link(
    link_id: str,
    store_link_data: dict,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Update a store link (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if link exists
            cur.execute("SELECT id FROM store_links WHERE id = %s", (link_id,))
            if not cur.fetchone():
                raise HTTPException(status_code=404, detail="Store link not found")
            
            # Update store link
            cur.execute("""
                UPDATE store_links 
                SET store_name = %s, price = %s, url = %s, is_official = %s
                WHERE id = %s
                RETURNING id, product_id, store_name, price, url, is_official, created_at
            """, (
                store_link_data.get("store_name"),
                store_link_data.get("price"),
                store_link_data.get("url"),
                store_link_data.get("is_official", False),
                link_id
            ))
            
            updated_link = cur.fetchone()
            conn.commit()
            
            return {"message": "Store link updated successfully", "store_link": dict(updated_link)}
            
    except Exception as e:
        conn.rollback()
        logger.exception("Error updating store link: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/store-links/{link_id}")
def delete_store_link(
    link_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete a store link (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if link exists
            cur.execute("SELECT id, product_id FROM store_links WHERE id = %s", (link_id,))
            link = cur.fetchone()
            if not link:
                raise HTTPException(status_code=404, detail="Store link not found")
            
            # Delete store link
            cur.execute("DELETE FROM store_links WHERE id = %s", (link_id,))
            conn.commit()
            
            return {"message": "Store link deleted successfully"}
            
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting store link: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.delete("/products/{product_id}")
def delete_product(
    product_id: str,
    current_admin: dict = Depends(get_current_admin_user)
):
    """Delete a product and all related data (admin only)"""
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if product exists
            cur.execute("SELECT id, name, product_url FROM products WHERE id = %s", (product_id,))
            product = cur.fetchone()
            if not product:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Product not found"
                )
            product_url = product.get("product_url")
            
            # Delete in order to avoid foreign key constraints
            # 1. Delete review comments first
            cur.execute("""
                DELETE FROM review_comments 
                WHERE review_id IN (
                    SELECT id FROM reviews WHERE product_id = %s
                )
            """, (product_id,))
            
            # 2. Delete review helpful votes
            cur.execute("""
                DELETE FROM review_helpful_votes 
                WHERE review_id IN (
                    SELECT id FROM reviews WHERE product_id = %s
                )
            """, (product_id,))
            
            # 3. Delete review media
            cur.execute("""
                DELETE FROM review_media 
                WHERE review_id IN (
                    SELECT id FROM reviews WHERE product_id = %s
                )
            """, (product_id,))
            
            # 4. Delete review pros
            cur.execute("""
                DELETE FROM review_pros 
                WHERE review_id IN (
                    SELECT id FROM reviews WHERE product_id = %s
                )
            """, (product_id,))
            
            # 5. Delete review cons
            cur.execute("""
                DELETE FROM review_cons 
                WHERE review_id IN (
                    SELECT id FROM reviews WHERE product_id = %s
                )
            """, (product_id,))
            
            # 6. Delete reviews
            cur.execute("DELETE FROM reviews WHERE product_id = %s", (product_id,))
            
            # 7. Delete product images
            cur.execute("DELETE FROM product_images WHERE product_id = %s", (product_id,))
            
            # 8. Delete product specifications
            cur.execute("DELETE FROM product_specifications WHERE product_id = %s", (product_id,))
            
            # 9. Delete product features
            cur.execute("DELETE FROM product_features WHERE product_id = %s", (product_id,))
            
            # 10. Delete store links
            cur.execute("DELETE FROM store_links WHERE product_id = %s", (product_id,))
            
            # 11. Delete review requests (by product_url)
            if product_url:
                cur.execute("DELETE FROM review_requests WHERE product_url = %s", (product_url,))
            
            # 12. Finally delete the product
            cur.execute("DELETE FROM products WHERE id = %s", (product_id,))
            
            conn.commit()
            
            logger.info(f"Product {product['name']} ({product_id}) deleted by admin {current_admin['email']}")
            
            return {"message": f"Product '{product['name']}' and all related data deleted successfully"}
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error deleting product: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)