#!/bin/bash

# Setup script for local development

echo "🚀 Setting up RevenueCat MRR Leaderboard for local development..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install it first:"
    echo "   macOS: brew install postgresql@14"
    echo "   Linux: sudo apt-get install postgresql"
    echo "   Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

# Default PostgreSQL user
PGUSER="postgres"

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    
    # Generate encryption key
    ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
    
    cat > .env << EOF
# Encryption key for API keys
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Postgres connection (update with your local credentials)
POSTGRES_URL=postgresql://postgres:postgres@localhost:5432/appmrr
# Or use individual variables:
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DATABASE=appmrr
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
EOF
    
    echo "✅ Created .env file with generated encryption key"
    echo "⚠️  Please update POSTGRES_URL with your actual PostgreSQL credentials"
else
    echo "✅ .env file already exists"
    # Try to read POSTGRES_USER from .env file
    if grep -q "^POSTGRES_USER=" .env; then
        PGUSER=$(grep "^POSTGRES_USER=" .env | cut -d '=' -f2 | tr -d '"' | tr -d "'")
    fi
fi

# Check if database exists
if psql -U "$PGUSER" -lqt | cut -d \| -f 1 | grep -qw appmrr; then
    echo "✅ Database 'appmrr' already exists"
else
    echo "📦 Creating database 'appmrr'..."
    createdb -U "$PGUSER" appmrr || {
        echo "❌ Failed to create database. Please create it manually:"
        echo "   createdb -U $PGUSER appmrr"
        exit 1
    }
    echo "✅ Database created"
fi

# Run schema
echo "📋 Running database schema..."
psql -U "$PGUSER" appmrr < schema.sql && echo "✅ Schema applied successfully" || {
    echo "❌ Failed to apply schema. Please run manually:"
    echo "   psql -U $PGUSER appmrr < schema.sql"
    exit 1
}

echo ""
echo "✨ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Update .env with your PostgreSQL credentials if needed"
echo "2. Run 'npm install' to install dependencies"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:4321"

