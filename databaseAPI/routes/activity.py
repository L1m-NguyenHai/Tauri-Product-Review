from fastapi import APIRouter, Depends, Query
from typing import List, Optional
from models.schemas import UserActivityCreate, UserActivityResponse
from database.activity import create_user_activity, get_user_activities
from uuid import UUID

router = APIRouter(prefix="/activities", tags=["User Activities"])

@router.post("/", response_model=UserActivityResponse)
def log_user_activity(activity: UserActivityCreate):
	return create_user_activity(
		user_id=activity.user_id,
		activity_type=activity.activity_type,
		activity_data=activity.activity_data
	)

@router.get("/", response_model=List[UserActivityResponse])
def list_user_activities(
	user_id: Optional[UUID] = Query(None),
	limit: int = Query(20, ge=1, le=100),
	offset: int = Query(0, ge=0)
):
	return get_user_activities(user_id=user_id, limit=limit, offset=offset)
