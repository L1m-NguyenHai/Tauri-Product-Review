# Development Workflow - LimReview

## Tổng Quan Workflow

Tài liệu này mô tả quy trình phát triển phần mềm từ planning đến deployment cho dự án LimReview.

---

## 1. Project Setup Workflow

### Initial Setup (One-time)
```mermaid
graph TD
    A[Clone Repository] --> B[Install Dependencies]
    B --> C[Setup Database]
    C --> D[Configure Environment]
    D --> E[Run Initial Tests]
    E --> F[Ready for Development]
```

### Daily Setup
```bash
# 1. Pull latest changes
git checkout main
git pull origin main

# 2. Start development environment
# Terminal 1: Backend API
cd databaseAPI
source venv/bin/activate  # hoặc venv\Scripts\activate trên Windows
python app.py

# Terminal 2: Frontend Development
cd ..
pnpm tauri dev

# Terminal 3: Database (if needed)
psql -U postgres -d limreview
```

---

## 2. Feature Development Workflow

### Planning Phase
1. **Requirement Analysis**
   - Analyze user story/requirements
   - Break down into smaller tasks
   - Estimate complexity and time

2. **Technical Design**
   - Database schema changes (if any)
   - API endpoint design
   - UI/UX mockups
   - Component architecture

3. **Task Creation**
   - Create GitHub issues
   - Add labels and milestones
   - Assign to developers

### Development Phase

#### Step 1: Branch Creation
```bash
# Create feature branch
git checkout main
git pull origin main
git checkout -b feature/user-rating-system

# Or for bug fixes
git checkout -b bugfix/login-validation-error
```

#### Step 2: Database Changes (if needed)
```sql
-- Create migration script
-- migrations/001_add_rating_system.sql
ALTER TABLE reviews ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- Test migration
psql -U postgres -d limreview_test -f migrations/001_add_rating_system.sql
```

#### Step 3: Backend Development
```python
# 1. Update schemas (models/schemas.py)
class ReviewCreate(BaseModel):
    product_id: UUID
    rating: int = Field(..., ge=1, le=5)
    title: str
    content: str

# 2. Create/update endpoints (routes/reviews.py)
@router.post("/", response_model=ReviewResponse)
async def create_review(review: ReviewCreate, current_user: dict = Depends(get_current_user)):
    # Implementation here
    pass

# 3. Add tests (tests/test_reviews.py)
def test_create_review_success():
    # Test implementation
    pass
```

#### Step 4: Frontend Development
```typescript
// 1. Update types (src/types/index.ts)
interface Review {
  id: string;
  rating: number; // New field
  title: string;
  content: string;
}

// 2. Create/update components
const ReviewForm: React.FC = () => {
  const [rating, setRating] = useState<number>(5);
  // Component implementation
};

// 3. Update API calls (src/services/api.ts)
export const createReview = async (reviewData: ReviewCreate): Promise<Review> => {
  const response = await axios.post('/reviews/', reviewData);
  return response.data;
};
```

#### Step 5: Testing
```bash
# Backend tests
cd databaseAPI
python -m pytest tests/ -v

# Frontend tests
cd ..
npm test

# Integration tests
npm run test:e2e

# Manual testing
pnpm tauri dev
```

#### Step 6: Code Review Preparation
```bash
# Commit changes
git add .
git commit -m "feat(reviews): add rating system for product reviews"

# Push branch
git push origin feature/user-rating-system

# Create Pull Request on GitHub
```

---

## 3. Code Review Process

### PR Creation Checklist
- [ ] Feature/fix is complete and working
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] No console errors or warnings
- [ ] Code follows project standards
- [ ] Database migrations tested
- [ ] Performance impact considered

### Review Process
```mermaid
graph TD
    A[Create PR] --> B[Self Review]
    B --> C[Request Review]
    C --> D{Review Pass?}
    D -->|Yes| E[Approve & Merge]
    D -->|No| F[Request Changes]
    F --> G[Make Changes]
    G --> B
    E --> H[Delete Feature Branch]
    H --> I[Deploy to Staging]
```

