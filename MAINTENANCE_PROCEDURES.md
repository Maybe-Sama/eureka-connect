# 🔧 Maintenance Procedures: Class Tracking System

## 📋 **Overview**

This document outlines the recommended maintenance procedures for the class tracking system, including daily, weekly, and monthly tasks, as well as troubleshooting procedures.

---

## 📅 **Daily Maintenance**

### **1. System Health Monitoring**

#### **Check Supabase Dashboard**
- **Location**: Supabase Dashboard → Database → Health
- **What to check**:
  - ✅ Database is online and responsive
  - ✅ No unusual CPU or memory usage
  - ✅ No connection errors
  - ✅ Query performance is acceptable

#### **Check Edge Function Logs**
- **Location**: Supabase Dashboard → Edge Functions → Logs
- **What to check**:
  - ✅ No errors in class generation webhook
  - ✅ Successful executions logged
  - ✅ Response times are acceptable

#### **Check Class Generation Logs**
```sql
-- Check recent class generation logs
SELECT 
    id,
    student_id,
    operation,
    trigger_time,
    status,
    message,
    classes_created
FROM public.class_generation_logs
WHERE trigger_time >= NOW() - INTERVAL '24 hours'
ORDER BY trigger_time DESC;

-- Count by status
SELECT 
    status,
    COUNT(*) as count
FROM public.class_generation_logs
WHERE trigger_time >= NOW() - INTERVAL '24 hours'
GROUP BY status;
```

### **2. Verify Recent Class Generation**

```sql
-- Check classes created today
SELECT 
    COUNT(*) as classes_created_today
FROM public.classes
WHERE created_at >= CURRENT_DATE;

-- Check classes by student
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    COUNT(c.id) as classes_today
FROM public.students s
LEFT JOIN public.classes c ON s.id = c.student_id
WHERE c.created_at >= CURRENT_DATE
GROUP BY s.id, s.first_name, s.last_name
ORDER BY classes_today DESC;
```

### **3. Check for Errors**

```sql
-- Check for failed class generations
SELECT 
    student_id,
    operation,
    trigger_time,
    message,
    error_details
FROM public.class_generation_logs
WHERE status = 'failed'
AND trigger_time >= NOW() - INTERVAL '24 hours'
ORDER BY trigger_time DESC;
```

**Action if errors found**:
1. Review error details
2. Check student data for issues
3. Run diagnostic script for affected students
4. Run correction script if needed

---

## 📅 **Weekly Maintenance**

### **1. Run Diagnostic Script**

**Purpose**: Identify any data inconsistencies or missing classes

**Command**:
```bash
node scripts/diagnose-class-tracking-issues.js
```

**Expected Output**:
- ✅ List of students with valid data
- ⚠️ List of students with missing classes
- ❌ List of students with invalid data

**Action if issues found**:
1. Review the diagnostic output
2. Identify root cause of issues
3. Fix data issues manually or run correction script
4. Re-run diagnostic to confirm fixes

### **2. Run Correction Script (if needed)**

**Purpose**: Automatically fix identified issues

**Command**:
```bash
node scripts/fix-class-tracking-issues.js
```

**Expected Output**:
- ✅ Number of classes created for each student
- ✅ Total classes created
- ⏭️ Students skipped (with reasons)

### **3. Verify Weekly Generation**

**Check that weekly generation ran successfully**:
```sql
-- Check weekly generation logs (Monday at 6:00 AM)
SELECT 
    id,
    operation,
    trigger_time,
    status,
    message,
    classes_created
FROM public.class_generation_logs
WHERE operation = 'scheduled'
AND trigger_time >= DATE_TRUNC('week', CURRENT_DATE) - INTERVAL '7 days'
ORDER BY trigger_time DESC;
```

**Manual trigger if needed**:
```bash
curl -X POST http://localhost:3000/api/class-tracking/generate-weekly-classes \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **4. Check for Duplicate Classes**

```sql
-- Check for duplicates
SELECT * FROM public.check_duplicate_classes();
```

**Action if duplicates found**:
```sql
-- Remove duplicates
SELECT * FROM public.remove_duplicate_classes();
```

### **5. Review Class Statistics**

```sql
-- Classes by status
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.classes
GROUP BY status
ORDER BY count DESC;

-- Classes by payment status
SELECT 
    payment_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM public.classes
GROUP BY payment_status
ORDER BY count DESC;

-- Classes by student (top 10)
SELECT 
    s.id,
    s.first_name,
    s.last_name,
    COUNT(c.id) as total_classes,
    SUM(CASE WHEN c.status = 'completed' THEN 1 ELSE 0 END) as completed_classes,
    SUM(CASE WHEN c.payment_status = 'paid' THEN 1 ELSE 0 END) as paid_classes
