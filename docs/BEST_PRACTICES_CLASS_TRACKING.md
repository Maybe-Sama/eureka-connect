# 🎯 Best Practices: Class Tracking System

## 📋 Overview

This document outlines the **best practices and guidelines** for working with the Class Tracking System. All developers and maintainers should follow these practices to ensure system consistency, reliability, and maintainability.

---

## 🚨 Critical Rules

### **1. Always Check This Guide First**
- ✅ **Before implementing** any new class tracking functionality
- ✅ **Before modifying** existing class generation logic
- ✅ **Before adding** new API endpoints related to classes
- ✅ **Before changing** database schema for classes

### **2. Never Duplicate Existing Functionality**
- ❌ **Don't create** new class generation functions
- ❌ **Don't implement** duplicate validation logic
- ❌ **Don't add** redundant API endpoints
- ❌ **Don't create** alternative diagnostic tools

### **3. Follow Established Patterns**
- ✅ **Use existing** class generation function
- ✅ **Follow established** validation patterns
- ✅ **Use consistent** error handling
- ✅ **Maintain** existing API structure

---

## 🏗️ Architecture Best Practices

### **1. Database Design**

#### **Schema Consistency**
```sql
-- ALWAYS use these field names and types
CREATE TABLE classes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER NOT NULL,
    course_id INTEGER NOT NULL,
    start_time TEXT NOT NULL,           -- HH:MM format
    end_time TEXT NOT NULL,             -- HH:MM format
    duration INTEGER NOT NULL,          -- minutes
    day_of_week INTEGER NOT NULL,       -- 0-6 (Sunday-Saturday)
    date TEXT NOT NULL,                 -- YYYY-MM-DD format
    is_recurring BOOLEAN DEFAULT 0,
    status TEXT DEFAULT 'scheduled',    -- scheduled, completed, cancelled
    payment_status TEXT DEFAULT 'unpaid', -- unpaid, paid
    payment_notes TEXT DEFAULT '',
    payment_date TEXT DEFAULT NULL,     -- YYYY-MM-DD format
    price REAL NOT NULL,
    subject TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id),
    FOREIGN KEY (course_id) REFERENCES courses(id)
);

-- ALWAYS include unique constraint
CREATE UNIQUE INDEX idx_classes_unique_slot 
ON classes(student_id, date, start_time, end_time);
```

#### **Field Standards**
- ✅ **Date format**: Always YYYY-MM-DD
- ✅ **Time format**: Always HH:MM (24-hour)
- ✅ **Status values**: Use exact strings (scheduled, completed, cancelled)
- ✅ **Payment values**: Use exact strings (unpaid, paid)
- ✅ **Day of week**: 0-6 (Sunday-Saturday)

### **2. API Design**

#### **Endpoint Standards**
```typescript
// ALWAYS follow these patterns
POST /api/students                    // Create student + auto-generate classes
PUT /api/students/[id]                // Update student + regenerate classes
POST /api/class-tracking/generate-missing-classes    // Generate missing classes
POST /api/class-tracking/generate-weekly-classes     // Weekly generation
GET /api/class-tracking              // Get tracking data
PUT /api/class-tracking/classes      // Update individual class
```

#### **Request/Response Standards**
```typescript
// Request validation
interface StudentRequest {
  first_name: string
  last_name: string
  email: string
  start_date: string        // YYYY-MM-DD
  fixed_schedule: TimeSlot[] // Validated array
}

// Response format
interface ApiResponse {
  success: boolean
  message?: string
  data?: any
  error?: string
}
```

### **3. Frontend Components**

#### **Component Standards**
```typescript
// ALWAYS use these interfaces
interface ClassData {
  id: number
  student_id: number
  course_id: number
  start_time: string
  end_time: string
  duration: number
  day_of_week: number
  date: string
  subject: string | null
  is_recurring: boolean
  status: string                    // scheduled, completed, cancelled
  payment_status: string            // unpaid, paid
  price: number
  notes: string | null
  payment_date: string | null
  payment_notes: string | null
  students: StudentInfo
  courses: CourseInfo
}

// ALWAYS use these props
interface ClassItemProps {
  classData: ClassData
  onUpdate: (updatedClass: ClassData) => void
}
```

