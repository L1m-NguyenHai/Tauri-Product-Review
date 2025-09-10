# Coding Standards & Best Practices - LimReview

## Tổng Quan

Tài liệu này định nghĩa các quy ước coding, best practices và workflow để đảm bảo code quality và team collaboration hiệu quả.

---

## Frontend Standards (React/TypeScript)

### 1. Naming Conventions

#### Components
```typescript
// ✅ PascalCase cho React components
const UserProfile = () => { ... };
const ProductList = () => { ... };

// ✅ Descriptive names
const ReviewModal = () => { ... };
const ConfirmDialog = () => { ... };

// ❌ Tránh generic names
const Modal = () => { ... }; // Too generic
const Dialog = () => { ... }; // Too generic
```

#### Files & Folders
```
// ✅ PascalCase cho component files
UserProfile.tsx
ProductList.tsx

// ✅ camelCase cho utility files
apiClient.ts
authUtils.ts

// ✅ kebab-case cho CSS/assets
user-profile.css
product-image.png
```

#### Variables & Functions
```typescript
// ✅ camelCase
const userName = 'john_doe';
const isUserAuthenticated = true;
const getUserProfile = () => { ... };

// ✅ Boolean variables với is/has/can prefix
const isLoading = false;
const hasPermission = true;
const canEdit = false;

// ✅ Constants UPPER_CASE
const API_BASE_URL = 'http://localhost:8000';
const MAX_FILE_SIZE = 5 * 1024 * 1024;
```

### 2. Component Structure

#### Standard Component Template
```typescript
import React, { useState, useEffect } from 'react';
import { SomeType } from '../types';
import { someUtility } from '../utils';

// Props interface
interface ComponentNameProps {
  prop1: string;
  prop2?: number; // Optional props
  onAction: (data: SomeType) => void; // Callbacks
}

// Main component
const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = defaultValue,
  onAction
}) => {
  // State hooks
  const [localState, setLocalState] = useState<string>('');
  
  // Effect hooks
  useEffect(() => {
    // Side effects
  }, []);
  
  // Event handlers
  const handleSomething = () => {
    // Handler logic
    onAction(data);
  };
  
  // Early returns
  if (!prop1) {
    return <div>Loading...</div>;
  }
  
  // Main render
  return (
    <div className="component-name">
      {/* JSX content */}
    </div>
  );
};

export default ComponentName;
```

### 3. TypeScript Best Practices

#### Type Definitions
```typescript
// ✅ Interface cho object shapes
interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

// ✅ Type aliases cho unions
type UserRole = 'user' | 'admin';
type LoadingState = 'idle' | 'loading' | 'success' | 'error';

// ✅ Generic types
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}
```

#### API Response Types
```typescript
// ✅ Consistent API response typing
interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface ProductListResponse {
  products: Product[];
  total: number;
  limit: number;
  offset: number;
}
```

### 4. Styling Guidelines

#### Tailwind CSS Usage
```tsx
// ✅ Component-based classes
<div className="flex items-center justify-between p-4 bg-white rounded-lg shadow-md">
  
// ✅ Responsive design
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// ✅ Dark mode support
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ✅ Consistent spacing
<div className="p-4 m-4"> // Use Tailwind spacing scale
```

#### Custom CSS (when needed)
```css
/* ✅ BEM methodology */
.product-card {}
.product-card__image {}
.product-card__title {}
.product-card--featured {}

/* ✅ CSS Custom Properties */
:root {
  --primary-color: #3b82f6;
  --secondary-color: #64748b;
  --border-radius: 0.5rem;
}
```

### 5. State Management

#### React Context
```typescript
// ✅ Context với TypeScript
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ✅ Custom hook for context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

#### Local State
```typescript
// ✅ Proper state typing
const [products, setProducts] = useState<Product[]>([]);
const [loading, setLoading] = useState<boolean>(false);
const [error, setError] = useState<string | null>(null);

// ✅ State updates
setProducts(prevProducts => [...prevProducts, newProduct]);
```

---

## Backend Standards (Python/FastAPI)

### 1. Code Style

#### PEP 8 Compliance
```python
# ✅ Import organization
import os
import sys
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel

from models.schemas import UserResponse
from auth.security import get_current_user

