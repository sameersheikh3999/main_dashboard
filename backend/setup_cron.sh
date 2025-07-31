#!/bin/bash

# Script to set up cron job for BigQuery data syncing every 2 hours

# Get the absolute path to the Django project
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MANAGE_PY="$PROJECT_DIR/manage.py"

# Create a temporary file for the cron job
CRON_FILE="/tmp/bigquery_sync_cron"

# Create the cron job entry
echo "# BigQuery data sync every 2 hours" > $CRON_FILE
echo "0 */2 * * * cd $PROJECT_DIR && python $MANAGE_PY sync_bigquery_data --data-type=all >> $PROJECT_DIR/logs/cron.log 2>&1" >> $CRON_FILE

# Install the cron job
crontab $CRON_FILE

# Clean up
rm $CRON_FILE

echo "Cron job installed successfully!"
echo "The BigQuery data sync will run every 2 hours."
echo "Logs will be written to: $PROJECT_DIR/logs/cron.log"
echo ""
echo "To view the cron job: crontab -l"
echo "To remove the cron job: crontab -r" 