# Weekly Class Generation Scheduling System

## 🎯 Overview

This document describes the implementation of an automated weekly class generation system that ensures all students with fixed schedules have their classes generated for the current week. The system is designed to run automatically every Monday to generate classes for the upcoming week.

## 📋 Current Status Analysis

### ✅ **Existing Mechanisms Found**
- **POST /api/class-tracking/generate-missing-classes** - Generates all missing classes from start_date to today
- **Scripts/fix-class-tracking-issues.js** - Manual script for fixing class tracking issues
- **Automatic class generation** in student creation/update routes

### ❌ **Missing Components**
- **No automated scheduling** - No cron jobs or scheduled tasks
- **No weekly-specific logic** - Current system generates all classes from start_date to today
- **No monitoring** - No way to track if weekly generation is working

## 🛠️ **New Implementation**

### **1. Weekly Class Generation Endpoint**
**File**: `app/api/class-tracking/generate-weekly-classes/route.ts`

#### **Features**
- ✅ **Week-specific generation** - Only generates classes for the current week (Monday to Sunday)
- ✅ **Duplicate prevention** - Uses compound key validation to avoid duplicates
- ✅ **Student filtering** - Only processes students with valid fixed_schedule and start_date
- ✅ **Detailed logging** - Comprehensive logging for monitoring and debugging
- ✅ **Error handling** - Robust error handling with detailed error messages
- ✅ **Statistics** - Returns detailed statistics about the generation process

#### **API Endpoints**
```typescript
// Generate weekly classes
POST /api/class-tracking/generate-weekly-classes

// Check generation status
GET /api/class-tracking/generate-weekly-classes
```

#### **Request/Response Format**
```json
// POST Response
{
  "success": true,
  "message": "Generación semanal completada: 15 clases creadas",
  "weekStart": "2024-01-15",
  "weekEnd": "2024-01-21",
  "totalClassesCreated": 15,
  "studentsProcessed": 8,
  "results": [
    {
      "studentId": 1,
      "studentName": "Juan Pérez",
      "classesCreated": 2,
      "message": "2 clases creadas para la semana 2024-01-15 a 2024-01-21"
    }
  ]
}
```

### **2. Weekly Generation Script**
**File**: `scripts/weekly-class-generation.js`

#### **Features**
- ✅ **Cron-ready** - Designed to be run as a cron job
- ✅ **Retry logic** - Automatic retry with configurable attempts
- ✅ **Timeout handling** - Configurable timeout for API requests
- ✅ **Error reporting** - Detailed error reporting and logging
- ✅ **Process management** - Proper signal handling and cleanup

#### **Usage**
```bash
# Manual execution
node scripts/weekly-class-generation.js

# Cron job (every Monday at 6:00 AM)
0 6 * * 1 cd /path/to/project && node scripts/weekly-class-generation.js
```

## 🕐 **Scheduling Options**

### **Option 1: Server Cron Job (Recommended)**
```bash
# Edit crontab
crontab -e

# Add this line for weekly execution (every Monday at 6:00 AM)
0 6 * * 1 cd /path/to/your/project && node scripts/weekly-class-generation.js >> /var/log/weekly-class-generation.log 2>&1
```

### **Option 2: Supabase Scheduled Functions**
```sql
-- Create a Supabase Edge Function for weekly class generation
-- This would require setting up a Supabase Edge Function
-- and configuring it to run on a schedule
```

### **Option 3: External Cron Service**
- **GitHub Actions** - Run on a schedule
- **Vercel Cron Jobs** - If using Vercel for deployment
- **Railway Cron** - If using Railway for deployment
- **DigitalOcean App Platform** - Built-in cron support

### **Option 4: Node.js Scheduler**
```javascript
// Using node-cron package
const cron = require('node-cron')

// Schedule for every Monday at 6:00 AM
cron.schedule('0 6 * * 1', () => {
  require('./scripts/weekly-class-generation.js')
})
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# API endpoint for weekly class generation
API_ENDPOINT=http://localhost:3000/api/class-tracking/generate-weekly-classes

# For production
API_ENDPOINT=https://your-domain.com/api/class-tracking/generate-weekly-classes
```