# ✅ Function naming (snake_case)
def get_user_profile(user_id: str) -> UserResponse:
    """Get user profile by ID."""
    pass

# ✅ Class naming (PascalCase)
class UserService:
    """Service for user operations."""
    
    def __init__(self):
        pass
    
    def create_user(self, user_data: dict) -> User:
        """Create a new user."""
        pass

# ✅ Constants (UPPER_CASE)
MAX_FILE_SIZE = 5 * 1024 * 1024
DEFAULT_PAGE_SIZE = 20
```

### 2. API Endpoint Structure

#### Standard Endpoint Template
```python
@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: str,
    current_user: dict = Depends(get_current_user)
) -> UserResponse:
    """
    Get user by ID.
    
    Args:
        user_id: UUID of the user
        current_user: Currently authenticated user
        
    Returns:
        UserResponse: User information
        
    Raises:
        HTTPException: If user not found or access denied
    """
    conn = get_conn()
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute(
                "SELECT * FROM users WHERE id = %s", 
                (user_id,)
            )
            user = cur.fetchone()
            
            if not user:
                raise HTTPException(
                    status_code=404, 
                    detail="User not found"
                )
                
            return user
            
    except HTTPException:
        raise
    except Exception as e:
        logger.exception("Error fetching user: %s", e)
        raise HTTPException(
            status_code=500,
            detail="Internal server error"
        )
    finally:
        put_conn(conn)
```

### 3. Database Practices

#### Query Organization
```python
# ✅ Parameterized queries
cur.execute(
    """
    SELECT u.*, COUNT(r.id) as review_count
    FROM users u
    LEFT JOIN reviews r ON u.id = r.user_id
    WHERE u.email = %s AND u.is_active = %s
    GROUP BY u.id
    """, 
    (email, True)
)

# ✅ Transaction handling
conn = get_conn()
try:
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # Multiple operations in transaction
        cur.execute("INSERT INTO users ...")
        cur.execute("INSERT INTO user_profiles ...")
        conn.commit()
except Exception:
    conn.rollback()
    raise
finally:
    put_conn(conn)
```

### 4. Error Handling

#### Consistent Error Responses
```python
# ✅ Standard exception handling
def validate_user_access(user_id: str, current_user: dict):
    """Validate user has access to resource."""
    if current_user["role"] != "admin" and current_user["id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="Access denied"
        )

# ✅ Custom exceptions
class UserNotFoundError(Exception):
    """Raised when user is not found."""
    pass

class InvalidCredentialsError(Exception):
    """Raised when credentials are invalid."""
    pass
```

### 5. Pydantic Models

#### Model Organization
```python
# ✅ Base models
class UserBase(BaseModel):
    email: EmailStr
    name: str
    avatar: Optional[str] = None

# ✅ Create models (input)
class UserCreate(UserBase):
    password: str

# ✅ Update models (partial input)
class UserUpdate(BaseModel):
    name: Optional[str] = None
    avatar: Optional[str] = None

# ✅ Response models (output)
class UserResponse(UserBase):
    id: UUID
    role: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
```

---

## Git Workflow

### 1. Branch Strategy

#### Branch Naming
```bash
# ✅ Feature branches
feature/user-authentication
feature/product-review-system
feature/admin-dashboard

# ✅ Bug fixes
bugfix/login-validation-error
bugfix/product-image-upload

# ✅ Hotfixes
hotfix/security-vulnerability
hotfix/database-connection-issue

# ✅ Release branches
release/v1.0.0
release/v1.1.0
```

#### Branch Workflow
```bash
# 1. Create feature branch from main
git checkout main
git pull origin main
git checkout -b feature/new-feature

# 2. Work on feature
git add .
git commit -m "feat: add user authentication"

# 3. Push and create PR
git push origin feature/new-feature

# 4. After PR approval, merge and cleanup
git checkout main
git pull origin main
git branch -d feature/new-feature
```

### 2. Commit Message Convention

#### Format
```
<type>(<scope>): <description>

<body>

<footer>
```

#### Types
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code style changes (formatting, etc.)
- **refactor**: Code refactoring
- **test**: Adding/updating tests
- **chore**: Maintenance tasks

#### Examples
```bash
# ✅ Good commit messages
git commit -m "feat(auth): add JWT token authentication"
git commit -m "fix(products): resolve image upload validation error"
git commit -m "docs(api): update endpoint documentation"
git commit -m "refactor(database): optimize user query performance"

