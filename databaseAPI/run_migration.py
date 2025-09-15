#!/usr/bin/env python3
"""
Script to apply the database migration for removing original_price
and setting up auto-update of product prices from store_links
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database.connection import init_pool, get_conn, put_conn, close_pool
from psycopg2.extras import RealDictCursor

def apply_migration():
    conn = None
    try:
        # Initialize database pool first
        print("🔌 Initializing database connection...")
        init_pool()
        
        conn = get_conn()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            print("🚀 Starting database migration...")
            
            # Read and execute the migration SQL file
            with open('remove_original_price_migration.sql', 'r') as f:
                sql_content = f.read()
            
            # Execute the entire migration as a transaction
            cur.execute(sql_content)
            conn.commit()
            
            print('✅ Migration completed successfully!')
            
            # Run verification queries
            print('\n📊 Verification Results:')
            
            # Check if original_price column is removed
            cur.execute("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name = 'products' AND column_name = 'original_price'
            """)
            original_price_exists = cur.fetchone()
            
            if original_price_exists:
                print('❌ ERROR: original_price column still exists!')
            else:
                print('✅ original_price column successfully removed')
            
            # Check trigger exists
            cur.execute("""
                SELECT trigger_name 
                FROM information_schema.triggers 
                WHERE trigger_name = 'trigger_update_product_price'
            """)
            trigger_exists = cur.fetchone()
            
            if trigger_exists:
                print('✅ Price update trigger successfully created')
            else:
                print('❌ ERROR: Price update trigger not found!')
            
            # Show sample of product prices vs store_links prices
            cur.execute("""
                SELECT 
                    p.name, 
                    p.price as product_price, 
                    MIN(sl.price) as min_store_price,
                    COUNT(sl.id) as store_count
                FROM products p 
                LEFT JOIN store_links sl ON p.id = sl.product_id 
                WHERE sl.price IS NOT NULL 
                GROUP BY p.id, p.name, p.price 
                ORDER BY p.name
                LIMIT 5
            """)
            
            sample_data = cur.fetchall()
            if sample_data:
                print('\n📋 Sample Product Prices (first 5):')
                for row in sample_data:
                    print(f"  • {row['name'][:50]}...")
                    print(f"    Product Price: {row['product_price']}")
                    print(f"    Min Store Price: {row['min_store_price']}")
                    print(f"    Store Links: {row['store_count']}")
                    print()
            
        return True
        
    except Exception as e:
        print(f'❌ Migration failed: {e}')
        if conn:
            conn.rollback()
        return False
    finally:
        if conn:
            put_conn(conn)
        # Close pool after migration
        close_pool()

if __name__ == "__main__":
    success = apply_migration()
    if success:
        print("\n🎉 Migration completed successfully!")
        print("Next steps:")
        print("1. Restart your backend server")
        print("2. Test product listings to verify prices display correctly")
        print("3. Test admin store_links management")
    else:
        print("\n💥 Migration failed! Please check the error above.")
        sys.exit(1)