from database.connection import get_conn, put_conn, init_pool, close_pool
from psycopg2.extras import RealDictCursor

# Initialize the pool first
init_pool()

# Test the products_with_image view
conn = get_conn()
try:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Test query like the API will use
        cur.execute('''
        SELECT 
            p.id,
            p.name,
            p.price,
            p.display_image,
            c.name AS category_name
        FROM products_with_image p
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE p.status = %s
        ORDER BY p.created_at DESC
        LIMIT 3
        ''', ('active',))
        
        products = cur.fetchall()
        print('✅ Sample products from API query:')
        for p in products:
            image_preview = p["display_image"][:50] if p["display_image"] else "No image"
            print(f'- {p["name"][:30]}... | Price: {p["price"]} | Image: {image_preview}...')
            
finally:
    put_conn(conn)
    close_pool()