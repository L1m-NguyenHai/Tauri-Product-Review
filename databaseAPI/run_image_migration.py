#!/usr/bin/env python3
"""
Run migration to remove image column from products table
"""

import psycopg2
import sys
import os

def main():
    try:
        # Import connection from database module
        from database.connection import get_db_connection
        print('✅ Using database.connection module')
    except ImportError:
        # Fallback connection
        def get_db_connection():
            return psycopg2.connect(
                host='localhost',
                database='LimReview',
                user='postgres',
                password='13579-97531'
            )
        print('⚠️  Using fallback connection')

    # Read migration script
    print('📖 Reading migration script...')
    try:
        with open('remove_image_url_migration.sql', 'r', encoding='utf-8') as f:
            sql_script = f.read()
    except FileNotFoundError:
        print('❌ Migration file not found!')
        return False

    print('🔌 Connecting to database...')
    conn = None
    cursor = None
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        print('🚀 Executing migration...')
        cursor.execute(sql_script)
        conn.commit()
        
        print('✅ Migration executed successfully!')
        
        # Verify changes
        print('\n🔍 Verifying schema changes...')
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'products' 
            AND column_name = 'image'
        """)
        remaining_cols = cursor.fetchall()
        
        if remaining_cols:
            print(f'⚠️  Image column still exists: {[col[0] for col in remaining_cols]}')
        else:
            print('✅ Image column successfully removed!')
            
        # Check views
        cursor.execute("""
            SELECT viewname 
            FROM pg_views 
            WHERE viewname IN ('products_with_image', 'products_with_pricing')
            AND schemaname = 'public'
        """)
        views = cursor.fetchall()
        print(f'✅ Created views: {[view[0] for view in views]}')
        
        # Check function
        cursor.execute("""
            SELECT proname 
            FROM pg_proc 
            WHERE proname = 'get_product_lowest_price'
        """)
        functions = cursor.fetchall()
        if functions:
            print('✅ Created function: get_product_lowest_price')
        
        # Test the view
        print('\n🧪 Testing products_with_image view...')
        cursor.execute("""
            SELECT COUNT(*) as total_products,
                   COUNT(first_image_url) as products_with_images
            FROM products_with_image
            LIMIT 1
        """)
        test_result = cursor.fetchone()
        if test_result:
            total, with_images = test_result
            print(f'📊 Total products: {total}, Products with images: {with_images}')
        
        return True
        
    except Exception as e:
        print(f'❌ Migration failed: {e}')
        if conn:
            conn.rollback()
        return False
        
    finally:
        if cursor:
            cursor.close()
        if conn:
            conn.close()
            print('\n🔌 Database connection closed')

if __name__ == '__main__':
    success = main()
    if success:
        print('\n🎉 Migration completed successfully!')
    else:
        print('\n💥 Migration failed!')
        sys.exit(1)