import os
from typing import Optional
import psycopg
from psycopg_pool import ConnectionPool

_connection_pools = {}
_current_db_url: Optional[str] = None

def set_database_url(db_url: Optional[str]):
    """Set the database URL for the current context"""
    global _current_db_url
    _current_db_url = db_url

def get_connection_pool(db_url: str):
    if not db_url:
        raise RuntimeError('database URL must be set or provided to get_connection_pool')
    if db_url not in _connection_pools:
        _connection_pools[db_url] = ConnectionPool(db_url, min_size=1, max_size=10)
    return _connection_pools[db_url]

def get_db(db_url: str):
    pool = get_connection_pool(db_url)
    with pool.connection() as conn:
        yield conn 