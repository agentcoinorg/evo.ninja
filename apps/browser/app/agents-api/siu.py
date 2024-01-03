from fastapi import APIRouter
router = APIRouter()

@router.get("/agents-api/siu")
async def siu():
    return "hello from /api/siu"