from fastapi import APIRouter
from fastapi.responses import HTMLResponse
from routes.auth import verify_email_get, verify_email_post

# Create a separate router specifically for email verification endpoints
# This router will be included without the /api/v1 prefix to handle email links
email_verification_router = APIRouter(prefix="/auth", tags=["Email Verification"])

# Include only the email verification endpoints
email_verification_router.add_api_route(
    "/verify-email", 
    verify_email_get, 
    methods=["GET"], 
    response_class=HTMLResponse,
    summary="Verify Email (GET)",
    description="Verify user email with token via GET request (for clickable email links)"
)

email_verification_router.add_api_route(
    "/verify-email", 
    verify_email_post, 
    methods=["POST"],
    summary="Verify Email (POST)", 
    description="Verify user email with token via POST request"
)