# ❌ Bad commit messages
git commit -m "fix bug"
git commit -m "update code"
git commit -m "changes"
```

### 3. Pull Request Guidelines

#### PR Template
```markdown
## Description
Brief description of changes made.

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Refactoring
- [ ] Performance improvement

## Testing
- [ ] Tests pass locally
- [ ] Added new tests for changes
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots for UI changes.

## Checklist
- [ ] Code follows project standards
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

---

## Code Review Guidelines

### 1. Review Checklist

#### Functionality
- [ ] Code works as intended
- [ ] Edge cases handled
- [ ] Error handling implemented
- [ ] Performance implications considered

#### Code Quality
- [ ] Code is readable and maintainable
- [ ] Follows project standards
- [ ] No code duplication
- [ ] Proper abstractions used

#### Security
- [ ] Input validation implemented
- [ ] Authentication/authorization correct
- [ ] No sensitive data exposed
- [ ] SQL injection prevention

#### Testing
- [ ] Adequate test coverage
- [ ] Tests are meaningful
- [ ] Edge cases tested
- [ ] Integration tests included

### 2. Review Process

1. **Self Review**: Author reviews own code before creating PR
2. **Peer Review**: At least one team member reviews
3. **Testing**: Reviewer tests changes locally
4. **Approval**: Reviewer approves or requests changes
5. **Merge**: Author merges after approval

---

## Development Environment

### 1. IDE Configuration

#### VS Code Settings
```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.organizeImports": true,
    "source.fixAll.eslint": true
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "python.formatting.provider": "black",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true
}
```

#### Extensions
- ESLint
- Prettier
- Python
- Pylance
- Tauri
- GitLens

### 2. Code Formatting

#### Frontend (Prettier)
```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
```

#### Backend (Black)
```ini
# pyproject.toml
[tool.black]
line-length = 88
target-version = ['py310']
include = '\.pyi?$'
```

### 3. Linting Configuration

#### ESLint
```javascript
// eslint.config.js
export default [
  {
    rules: {
      'react/prop-types': 'off',
      '@typescript-eslint/explicit-function-return-type': 'warn',
      'no-unused-vars': 'error',
      'prefer-const': 'error'
    }
  }
];
```

---

## Testing Standards

### 1. Frontend Testing

#### Unit Tests
```typescript
// UserProfile.test.tsx
import { render, screen } from '@testing-library/react';
import UserProfile from './UserProfile';

describe('UserProfile', () => {
  test('renders user name', () => {
    const mockUser = {
      id: '1',
      name: 'John Doe',
      email: 'john@example.com'
    };
    
    render(<UserProfile user={mockUser} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### 2. Backend Testing

#### API Tests
```python
# test_auth.py
import pytest
from fastapi.testclient import TestClient
from app import app

client = TestClient(app)

def test_login_success():
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "password"
    })
    
    assert response.status_code == 200
    assert "access_token" in response.json()

def test_login_invalid_credentials():
    response = client.post("/auth/login", json={
        "email": "test@example.com",
        "password": "wrong_password"
    })
    
    assert response.status_code == 401
    assert response.json()["detail"] == "Incorrect email or password"
```

---

## Performance Guidelines

### 1. Frontend Performance

#### Component Optimization
```typescript
// ✅ Use React.memo for expensive components
const ExpensiveComponent = React.memo(({ data }) => {
  return <div>{/* Complex rendering */}</div>;
});

// ✅ Lazy loading
const LazyComponent = React.lazy(() => import('./LazyComponent'));

// ✅ Optimize images
<img 
  src="/image.jpg" 
  alt="Description"
  loading="lazy"
  width={300}
  height={200}
/>
```

### 2. Backend Performance

#### Database Optimization
```python
# ✅ Use indexes
CREATE INDEX idx_products_category_id ON products(category_id);

# ✅ Limit queries
SELECT * FROM products LIMIT 20 OFFSET 0;

# ✅ Use connection pooling
# Implemented in database/connection.py
```

---

Các standards này giúp đảm bảo code quality cao và team collaboration hiệu quả. Tất cả team members cần tuân thủ để maintain consistency trong codebase.