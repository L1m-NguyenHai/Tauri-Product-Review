#!/usr/bin/env python3
"""
Script test để verify HAProxy connection trong databaseAPI
Test cả read và write operations
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from database.connection import init_pool, close_pool, get_read_conn, get_write_conn, put_read_conn, put_write_conn
from psycopg2.extras import RealDictCursor
from datetime import datetime

def test_read_operations():
    """Test read operations với read pool"""
    print("\n" + "="*60)
    print("🔵 TESTING READ OPERATIONS (Read Pool - Port 5001)")
    print("="*60)
    
    try:
        conn = get_read_conn()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("✅ Got connection from read pool!")
        
        # Test 1: Count users
        print("\n📖 Test 1: Count users...")
        cursor.execute("SELECT COUNT(*) as count FROM users")
        result = cursor.fetchone()
        print(f"✅ Total users: {result['count']}")
        
        # Test 2: List categories
        print("\n📖 Test 2: List categories...")
        cursor.execute("SELECT id, name FROM categories ORDER BY name LIMIT 5")
        categories = cursor.fetchall()
        print(f"✅ Found {len(categories)} categories:")
        for cat in categories:
            print(f"   - {cat['name']} (ID: {cat['id']})")
        
        # Test 3: Count products
        print("\n📖 Test 3: Count products...")
        cursor.execute("SELECT COUNT(*) as count FROM products")
        result = cursor.fetchone()
        print(f"✅ Total products: {result['count']}")
        
        # Test 4: Count reviews
        print("\n📖 Test 4: Count reviews...")
        cursor.execute("SELECT COUNT(*) as count FROM reviews")
        result = cursor.fetchone()
        print(f"✅ Total reviews: {result['count']}")
        
        cursor.close()
        put_read_conn(conn)
        
        print("\n✅ READ OPERATIONS TEST: PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ READ OPERATIONS TEST FAILED!")
        print(f"Error: {type(e).__name__}: {e}")
        return False

def test_write_operations():
    """Test write operations với write pool"""
    print("\n" + "="*60)
    print("🔵 TESTING WRITE OPERATIONS (Write Pool - Port 5000)")
    print("="*60)
    
    try:
        conn = get_write_conn()
        conn.autocommit = False
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        print("✅ Got connection from write pool!")
        
        # Test 1: Create test table
        print("\n📝 Test 1: Create test table...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS api_test (
                id SERIAL PRIMARY KEY,
                test_data VARCHAR(255),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        """)
        conn.commit()
        print("✅ Table created successfully!")
        
        # Test 2: Insert data
        test_value = f"API Test - {datetime.now().isoformat()}"
        print(f"\n📝 Test 2: Insert data: '{test_value}'")
        cursor.execute(
            "INSERT INTO api_test (test_data) VALUES (%s) RETURNING id, created_at",
            (test_value,)
        )
        result = cursor.fetchone()
        conn.commit()
        print(f"✅ Insert successful! ID: {result['id']}")
        
        # Test 3: Update data
        print(f"\n📝 Test 3: Update data with ID {result['id']}...")
        cursor.execute(
            "UPDATE api_test SET test_data = %s WHERE id = %s",
            (f"Updated - {datetime.now().isoformat()}", result['id'])
        )
        conn.commit()
        print(f"✅ Update successful! Rows affected: {cursor.rowcount}")
        
        # Test 4: Delete data
        print(f"\n📝 Test 4: Delete test data...")
        cursor.execute("DELETE FROM api_test WHERE id = %s", (result['id'],))
        conn.commit()
        print(f"✅ Delete successful! Rows affected: {cursor.rowcount}")
        
        # Cleanup
        cursor.execute("DROP TABLE IF EXISTS api_test")
        conn.commit()
        print("\n🧹 Cleaned up test table")
        
        cursor.close()
        put_write_conn(conn)
        
        print("\n✅ WRITE OPERATIONS TEST: PASSED")
        return True
        
    except Exception as e:
        print(f"\n❌ WRITE OPERATIONS TEST FAILED!")
        print(f"Error: {type(e).__name__}: {e}")
        if conn:
            conn.rollback()
        return False

def test_read_pool_write_restriction():
    """Test xem read pool có chặn write operations không"""
    print("\n" + "="*60)
    print("🔵 TESTING READ POOL WRITE RESTRICTION")
    print("="*60)
    
    try:
        conn = get_read_conn()
        cursor = conn.cursor()
        
        print("\n🚫 Attempting to write on read pool (should fail)...")
        
        try:
            cursor.execute("""
                CREATE TABLE test_should_fail (
                    id SERIAL PRIMARY KEY
                )
            """)
            conn.commit()
            print("⚠️  WARNING: Write operation succeeded on read pool!")
            put_read_conn(conn)
            return False
        except Exception as write_error:
            print(f"✅ Write operation correctly rejected!")
            print(f"   Error: {type(write_error).__name__}")
            put_read_conn(conn)
            return True
            
    except Exception as e:
        print(f"\n❌ TEST FAILED!")
        print(f"Error: {type(e).__name__}: {e}")
        return False

def main():
    print("\n" + "🚀"*30)
    print("DATABASE API - HAPROXY CONNECTION TEST")
    print("Testing connection pools:")
    print("  - Write Pool: Port 5000 (Master)")
    print("  - Read Pool: Port 5001 (Replica)")
    print("🚀"*30)
    
    try:
        # Initialize pools
        print("\n🔄 Initializing connection pools...")
        init_pool()
        print("✅ Connection pools initialized!")
        
        results = {}
        
        # Test read operations
        results['read'] = test_read_operations()
        
        # Test write operations
        results['write'] = test_write_operations()
        
        # Test read pool restriction
        results['restriction'] = test_read_pool_write_restriction()
        
        # Summary
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)
        print(f"Read Operations:        {'✅ PASSED' if results['read'] else '❌ FAILED'}")
        print(f"Write Operations:       {'✅ PASSED' if results['write'] else '❌ FAILED'}")
        print(f"Read Pool Restriction:  {'✅ PASSED' if results['restriction'] else '❌ FAILED'}")
        print("="*60)
        
        # Cleanup
        close_pool()
        print("\n🧹 Connection pools closed")
        
        if all(results.values()):
            print("\n🎉 ALL TESTS PASSED!")
            return 0
        else:
            print("\n⚠️  SOME TESTS FAILED!")
            return 1
            
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == "__main__":
    sys.exit(main())
