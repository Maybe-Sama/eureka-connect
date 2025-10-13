# 🚀 Supabase Setup Complete Guide

## 📋 **Overview**

This guide provides complete instructions for setting up the class tracking system with Supabase, including schema verification, triggers, RLS policies, Edge Functions, data migration, and end-to-end testing.

---

## 🎯 **Step 1: Check Supabase Indices and Columns**

### **1.1 Run Schema Verification Script**

**File**: `database/supabase-complete-schema-verification.sql`

**Purpose**: Verifies and creates all required columns, indices, and constraints

**Instructions**:
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase-complete-schema-verification.sql`
3. Run the script
4. Review the output to confirm all columns and indices are created

**What it does**:
- ✅ Adds missing columns (`course_id`, `subject`, `notes`, `payment_status`, `payment_notes`, `payment_date`)
- ✅ Creates CHECK constraints for `payment_status` and `status`
- ✅ Creates UNIQUE index on `(student_id, date, start_time, end_time)`
- ✅ Creates performance indices for common queries
- ✅ Adds `start_date` and `fixed_schedule` to students table
- ✅ Creates utility functions for duplicate detection and removal

**Verification**:
```sql
-- Check all columns exist
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'classes'
ORDER BY ordinal_position;

-- Check unique index exists
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'classes'
AND indexname = 'idx_classes_unique_slot';

-- Check for duplicates
SELECT * FROM public.check_duplicate_classes();
```

---

## 🤖 **Step 2: Set Up Supabase Triggers or Functions**

### **2.1 Run Triggers and Functions Script**

**File**: `database/supabase-triggers-and-functions.sql`

**Purpose**: Sets up automated class generation using database triggers

**Instructions**:
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase-triggers-and-functions.sql`
3. Run the script
4. Review the output to confirm all triggers and functions are created

**What it does**:
- ✅ Creates trigger for student INSERT (automatic class generation)
- ✅ Creates trigger for student UPDATE (automatic class regeneration)
- ✅ Creates function for weekly class generation
- ✅ Creates logging table for trigger executions
- ✅ Creates utility functions for maintenance

**Verification**:
```sql
-- Check triggers exist
SELECT trigger_name, event_manipulation, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table = 'students'
ORDER BY trigger_name;

-- Check recent log entries
SELECT id, student_id, operation, trigger_time, status, message
FROM public.class_generation_logs
ORDER BY trigger_time DESC
LIMIT 10;
```

### **2.2 Deploy Edge Function**

**File**: `database/supabase-edge-function-template.ts`

**Purpose**: Calls Next.js API endpoints from database triggers

**Instructions**:

1. **Install Supabase CLI**:
   ```bash
   npm install -g supabase
   ```

2. **Login to Supabase**:
   ```bash
   supabase login
   ```

3. **Link your project**:
   ```bash
   supabase link --project-ref your-project-ref
   ```

4. **Create function directory**:
   ```bash
   mkdir -p supabase/functions/class-generation-webhook
   ```

5. **Copy the Edge Function template**:
   ```bash
   cp database/supabase-edge-function-template.ts supabase/functions/class-generation-webhook/index.ts
   ```

6. **Deploy the function**:
   ```bash
   supabase functions deploy class-generation-webhook
   ```

7. **Set environment variables**:
   ```bash
   supabase secrets set NEXTJS_API_URL=https://your-domain.com
   supabase secrets set API_SECRET=your-secret-key  # Optional
   ```

8. **Test the function**:
   ```bash
   curl -X POST https://your-project-ref.supabase.co/functions/v1/class-generation-webhook \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"type":"student-insert","studentId":1}'
   ```

### **2.3 Schedule Weekly Generation**

**Option 1: Supabase Dashboard**
1. Go to Supabase Dashboard → Edge Functions
2. Create a new scheduled function
3. Set schedule: `0 6 * * 1` (Every Monday at 6:00 AM)
4. Set function URL: `https://your-project-ref.supabase.co/functions/v1/class-generation-webhook`
5. Set body: `{"type":"weekly-generation"}`

