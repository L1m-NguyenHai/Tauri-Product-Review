from psycopg2.pool import ThreadedConnectionPool
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException
import os
import logging

logger = logging.getLogger("uvicorn.error")

# Load environment variables
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_NAME = os.getenv("DB_NAME", "LimReview")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASS = os.getenv("DB_PASS", "13579-97531")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_MIN_CONN = int(os.getenv("DB_MIN_CONN", "1"))
DB_MAX_CONN = int(os.getenv("DB_MAX_CONN", "10"))

pool = None

def init_pool():
    global pool
    try:
        pool = ThreadedConnectionPool(
            minconn=DB_MIN_CONN,
            maxconn=DB_MAX_CONN,
            host=DB_HOST,
            database=DB_NAME,
            user=DB_USER,
            password=DB_PASS,
            port=DB_PORT,
        )
        logger.info("Database connection pool created.")
    except Exception as e:
        logger.exception("Failed to create DB connection pool: %s", e)
        raise

def close_pool():
    global pool
    if pool:
        pool.closeall()
        logger.info("Database connection pool closed.")

def get_conn():
    if not pool:
        raise HTTPException(status_code=500, detail="Database pool is not initialized")
    try:
        return pool.getconn()
    except Exception as e:
        logger.exception("Could not get DB connection: %s", e)
        raise HTTPException(status_code=500, detail="Could not acquire database connection")

def put_conn(conn):
    if pool and conn:
        try:
            pool.putconn(conn)
        except Exception:
            pass