#### **UI Standards**
- ✅ **Consistent styling** - Use established design system
- ✅ **Loading states** - Show progress during operations
- ✅ **Error handling** - Display clear error messages
- ✅ **Success feedback** - Confirm successful operations

---

## 🔧 Development Best Practices

### **1. Class Generation**

#### **Always Use Existing Function**
```typescript
// ✅ CORRECT - Use existing function
import { generateClassesFromStartDate } from '@/lib/class-generation'

const classes = await generateClassesFromStartDate(
  studentId,
  courseId,
  fixedSchedule,
  startDate,
  endDate
)

// ❌ WRONG - Don't create new generation logic
// const classes = await myCustomGenerationFunction(...)
```

#### **Validation Requirements**
```typescript
// ALWAYS validate before generation
if (!studentId || !courseId) {
  throw new Error('Invalid studentId or courseId')
}

if (!fixedSchedule || !Array.isArray(fixedSchedule) || fixedSchedule.length === 0) {
  throw new Error('Invalid or empty fixedSchedule')
}

if (!startDate || !endDate) {
  throw new Error('Invalid startDate or endDate')
}

// Validate date format
const dateRegex = /^\d{4}-\d{2}-\d{2}$/
if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
  throw new Error('Invalid date format. Use YYYY-MM-DD')
}
```

#### **Duplicate Prevention**
```typescript
// ALWAYS use compound key for duplicate prevention
const existingClassKeys = new Set(
  existingClasses.map(cls => `${cls.date}-${cls.start_time}-${cls.end_time}`)
)

const newClasses = generatedClasses.filter(genClass => 
  !existingClassKeys.has(`${genClass.date}-${genClass.start_time}-${genClass.end_time}`)
)
```

### **2. Error Handling**

#### **API Error Handling**
```typescript
// ALWAYS use consistent error format
try {
  // Operation
} catch (error) {
  console.error('Error description:', error)
  return NextResponse.json({ 
    error: 'User-friendly error message',
    details: error instanceof Error ? error.message : 'Unknown error'
  }, { status: 500 })
}
```

#### **Frontend Error Handling**
```typescript
// ALWAYS handle errors gracefully
try {
  const response = await fetch('/api/endpoint')
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Operation failed')
  }
  // Success handling
} catch (error) {
  console.error('Error:', error)
  toast.error(`Error: ${error.message}`)
}
```

### **3. Data Validation**

#### **Input Validation**
```typescript
// ALWAYS validate all inputs
const validateStudentData = (data: any) => {
  // Required fields
  if (!data.first_name || !data.last_name || !data.email) {
    throw new Error('Missing required fields')
  }
  
  // Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    throw new Error('Invalid email format')
  }
  
  // Date format
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/
  if (!dateRegex.test(data.start_date)) {
    throw new Error('Invalid date format. Use YYYY-MM-DD')
  }
  
  // Future date check
  const startDate = new Date(data.start_date)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  if (startDate > today) {
    throw new Error('Start date cannot be in the future')
  }
}
```

