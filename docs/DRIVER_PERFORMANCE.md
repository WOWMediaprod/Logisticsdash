# Driver Performance Dashboard

## Overview

The Driver Performance dashboard provides admins and dispatchers with a comprehensive bird's eye view of all driver metrics and insights across their company. It displays real-time and historical performance data with intelligent alerts, trend analysis, and visual mapping of driver locations.

**Access**: `/dashboard/driver-performance`

## Features

### 1. Time Period Filtering
Quickly switch between different time ranges to analyze performance trends:
- **Today** - Current day performance
- **This Week** - Last 7 days
- **This Month** - Current calendar month
- **Last 30 Days** - Rolling 30-day window

### 2. Summary Cards
Quick overview of key metrics:
- **Total Drivers** - Count of active drivers in the company
- **Online Now** - Real-time count of drivers currently online
- **Top Performers** - Drivers with completion rates >120% of company average
- **Needs Attention** - Underperforming drivers or those with idle streaks

### 3. Company Averages Bar
Performance benchmarks showing:
- Average completion rate across all drivers
- Average jobs per day
- Average earnings per driver
- Current selected time period

### 4. Sortable Driver Table
Comprehensive metrics for each driver with sorting capabilities:

| Column | Description |
|--------|-------------|
| **Driver** | Driver name with status badges (alerts) |
| **Status** | Online/offline indicator with real-time status |
| **Jobs** | Completed jobs / Total assigned jobs in period |
| **Rate** | Completion rate % with color coding |
| **Trend** | Job count change vs previous period (arrow + %) |
| **Earnings** | Total earnings for the period |
| **Jobs/Day** | Average jobs completed per working day |
| **Active Days** | Days worked / Total days in period |
| **Last Seen** | Relative time since last location update |

### 5. Driver Location Map
Interactive Leaflet map showing:
- 🟢 **Green markers** - Online and active drivers
- ⚫ **Gray markers** - Offline drivers
- Click markers for driver details popup

### 6. Intelligent Alerts
Automatic flagging of driver performance:

| Alert | Condition | Badge |
|-------|-----------|-------|
| **Top Performer** | Completion rate ≥ 120% of company average | ⭐ Blue |
| **Needs Attention** | Completion rate ≤ 80% of company average | ⚠️ Orange |
| **Idle Streak** | No jobs assigned in last 3 days | 💤 Red |
| **New Driver** | First job less than 7 days ago | 🆕 Gray |

### 7. Trend Indicators
Visual indicators showing performance change vs previous period:
- **Green ↑** - Improvement (positive change)
- **Red ↓** - Decline (negative change)
- **Gray →** - No change

### 8. Completion Rate Colors
Visual coding for quick assessment:
- 🟢 **Green** (≥85%) - Excellent
- 🟡 **Yellow** (70-85%) - Good
- 🔴 **Red** (<70%) - Needs improvement

## API Endpoint

### GET `/api/v1/driver-stats/overview`

Retrieves comprehensive driver performance data with metrics, trends, and alerts.

**Query Parameters:**
```
companyId: string (required) - Company identifier
period: 'today' | 'week' | 'month' | '30days' (optional, default: 'week')
```

**Response Example:**
```json
{
  "success": true,
  "data": {
    "period": {
      "start": "2025-11-25T00:00:00Z",
      "end": "2025-12-02T23:59:59Z",
      "label": "This Week"
    },
    "previousPeriod": {
      "start": "2025-11-18T00:00:00Z",
      "end": "2025-11-25T00:00:00Z"
    },
    "companyAverages": {
      "completionRate": 87.5,
      "jobsPerDay": 4.2,
      "avgEarnings": 2150.50
    },
    "drivers": [
      {
        "id": "driver_123",
        "name": "John Smith",
        "phone": "+94701234567",
        "isOnline": true,
        "lastLocation": {
          "lat": 7.8731,
          "lng": 80.7718,
          "updatedAt": "2025-12-02T15:30:00Z"
        },
        "stats": {
          "totalJobs": 15,
          "completedJobs": 14,
          "completionRate": 93.3,
          "totalEarnings": 2850.00,
          "jobsPerDay": 2.1,
          "activeDays": 6,
          "idleDays": 1
        },
        "trends": {
          "jobsChange": 12.5,
          "earningsChange": 8.3,
          "completionRateChange": 5.2
        },
        "alerts": {
          "isTopPerformer": true,
          "isUnderperforming": false,
          "hasIdleStreak": false,
          "isNewDriver": false
        },
        "lastActive": "2025-12-02T15:30:00Z"
      }
    ],
    "summary": {
      "totalDrivers": 12,
      "onlineNow": 8,
      "topPerformers": 3,
      "needsAttention": 2
    }
  }
}
```