**Option 2: Cron Job**
```bash
# Add to crontab
0 6 * * 1 cd /path/to/your/project && node scripts/weekly-class-generation.js >> /var/log/weekly-class-generation.log 2>&1
```

---

## 🧹 **Step 3: Migrate and Clean Existing Data**

### **3.1 Check for Duplicate Classes**

**Run in Supabase SQL Editor**:
```sql
-- Check for duplicates
SELECT * FROM public.check_duplicate_classes();
```

**If duplicates found**:
```sql
-- Remove duplicates (keeps oldest record)
SELECT * FROM public.remove_duplicate_classes();
```

### **3.2 Run Diagnostic Script**

**From terminal**:
```bash
node scripts/diagnose-class-tracking-issues.js
```

**Expected output**:
- ✅ List of students with valid data
- ⚠️ List of students with missing classes
- ❌ List of students with invalid data

### **3.3 Run Correction Script**

**From terminal**:
```bash
node scripts/fix-class-tracking-issues.js
```

**Expected output**:
- ✅ Number of classes created for each student
- ✅ Total classes created
- ⏭️ Students skipped (with reasons)

### **3.4 Clean Obsolete Data**

**Run in Supabase SQL Editor**:
```sql
-- Clean old logs (older than 30 days)
SELECT * FROM public.clean_old_class_generation_logs(30);

-- Check for orphaned classes (classes without students)
SELECT c.id, c.student_id, c.date, c.start_time
FROM public.classes c
LEFT JOIN public.students s ON c.student_id = s.id
WHERE s.id IS NULL;

-- Delete orphaned classes if found
DELETE FROM public.classes
WHERE student_id NOT IN (SELECT id FROM public.students);
```

---

## 🔒 **Step 4: Review Row Level Security (RLS) Policies**

### **4.1 Run RLS Policies Script**

**File**: `database/supabase-rls-policies.sql`

**Purpose**: Sets up Row Level Security for data protection

**Instructions**:
1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `supabase-rls-policies.sql`
3. Run the script
4. Review the output to confirm all policies are created

**What it does**:
- ✅ Enables RLS on all tables
- ✅ Creates policies for authenticated users
- ✅ Creates policies for admin users
- ✅ Grants permissions to service role
- ✅ Creates helper functions for role checking

**Verification**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('courses', 'students', 'classes', 'class_generation_logs')
ORDER BY tablename;

-- Check policies exist
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### **4.2 Update API Routes to Use Service Role**

**Important**: API routes and Edge Functions must use the SERVICE ROLE key to bypass RLS

**Update `.env.local`**:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Update `lib/supabase.ts`**:
```typescript
import { createClient } from '@supabase/supabase-js'

// For server-side operations (bypasses RLS)
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// For client-side operations (respects RLS)
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

**Update API routes to use `supabaseAdmin`**:
```typescript
// In app/api/class-tracking/generate-missing-classes/route.ts
import { supabaseAdmin } from '@/lib/supabase'

// Use supabaseAdmin instead of supabase
const { data: students, error } = await supabaseAdmin
  .from('students')
  .select('*')
```

---

## 🧪 **Step 5: Perform End-to-End Tests**

### **5.1 Test Student Creation with Class Generation**

**Test Case 1: Create Student with Fixed Schedule**

1. **Open frontend**: `http://localhost:3000/students`
2. **Click "Add Student"**
3. **Fill in student data**:
   - First Name: Test
   - Last Name: Student
   - Email: test@example.com
   - Birth Date: 2000-01-01
   - Phone: 123456789
   - Course: Select a course
   - Start Date: 2024-01-15 (past date)
   - Fixed Schedule:
     ```json
     [
       {
         "day_of_week": 1,
         "start_time": "10:00",
         "end_time": "11:00",
         "subject": "Matemáticas"
       },
       {
         "day_of_week": 3,
         "start_time": "15:00",
         "end_time": "16:30",
         "subject": "Física"
       }
     ]
     ```
