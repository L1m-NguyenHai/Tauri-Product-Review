from fastapi import FastAPI, HTTPException, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse
from fastapi.openapi.docs import get_swagger_ui_html
from fastapi.openapi.utils import get_openapi
import time
import logging
from database.connection import init_pool, close_pool
from discord_media import start_discord_bot

# Import all routers
from routes.auth import router as auth_router
from routes.users import router as users_router
from routes.categories import router as categories_router
from routes.products import router as products_router
from routes.reviews import router as reviews_router
from routes.review_requests import router as review_requests_router
from routes.contact import router as contact_router
from routes.admin import router as admin_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app with comprehensive metadata
app = FastAPI(
    title="Product Review API",
    description="""
    A comprehensive FastAPI application for managing product reviews and ratings.
    
    ## Features
    
    * **Authentication & Authorization**: JWT-based authentication with role-based access control
    * **User Management**: User registration, profiles, following system
    * **Product Management**: CRUD operations for products, categories, features, images, specifications
    * **Review System**: Complete review system with ratings, pros/cons, media attachments, helpful votes
    * **Review Requests**: Users can request reviews for new products
    * **Contact System**: Contact form submissions and management
    * **Admin Dashboard**: Comprehensive admin panel with analytics and system management
    
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
)

# CORS Middleware - Configure for your frontend domains
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # React development server
        "http://localhost:5173",  # Vite development server
        "http://localhost:8080",  # Vue development server
        "https://yourdomain.com",  # Production frontend
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host Middleware (optional, for production)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["localhost", "127.0.0.1", "yourdomain.com"]
)

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

# Database lifecycle events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection pool on startup"""
    try:
        init_pool()
        logger.info("Database connection pool initialized successfully")
        # Start Discord bot for media upload
        start_discord_bot()
        logger.info("Discord bot started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database or Discord bot: {e}")
        raise

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection pool on shutdown"""
    try:
        close_pool()
        logger.info("Database connection pool closed successfully")
    except Exception as e:
        logger.error(f"Error closing database: {e}")

# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "message": "Product Review API",
        "version": "1.0.0",
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
        "version": "1.0.0",
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

# Include all routers with appropriate prefixes and tags
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(categories_router, prefix="/api/v1")
app.include_router(products_router, prefix="/api/v1")
app.include_router(reviews_router, prefix="/api/v1")
app.include_router(review_requests_router, prefix="/api/v1")
app.include_router(contact_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")

# Custom OpenAPI schema
def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    
    openapi_schema = get_openapi(
        title="Product Review API",
        version="1.0.0",
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
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
        access_log=True
    )