### **Script Configuration**
```javascript
const config = {
  apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000/api/class-tracking/generate-weekly-classes',
  timeout: 30000, // 30 seconds
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
}
```

## 📊 **Monitoring and Logging**

### **Log Output Example**
```
[2024-01-15T06:00:00.000Z] 🚀 Starting weekly class generation script
[2024-01-15T06:00:00.100Z] 📡 API Endpoint: http://localhost:3000/api/class-tracking/generate-weekly-classes
[2024-01-15T06:00:00.200Z] 🔄 Attempt 1/3
[2024-01-15T06:00:01.500Z] ✅ Weekly class generation completed successfully!
[2024-01-15T06:00:01.600Z] 📊 Results:
[2024-01-15T06:00:01.700Z]    • Week: 2024-01-15 to 2024-01-21
[2024-01-15T06:00:01.800Z]    • Classes created: 15
[2024-01-15T06:00:01.900Z]    • Students processed: 8
```

### **Error Handling**
- **Retry Logic**: Automatically retries failed requests
- **Timeout Protection**: Prevents hanging requests
- **Signal Handling**: Proper cleanup on interruption
- **Error Reporting**: Detailed error messages for debugging

## 🧪 **Testing**

### **Manual Testing**
```bash
# Test the API endpoint directly
curl -X POST http://localhost:3000/api/class-tracking/generate-weekly-classes

# Test the script
node scripts/weekly-class-generation.js
```

### **Cron Testing**
```bash
# Test cron job (run every minute for testing)
* * * * * cd /path/to/project && node scripts/weekly-class-generation.js

# Check cron logs
tail -f /var/log/weekly-class-generation.log
```

## 🔍 **Verification**

### **Check Generation Status**
```bash
# Check if classes were generated for this week
curl http://localhost:3000/api/class-tracking/generate-weekly-classes
```

### **Database Verification**
```sql
-- Check classes generated this week
SELECT 
  COUNT(*) as total_classes,
  COUNT(DISTINCT student_id) as students_with_classes,
  MIN(date) as earliest_date,
  MAX(date) as latest_date
FROM classes 
WHERE date >= '2024-01-15' AND date <= '2024-01-21';
```

## 📈 **Benefits**

### **Automated Workflow**
- ✅ **No manual intervention** - Classes generated automatically every week
- ✅ **Consistent scheduling** - Ensures all students have their weekly classes
- ✅ **Reduced workload** - Eliminates manual class generation tasks

### **Data Integrity**
- ✅ **Duplicate prevention** - Prevents duplicate classes
- ✅ **Consistent data** - All students with fixed schedules get classes
- ✅ **Audit trail** - Detailed logging for monitoring

### **Performance**
- ✅ **Efficient processing** - Only generates current week's classes
- ✅ **Batch operations** - Processes multiple students efficiently
- ✅ **Error recovery** - Automatic retry on failures

## 🚀 **Deployment Steps**

### **1. Deploy the API Endpoint**
- The endpoint is already created in `app/api/class-tracking/generate-weekly-classes/route.ts`
- No additional deployment steps needed

### **2. Set Up Cron Job**
```bash
# Add to crontab
crontab -e

# Add this line
0 6 * * 1 cd /path/to/your/project && node scripts/weekly-class-generation.js >> /var/log/weekly-class-generation.log 2>&1
```

### **3. Test the Setup**
```bash
# Test manually first
node scripts/weekly-class-generation.js

# Check logs
tail -f /var/log/weekly-class-generation.log
```

### **4. Monitor Results**
- Check logs regularly for any errors
- Verify classes are being generated correctly
- Monitor API endpoint performance

## 🎉 **Conclusion**

The weekly class generation system provides:

1. **Automated class generation** for all students with fixed schedules
2. **Week-specific processing** to avoid generating unnecessary classes
3. **Robust error handling** with retry logic and detailed logging
4. **Easy deployment** with multiple scheduling options
5. **Comprehensive monitoring** and verification tools

This system ensures that all students with fixed schedules automatically receive their weekly classes without manual intervention, improving the overall efficiency and reliability of the class management system.

**Status**: ✅ Ready for deployment
**Files Created**: 2 new files (API endpoint + script)
**Next Steps**: Deploy and configure cron job