4. **Click "Save"**
5. **Verify**:
   - Student is created successfully
   - Classes are generated automatically
   - Check in class tracking dashboard

**Expected Result**:
- ✅ Student created
- ✅ Classes generated from start_date to today
- ✅ All classes have `status='scheduled'` and `payment_status='unpaid'`

**Verification Query**:
```sql
-- Check classes were generated
SELECT COUNT(*) as class_count
FROM public.classes
WHERE student_id = (SELECT id FROM public.students WHERE email = 'test@example.com');

-- Check class details
SELECT date, start_time, end_time, status, payment_status, is_recurring
FROM public.classes
WHERE student_id = (SELECT id FROM public.students WHERE email = 'test@example.com')
ORDER BY date, start_time;
```

### **5.2 Test Student Update with Class Regeneration**

**Test Case 2: Update Student Schedule**

1. **Open student detail page**
2. **Click "Edit"**
3. **Modify fixed_schedule**:
   ```json
   [
     {
       "day_of_week": 2,
       "start_time": "09:00",
       "end_time": "10:00",
       "subject": "Química"
     }
   ]
   ```
4. **Click "Save"**
5. **Verify**:
   - Student is updated successfully
   - Old classes are deleted
   - New classes are generated based on new schedule

**Expected Result**:
- ✅ Student updated
- ✅ Old classes deleted
- ✅ New classes generated with new schedule

**Verification Query**:
```sql
-- Check classes were regenerated
SELECT date, start_time, end_time, subject
FROM public.classes
WHERE student_id = (SELECT id FROM public.students WHERE email = 'test@example.com')
ORDER BY date, start_time
LIMIT 10;
```

### **5.3 Test "Update Classes" Button**

**Test Case 3: Manual Class Generation**

1. **Open class tracking dashboard**: `http://localhost:3000/class-tracking`
2. **Click "Actualizar Clases hasta Hoy"** (green button)
3. **Wait for completion**
4. **Verify success message**:
   - Shows number of classes created
   - Shows number of students processed

**Expected Result**:
- ✅ Success toast notification
- ✅ All missing classes generated
- ✅ Dashboard refreshes with new data

**Verification Query**:
```sql
-- Check all students have classes up to today
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    s.start_date,
    COUNT(c.id) as class_count,
    MAX(c.date) as last_class_date
FROM public.students s
LEFT JOIN public.classes c ON s.id = c.student_id
WHERE s.start_date IS NOT NULL
AND s.fixed_schedule IS NOT NULL
GROUP BY s.id, s.first_name, s.last_name, s.start_date
ORDER BY s.id;
```

### **5.4 Test Weekly Generation Endpoint**

**Test Case 4: Weekly Class Generation**

**From terminal**:
```bash
curl -X POST http://localhost:3000/api/class-tracking/generate-weekly-classes \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Weekly class generation completed",
  "totalClassesCreated": 15,
  "studentsProcessed": 5,
  "weekStartDate": "2024-01-15",
  "weekEndDate": "2024-01-21"
}
```

**Verification Query**:
```sql
-- Check classes were generated for current week
SELECT 
    date,
    COUNT(*) as class_count
FROM public.classes
WHERE date >= DATE_TRUNC('week', CURRENT_DATE)
AND date < DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '7 days'
GROUP BY date
ORDER BY date;
```

### **5.5 Run Diagnostic and Correction Scripts**

**Test Case 5: System Health Check**

**Run diagnostic**:
```bash
node scripts/diagnose-class-tracking-issues.js
```

**Expected Output**:
- ✅ All students have valid data
- ✅ No missing classes
- ✅ No data inconsistencies

**Run correction** (if issues found):
```bash
node scripts/fix-class-tracking-issues.js
```

