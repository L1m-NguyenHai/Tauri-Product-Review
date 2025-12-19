from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException
import os
import logging

logger = logging.getLogger("uvicorn.error")

# Load environment variables for HAProxy
# HAProxy endpoints - Port 5000 for Write (Master), Port 5001 for Read (Replica)
DB_WRITE_HOST = os.getenv("DB_WRITE_HOST", "52.220.60.78")
DB_WRITE_PORT = int(os.getenv("DB_WRITE_PORT", "5000"))
DB_READ_HOST = os.getenv("DB_READ_HOST", "52.220.60.78")
DB_READ_PORT = int(os.getenv("DB_READ_PORT", "5001"))

DB_NAME = os.getenv("DB_NAME", "review_app_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "")
DB_MIN_CONN = int(os.getenv("DB_MIN_CONN", "1"))
DB_MAX_CONN = int(os.getenv("DB_MAX_CONN", "10"))

write_pool = None
read_pool = None

def init_pool():
    """Initialize both write and read connection pools for HAProxy"""
    global write_pool, read_pool
    try:
        # Write pool - connects to HAProxy port 5000 (Master)
        write_pool = ThreadedConnectionPool(
            minconn=DB_MIN_CONN,
            maxconn=DB_MAX_CONN,
            host=DB_WRITE_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_WRITE_PORT,
        )
        logger.info(f"Write connection pool created (HAProxy {DB_WRITE_HOST}:{DB_WRITE_PORT})")
        
        # Read pool - connects to HAProxy port 5001 (Replica)
        read_pool = ThreadedConnectionPool(
            minconn=DB_MIN_CONN,
            maxconn=DB_MAX_CONN,
            host=DB_READ_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_READ_PORT,
        )
        logger.info(f"Read connection pool created (HAProxy {DB_READ_HOST}:{DB_READ_PORT})")
        
    except Exception as e:
        logger.exception("Failed to create DB connection pools: %s", e)
        raise

def close_pool():
    """Close both write and read connection pools"""
    global write_pool, read_pool
    if write_pool:
        write_pool.closeall()
        logger.info("Write connection pool closed.")
    if read_pool:
        read_pool.closeall()
        logger.info("Read connection pool closed.")

def is_connection_alive(conn):
    """Check if a database connection is still alive"""
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT 1")
        return True
    except Exception:
        return False

def get_write_conn():
    """Get a connection from the write pool (for INSERT, UPDATE, DELETE operations)"""
    if not write_pool:
        raise HTTPException(status_code=500, detail="Write database pool is not initialized")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            conn = write_pool.getconn()
            # Validate the connection
            if not is_connection_alive(conn):
                logger.warning(f"Stale write connection detected, closing and retrying (attempt {attempt + 1})")
                try:
                    conn.close()
                except:
                    pass
                write_pool.putconn(conn, close=True)
                if attempt < max_retries - 1:
                    continue
                else:
                    raise Exception("Failed to get valid write connection after retries")
            return conn
        except Exception as e:
            logger.exception("Could not get write DB connection (attempt %d): %s", attempt + 1, e)
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail="Could not acquire write database connection")
    
    raise HTTPException(status_code=500, detail="Could not acquire write database connection")

def get_read_conn():
    """Get a connection from the read pool (for SELECT operations)"""
    if not read_pool:
        raise HTTPException(status_code=500, detail="Read database pool is not initialized")
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            conn = read_pool.getconn()
            # Validate the connection
            if not is_connection_alive(conn):
                logger.warning(f"Stale read connection detected, closing and retrying (attempt {attempt + 1})")
                try:
                    conn.close()
                except:
                    pass
                read_pool.putconn(conn, close=True)
                if attempt < max_retries - 1:
                    continue
                else:
                    raise Exception("Failed to get valid read connection after retries")
            return conn
        except Exception as e:
            logger.exception("Could not get read DB connection (attempt %d): %s", attempt + 1, e)
            if attempt == max_retries - 1:
                raise HTTPException(status_code=500, detail="Could not acquire read database connection")
    
    raise HTTPException(status_code=500, detail="Could not acquire read database connection")

def get_conn():
    """
    Backward compatibility: Returns write connection by default.
    Use get_read_conn() or get_write_conn() explicitly for better control.
    """
    logger.warning("Using deprecated get_conn(). Use get_read_conn() or get_write_conn() explicitly.")
    return get_write_conn()

def put_write_conn(conn):
    """Return a write connection to the pool"""
    if write_pool and conn:
        try:
            write_pool.putconn(conn)
        except Exception:
            pass

def put_read_conn(conn):
    """Return a read connection to the pool"""
    if read_pool and conn:
        try:
            read_pool.putconn(conn)
        except Exception:
            pass

def put_conn(conn):
    """
    Backward compatibility: Try to return connection to write pool.
    Use put_read_conn() or put_write_conn() explicitly for better control.
    """
    put_write_conn(conn)

def safe_rollback(conn):
    """Safely rollback a connection, handling already-closed connections"""
    try:
        if conn and not conn.closed:
            conn.rollback()
            logger.info("Transaction rolled back successfully")
    except Exception as e:
        logger.warning(f"Failed to rollback connection: {e}")