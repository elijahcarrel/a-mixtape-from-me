#!/usr/bin/env python3
"""
Migration script to add undo/redo functionality to existing mixtape databases.

This script adds the following columns to existing tables:
- mixtape.undo_to_version (INTEGER, nullable)
- mixtape.redo_to_version (INTEGER, nullable)  
- mixtape_snapshot.undo_to_version (INTEGER, nullable)
- mixtape_snapshot.redo_to_version (INTEGER, nullable)

Run this script on your existing database to enable undo/redo functionality.
"""

import os
import sys
import argparse
from sqlalchemy import create_engine, text
from sqlalchemy.exc import ProgrammingError

# Add the project root to the path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def run_migration(database_url: str, dry_run: bool = False) -> None:
    """
    Run the migration to add undo/redo columns to existing mixtape tables.
    
    This function executes the necessary ALTER TABLE statements to add the
    undo_to_version and redo_to_version columns to both the mixtape and
    mixtape_snapshot tables. These columns enable the undo/redo functionality
    by storing pointers to previous and future versions in the version history.
    
    Args:
        database_url: SQLAlchemy-compatible database connection string
        dry_run: If True, show what would be executed without making changes
        
    Raises:
        ProgrammingError: If the database operations fail
        Exception: For any other unexpected errors during migration
        
    Note:
        The migration uses IF NOT EXISTS to handle cases where columns
        may already exist. Existing records will have NULL values for
        these columns, which is correct for mixtapes without edit history.
    """
    engine = create_engine(database_url)
    
    # SQL statements to add the new columns
    migration_statements = [
        # Add columns to mixtape table
        "ALTER TABLE mixtape ADD COLUMN IF NOT EXISTS undo_to_version INTEGER",
        "ALTER TABLE mixtape ADD COLUMN IF NOT EXISTS redo_to_version INTEGER",
        
        # Add columns to mixtape_snapshot table  
        "ALTER TABLE mixtape_snapshot ADD COLUMN IF NOT EXISTS undo_to_version INTEGER",
        "ALTER TABLE mixtape_snapshot ADD COLUMN IF NOT EXISTS redo_to_version INTEGER",
    ]
    
    print(f"Running migration on database: {database_url}")
    if dry_run:
        print("DRY RUN MODE - No changes will be made")
    
    with engine.connect() as conn:
        for statement in migration_statements:
            print(f"Executing: {statement}")
            
            if not dry_run:
                try:
                    conn.execute(text(statement))
                    conn.commit()
                    print("✓ Success")
                except ProgrammingError as e:
                    if "already exists" in str(e).lower():
                        print("✓ Column already exists (skipped)")
                    else:
                        print(f"✗ Error: {e}")
                        raise
            else:
                print("  (Would execute in non-dry-run mode)")
    
    print("\nMigration completed successfully!")
    print("\nNew columns added:")
    print("- mixtape.undo_to_version")
    print("- mixtape.redo_to_version") 
    print("- mixtape_snapshot.undo_to_version")
    print("- mixtape_snapshot.redo_to_version")
    print("\nNote: These columns will be NULL for existing records, which is correct.")
    print("Undo/redo functionality will work for new edits going forward.")

def main():
    parser = argparse.ArgumentParser(description="Migrate database to add undo/redo functionality")
    parser.add_argument("--database-url", required=True, help="Database connection URL")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be executed without making changes")
    
    args = parser.parse_args()
    
    try:
        run_migration(args.database_url, args.dry_run)
    except Exception as e:
        print(f"Migration failed: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()
