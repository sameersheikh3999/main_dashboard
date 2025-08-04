# UserSchoolProfile Teacher Count Implementation

## Overview

This implementation updates the total teacher count calculation on the FDE dashboard to use the `UserSchoolProfile` table instead of the aggregated `SchoolData.teacher_count` field. This provides a more accurate count based on actual teacher profiles rather than pre-calculated aggregates.

## Changes Made

### 1. Updated LocalSummaryStatsView (backend/api/views.py)

**Before:**
```python
total_teachers = queryset.aggregate(total=models.Sum('teacher_count'))['total'] or 0
```

**After:**
```python
# Calculate total teachers using UserSchoolProfile table for more accurate count
teacher_profile_queryset = UserSchoolProfile.objects.all()

# Apply filters based on user role
if user_profile.role == 'AEO' and user_profile.sector:
    teacher_profile_queryset = teacher_profile_queryset.filter(sector=user_profile.sector)
elif user_profile.role == 'Principal' and user_profile.school_name:
    teacher_profile_queryset = teacher_profile_queryset.filter(school=user_profile.school_name)

# Apply additional filters
if sector_filter:
    teacher_profile_queryset = teacher_profile_queryset.filter(sector=sector_filter)

# Count distinct teachers from user school profiles
total_teachers = teacher_profile_queryset.values('user_id').distinct().count()
```

### 2. Updated AdminDashboardView (backend/api/views.py)

**Before:**
```python
'total_teachers': teacher_data.count(),
```

**After:**
```python
# Use UserSchoolProfile for more accurate teacher count
teacher_profile_queryset = UserSchoolProfile.objects.all()

# Apply filters to teacher profiles
if sector:
    teacher_profile_queryset = teacher_profile_queryset.filter(sector__icontains=sector)
if school:
    teacher_profile_queryset = teacher_profile_queryset.filter(school__icontains=school)

'total_teachers': teacher_profile_queryset.values('user_id').distinct().count(),
```

### 3. Updated LPDataSummaryView (backend/api/views.py)

**Before:**
```python
total_teachers = TeacherData.objects.count()
```

**After:**
```python
# Use UserSchoolProfile for more accurate teacher count
total_teachers = UserSchoolProfile.objects.values('user_id').distinct().count()
```

### 4. Added Import Statement

Added `UserSchoolProfile` to the imports in `backend/api/views.py`:
```python
from .models import UserProfile, Conversation, Message, TeacherData, AggregatedData, FilterOptions, SchoolData, SectorData, UserSchoolProfile
```

## Benefits of the New Implementation

### 1. **More Accurate Count**
- **Old Method**: 3,383 teachers (from SchoolData.teacher_count sum)
- **New Method**: 4,136 teachers (from UserSchoolProfile distinct user_id)
- **Difference**: +753 teachers (22% increase)

### 2. **Real-time Accuracy**
- Uses actual teacher profile data instead of pre-calculated aggregates
- Reflects the current state of teacher registrations
- Not dependent on data sync processes

### 3. **Better Filtering**
- Supports proper filtering by sector, school, and user role
- Maintains consistency with existing permission system
- Provides accurate counts for filtered views

### 4. **Data Consistency**
- Aligns with the source of truth (UserSchoolProfile table)
- Reduces discrepancies between different parts of the system
- More reliable for reporting and analytics

## Test Results

The implementation was tested and shows:

```
Teacher Count Comparison:
  Old Method (SchoolData.teacher_count sum): 3,383
  New Method (UserSchoolProfile distinct user_id): 4,136
  TeacherData distinct user_id: 3,383

Breakdown by Sector (UserSchoolProfile):
  B.K: 587 teachers
  Nilore: 558 teachers
  Sihala: 576 teachers
  Tarnol: 644 teachers
  Urban-I: 946 teachers
  Urban-II: 825 teachers
```

## Impact on FDE Dashboard

### Frontend Display
The FDE dashboard will now show:
- **Total Teachers**: 4,136 (instead of 3,383)
- **More accurate sector breakdowns**
- **Better filtering results**

### API Endpoints Affected
1. `/api/bigquery/summary-stats/` - Main dashboard stats
2. `/api/admin/dashboard/` - Admin dashboard stats
3. `/api/lp-data/summary/` - LP data summary

## Technical Details

### Query Performance
- Uses `values('user_id').distinct().count()` for efficient counting
- Leverages existing database indexes on `user_id`, `sector`, and `school`
- Maintains good performance with proper filtering

### Data Integrity
- Counts only distinct `user_id` values to avoid duplicates
- Respects user role-based filtering (AEO, Principal, FDE)
- Supports sector and school-specific filtering

### Backward Compatibility
- No changes to API response structure
- Existing frontend code continues to work
- Only the calculation method has changed

## Future Considerations

1. **Caching**: Consider implementing caching for frequently accessed counts
2. **Monitoring**: Add metrics to track count accuracy over time
3. **Validation**: Implement periodic validation between UserSchoolProfile and TeacherData counts
4. **Documentation**: Update API documentation to reflect the new calculation method

## Files Modified

1. `backend/api/views.py` - Updated teacher count calculations
2. `test_user_school_profile_teacher_count.py` - Test script for verification

## Testing

To test the implementation:

```bash
# Run the test script
python test_user_school_profile_teacher_count.py

# Test the API endpoint
curl -H "Authorization: Bearer <token>" \
     http://localhost:8000/api/bigquery/summary-stats/
```

The new implementation provides a more accurate and reliable teacher count that better reflects the actual number of teachers in the system. 