### Reviewer Responsibilities
1. **Code Quality Check**
   - Logic correctness
   - Performance implications
   - Security considerations
   - Code maintainability

2. **Testing Verification**
   - Pull and test locally
   - Verify test coverage
   - Check edge cases

3. **Documentation Review**
   - API documentation updated
   - Code comments adequate
   - User documentation current

---

## 4. Release Workflow

### Release Planning
1. **Version Planning**
   ```bash
   # Semantic versioning: MAJOR.MINOR.PATCH
   # Example: 1.2.3
   # MAJOR: Breaking changes
   # MINOR: New features (backward compatible)
   # PATCH: Bug fixes
   ```

2. **Feature Freeze**
   - No new features after freeze date
   - Only bug fixes allowed
   - Final testing phase

### Release Process
```mermaid
graph TD
    A[Feature Complete] --> B[Create Release Branch]
    B --> C[Final Testing]
    C --> D{Tests Pass?}
    D -->|No| E[Fix Issues]
    E --> C
    D -->|Yes| F[Update Version Numbers]
    F --> G[Create Release Notes]
    G --> H[Tag Release]
    H --> I[Merge to Main]
    I --> J[Deploy to Production]
    J --> K[Post-release Monitoring]
```

#### Step-by-step Release
```bash
# 1. Create release branch
git checkout main
git pull origin main
git checkout -b release/v1.2.0

# 2. Update version numbers
# package.json
{
  "version": "1.2.0"
}

# tauri.conf.json
{
  "version": "1.2.0"
}

# 3. Run final tests
pnpm test
cd databaseAPI && python -m pytest

# 4. Build production version
pnpm build
pnpm tauri build

# 5. Create release notes
# CHANGELOG.md
## [1.2.0] - 2024-01-15
### Added
- User rating system
- Advanced search filters
- Email notifications

### Fixed
- Login validation bug
- Image upload issues

### Changed
- Improved performance for product listing

# 6. Commit and tag
git add .
git commit -m "chore: bump version to 1.2.0"
git tag v1.2.0

# 7. Merge to main
git checkout main
git merge release/v1.2.0
git push origin main --tags

# 8. Clean up
git branch -d release/v1.2.0
```

---

## 5. Deployment Workflow

### Environment Strategy
```
Development → Staging → Production
```

#### Development Environment
- Local development
- Feature branches
- Continuous integration

#### Staging Environment
- Pre-production testing
- Release candidate validation
- Performance testing

#### Production Environment
- Live application
- Monitoring and alerts
- Backup and recovery

### Deployment Steps

#### Backend Deployment
```bash
# 1. Prepare production environment
# Update environment variables
export DATABASE_URL="postgresql://user:pass@prod-host:5432/limreview"
export SECRET_KEY="production-secret-key"

# 2. Install dependencies
pip install -r req.txt

# 3. Run migrations
python migrate_database.py

# 4. Start application
gunicorn app:app --bind 0.0.0.0:8000 --workers 4

# 5. Setup reverse proxy (nginx)
server {
    listen 80;
    server_name api.limreview.com;
    
    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Desktop App Distribution
```bash
# 1. Build for target platforms
pnpm tauri build --target x86_64-pc-windows-msvc
pnpm tauri build --target x86_64-apple-darwin
pnpm tauri build --target x86_64-unknown-linux-gnu

# 2. Sign applications (for distribution)
# Windows: Code signing certificate
# macOS: Apple Developer certificate
# Linux: GPG signing

# 3. Create installers
# Windows: .msi installer
# macOS: .dmg package
# Linux: .deb/.rpm packages

