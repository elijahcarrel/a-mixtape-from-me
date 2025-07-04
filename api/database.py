import os
from psycopg2 import pool

# Get the connection string from the environment variable
connection_string = os.getenv('DATABASE_URL')
# Create a connection pool
connection_pool = pool.SimpleConnectionPool(
    1,  # Minimum number of connections in the pool
    10,  # Maximum number of connections in the pool
    connection_string
)

def get_db():
    """Dependency function to get a database connection from the pool"""
    conn = connection_pool.getconn()
    try:
        yield conn
    finally:
        connection_pool.putconn(conn) 