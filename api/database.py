import os
from psycopg2 import pool

_connection_pool = None

def get_connection_pool():
    global _connection_pool
    if _connection_pool is None:
        connection_string = os.getenv('DATABASE_URL')
        _connection_pool = pool.SimpleConnectionPool(
            1,  # Minimum number of connections in the pool
            10,  # Maximum number of connections in the pool
            connection_string
        )
    return _connection_pool

def get_db():
    """Dependency function to get a database connection from the pool"""
    conn = get_connection_pool().getconn()
    try:
        yield conn
    finally:
        get_connection_pool().putconn(conn) 