#!/bin/bash

# Script to clean the database

echo "🧹 Cleaning database..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed."
    exit 1
fi

# Default PostgreSQL user
PGUSER="postgres"

# Try to read POSTGRES_USER from .env file if it exists
if [ -f .env ]; then
    if grep -q "^POSTGRES_USER=" .env; then
        PGUSER=$(grep "^POSTGRES_USER=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    fi
fi

# Check if database exists
if ! psql -U "$PGUSER" -lqt | cut -d \| -f 1 | grep -qw appmrr; then
    echo "❌ Database 'appmrr' does not exist"
    exit 1
fi

# Run clean script
echo "⚠️  This will delete ALL data from the database. Are you sure? (y/N)"
read -r confirmation

if [ "$confirmation" != "y" ] && [ "$confirmation" != "Y" ]; then
    echo "Cancelled."
    exit 0
fi

psql -U "$PGUSER" appmrr < clean-db.sql && echo "✅ Database cleaned successfully" || {
    echo "❌ Failed to clean database"
    exit 1
}

echo ""
echo "✨ Database has been cleaned. All startups, metrics, and API keys have been removed."

