# BigQuery Data Sync System

This system automatically fetches data from BigQuery every 2 hours and stores it in the Django database for faster access.

## Overview

The application now uses a hybrid approach:
- **Data Source**: BigQuery (updated every 2 hours)
- **Data Storage**: Django database (for fast access)
- **Data Access**: Django ORM queries (instead of direct BigQuery calls)

## New Models

The following models have been added to store BigQuery data:

- `TeacherData`: Stores individual teacher performance data
- `AggregatedData`: Stores weekly/monthly aggregated statistics
- `SchoolData`: Stores school-level performance data
- `FilterOptions`: Stores available filter options (schools, sectors, grades, subjects)
- `DataSyncLog`: Tracks sync operations and their status

## Setup Instructions

### 1. Run Database Migrations

```bash
cd backend
source venv/bin/activate
python manage.py makemigrations
python manage.py migrate
```

### 2. Check Data Status

Check the current status of your data:

```bash
python check_data_status.py
```

This will show you if you have data and whether it's fresh.

### 3. Initial Data Sync

Run the initial sync to populate the database with BigQuery data:

```bash
python manage.py sync_bigquery_data --data-type=all
```

**Note**: Make sure you have BigQuery credentials set up before running this command.

### 4. Set Up Automatic Sync (Optional)

To enable automatic syncing every 2 hours:

```bash
./setup_cron.sh
```

This will create a cron job that runs every 2 hours.

## Management Commands

### Sync BigQuery Data

```bash
# Sync all data types
python manage.py sync_bigquery_data --data-type=all

# Sync specific data type
python manage.py sync_bigquery_data --data-type=teacher_data
python manage.py sync_bigquery_data --data-type=aggregated_data
python manage.py sync_bigquery_data --data-type=school_data
python manage.py sync_bigquery_data --data-type=filter_options

# Force sync (ignore 2-hour freshness check)
python manage.py sync_bigquery_data --data-type=all --force
```

## API Endpoints

### Data Sync Management

- `GET /api/data-sync/status`: Check data freshness and sync status
- `POST /api/data-sync/trigger`: Manually trigger a data sync

### Example Usage

```bash
# Check sync status
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/data-sync/status

# Trigger manual sync
curl -X POST -H "Authorization: Bearer <token>" \
     -H "Content-Type: application/json" \
     -d '{"data_type": "all", "force": false}' \
     http://localhost:8000/api/data-sync/trigger
```

## Data Freshness

The system checks if data is fresh (updated within 2 hours) before syncing:

- **Fresh Data**: Data updated within the last 2 hours
- **Stale Data**: Data older than 2 hours
- **Force Sync**: Override freshness check with `--force` flag

## Monitoring

### Check Data Status

Use the provided script to check data status:

```bash
python check_data_status.py
```

This will show:
- Current data counts
- Data freshness status
- Recent sync operations
- Recommendations for next steps

### Logs

- **Cron Logs**: `backend/logs/cron.log`
- **Django Logs**: `backend/logs/django.log`
- **Sync Logs**: Stored in `DataSyncLog` model

### Check Sync Status Programmatically

```python
from api.services import DataService

# Check data freshness
freshness = DataService.check_data_freshness()
print(freshness)

# Get recent sync operations
sync_status = DataService.get_sync_status()
for sync in sync_status:
    print(f"{sync.sync_type}: {sync.status}")
```

## Performance Benefits

1. **Faster Response Times**: Django database queries are much faster than BigQuery API calls
2. **Reduced API Costs**: Fewer BigQuery API calls
3. **Better Reliability**: Less dependent on BigQuery API availability
4. **Caching**: Data is cached for 2 hours, reducing load on BigQuery

## Troubleshooting

### Common Issues

1. **Sync Fails**: Check BigQuery credentials and network connectivity
2. **Data Not Updating**: Verify cron job is running (`crontab -l`)
3. **Permission Errors**: Ensure proper file permissions for logs directory

### Manual Recovery

If automatic sync fails, you can manually trigger a sync:

```bash
python manage.py sync_bigquery_data --data-type=all --force
```

### View Cron Logs

```bash
tail -f backend/logs/cron.log
```

## Configuration

### Environment Variables

Ensure these are set in your `.env` file:

```
GOOGLE_APPLICATION_CREDENTIALS=/path/to/your/bigquery-credentials.json
```

### Database Settings

The system uses the default Django database configuration. For production, consider using PostgreSQL for better performance with large datasets.

## Migration from Direct BigQuery

The existing API endpoints have been updated to use Django database instead of direct BigQuery calls:

- `BigQueryTeacherDataView` → Uses `DataService.get_teacher_data()`
- `BigQueryAggregatedDataView` → Uses `DataService.get_aggregated_data()`
- `BigQueryFilterOptionsView` → Uses `DataService.get_filter_options()`
- `BigQuerySummaryStatsView` → Uses `DataService.get_summary_stats()`
- `BigQueryAllSchoolsView` → Uses `DataService.get_school_data()`

### Important Changes

- **No Dummy Data**: The system no longer returns dummy/fallback data. If no data is available, it will return appropriate error responses.
- **Real Data Only**: All responses now contain only real data from BigQuery (via Django database).
- **Empty Responses**: When no data is found, endpoints return empty arrays `[]` or appropriate error messages.

No changes are required in the frontend code - the API responses remain the same format, but will be empty if no data is available. 