#### **Schedule Validation**
```typescript
// ALWAYS validate fixed_schedule
const validateFixedSchedule = (schedule: any) => {
  if (!Array.isArray(schedule)) {
    throw new Error('fixed_schedule must be an array')
  }
  
  if (schedule.length === 0) {
    throw new Error('fixed_schedule cannot be empty')
  }
  
  for (let i = 0; i < schedule.length; i++) {
    const slot = schedule[i]
    
    // Required fields
    if (typeof slot.day_of_week !== 'number' || slot.day_of_week < 0 || slot.day_of_week > 6) {
      throw new Error(`Invalid day_of_week in slot ${i + 1}. Must be 0-6`)
    }
    
    if (!slot.start_time || !slot.end_time) {
      throw new Error(`Missing start_time or end_time in slot ${i + 1}`)
    }
    
    // Time format validation
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
    if (!timeRegex.test(slot.start_time) || !timeRegex.test(slot.end_time)) {
      throw new Error(`Invalid time format in slot ${i + 1}. Use HH:MM`)
    }
    
    // Time logic validation
    const startMinutes = timeToMinutes(slot.start_time)
    const endMinutes = timeToMinutes(slot.end_time)
    if (endMinutes <= startMinutes) {
      throw new Error(`end_time must be after start_time in slot ${i + 1}`)
    }
  }
}
```

---

## 🧪 Testing Best Practices

### **1. Unit Testing**

#### **Class Generation Testing**
```typescript
// ALWAYS test with various scenarios
describe('generateClassesFromStartDate', () => {
  it('should generate classes for valid student', async () => {
    const classes = await generateClassesFromStartDate(
      1, // studentId
      1, // courseId
      [{ day_of_week: 1, start_time: '10:00', end_time: '11:00' }],
      '2024-01-15', // startDate
      '2024-01-22'  // endDate
    )
    
    expect(classes).toHaveLength(1)
    expect(classes[0].status).toBe('scheduled')
    expect(classes[0].payment_status).toBe('unpaid')
    expect(classes[0].is_recurring).toBe(true)
  })
  
  it('should handle invalid inputs gracefully', async () => {
    const classes = await generateClassesFromStartDate(
      null, // invalid studentId
      1,
      [],
      '2024-01-15',
      '2024-01-22'
    )
    
    expect(classes).toHaveLength(0)
  })
})
```

#### **Validation Testing**
```typescript
// ALWAYS test validation functions
describe('validateStudentData', () => {
  it('should accept valid data', () => {
    const validData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      start_date: '2024-01-15'
    }
    
    expect(() => validateStudentData(validData)).not.toThrow()
  })
  
  it('should reject invalid email', () => {
    const invalidData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'invalid-email',
      start_date: '2024-01-15'
    }
    
    expect(() => validateStudentData(invalidData)).toThrow('Invalid email format')
  })
})
```

### **2. Integration Testing**

#### **API Endpoint Testing**
```typescript
// ALWAYS test complete API flows
describe('POST /api/students', () => {
  it('should create student and generate classes', async () => {
    const studentData = {
      first_name: 'John',
      last_name: 'Doe',
      email: 'john@example.com',
      start_date: '2024-01-15',
      fixed_schedule: [
        { day_of_week: 1, start_time: '10:00', end_time: '11:00' }
      ]
    }
    
    const response = await fetch('/api/students', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(studentData)
    })
    
    expect(response.ok).toBe(true)
    
    const result = await response.json()
    expect(result.studentId).toBeDefined()
    
    // Verify classes were generated
    const classesResponse = await fetch(`/api/class-tracking/classes?studentId=${result.studentId}`)
    const classes = await classesResponse.json()
    expect(classes.length).toBeGreaterThan(0)
  })
})
```

### **3. Performance Testing**

#### **Large Dataset Testing**
```typescript
// ALWAYS test with realistic data volumes
describe('Performance Tests', () => {
  it('should handle large number of students', async () => {
    const startTime = Date.now()
    
    // Generate classes for 100 students
    const students = Array.from({ length: 100 }, (_, i) => ({
      id: i + 1,
      start_date: '2024-01-01',
      fixed_schedule: [
        { day_of_week: 1, start_time: '10:00', end_time: '11:00' }
      ]
    }))
    
    for (const student of students) {
      await generateClassesFromStartDate(
        student.id,
        1,
        student.fixed_schedule,
        student.start_date,
        '2024-12-31'
      )
    }
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    // Should complete within 30 seconds
    expect(duration).toBeLessThan(30000)
  })
})
```

