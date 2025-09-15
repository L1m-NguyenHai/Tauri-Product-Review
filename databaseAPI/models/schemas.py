from pydantic import BaseModel, EmailStr, validator
from typing import Optional, List
from datetime import datetime
from decimal import Decimal
from uuid import UUID
import re

# User Models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    avatar: Optional[str] = None

class UserCreate(UserBase):
    password: str
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        
        if not re.search(r'[A-Z]', v):
            raise ValueError('Password must contain at least one uppercase letter')
        
        if not re.search(r'[a-z]', v):
            raise ValueError('Password must contain at least one lowercase letter')
        
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        
        if not re.search(r'[^A-Za-z0-9]', v):
            raise ValueError('Password must contain at least one special character')
        
        return v

class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

class UserRoleUpdate(BaseModel):
    role: str
    
    @validator('role')
    def validate_role(cls, v):
        valid_roles = ['user', 'reviewer']
        if v not in valid_roles:
            raise ValueError(f'Invalid role. Must be one of: {", ".join(valid_roles)}')
        return v

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(UserBase):
    id: UUID
    role: str
    email_verified: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class EmailVerificationRequest(BaseModel):
    email: EmailStr

class EmailVerificationConfirm(BaseModel):
    token: str

# Category Models
class CategoryBase(BaseModel):
    name: str
    slug: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None

class CategoryResponse(CategoryBase):
    id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Product Models
class ProductBase(BaseModel):
    name: str
    description: Optional[str] = None
    manufacturer: Optional[str] = None
    price: Optional[Decimal] = None
    product_url: Optional[str] = None
    availability: Optional[str] = None
    status: str = "active"

class ProductCreate(ProductBase):
    category_id: Optional[UUID] = None

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[UUID] = None
    manufacturer: Optional[str] = None
    price: Optional[Decimal] = None
    product_url: Optional[str] = None
    availability: Optional[str] = None
    status: Optional[str] = None

class ProductResponse(ProductBase):
    id: UUID
    category_id: Optional[UUID] = None
    average_rating: Decimal
    review_count: int
    created_at: datetime
    updated_at: datetime
    category_name: Optional[str] = None
    display_image: Optional[str] = None  # From products_with_image view

    class Config:
        from_attributes = True

# Product Feature Models
class ProductFeatureBase(BaseModel):
    feature_text: str
    sort_order: int = 0

class ProductFeatureCreate(ProductFeatureBase):
    product_id: UUID

class ProductFeatureResponse(ProductFeatureBase):
    id: UUID
    product_id: UUID

    class Config:
        from_attributes = True

# Product Image Models
class ProductImageBase(BaseModel):
    image_url: str
    is_primary: bool = False
    sort_order: int = 0

class ProductImageCreate(ProductImageBase):
    product_id: UUID

class ProductImageResponse(ProductImageBase):
    id: UUID
    product_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Product Specification Models
class ProductSpecificationBase(BaseModel):
    spec_name: str
    spec_value: str

class ProductSpecificationCreate(ProductSpecificationBase):
    product_id: UUID

class ProductSpecificationResponse(ProductSpecificationBase):
    id: UUID
    product_id: UUID

    class Config:
        from_attributes = True

# Store Link Models
class StoreLinkBase(BaseModel):
    store_name: str
    price: Optional[Decimal] = None
    url: str
    is_official: bool = False

class StoreLinkCreate(StoreLinkBase):
    product_id: UUID

class StoreLinkResponse(StoreLinkBase):
    id: UUID
    product_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Review Models
