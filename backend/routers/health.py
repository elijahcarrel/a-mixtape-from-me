from fastapi import APIRouter, Depends
from sqlmodel import Session, func, select

from backend.database import get_readonly_session

router = APIRouter()

@router.get("/db")
def db(session: Session = Depends(get_readonly_session)):
    time = session.exec(select(func.now())).first()
    version = session.exec(select(func.version())).first()

    return {
        "status": "ok",
        "time": str(time),
        "version": str(version),
    }

@router.get("/app")
def app_health():
    return {"status": "ok"}
