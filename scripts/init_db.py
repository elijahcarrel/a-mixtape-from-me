#!/usr/bin/env python3
"""
Database initialization script using SQLModel.
This script creates all tables defined in the SQLModel models.
"""

import os
import sys
from dotenv import load_dotenv
from sqlmodel import SQLModel

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.db_conn.global_db_conn import initialize_engine
from backend.db_models import Mixtape, MixtapeAudit, MixtapeTrack, MixtapeAuditTrack

def main():
    """Initialize the database with all tables"""
    # Load environment variables
    load_dotenv('.env.local')
    
    # Get database URL from environment
    database_url = os.getenv('DATABASE_URL')
    
    if not database_url:
        print("Error: DATABASE_URL environment variable not set")
        sys.exit(1)
    

    try:
        engine = initialize_engine(database_url)
        print(f"Dropping tables in database: {database_url}")
        SQLModel.metadata.drop_all(engine) 
        print(f"Creating tables in database: {database_url}")
        SQLModel.metadata.create_all(engine)
        print("✅ Database tables created successfully!")

    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 