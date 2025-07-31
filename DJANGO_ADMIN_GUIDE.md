# Django Admin Panel Guide

## 🎯 **Admin Panel Access**

### **URL**: http://localhost:8000/admin/

### **Login Credentials**:
- **Username**: `admin` (existing superuser)
- **Username**: `admin2`, **Password**: `1122` (newly created)

---

## 📊 **Available Data Models**

### **1. User Profiles** (17 records)
- **Purpose**: User profiles with roles and school information
- **Key Fields**: User, Role, School Name, Sector, EMIS
- **Features**: Search by username, email, school name, EMIS
- **Filters**: Role, Sector

### **2. Conversations** (6 records)
- **Purpose**: Chat conversations between AEOs and principals
- **Key Fields**: School Name, AEO, Principal, Created/Last Message Date
- **Features**: Message count display, conversation status
- **Filters**: School Name, Date ranges

### **3. Messages** (7 records)
- **Purpose**: Individual messages in conversations
- **Key Fields**: Sender, Receiver, Message Text, Timestamp, Read Status
- **Features**: Message preview, conversation links, bulk read/unread actions
- **Filters**: Read status, timestamp, school name

### **4. Teacher Data** (10,000 records)
- **Purpose**: Teacher performance data from BigQuery
- **Key Fields**: Teacher, Grade, Subject, School, Sector, LP Ratio
- **Features**: Performance tracking, date filtering
- **Filters**: Grade, Subject, Sector, Date ranges

### **5. Aggregated Data**
- **Purpose**: Aggregated school performance data
- **Key Fields**: School, Sector, Period, Teacher Count, Average LP Ratio
- **Features**: Performance metrics, period tracking
- **Filters**: Sector, Period Type, Date ranges

### **6. School Data** (341 records)
- **Purpose**: School-level information
- **Key Fields**: School Name, Sector, EMIS, Teacher Count, Average LP Ratio
- **Features**: School performance tracking
- **Filters**: Sector

### **7. Filter Options**
- **Purpose**: Available filter options for the dashboard
- **Key Fields**: Option Type, Option Value
- **Features**: Filter management
- **Filters**: Option Type, Creation Date

### **8. Data Sync Logs**
- **Purpose**: Logs of data synchronization operations
- **Key Fields**: Sync Type, Status, Records Processed, Duration
- **Features**: Sync monitoring, error tracking
- **Filters**: Sync Type, Status, Date ranges

### **9. User School Profiles**
- **Purpose**: User-school profile mappings
- **Key Fields**: User ID, Teacher, School, Sector, EMIS
- **Features**: Profile management
- **Filters**: Sector

---

## 🚀 **Admin Panel Features**

### **Search & Filtering**
- **Global Search**: Search across all fields
- **Advanced Filters**: Filter by specific criteria
- **Date Ranges**: Filter by creation/modification dates
- **Status Filters**: Filter by read status, sync status, etc.

### **Bulk Actions**
- **Messages**: Mark as read/unread in bulk
- **Data Export**: Export selected records (placeholder)
- **Mass Updates**: Update multiple records at once

### **Data Visualization**
- **Message Counts**: See conversation message counts
- **Performance Indicators**: View teacher and school performance
- **Sync Status**: Monitor data synchronization
- **Activity Tracking**: Track recent activity

### **User Management**
- **User Profiles**: Manage user roles and school assignments
- **Active/Inactive Users**: Track user status
- **Role-based Access**: View users by role (AEO, Principal, etc.)

---

## 📈 **Key Metrics Available**

### **User Statistics**
- Total Users: 17
- Active Users: Tracked by user status
- Role Distribution: AEO, Principal, FDE, etc.

### **Communication Statistics**
- Total Conversations: 6
- Total Messages: 7
- Unread Messages: Tracked by read status
- Recent Activity: Last 7 days

### **Performance Data**
- Teacher Records: 10,000
- School Records: 341
- Performance Metrics: LP Ratios, Grades
- Sector Distribution: Performance by sector

### **System Health**
- Sync Logs: Data synchronization status
- Error Tracking: Failed operations
- Performance Monitoring: Sync duration

---

## 🔧 **Admin Actions**

### **For Messages**
1. **Mark as Read**: Select messages → "Mark selected messages as read"
2. **Mark as Unread**: Select messages → "Mark selected messages as unread"
3. **View Details**: Click on individual messages for full content
4. **Filter by Status**: Show only read/unread messages

### **For Conversations**
1. **View Message Count**: See total messages per conversation
2. **Track Activity**: Monitor last message timestamps
3. **Search Participants**: Find conversations by AEO/Principal

### **For Data Management**
1. **Monitor Sync Status**: Check data synchronization logs
2. **Track Performance**: View teacher and school performance data
3. **Manage Filters**: Update available filter options

---

## 🎨 **Admin Interface Customization**

### **Site Branding**
- **Header**: "Dashboard Admin Panel"
- **Title**: "Dashboard Admin"
- **Welcome Message**: "Welcome to Dashboard Administration"

### **List Views**
- **Pagination**: 50-100 records per page
- **Sorting**: Click column headers to sort
- **Quick Actions**: Bulk operations available
- **Status Indicators**: Visual status indicators

### **Detail Views**
- **Read-only Fields**: Timestamps, IDs
- **Editable Fields**: Content, status, relationships
- **Related Objects**: Links to related records

---

## 🔍 **Troubleshooting**

### **If you can't see any data:**
1. Check if the Django server is running
2. Verify you're logged in with superuser credentials
3. Check if there are any database connection issues

### **If models aren't showing:**
1. Ensure all migrations are applied
2. Check if the admin.py file is properly configured
3. Restart the Django server

### **If you get permission errors:**
1. Verify your user has superuser privileges
2. Check if the user is active
3. Ensure proper staff status

---

## 📞 **Support**

If you encounter any issues with the admin panel:
1. Check the Django server logs
2. Verify database connectivity
3. Ensure all dependencies are installed
4. Contact the development team for assistance

---

**Happy Administering! 🎉** 