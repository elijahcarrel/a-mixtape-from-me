from fastapi import APIRouter, Request
from sqlmodel import select, func

router = APIRouter()

@router.get("/db")
def db(request_obj: Request):
    session = next(request_obj.app.state.get_db_dep())

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