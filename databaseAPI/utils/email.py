import smtplib
import secrets
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import os
import logging

logger = logging.getLogger("uvicorn.error")

# Email configuration - you can set these in environment variables
SMTP_SERVER = os.getenv("SMTP_SERVER", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USERNAME = os.getenv("SMTP_USERNAME", "nhailtvop@gmail.com")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "urpf chej lrnk ylzv")
FROM_EMAIL = os.getenv("FROM_EMAIL", SMTP_USERNAME)
API_BASE_URL = os.getenv("API_BASE_URL", "http://localhost:8000")  # API base URL for verification links

# Log configuration for debugging
logger.info(f"Email config loaded - SMTP_SERVER: {SMTP_SERVER}, SMTP_PORT: {SMTP_PORT}, FROM_EMAIL: {FROM_EMAIL}, API_BASE_URL: {API_BASE_URL}")

def generate_verification_token() -> str:
    """Generate a secure verification token"""
    return secrets.token_urlsafe(32)

def get_verification_expiry() -> datetime:
    """Get verification token expiry time (24 hours from now)"""
    return datetime.utcnow() + timedelta(hours=24)

def send_verification_email(email: str, token: str, name: str) -> bool:
    """Send email verification email"""
    try:
        logger.info(f"Attempting to send verification email to {email}")
        
        # Create verification URL pointing to API endpoint
        verification_url = f"{API_BASE_URL}/auth/verify-email?token={token}"
        logger.info(f"Verification URL: {verification_url}")
        
        # Create email content
        subject = "Verify Your Email - Product Review App"
        
        html_body = f"""
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="text-align: center; border-bottom: 1px solid #eee; padding-bottom: 20px;">
                <h2 style="color: #333;">Welcome to Product Review App!</h2>
            </div>
            <div style="padding: 20px 0;">
                <p>Hi {name},</p>
                <p>Thank you for registering with us. Please click the button below to verify your email address and activate your account:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="{verification_url}" 
                       style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                       ✅ Verify Email Address
                    </a>
                </div>
                <p style="color: #666; font-size: 14px;">Or copy and paste this URL into your browser:</p>
                <p style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all; font-family: monospace; font-size: 12px;">{verification_url}</p>
                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; padding: 10px; margin: 20px 0;">
                    <p style="margin: 0; color: #856404; font-size: 14px;">⏰ <strong>Important:</strong> This verification link will expire in 24 hours.</p>
                </div>
                <p style="color: #666; font-size: 14px;">If you didn't create this account, you can safely ignore this email.</p>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; text-align: center; color: #666; font-size: 14px;">
                <p>Best regards,<br><strong>Product Review Team</strong></p>
                <p>🚀 <a href="{API_BASE_URL}/docs" style="color: #007bff;">Explore our API Documentation</a></p>
            </div>
        </body>
        </html>
        """
        
        text_body = f"""
        Welcome to Product Review App!
        
        Hi {name},
        
        Thank you for registering with us. Please visit the following link to verify your email address and activate your account:
        
        {verification_url}
        
        ⏰ IMPORTANT: This verification link will expire in 24 hours.
        
        If you didn't create this account, you can safely ignore this email.
        
        Best regards,
        Product Review Team
        
        🚀 Explore our API: {API_BASE_URL}/docs
        """
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        
        # Add both text and HTML parts
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        
        msg.attach(part1)
        msg.attach(part2)
        
        logger.info(f"Connecting to SMTP server {SMTP_SERVER}:{SMTP_PORT}")
        
        # Send email with detailed error handling
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            # server.set_debuglevel(1)  # Disable debug output for production
            logger.info("Starting TLS connection...")
            server.starttls()
            
            logger.info(f"Logging in with username: {SMTP_USERNAME}")
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            
            logger.info(f"Sending email to {email}")
            server.send_message(msg)
        
        logger.info(f"Verification email sent successfully to {email}")
        return True
        
    except smtplib.SMTPAuthenticationError as e:
        logger.error(f"SMTP Authentication failed for {email}: {str(e)}")
        logger.error("Please check SMTP_USERNAME and SMTP_PASSWORD in .env file")
        return False
    except smtplib.SMTPException as e:
        logger.error(f"SMTP error when sending email to {email}: {str(e)}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error sending verification email to {email}: {str(e)}")
        logger.error(f"Error type: {type(e).__name__}")
        return False

def send_welcome_email(email: str, name: str) -> bool:
    """Send welcome email after successful verification"""
    try:
        subject = "Welcome to Product Review App!"
        
        html_body = f"""
        <html>
        <body>
            <h2>Welcome to Product Review App!</h2>
            <p>Hi {name},</p>
            <p>Your email has been successfully verified! You can now:</p>
            <ul>
                <li>Browse and search products</li>
                <li>Write detailed reviews</li>
                <li>Request product reviews</li>
                <li>Interact with other reviewers</li>
            </ul>
            <p>Start exploring now by accessing the API at: <a href="{API_BASE_URL}/docs">{API_BASE_URL}/docs</a></p>
            <br>
            <p>Happy reviewing!<br>Product Review Team</p>
        </body>
        </html>
        """
        
        # Create message
        msg = MIMEText(html_body, 'html')
        msg['Subject'] = subject
        msg['From'] = FROM_EMAIL
        msg['To'] = email
        
        # Send email
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
            server.starttls()
            server.login(SMTP_USERNAME, SMTP_PASSWORD)
            server.send_message(msg)
        
        logger.info(f"Welcome email sent to {email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {email}: {str(e)}")
        return False