---

## 📊 Monitoring Best Practices

### **1. Health Monitoring**

#### **System Health Checks**
```typescript
// ALWAYS implement health checks
export async function GET() {
  try {
    // Check database connection
    const { data, error } = await supabase
      .from('students')
      .select('count')
      .limit(1)
    
    if (error) {
      return NextResponse.json({ 
        status: 'unhealthy', 
        error: 'Database connection failed' 
      }, { status: 500 })
    }
    
    // Check class generation function
    const testClasses = await generateClassesFromStartDate(
      1, 1, 
      [{ day_of_week: 1, start_time: '10:00', end_time: '11:00' }],
      '2024-01-15', '2024-01-15'
    )
    
    if (testClasses.length === 0) {
      return NextResponse.json({ 
        status: 'unhealthy', 
        error: 'Class generation failed' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      status: 'healthy',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'unhealthy', 
      error: error.message 
    }, { status: 500 })
  }
}
```

#### **Performance Monitoring**
```typescript
// ALWAYS monitor performance metrics
const performanceMetrics = {
  classGenerationTime: 0,
  databaseQueryTime: 0,
  memoryUsage: 0,
  errorRate: 0
}

// Track class generation performance
const startTime = Date.now()
const classes = await generateClassesFromStartDate(...)
const endTime = Date.now()
performanceMetrics.classGenerationTime = endTime - startTime

// Log performance metrics
console.log('Performance Metrics:', performanceMetrics)
```

### **2. Error Monitoring**

#### **Error Tracking**
```typescript
// ALWAYS track and log errors
const errorTracker = {
  logError: (error: Error, context: string) => {
    console.error(`[${context}] Error:`, {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context
    })
    
    // Send to monitoring service
    // sendToMonitoringService(error, context)
  }
}

// Use in try-catch blocks
try {
  // Operation
} catch (error) {
  errorTracker.logError(error, 'class-generation')
  throw error
}
```

#### **Data Consistency Monitoring**
```typescript
// ALWAYS monitor data consistency
const checkDataConsistency = async () => {
  // Check for duplicate classes
  const duplicates = await supabase
    .from('classes')
    .select('student_id, date, start_time, end_time, count')
    .group('student_id, date, start_time, end_time')
    .having('count', '>', 1)
  
  if (duplicates.length > 0) {
    console.error('Data consistency issue: Duplicate classes found', duplicates)
    // Alert administrators
  }
  
  // Check for orphaned classes
  const orphanedClasses = await supabase
    .from('classes')
    .select('id')
    .is('student_id', null)
  
  if (orphanedClasses.length > 0) {
    console.error('Data consistency issue: Orphaned classes found', orphanedClasses)
    // Alert administrators
  }
}
```

---

## 🔄 Maintenance Best Practices

### **1. Regular Maintenance**

#### **Daily Tasks**
```bash
#!/bin/bash
# daily-maintenance.sh

echo "🔍 Running daily maintenance..."

# Check system health
curl -f http://localhost:3000/api/health || echo "❌ Health check failed"

# Check for errors in logs
grep -i "error\|failed" /var/log/app.log | tail -10

# Check database size
du -h database.db

echo "✅ Daily maintenance completed"
```

#### **Weekly Tasks**
```bash
#!/bin/bash
# weekly-maintenance.sh

echo "🔍 Running weekly maintenance..."

# Run diagnostic script
node scripts/diagnose-class-tracking-issues.js > diagnostic.log 2>&1

# Check for issues
if grep -q "Alumnos con clases faltantes" diagnostic.log; then
    echo "⚠️ Issues found, running correction..."
    node scripts/fix-class-tracking-issues.js > correction.log 2>&1
fi

# Clean up old logs
find /var/log -name "*.log" -mtime +30 -delete

echo "✅ Weekly maintenance completed"
```

### **2. Database Maintenance**