## Data Calculations

### Completion Rate
```
completedJobs / totalAssignedJobs * 100
```
Only counts jobs with status = 'COMPLETED' in the selected period.

### Trend Percentages
```
currentPeriod = last 7 days
previousPeriod = 7 days before that
jobsChange = ((current - previous) / previous) * 100
```
Handles edge case where previous = 0:
- If previous = 0 and current > 0, shows +100%
- If previous = 0 and current = 0, shows 0%

### Jobs Per Day
```
workingDays = count of weekdays in period (Mon-Fri)
jobsPerDay = totalJobs / workingDays
```
Excludes weekends for accurate utilization metrics.

### Active Days
```
activeDays = count of unique dates with at least 1 job
idleDays = workingDays - activeDays
```

### Performance Thresholds
```
companyAvg = sum of all driver completion rates / driverCount
isTopPerformer = driverRate >= (companyAvg * 1.2)
isUnderperforming = driverRate <= (companyAvg * 0.8)
```

### Idle Streak Detection
```
last3Days = jobs assigned in previous 3 days
hasIdleStreak = last3Days.length === 0 && !isNewDriver
```

### New Driver Detection
```
firstJobDate = earliest job date for driver
sevenDaysAgo = now - 7 days
isNewDriver = firstJobDate > sevenDaysAgo || noJobsAtAll
```

## Architecture

### Frontend
- **File**: `apps/web/src/app/dashboard/driver-performance/page.tsx`
- **Components**:
  - Main page with period filters and summary cards
  - Sortable data table with trend indicators
  - DriverMap component for location visualization
- **State Management**: React Query for API data fetching
- **Libraries**: Leaflet for mapping, Framer Motion for animations

### Backend API
- **Endpoint**: `GET /api/v1/driver-stats/overview`
- **Service**: `DriverStatsService.getDriverOverview()`
- **Controller**: `DriverStatsController`
- **Database**: Prisma queries on Job, Driver, DriverEarning, LocationTracking

### Data Sources
1. **Job Table** - Job assignments and completions
2. **Driver Table** - Driver profiles and online status
3. **DriverEarning Table** - Earnings records with bonuses
4. **LocationTracking Table** - GPS coordinates for map

## Performance Considerations

### Query Optimization
- Fetches all drivers with one query using `include`
- Filters completed jobs by date range in memory
- Calculates trends without additional database queries
- Returns only necessary fields to minimize payload

### Caching Strategy
- Frontend caches data with React Query
- Stale data refreshed when period filter changes
- Manual refresh button available for immediate updates

### Typical Response Times
- API response: ~500ms - 1s (with 50+ drivers)
- Frontend render: ~1s (including map initialization)
- Total page load: ~2-3s

## Browser Compatibility

- **Map**: Requires modern browser with DOM support
- **Leaflet**: Works on all modern browsers (Chrome, Firefox, Safari, Edge)
- **Dynamic imports**: Next.js 15 with SSR disabled for map

## Usage Examples

### View This Week's Performance
```
Navigate to /dashboard/driver-performance
Filter automatically set to "This Week"
See company averages and driver rankings
```

### Identify Top Performers
```
Look for ⭐ badges in driver table
Sort by "Rate" column descending
Review "Trend" column for consistent improvement
```

### Monitor Underperforming Drivers
```
Look for ⚠️ badges in driver table
Check "Last Seen" to verify if they're idle
Review "Trend" to see if improving or declining
```

### Track Real-Time Locations
```
Scroll to map section at bottom
Green markers = online and working
Gray markers = offline
Click markers for driver details popup
```

## Troubleshooting

### "No drivers found"
- Verify company ID is correct
- Check that drivers exist in the selected time period
- Ensure drivers have at least one job assignment

### Map not showing locations
- Confirm drivers have `lastLocationLat` and `lastLocationLng` fields
- Verify GPS tracking is enabled in driver mobile app
- Check browser console for Leaflet loading errors

### Missing trend data
- Previous period must have data for trend calculation
- New drivers won't show trends in first period
- Time period must be at least 1 day long

## Related Features

- **Live Tracking**: `/dashboard/tracking` - Real-time job tracking
- **Billing**: `/dashboard/billing` - Revenue and earnings management
- **Resources**: `/dashboard/resources` - Driver and vehicle management
- **Driver Profile**: Driver individual performance page (future)

## Future Enhancements

- [ ] Export performance data to CSV/Excel
- [ ] Performance prediction using ML
- [ ] Custom alert thresholds per company
- [ ] Detailed analytics charts and graphs
- [ ] Performance comparison between drivers
- [ ] Scheduled performance reports via email
- [ ] Integration with driver incentive programs
