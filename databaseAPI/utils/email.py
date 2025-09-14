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
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Log configuration for debugging
logger.info(f"Email config loaded - SMTP_SERVER: {SMTP_SERVER}, SMTP_PORT: {SMTP_PORT}, FROM_EMAIL: {FROM_EMAIL}")

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
        
        # Create verification URL
        verification_url = f"{FRONTEND_URL}/verify-email?token={token}"
        logger.info(f"Verification URL: {verification_url}")
        
        # Create email content
        subject = "Verify Your Email - Product Review App"
        
        html_body = f"""
        <html>
        <body>
            <h2>Welcome to Product Review App!</h2>
            <p>Hi {name},</p>
            <p>Thank you for registering with us. Please click the link below to verify your email address:</p>
            <p>
                <a href="{verification_url}" 
                   style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                   Verify Email Address
                </a>
            </p>
            <p>Or copy and paste this URL into your browser:</p>
            <p>{verification_url}</p>
            <p>This link will expire in 24 hours.</p>
            <p>If you didn't create this account, you can safely ignore this email.</p>
            <br>
            <p>Best regards,<br>Product Review Team</p>
        </body>
        </html>
        """
        
        text_body = f"""
        Welcome to Product Review App!
        
        Hi {name},
        
        Thank you for registering with us. Please visit the following link to verify your email address:
        
        {verification_url}
        
        This link will expire in 24 hours.
        
        If you didn't create this account, you can safely ignore this email.
        
        Best regards,
        Product Review Team
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
            <p>Start exploring now at: <a href="{FRONTEND_URL}">{FRONTEND_URL}</a></p>
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