#### **Index Maintenance**
```sql
-- ALWAYS maintain indexes for performance
ANALYZE classes;
REINDEX classes;

-- Check index usage
SELECT name, sql FROM sqlite_master WHERE type='index' AND name LIKE 'idx_classes%';
```

#### **Data Cleanup**
```sql
-- ALWAYS clean up old data
DELETE FROM classes 
WHERE created_at < datetime('now', '-1 year') 
AND status = 'cancelled' 
AND payment_status = 'unpaid';

-- Vacuum database
VACUUM;
```

### **3. Backup and Recovery**

#### **Backup Procedures**
```bash
#!/bin/bash
# backup-database.sh

echo "💾 Creating database backup..."

# Create timestamped backup
BACKUP_FILE="backup_$(date +%Y%m%d_%H%M%S).db"
cp database.db "backups/$BACKUP_FILE"

# Compress backup
gzip "backups/$BACKUP_FILE"

# Keep only last 30 backups
find backups/ -name "backup_*.db.gz" -mtime +30 -delete

echo "✅ Backup created: $BACKUP_FILE.gz"
```

#### **Recovery Procedures**
```bash
#!/bin/bash
# restore-database.sh

if [ -z "$1" ]; then
    echo "Usage: $0 <backup_file>"
    exit 1
fi

BACKUP_FILE="$1"

echo "🔄 Restoring database from $BACKUP_FILE..."

# Stop application
pkill -f "node.*next"

# Restore database
gunzip -c "$BACKUP_FILE" > database.db

# Start application
npm start &

echo "✅ Database restored successfully"
```

---

## 🚀 Deployment Best Practices

### **1. Pre-Deployment Checklist**

#### **Code Review Checklist**
- ✅ **Functionality tested** - All features work as expected
- ✅ **Performance tested** - No performance regressions
- ✅ **Error handling** - All error cases handled
- ✅ **Documentation updated** - This guide updated if needed
- ✅ **Database migrations** - All migrations tested
- ✅ **Backup created** - Current database backed up

#### **Testing Checklist**
- ✅ **Unit tests pass** - All unit tests passing
- ✅ **Integration tests pass** - All integration tests passing
- ✅ **Performance tests pass** - Performance within acceptable limits
- ✅ **Security tests pass** - No security vulnerabilities
- ✅ **User acceptance tests** - End-to-end workflows tested

### **2. Deployment Procedures**

#### **Staging Deployment**
```bash
#!/bin/bash
# deploy-staging.sh

echo "🚀 Deploying to staging..."

# Build application
npm run build

# Run tests
npm test

# Deploy to staging
rsync -av dist/ staging-server:/var/www/app/

# Restart services
ssh staging-server "systemctl restart app"

echo "✅ Staging deployment completed"
```

#### **Production Deployment**
```bash
#!/bin/bash
# deploy-production.sh

echo "🚀 Deploying to production..."

# Create backup
./backup-database.sh

# Deploy application
npm run build
rsync -av dist/ production-server:/var/www/app/

# Run database migrations
ssh production-server "cd /var/www/app && npm run migrate"

# Restart services
ssh production-server "systemctl restart app"

# Verify deployment
curl -f https://your-domain.com/api/health

echo "✅ Production deployment completed"
```

### **3. Post-Deployment Monitoring**

#### **Health Verification**
```bash
#!/bin/bash
# post-deployment-check.sh

echo "🔍 Verifying deployment..."

# Check application health
curl -f https://your-domain.com/api/health || exit 1

# Check class generation
curl -X POST https://your-domain.com/api/class-tracking/generate-missing-classes \
  -H "Content-Type: application/json" \
  -d '{}' || exit 1

# Check database connectivity
curl -f https://your-domain.com/api/class-tracking || exit 1

echo "✅ Deployment verification completed"
```

---

## 📚 Documentation Best Practices

### **1. Code Documentation**