# 4. Distribute
# Upload to GitHub Releases
# Submit to app stores (if applicable)
# Update auto-updater configuration
```

---

## 6. Monitoring & Maintenance Workflow

### Daily Operations
1. **Health Checks**
   ```bash
   # API health
   curl https://api.limreview.com/health
   
   # Database connectivity
   psql -h prod-host -U user -d limreview -c "SELECT 1;"
   
   # Application logs
   tail -f /var/log/limreview/app.log
   ```

2. **Performance Monitoring**
   - Response time tracking
   - Error rate monitoring
   - Database query performance
   - Memory and CPU usage

3. **Security Monitoring**
   - Failed login attempts
   - Suspicious API requests
   - Security vulnerability scans
   - SSL certificate expiry

### Weekly Maintenance
1. **Database Maintenance**
   ```sql
   -- Update statistics
   ANALYZE;
   
   -- Reindex if needed
   REINDEX TABLE products;
   
   -- Vacuum tables
   VACUUM ANALYZE reviews;
   ```

2. **Backup Verification**
   ```bash
   # Test backup restoration
   pg_restore --dry-run backup_file.sql
   
   # Verify backup integrity
   pg_dump --schema-only limreview | diff - schema_backup.sql
   ```

3. **Dependency Updates**
   ```bash
   # Frontend dependencies
   npm outdated
   npm update
   
   # Backend dependencies
   pip list --outdated
   pip-review --auto
   ```

### Monthly Reviews
1. **Performance Review**
   - Analyze slow queries
   - Review API response times
   - Check disk space usage
   - Optimize database indexes

2. **Security Review**
   - Update dependencies
   - Review access logs
   - Check SSL certificates
   - Security scan reports

3. **User Feedback Review**
   - Analyze user reports
   - Plan feature improvements
   - Bug prioritization
   - UX/UI enhancements

---

## 7. Emergency Response Workflow

### Incident Classification
- **P0 (Critical)**: Complete service outage
- **P1 (High)**: Major feature broken
- **P2 (Medium)**: Minor feature issues
- **P3 (Low)**: Cosmetic issues

### Response Process
```mermaid
graph TD
    A[Incident Detected] --> B[Assess Severity]
    B --> C{Severity Level?}
    C -->|P0/P1| D[Immediate Response]
    C -->|P2/P3| E[Schedule Fix]
    D --> F[Hotfix Development]
    F --> G[Emergency Deployment]
    G --> H[Verify Fix]
    H --> I[Post-incident Review]
    E --> J[Regular Development Cycle]
```

### Hotfix Process
```bash
# 1. Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-security-fix

# 2. Implement minimal fix
# Make only necessary changes
# Focus on stability over features

# 3. Test thoroughly
pnpm test
python -m pytest

# 4. Fast-track review
# Require only one reviewer for P0 issues
# Skip non-essential checks

# 5. Deploy immediately
git tag hotfix-v1.2.1
git push origin main --tags

# 6. Communicate
# Notify users of fix
# Update status page
# Document in incident log
```

---

## 8. Documentation Workflow

### Documentation Maintenance
1. **Code Documentation**
   - Update API docs with changes
   - Keep inline comments current
   - Update type definitions

2. **User Documentation**
   - Installation guides
   - Feature tutorials
   - Troubleshooting guides

3. **Developer Documentation**
   - Architecture updates
   - Workflow changes
   - Best practices evolution

### Documentation Review Process
- Review docs with each PR
- Quarterly documentation audit
- User feedback incorporation
- Regular accuracy checks

---

## 9. Communication Workflow

### Daily Standups
- What did you work on yesterday?
- What will you work on today?
- Any blockers or concerns?

### Weekly Planning
- Review completed work
- Plan upcoming features
- Discuss technical debt
- Resource allocation

### Sprint Reviews
- Demo completed features
- Gather feedback
- Plan next sprint
- Retrospective discussion

### Tools & Channels
- **GitHub Issues**: Task tracking
- **GitHub Projects**: Sprint planning
- **Slack/Discord**: Daily communication
- **Email**: Formal communications
- **Wiki**: Documentation updates

---

Workflow này đảm bảo development process hiệu quả, quality code và reliable deployments cho dự án LimReview.