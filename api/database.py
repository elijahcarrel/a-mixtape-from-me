import os
import psycopg
from psycopg_pool import ConnectionPool

_connection_pools = {}

def get_connection_pool(db_url: str = None):
    if not db_url:
        db_url = os.getenv('DATABASE_URL', '')
    if not db_url:
        raise RuntimeError('DATABASE_URL must be set or provided to get_connection_pool')
    if db_url not in _connection_pools:
        _connection_pools[db_url] = ConnectionPool(db_url, min_size=1, max_size=10)
    return _connection_pools[db_url]

def get_db(db_url: str = None):
    pool = get_connection_pool(db_url)
    with pool.connection() as conn:
        yield conn 