FROM public.students s
LEFT JOIN public.classes c ON s.id = c.student_id
GROUP BY s.id, s.first_name, s.last_name
ORDER BY total_classes DESC
LIMIT 10;
```

---

## 📅 **Monthly Maintenance**

### **1. Clean Old Logs**

**Purpose**: Remove old class generation logs to keep database size manageable

**Command**:
```sql
-- Clean logs older than 30 days
SELECT * FROM public.clean_old_class_generation_logs(30);
```

**Verify**:
```sql
-- Check log count by month
SELECT 
    DATE_TRUNC('month', trigger_time) as month,
    COUNT(*) as log_count
FROM public.class_generation_logs
GROUP BY DATE_TRUNC('month', trigger_time)
ORDER BY month DESC;
```

### **2. Database Performance Review**

**Check table sizes**:
```sql
-- Check table sizes
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Check index usage**:
```sql
-- Check index usage
SELECT 
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans,
    idx_tup_read as tuples_read,
    idx_tup_fetch as tuples_fetched
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

**Analyze and vacuum**:
```sql
-- Analyze tables for query planner
ANALYZE public.students;
ANALYZE public.classes;
ANALYZE public.courses;
ANALYZE public.class_generation_logs;

-- Vacuum to reclaim storage
VACUUM ANALYZE public.students;
VACUUM ANALYZE public.classes;
VACUUM ANALYZE public.courses;
VACUUM ANALYZE public.class_generation_logs;
```

### **3. Review and Update Documentation**

**Check if documentation is up to date**:
- [ ] README.md reflects current system state
- [ ] INTERNAL_README_CLASS_TRACKING.md is accurate
- [ ] MAINTENANCE_PROCEDURES.md (this document) is current
- [ ] SUPABASE_SETUP_COMPLETE_GUIDE.md is accurate

**Update if needed**:
- Add new procedures discovered during maintenance
- Update troubleshooting steps based on recent issues
- Document any configuration changes

### **4. Backup Verification**

**Check Supabase backups**:
- **Location**: Supabase Dashboard → Database → Backups
- **What to check**:
  - ✅ Daily backups are running
  - ✅ Backups are successful
  - ✅ Retention policy is appropriate

**Test restore procedure** (in staging environment):
1. Create a test restore from backup
2. Verify data integrity
3. Test application functionality
4. Document any issues

### **5. Security Review**

**Check RLS policies**:
```sql
-- Review RLS policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

**Check for unauthorized access attempts**:
- Review Supabase Auth logs
- Check for unusual API usage patterns
- Review Edge Function logs for errors

---

## 🚨 **Troubleshooting Procedures**

### **Issue 1: Classes Not Generated for New Student**

**Symptoms**:
- Student created successfully
- No classes appear in class tracking
- No errors in logs

**Diagnosis**:
```bash
# Run diagnostic for specific student
node scripts/diagnose-class-tracking-issues.js
```

```sql
-- Check student data
SELECT 
    id,
    first_name,
    last_name,
    start_date,
    fixed_schedule
FROM public.students
WHERE id = <student_id>;

-- Check class generation logs
SELECT *
FROM public.class_generation_logs
WHERE student_id = <student_id>
ORDER BY trigger_time DESC;
```

**Solutions**:
1. **Missing start_date or fixed_schedule**:
   - Update student with required data
   - Trigger will automatically generate classes

2. **Invalid fixed_schedule format**:
   - Fix the JSON format
   - Update student
   - Trigger will regenerate classes

3. **Trigger not firing**:
   - Check trigger exists in Supabase
   - Re-run triggers setup script
   - Manually trigger class generation

**Manual fix**:
```bash
# Generate classes manually
curl -X POST http://localhost:3000/api/class-tracking/generate-missing-classes \
  -H "Content-Type: application/json" \
  -d '{"studentId": <student_id>}'
```

### **Issue 2: Duplicate Classes**

**Symptoms**:
- Multiple identical classes for same student
- Unique constraint violations in logs

**Diagnosis**:
```sql
-- Check for duplicates
SELECT * FROM public.check_duplicate_classes();
```

**Solution**:
```sql
-- Remove duplicates (keeps oldest)
SELECT * FROM public.remove_duplicate_classes();
```

**Prevention**:
- Verify unique index exists
- Check class generation logic
- Review trigger implementation

### **Issue 3: Weekly Generation Not Running**

**Symptoms**:
- No classes generated for upcoming week
- No logs for weekly generation

**Diagnosis**:
```sql
-- Check recent scheduled generations
SELECT *
FROM public.class_generation_logs
WHERE operation = 'scheduled'
ORDER BY trigger_time DESC
LIMIT 10;
```

**Check Edge Function**:
- Supabase Dashboard → Edge Functions → Logs
- Look for execution errors
- Verify schedule is configured

**Solutions**:
1. **Edge Function not deployed**:
   - Deploy Edge Function
   - Configure schedule

2. **Schedule misconfigured**:
   - Update cron expression
   - Verify timezone settings

