from fastapi import APIRouter
router = APIRouter()

@router.get("/agents-api/yo")
async def yo():
    return "hello from /api/yo"