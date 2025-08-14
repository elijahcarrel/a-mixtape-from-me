from sqlalchemy import Engine
from sqlmodel import create_engine

# Global variable holding the singular engine connection.
# We assume there is only one global database connection to a single database. If in the future
# we need to support multiple databases, this code will need to change.
# TODO: make this thread-safe? Overkill since it only gets loaded on startup.
# TODO: rather than a global variable, instantiate this at a known time and pass it through the app somehow?
_current_engine: Engine | None = None

def normalize_db_url(db_url: str)->str:
    # Convert Neon `postgres://` URL to SQLAlchemy `postgresql://` format if needed
    if db_url.startswith('postgres://'):
        # Convert to SQLAlchemy format
        return db_url.replace('postgres://', 'postgresql://')
    elif db_url.startswith('postgresql://'):
        # Already in SQLAlchemy format
        return db_url
    elif db_url.startswith('postgresql+psycopg://') or db_url.startswith('postgresql+psycopg2://'):
        # Already in correct psycopg format
        return db_url
    else:
        raise Exception(f"db_url {db_url} is invalid")

def load_engine(engine_url: str)->Engine:
    return create_engine(
        engine_url,
        pool_pre_ping=True,
        pool_recycle=300,
        echo=False  # Set to True for SQL debugging
    )

def initialize_engine(db_url: str)->Engine:
    '''
    Initializes the database engine at the given URL (if it isn't already initialized), stores it in a global variable, and returns it.
    '''
    global _current_engine
    engine_url = normalize_db_url(db_url)
    if _current_engine is None:
        _current_engine = load_engine(engine_url)
    elif str(_current_engine.url) != engine_url:
        raise Exception(f"engine was already loaded with url {_current_engine.url}, cannot load a engine at different url {engine_url} (which is a normalized version of {db_url})")
    return _current_engine

def get_current_engine()->Engine:
    return _current_engine