class ReviewBase(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    rating: int

    @validator('rating')
    def validate_rating(cls, v):
        if v < 1 or v > 5:
            raise ValueError('Rating must be between 1 and 5')
        return v

class ReviewCreate(ReviewBase):
    product_id: UUID

class ReviewUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    rating: Optional[int] = None
    status: Optional[str] = None

class ReviewResponse(ReviewBase):
    id: UUID
    user_id: UUID
    product_id: UUID
    status: str
    helpful_count: int
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    product_name: Optional[str] = None

    class Config:
        from_attributes = True

# Review Pros Models
class ReviewProBase(BaseModel):
    pro_text: str
    sort_order: int = 0

class ReviewProCreate(ReviewProBase):
    pass

class ReviewProResponse(ReviewProBase):
    id: UUID
    review_id: UUID

    class Config:
        from_attributes = True

# Review Cons Models
class ReviewConBase(BaseModel):
    con_text: str
    sort_order: int = 0

class ReviewConCreate(ReviewConBase):
    pass

class ReviewConResponse(ReviewConBase):
    id: UUID
    review_id: UUID

    class Config:
        from_attributes = True

# Review Media Models
class ReviewMediaBase(BaseModel):
    media_url: str
    media_type: str
    sort_order: int = 0

class ReviewMediaCreate(ReviewMediaBase):
    pass

class ReviewMediaResponse(ReviewMediaBase):
    id: UUID
    review_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Review Helpful Vote Models
class ReviewHelpfulVoteCreate(BaseModel):
    review_id: UUID

class ReviewHelpfulVoteResponse(BaseModel):
    id: UUID
    review_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

# Review Request Models
class ReviewRequestBase(BaseModel):
    product_name: str
    manufacturer: Optional[str] = None
    product_url: Optional[str] = None
    price: Optional[Decimal] = None
    availability: Optional[str] = None
    description: Optional[str] = None
    reasoning: Optional[str] = None
    contact_email: Optional[str] = None

class ReviewRequestCreate(ReviewRequestBase):
    category_id: Optional[UUID] = None

class ReviewRequestUpdate(BaseModel):
    status: Optional[str] = None
    admin_notes: Optional[str] = None

class ReviewRequestResponse(ReviewRequestBase):
    id: UUID
    user_id: UUID
    category_id: Optional[UUID] = None
    status: str
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    user_name: Optional[str] = None
    category_name: Optional[str] = None

    class Config:
        from_attributes = True

# Contact Message Models
class ContactMessageBase(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str

class ContactMessageCreate(ContactMessageBase):
    pass

class ContactMessageUpdate(BaseModel):
    status: Optional[str] = None

class ContactMessageResponse(ContactMessageBase):
    id: UUID
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# User Follow Models
class UserFollowCreate(BaseModel):
    followed_id: UUID

class UserFollowResponse(BaseModel):
    id: UUID
    follower_id: UUID
    followed_id: UUID
    created_at: datetime
    follower_name: Optional[str] = None
    followed_name: Optional[str] = None

    class Config:
        from_attributes = True

# Token Models
class Token(BaseModel):
    access_token: str
    token_type: str
    expires_in: int

class TokenData(BaseModel):
    email: Optional[str] = None

# Statistics Models
class DashboardStats(BaseModel):
    total_users: int
    total_products: int
    total_reviews: int
    pending_reviews: int
    pending_review_requests: int
    unread_messages: int

# Search and Filter Models
class ProductFilter(BaseModel):
    category_id: Optional[UUID] = None
    manufacturer: Optional[str] = None
    min_price: Optional[Decimal] = None
    max_price: Optional[Decimal] = None
    min_rating: Optional[float] = None
    status: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"

class ReviewFilter(BaseModel):
    product_id: Optional[UUID] = None
    user_id: Optional[UUID] = None
    rating: Optional[int] = None
    status: Optional[str] = None
    sort_by: Optional[str] = "created_at"
    sort_order: Optional[str] = "desc"

# Pagination Models
class PaginationParams(BaseModel):
    limit: int = 20
    offset: int = 0

class PaginatedResponse(BaseModel):
    items: List[dict]
    total: int
    limit: int
    offset: int
    has_next: bool
    has_prev: bool

class PaginatedProductsResponse(BaseModel):
    items: List[ProductResponse]
    total: int
    limit: int
    offset: int
    has_next: bool
    has_prev: bool