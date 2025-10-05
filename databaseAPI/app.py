from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
import time
import logging
import os
from dotenv import load_dotenv
from database.connection import init_pool, close_pool
from utils.discord_media import start_discord_bot

# Load environment variables
load_dotenv()

# Import all routers
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.categories import router as categories_router
from routes.products import router as products_router
from routes.reviews import router as reviews_router
from routes.review_requests import router as review_requests_router
from routes.contact import router as contact_router
from routes.admin import router as admin_router

from routes.email_verification import email_verification_router
from routes.activity import router as activity_router
from routes.p2p_sync import router as p2p_sync_router

from contextlib import asynccontextmanager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events"""
    # Startup code
    try:
        init_pool()
        logger.info("Database connection pool initialized successfully")
        # Start Discord bot for media upload
        start_discord_bot()
        logger.info("Discord bot started successfully")
        
        # Start P2P services
        from p2p_sync.discovery import peer_discovery
        from p2p_sync.sync_manager import data_sync_manager
        
        await peer_discovery.start_discovery()
        await data_sync_manager.start_sync_service()
        logger.info("P2P sync services started successfully")
        
    except Exception as e:
        logger.error(f"Failed to initialize services: {e}")
        raise
    yield
    # Shutdown code
    try:
        close_pool()
        logger.info("Database connection pool closed successfully")
        
        # Stop P2P services
        try:
            from p2p_sync.discovery import peer_discovery
            from p2p_sync.sync_manager import data_sync_manager
            
            await peer_discovery.stop_discovery()
            await data_sync_manager.stop_sync_service()
            logger.info("P2P sync services stopped successfully")
        except Exception as e:
            logger.error(f"Error stopping P2P services: {e}")
        
        # Cleanup Discord resources (if cleanup function exists)
        try:
            from utils.discord_media import cleanup_discord # type: ignore
            await cleanup_discord()
            logger.info("Discord resources cleaned up successfully")
        except (ImportError, AttributeError):
            logger.info("No Discord cleanup needed")
    except Exception as e:
        logger.error(f"Error during shutdown: {e}")

    # ...existing code...
app = FastAPI(
    title="Product Review API",
    description="""
    A comprehensive FastAPI application for managing product reviews and ratings with P2P synchronization.
    
    ## Features
    
    * **Authentication & Authorization**: JWT-based authentication with role-based access control
    * **User Management**: User registration, profiles, following system
    * **Product Management**: CRUD operations for products, categories, features, images, specifications
    * **Review System**: Complete review system with ratings, pros/cons, media attachments, helpful votes
    * **Review Requests**: Users can request reviews for new products
    * **Contact System**: Contact form submissions and management
    * **Admin Dashboard**: Comprehensive admin panel with analytics and system management
    * **P2P Synchronization**: Real-time database synchronization between distributed nodes
    
    ## P2P Sync Features
    
    * **Automatic Peer Discovery**: Automatically discover other nodes on the network
    * **Real-time Sync**: WebSocket-based real-time data synchronization
    * **Conflict Resolution**: Intelligent conflict resolution for concurrent updates
    * **Manual Sync**: Manual trigger for synchronization with specific peers
    * **Health Monitoring**: Monitor peer health and connection status
    
    ## Authentication
    
    Most endpoints require authentication. Use the `/auth/login` endpoint to get an access token,
    then include it in the Authorization header as `Bearer <token>`.
    
    ## Roles
    
    * **User**: Can create reviews, follow other users, submit review requests
    * **Admin**: Full access to all endpoints including user management and system administration
    """,
    version="1.0.1",
    contact={
        "name": "API Support",
        "email": "nhailtvop@gmail.com",
    },
    license_info={
        "name": "MIT",
        "url": "https://opensource.org/licenses/MIT",
    },
    lifespan=lifespan
)

app.include_router(activity_router, prefix="/api/v1")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=False,  # Must be False when using allow_origins=["*"]
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Accept",
        "Accept-Language", 
        "Content-Language",
        "Content-Type",
        "Authorization",
        "Cache-Control",
        "X-Requested-With"
    ],
    expose_headers=["*"],
)

# Trusted Host Middleware - Allow all hosts for development/testing
# app.add_middleware(
#     TrustedHostMiddleware,
#     allowed_hosts=["*"]  # Allow all hosts
# )

# Custom middleware for request logging and timing
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    
    # Log request
    logger.info(f"Request: {request.method} {request.url}")
    
    # Process request
    response = await call_next(request)
    
    # Calculate processing time
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = str(process_time)
    
    # Log response
    logger.info(f"Response: {response.status_code} in {process_time:.3f}s")
    
    return response

# Global exception handler
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.status_code,
                "message": exc.detail,
                "path": str(request.url.path)
            }
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": 500,
                "message": "Internal server error",
                "path": str(request.url.path)
            }
        }
    )

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Product Review API",
        "version": "1.0.1",
        "status": "operational",
        "documentation": "/docs",
        "openapi_schema": "/openapi.json"
    }

# Health check endpoint
@app.get("/health", tags=["System"])
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        from database.connection import get_conn, put_conn
        conn = get_conn()
        put_conn(conn)
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": time.time()
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return JSONResponse(
            status_code=503,
            content={
                "status": "unhealthy",
                "database": "disconnected",
                "error": str(e),
                "timestamp": time.time()
            }
        )

# API version endpoint
@app.get("/version", tags=["System"])
async def get_version():
    """Get API version information"""
    return {
        "version": "1.0.1",
        "build": "production",
        "features": [
            "authentication",
            "user_management", 
            "product_management",
            "review_system",
            "admin_dashboard",
            "analytics"
        ]
    }

# Include email verification router without prefix for email links
app.include_router(email_verification_router)

# Include all routers with appropriate prefixes and tags
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(review_requests_router, prefix="/api/v1")
app.include_router(contact_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(p2p_sync_router, prefix="/api/v1")

# Create uploads directory if it doesn't exist
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
avatars_dir = os.path.join(uploads_dir, "avatars")
os.makedirs(uploads_dir, exist_ok=True)
os.makedirs(avatars_dir, exist_ok=True)

# Mount static files for uploads
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Product Review API",
        version="1.0.1",
        description="A comprehensive API for managing product reviews and ratings",
        routes=app.routes,
    )
    
    # Add security scheme
    openapi_schema["components"]["securitySchemes"] = {
        "bearerAuth": {
            "type": "http",
            "scheme": "bearer",
            "bearerFormat": "JWT",
        }
    }
    
    # Add security to all protected endpoints
    for path in openapi_schema["paths"]:
        for method in openapi_schema["paths"][path]:
            if method != "options":
                # Add security to all endpoints except auth and some public endpoints
                if not any(tag in openapi_schema["paths"][path][method].get("tags", []) 
                          for tag in ["Authentication", "Root", "System"]):
                    openapi_schema["paths"][path][method]["security"] = [{"bearerAuth": []}]
    
    app.openapi_schema = openapi_schema
    return app.openapi_schema

app.openapi = custom_openapi

# Development server configuration
if __name__ == "__main__":
    import uvicorn
    
    # Development configuration
    uvicorn.run(
        "app:app",
        host="localhost",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
