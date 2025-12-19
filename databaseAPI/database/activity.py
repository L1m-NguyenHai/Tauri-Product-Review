# Hoạt động với bảng user_activities
from database.connection import get_read_conn, get_write_conn, put_read_conn, put_write_conn
from psycopg2.extras import RealDictCursor
from fastapi import HTTPException
import json

def create_user_activity(user_id, activity_type, activity_data=None):
	conn = get_write_conn()
	try:
		with conn.cursor(cursor_factory=RealDictCursor) as cur:
			# Xóa activity cũ hơn 30 ngày trước khi thêm mới
			cur.execute(
				"""
				DELETE FROM user_activities 
				WHERE created_at < NOW() - INTERVAL '30 days'
				"""
			)
			
			cur.execute(
				"""
				INSERT INTO user_activities (user_id, activity_type, activity_data)
				VALUES (%s, %s, %s)
				RETURNING id, user_id, activity_type, activity_data, created_at
				""",
				(str(user_id), activity_type, json.dumps(activity_data) if activity_data else None)
			)
			activity = cur.fetchone()
			conn.commit()
			return activity
	except Exception as e:
		conn.rollback()
		raise HTTPException(status_code=500, detail=f"Error creating user activity: {e}")
	finally:
		put_write_conn(conn)

def get_user_activities(user_id=None, limit=20, offset=0):
	conn = get_read_conn()
	try:
		with conn.cursor(cursor_factory=RealDictCursor) as cur:
			if user_id:
				cur.execute(
					"""
					SELECT * FROM user_activities 
					WHERE user_id = %s 
					AND created_at >= NOW() - INTERVAL '30 days'
					ORDER BY created_at DESC LIMIT %s OFFSET %s
					""",
					(str(user_id), limit, offset)
				)
			else:
				cur.execute(
					"""
					SELECT * FROM user_activities
					WHERE created_at >= NOW() - INTERVAL '30 days'
					ORDER BY created_at DESC LIMIT %s OFFSET %s
					""",
					(limit, offset)
				)
			return cur.fetchall()
	except Exception as e:
		raise HTTPException(status_code=500, detail=f"Error fetching user activities: {e}")
	finally:
		put_read_conn(conn)
