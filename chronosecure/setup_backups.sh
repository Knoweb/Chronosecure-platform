#!/bin/bash

# Configuration
BACKUP_DIR="/root/chronosecure-backups"
DB_CONTAINER="chronosecure-db"
DB_USER="postgres"
DB_NAME="chronosecure"
RETENTION_DAYS=7

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Generate filename with timestamp
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

echo "Starting database backup for $DB_NAME..."

# Execute pg_dump inside the docker container, then gzip it on the host
docker exec "$DB_CONTAINER" pg_dump -U "$DB_USER" "$DB_NAME" | gzip > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "Backup completed successfully: $BACKUP_FILE"
else
    echo "Error during database backup!"
    exit 1
fi

# Clean up old backups based on retention policy
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "db_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Old backups cleaned up successfully."
