import os
from dotenv import load_dotenv
from api.app_factory import create_app

# Load environment variables from .env.local file in development.
if os.getenv('VERCEL_ENV') is None:
    load_dotenv('.env.local')

# Create app with production database
database_url = os.getenv('DATABASE_URL')
app = create_app(database_url)
