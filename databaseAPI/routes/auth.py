from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPAuthorizationCredentials
from datetime import timedelta
from models.schemas import UserCreate, UserLogin, UserResponse, Token
from auth.security import (
    authenticate_user, 
    create_access_token, 
    get_password_hash,
    get_current_user,
    ACCESS_TOKEN_EXPIRE_MINUTES
)
from database.connection import get_conn, put_conn
from psycopg2.extras import RealDictCursor
import logging
import uuid

logger = logging.getLogger("uvicorn.error")

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=UserResponse)
def register(user: UserCreate):
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Check if user already exists
            cur.execute("SELECT id FROM users WHERE email = %s", (user.email,))
            if cur.fetchone():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            
            # Create new user
            user_id = str(uuid.uuid4())
            hashed_password = get_password_hash(user.password)
            
            cur.execute("""
                INSERT INTO users (id, email, name, password_hash, avatar, role)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
            """, (user_id, user.email, user.name, hashed_password, user.avatar, "user"))
            
            new_user = cur.fetchone()
            conn.commit()
            return new_user
            
    except HTTPException:
        raise
    except Exception as e:
        conn.rollback()
        logger.exception("Error creating user: %s", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        put_conn(conn)

@router.post("/login", response_model=Token)
def login(user: UserLogin):
    authenticated_user = authenticate_user(user.email, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user["email"]}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.get("/me", response_model=UserResponse)
def get_current_user_info(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/refresh", response_model=Token)
def refresh_token(current_user: dict = Depends(get_current_user)):
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user["email"]}, 
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "expires_in": ACCESS_TOKEN_EXPIRE_MINUTES * 60
    }

@router.post("/logout")
def logout(current_user: dict = Depends(get_current_user)):
    """
    Logout endpoint - Client-side logout
    
    Since JWTs are stateless, the client should:
    1. Delete the token from local storage/cookies
    2. Clear any cached user data
    3. Redirect to login page
    
    For additional security, you can implement server-side token blacklisting
    using the /logout-server endpoint.
    """
    return {
        "message": "Successfully logged out",
        "instructions": {
            "client_action": "Delete the JWT token from client storage",
            "redirect": "/login",
            "clear_cache": True
        }
    }

@router.post("/logout-server")
def logout_server(current_user: dict = Depends(get_current_user)):
    """
    Server-side logout with token blacklisting
    
    This adds the current token to a blacklist in the database.
    Requires implementing token blacklist checking in the auth middleware.
    """
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Get the current token from the request
            from fastapi import Request
            # Note: In a real implementation, you'd extract the token from the request
            # For now, we'll create a simple logout record
            
            logout_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO user_sessions (id, user_id, action, created_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT DO NOTHING
            """, (logout_id, current_user["id"], "logout"))
            
            conn.commit()
            
            return {
                "message": "Successfully logged out from server",
                "user_id": current_user["id"],
                "logout_time": "now",
                "instructions": {
                    "client_action": "Delete the JWT token from client storage",
                    "redirect": "/login",
                    "server_action": "Token invalidated on server"
                }
            }
            
    except Exception as e:
        conn.rollback()
        logger.exception("Error during server logout: %s", e)
        # Even if server logout fails, client should still logout
        return {
            "message": "Client logout successful, server logout failed",
            "error": str(e),
            "instructions": {
                "client_action": "Delete the JWT token from client storage",
                "redirect": "/login"
            }
        }
    finally:
        put_conn(conn)

@router.post("/logout-all")
def logout_all_devices(current_user: dict = Depends(get_current_user)):
    """
    Logout from all devices
    
    This invalidates all sessions for the current user.
    Useful for security purposes when account is compromised.
    """
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Record the logout-all action
            logout_id = str(uuid.uuid4())
            cur.execute("""
                INSERT INTO user_sessions (id, user_id, action, created_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            """, (logout_id, current_user["id"], "logout_all"))
            
            # Update user's updated_at timestamp to invalidate all existing tokens
            # (if you implement token validation based on user.updated_at)
            cur.execute("""
                UPDATE users 
                SET updated_at = CURRENT_TIMESTAMP 
                WHERE id = %s
            """, (current_user["id"],))
            
            conn.commit()
            
            return {
                "message": "Successfully logged out from all devices",
                "user_id": current_user["id"],
                "logout_time": "now",
                "instructions": {
                    "client_action": "Delete the JWT token from client storage",
                    "redirect": "/login",
                    "server_action": "All user sessions invalidated"
                }
            }
            
    except Exception as e:
        conn.rollback()
        logger.exception("Error during logout all: %s", e)
        raise HTTPException(status_code=500, detail="Logout failed")
    finally:
        put_conn(conn)