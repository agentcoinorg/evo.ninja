from fastapi import FastAPI
from .siu import router as siu_router
from .yo import router as yo_router

app = FastAPI()

app.include_router(siu_router)
app.include_router(yo_router)