#!/bin/bash

# Database Export Script
# This script exports your Supabase PostgreSQL database to a SQL file

# Configuration from .env.local
SUPABASE_URL="https://lpoewuhuzzsccsywjemv.supabase.co"
DB_HOST="db.lpoewuhuzzsccsywjemv.supabase.co"
DB_PORT="5432"
DB_NAME="postgres"
DB_USER="postgres"
DB_PASSWORD="i69Mh5Fmccr_mv0UxWIJLD59fBri5xJe"

# Output file with timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
OUTPUT_DIR="database_backups"
OUTPUT_FILE="${OUTPUT_DIR}/backup_${TIMESTAMP}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$OUTPUT_DIR"

echo "========================================="
echo "Database Export Script"
echo "========================================="
echo "Export started at: $(date)"
echo ""

# Export options:
# -h: host
# -p: port
# -U: username
# -d: database name
# -F p: plain SQL format
# -f: output file
# --no-owner: don't include ownership commands
# --no-acl: don't include access privileges
# -v: verbose

export PGPASSWORD="$DB_PASSWORD"

echo "Exporting database schema and data..."
echo "This may take a few minutes depending on data size..."
echo ""

pg_dump \
  -h "$DB_HOST" \
  -p "$DB_PORT" \
  -U "$DB_USER" \
  -d "$DB_NAME" \
  -F p \
  --no-owner \
  --no-acl \
  -v \
  -f "$OUTPUT_FILE"

# Check if export was successful
if [ $? -eq 0 ]; then
    FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
    echo ""
    echo "========================================="
    echo "✅ Export completed successfully!"
    echo "========================================="
    echo "File: $OUTPUT_FILE"
    echo "Size: $FILE_SIZE"
    echo "Completed at: $(date)"
    echo ""
    echo "To restore this backup on your server:"
    echo "psql -U accounting_user -d accounting_db -f $OUTPUT_FILE"
else
    echo ""
    echo "========================================="
    echo "❌ Export failed!"
    echo "========================================="
    echo "Please check:"
    echo "1. PostgreSQL client (pg_dump) is installed"
    echo "2. Database credentials are correct"
    echo "3. Network connection to Supabase"
    exit 1
fi

# Clear password from environment
unset PGPASSWORD

# Create a compressed version
echo ""
echo "Creating compressed backup..."
gzip -c "$OUTPUT_FILE" > "${OUTPUT_FILE}.gz"

if [ $? -eq 0 ]; then
    COMPRESSED_SIZE=$(ls -lh "${OUTPUT_FILE}.gz" | awk '{print $5}')
    echo "✅ Compressed backup created: ${OUTPUT_FILE}.gz"
    echo "   Compressed size: $COMPRESSED_SIZE"
    echo ""
    echo "You now have:"
    echo "  - Full backup: $OUTPUT_FILE"
    echo "  - Compressed:  ${OUTPUT_FILE}.gz"
fi

echo ""
echo "========================================="
echo "Export Summary"
echo "========================================="
echo "All backups are stored in: $OUTPUT_DIR/"
echo ""
echo "Available backups:"
ls -lh "$OUTPUT_DIR" | tail -n +2