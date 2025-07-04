from fastapi import APIRouter, Depends
from psycopg2.extensions import connection
from api.database import get_db

router = APIRouter()

@router.get("/db")
def db(db_conn: connection = Depends(get_db)):
    # Create a cursor object
    cur = db_conn.cursor()
    # Execute SQL commands to retrieve the current time and version from PostgreSQL
    cur.execute('SELECT NOW();')
    time = cur.fetchone()[0]
    cur.execute('SELECT version();')
    version = cur.fetchone()[0]
    # Close the cursor
    cur.close()
    
    return {
        "message": "Hello from FastAPI. Server started at " + str(time) + ". Postgres version: " + version
    } 