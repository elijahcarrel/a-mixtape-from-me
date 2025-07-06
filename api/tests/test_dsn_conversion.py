import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

from api.tests.test_mixtape_api import dsn_to_url

def test_dsn_to_url_conversion():
    """Test that DSN strings are correctly converted to SQLAlchemy URLs"""
    
    # Test basic DSN
    dsn = "user=postgres dbname=tests host=127.0.0.1 port=30484"
    url = dsn_to_url(dsn)
    assert url == "postgresql+psycopg://postgres@127.0.0.1:30484/tests"
    
    # Test DSN with password
    dsn_with_password = "user=postgres password=mypass dbname=tests host=127.0.0.1 port=30484"
    url_with_password = dsn_to_url(dsn_with_password)
    assert url_with_password == "postgresql+psycopg://postgres:mypass@127.0.0.1:30484/tests"
    
    # Test DSN with default values
    dsn_minimal = "dbname=tests"
    url_minimal = dsn_to_url(dsn_minimal)
    assert url_minimal == "postgresql+psycopg://postgres@localhost:5432/tests"
    
    print("✅ All DSN to URL conversion tests passed!")

if __name__ == "__main__":
    test_dsn_to_url_conversion() 