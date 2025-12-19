"""
Helper module để quản lý database operations với HAProxy
Tự động route đến read hoặc write connection pool dựa vào operation type
"""
from contextlib import contextmanager
from database.connection import (
    get_read_conn, get_write_conn,
    put_read_conn, put_write_conn
)
import logging

logger = logging.getLogger("uvicorn.error")

@contextmanager
def read_operation():
    """
    Context manager cho read operations (SELECT)
    Tự động lấy connection từ read pool và trả về sau khi xong
    
    Usage:
        with read_operation() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT ...")
    """
    conn = get_read_conn()
    try:
        yield conn
    finally:
        put_read_conn(conn)

@contextmanager
def write_operation():
    """
    Context manager cho write operations (INSERT, UPDATE, DELETE)
    Tự động lấy connection từ write pool và trả về sau khi xong
    
    Usage:
        with write_operation() as conn:
            cursor = conn.cursor()
            cursor.execute("INSERT ...")
            conn.commit()
    """
    conn = get_write_conn()
    try:
        yield conn
    finally:
        put_write_conn(conn)