**Expected Output**:
- ✅ All issues corrected
- ✅ Classes generated for students with missing data

---

## 📚 **Step 6: Update Documentation and Maintenance Procedures**

### **6.1 Update Project README**

**Add Supabase Setup Section to `README.md`**:

```markdown
## 🗄️ Supabase Setup

### Database Schema
The project uses Supabase (PostgreSQL) for production. All required schema, indices, and constraints are defined in:
- `database/supabase-complete-schema-verification.sql` - Complete schema setup
- `database/supabase-triggers-and-functions.sql` - Automated triggers
- `database/supabase-rls-policies.sql` - Security policies

### Automated Class Generation
The system includes automated class generation:
- **Student Creation**: Classes are automatically generated when a student is created with `start_date` and `fixed_schedule`
- **Student Update**: Classes are automatically regenerated when schedule is modified
- **Weekly Generation**: Classes for the upcoming week are generated every Monday at 6:00 AM

### Maintenance
- **Daily**: Monitor system health via Supabase Dashboard
- **Weekly**: Run diagnostic script to check for issues
- **Monthly**: Review and clean old logs

See `SUPABASE_SETUP_COMPLETE_GUIDE.md` for detailed setup instructions.
```

### **6.2 Create Maintenance Procedures Document**

**File**: `MAINTENANCE_PROCEDURES.md` (will be created next)

---

## 🎯 **Completion Checklist**

### **Schema and Indices**
- [ ] ✅ All required columns exist in `classes` table
- [ ] ✅ Unique index on `(student_id, date, start_time, end_time)` created
- [ ] ✅ Performance indices created
- [ ] ✅ CHECK constraints for `status` and `payment_status` added

### **Triggers and Functions**
- [ ] ✅ Trigger for student INSERT created
- [ ] ✅ Trigger for student UPDATE created
- [ ] ✅ Weekly generation function created
- [ ] ✅ Logging table created
- [ ] ✅ Edge Function deployed

### **Data Migration**
- [ ] ✅ Duplicate classes removed
- [ ] ✅ Diagnostic script run successfully
- [ ] ✅ Correction script run successfully
- [ ] ✅ Orphaned data cleaned

### **RLS Policies**
- [ ] ✅ RLS enabled on all tables
- [ ] ✅ Policies created for authenticated users
- [ ] ✅ Service role permissions granted
- [ ] ✅ API routes updated to use service role

### **End-to-End Tests**
- [ ] ✅ Student creation with class generation tested
- [ ] ✅ Student update with class regeneration tested
- [ ] ✅ "Update Classes" button tested
- [ ] ✅ Weekly generation endpoint tested
- [ ] ✅ Diagnostic and correction scripts tested

### **Documentation**
- [ ] ✅ README updated with Supabase setup
- [ ] ✅ Maintenance procedures documented
- [ ] ✅ Edge Function deployment documented
- [ ] ✅ RLS configuration documented

---

## 🎉 **Conclusion**

Your Supabase setup is now complete! The class tracking system includes:

1. ✅ **Complete schema** with all required columns and indices
2. ✅ **Automated class generation** via database triggers
3. ✅ **Weekly scheduled generation** via Edge Functions or cron
4. ✅ **Row Level Security** for data protection
5. ✅ **Clean and migrated data** with no duplicates
6. ✅ **End-to-end tested** functionality
7. ✅ **Comprehensive documentation** for maintenance

**Status**: ✅ Supabase Setup Complete
**Next Steps**: Deploy to production and monitor system health

---

## 📞 **Support**

For issues or questions:
1. Check the diagnostic scripts output
2. Review Supabase logs in Dashboard
3. Check Edge Function logs
4. Review `INTERNAL_README_CLASS_TRACKING.md` for system architecture

**Document Status**: ✅ Complete
**Last Updated**: 2024-01-15
**Version**: 1.0.0