3. **API endpoint error**:
   - Check Next.js logs
   - Verify API is accessible
   - Test endpoint manually

**Manual trigger**:
```bash
curl -X POST http://localhost:3000/api/class-tracking/generate-weekly-classes \
  -H "Content-Type: application/json" \
  -d '{}'
```

### **Issue 4: Performance Degradation**

**Symptoms**:
- Slow class generation
- Timeout errors
- High database CPU usage

**Diagnosis**:
```sql
-- Check slow queries
SELECT 
    query,
    calls,
    total_time,
    mean_time,
    max_time
FROM pg_stat_statements
WHERE query LIKE '%classes%'
ORDER BY mean_time DESC
LIMIT 10;

-- Check table sizes
SELECT 
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solutions**:
1. **Missing indices**:
   - Re-run schema verification script
   - Verify all indices exist

2. **Large dataset**:
   - Implement pagination
   - Optimize queries
   - Consider archiving old data

3. **Inefficient queries**:
   - Review query execution plans
   - Add missing indices
   - Optimize query logic

**Performance optimization**:
```sql
-- Analyze tables
ANALYZE public.classes;

-- Reindex if needed
REINDEX TABLE public.classes;

-- Vacuum to reclaim space
VACUUM ANALYZE public.classes;
```

### **Issue 5: RLS Permission Errors**

**Symptoms**:
- API routes return permission errors
- Classes not created despite valid data
- "new row violates row-level security policy" errors

**Diagnosis**:
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'classes';

-- Check policies
SELECT *
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'classes';
```

**Solutions**:
1. **API using wrong key**:
   - Verify API routes use SERVICE ROLE key
   - Check `.env.local` configuration
   - Update `lib/supabase.ts` to use `supabaseAdmin`

2. **Policies too restrictive**:
   - Review and update RLS policies
   - Grant necessary permissions
   - Test with service role

3. **Missing grants**:
   - Re-run RLS policies script
   - Verify grants for service_role

---

## 📊 **Monitoring Dashboard**

### **Key Metrics to Track**

#### **Daily Metrics**
- Number of classes created today
- Number of students with missing classes
- Number of failed class generations
- Average class generation time

#### **Weekly Metrics**
- Total classes generated this week
- Students processed by weekly generation
- Number of duplicate classes removed
- System uptime and availability

#### **Monthly Metrics**
- Total classes in system
- Classes by status distribution
- Classes by payment status distribution
- Database size growth

### **Monitoring Queries**

**Daily Dashboard**:
```sql
-- Classes created today
SELECT COUNT(*) as classes_today
FROM public.classes
WHERE created_at >= CURRENT_DATE;

-- Failed generations today
SELECT COUNT(*) as failures_today
FROM public.class_generation_logs
WHERE status = 'failed'
AND trigger_time >= CURRENT_DATE;

-- Students with missing classes
SELECT COUNT(*) as students_with_issues
FROM public.students s
WHERE s.start_date IS NOT NULL
AND s.fixed_schedule IS NOT NULL
AND s.start_date < CURRENT_DATE
AND NOT EXISTS (
    SELECT 1
    FROM public.classes c
    WHERE c.student_id = s.id
    AND c.date = CURRENT_DATE - INTERVAL '1 day'
);
```

**Weekly Dashboard**:
```sql
-- Classes created this week
SELECT COUNT(*) as classes_this_week
FROM public.classes
WHERE created_at >= DATE_TRUNC('week', CURRENT_DATE);

-- Weekly generation status
SELECT 
    status,
    COUNT(*) as count
FROM public.class_generation_logs
WHERE operation = 'scheduled'
AND trigger_time >= DATE_TRUNC('week', CURRENT_DATE)
GROUP BY status;
```

---

## 🎯 **Maintenance Checklist**

### **Daily Checklist**
- [ ] Check Supabase Dashboard for health
- [ ] Review Edge Function logs
- [ ] Check class generation logs for errors
- [ ] Verify classes created today

### **Weekly Checklist**
- [ ] Run diagnostic script
- [ ] Run correction script (if issues found)
- [ ] Verify weekly generation ran
- [ ] Check for duplicate classes
- [ ] Review class statistics

### **Monthly Checklist**
- [ ] Clean old logs (30+ days)
- [ ] Review database performance
- [ ] Analyze and vacuum tables
- [ ] Update documentation
- [ ] Verify backup integrity
- [ ] Review security policies

---

## 🎉 **Conclusion**

Following these maintenance procedures will ensure:
1. ✅ **System reliability** - Early detection of issues
2. ✅ **Data integrity** - No duplicates or missing data
3. ✅ **Performance** - Optimized database and queries
4. ✅ **Security** - Proper access control and monitoring
5. ✅ **Documentation** - Up-to-date procedures and guides

**Status**: ✅ Maintenance Procedures Documented
**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintainer**: Development Team