#### **Function Documentation**
```typescript
/**
 * Generates classes for a student from start_date to end_date
 * 
 * @param studentId - The ID of the student
 * @param courseId - The ID of the course
 * @param fixedSchedule - Array of time slots for the student
 * @param startDate - Start date for class generation (YYYY-MM-DD)
 * @param endDate - End date for class generation (YYYY-MM-DD)
 * @returns Promise<ClassData[]> - Array of generated class data
 * 
 * @throws {Error} When studentId or courseId is invalid
 * @throws {Error} When fixedSchedule is invalid or empty
 * @throws {Error} When startDate or endDate is invalid
 * 
 * @example
 * ```typescript
 * const classes = await generateClassesFromStartDate(
 *   1, 1, 
 *   [{ day_of_week: 1, start_time: '10:00', end_time: '11:00' }],
 *   '2024-01-15', '2024-01-22'
 * )
 * ```
 */
export async function generateClassesFromStartDate(
  studentId: number,
  courseId: number,
  fixedSchedule: TimeSlot[],
  startDate: string,
  endDate: string
): Promise<ClassData[]> {
  // Implementation
}
```

#### **Interface Documentation**
```typescript
/**
 * Represents a time slot in a student's fixed schedule
 */
interface TimeSlot {
  /** Day of the week (0=Sunday, 1=Monday, ..., 6=Saturday) */
  day_of_week: number
  
  /** Start time in HH:MM format (24-hour) */
  start_time: string
  
  /** End time in HH:MM format (24-hour) */
  end_time: string
  
  /** Optional subject for this time slot */
  subject?: string
}
```

### **2. API Documentation**

#### **Endpoint Documentation**
```typescript
/**
 * POST /api/class-tracking/generate-missing-classes
 * 
 * Generates missing classes for all students with valid fixed_schedule
 * 
 * @request
 * ```json
 * {
 *   "studentId": 1  // Optional: Generate for specific student
 * }
 * ```
 * 
 * @response
 * ```json
 * {
 *   "success": true,
 *   "totalClassesCreated": 45,
 *   "studentsProcessed": 8,
 *   "results": [
 *     {
 *       "studentId": 1,
 *       "studentName": "John Doe",
 *       "classesCreated": 12,
 *       "message": "12 clases creadas hasta 2024-01-15"
 *     }
 *   ]
 * }
 * ```
 * 
 * @errors
 * - 400: Invalid request data
 * - 500: Internal server error
 */
```

### **3. User Documentation**

#### **Feature Documentation**
```markdown
## Class Generation

The system automatically generates classes for students based on their fixed schedule.

### How it works

1. **Student Creation**: When a student is created with `start_date` and `fixed_schedule`, classes are automatically generated
2. **Weekly Generation**: Every Monday, classes for the upcoming week are generated
3. **Manual Generation**: Use the "Update Classes" button to generate missing classes

### Requirements

- Student must have valid `start_date` (YYYY-MM-DD format)
- Student must have valid `fixed_schedule` (array of time slots)
- `start_date` cannot be in the future
- Time slots must have valid `day_of_week` (0-6), `start_time`, and `end_time`

### Troubleshooting

If classes are not generated:
1. Check that student has valid `start_date` and `fixed_schedule`
2. Run diagnostic script: `node scripts/diagnose-class-tracking-issues.js`
3. Use "Update Classes" button in the frontend
4. Contact administrator if issues persist
```

---

## 🎉 Conclusion

These best practices ensure:

1. ✅ **System consistency** - All components work together seamlessly
2. ✅ **Code quality** - High-quality, maintainable code
3. ✅ **Reliability** - Robust error handling and validation
4. ✅ **Performance** - Optimized for speed and efficiency
5. ✅ **Maintainability** - Easy to understand and modify
6. ✅ **Documentation** - Clear documentation for all components

**Remember**: Always check this guide before implementing new functionality to avoid duplications and ensure consistency.

**Status**: ✅ Best Practices Documented
**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintainer**: Development Team
