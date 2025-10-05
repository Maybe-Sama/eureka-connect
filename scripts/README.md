# Class Tracking Scripts

This directory contains diagnostic and correction scripts for the class tracking system. These scripts are essential for maintaining data integrity and ensuring the system functions correctly.

## 📋 Available Scripts

### 🔍 **Diagnostic Scripts**

#### `diagnose-class-tracking-issues.js`
**Purpose**: Comprehensive analysis of the class tracking system

**What it checks**:
- ✅ Student data validation (start_date, fixed_schedule)
- ✅ Schedule validation (JSON parsing, structure, content)
- ✅ Class count analysis (existing vs expected)
- ✅ Date range validation (future dates, missing classes)
- ✅ Data integrity (orphaned or inconsistent data)

**Usage**:
```bash
node scripts/diagnose-class-tracking-issues.js
```

**Output**: Detailed report of system health and identified issues

#### `diagnose-simple-require.js`
**Purpose**: Simplified diagnostic for basic issues

**Usage**:
```bash
node scripts/diagnose-simple-require.js
```

### 🔧 **Correction Scripts**

#### `fix-class-tracking-issues.js`
**Purpose**: Automatically fixes identified issues

**What it does**:
- ✅ Validates student data
- ✅ Generates missing classes
- ✅ Prevents duplicates
- ✅ Comprehensive error reporting
- ✅ Progress tracking

**Usage**:
```bash
node scripts/fix-class-tracking-issues.js
```

**Output**: Detailed report of corrections made

#### `fix-simple-require.js`
**Purpose**: Simplified correction for basic issues

**Usage**:
```bash
node scripts/fix-simple-require.js
```

### 🧪 **Test Scripts**

#### `test-class-tracking-fix.js`
**Purpose**: Test the correction functionality

**Usage**:
```bash
node scripts/test-class-tracking-fix.js
```

#### `test-fixed-schedules-comprehensive.js`
**Purpose**: Comprehensive testing of fixed schedules

**Usage**:
```bash
node scripts/test-fixed-schedules-comprehensive.js
```

## 🚀 **Quick Start**

### **1. Run Diagnostic**
```bash
# Check system health
node scripts/diagnose-class-tracking-issues.js
```

### **2. Fix Issues (if found)**
```bash
# Fix identified issues
node scripts/fix-class-tracking-issues.js
```

### **3. Verify Fixes**
```bash
# Run diagnostic again to verify
node scripts/diagnose-class-tracking-issues.js
```

## 📊 **Understanding Output**

### **Diagnostic Output**

#### ✅ **Healthy System**
```
✅ Alumnos funcionando correctamente: 15
   • Juan Pérez (45 clases)
   • María García (32 clases)
```

#### ⚠️ **Issues Found**
```
⚠️ Alumnos con clases faltantes: 3
   • Ana Martín - Faltan 12 clases (tiene 20, debería tener 32)
```

#### ❌ **Critical Issues**
```
❌ Alumnos sin start_date: 2
   • Luis Fernández
   • Carmen Díaz
```

### **Correction Output**

#### ✅ **Successful Correction**
```
✅ Alumnos corregidos: 5
✅ Total de clases creadas: 45

Detalle de correcciones:
  • Ana Martín: 12 clases creadas
  • Pedro Ruiz: 8 clases creadas
```

#### ⚠️ **Partial Success**
```
⏭️ Alumnos omitidos: 2
Motivos:
  • Elena Vargas: Sin fixed_schedule
  • Carlos Díaz: Fecha de inicio futura
```

## 🔄 **Regular Maintenance**

### **Weekly Maintenance**
```bash
#!/bin/bash
# scripts/weekly-maintenance.sh

echo "🔍 Running weekly class tracking maintenance..."

# Run diagnostic
node scripts/diagnose-class-tracking-issues.js > diagnostic-results.log 2>&1

# Check if issues were found
if grep -q "Alumnos con clases faltantes\|Alumnos sin start_date\|Alumnos sin fixed_schedule" diagnostic-results.log; then
    echo "⚠️ Issues found, running correction script..."
    node scripts/fix-class-tracking-issues.js > correction-results.log 2>&1
    echo "📧 Sending maintenance report..."
else
    echo "✅ No issues found, system is healthy"
fi

echo "🎉 Weekly maintenance completed"
```

### **Cron Job Setup**
```bash
# Add to crontab (every Monday at 2:00 AM)
crontab -e

# Add this line
0 2 * * 1 cd /path/to/your/project && node scripts/diagnose-class-tracking-issues.js >> /var/log/class-diagnostic.log 2>&1

# If issues found, run correction (every Monday at 2:30 AM)
30 2 * * 1 cd /path/to/your/project && node scripts/fix-class-tracking-issues.js >> /var/log/class-correction.log 2>&1
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **Script Fails to Run**
```bash
# Check Node.js version
node --version

# Install dependencies
npm install

# Check file permissions
chmod +x scripts/*.js
```

#### **Database Connection Issues**
```bash
# Check environment variables
echo $DATABASE_URL

# Test database connection
node -e "console.log(require('./lib/database.js'))"
```

#### **Module Import Errors**
```bash
# Check if modules exist
ls -la lib/database.js
ls -la lib/class-generation.js

# Run with debug output
DEBUG=* node scripts/diagnose-class-tracking-issues.js
```

### **Error Codes**

| Code | Meaning | Solution |
|------|---------|----------|
| 1 | General error | Check logs for details |
| 2 | Database connection failed | Verify database configuration |
| 3 | Module import failed | Check file paths and permissions |
| 4 | Validation error | Check input data format |

## 📈 **Monitoring**

### **Health Check**
```bash
# Quick health check
node scripts/diagnose-class-tracking-issues.js | grep -E "(✅|❌|⚠️)"
```

### **Log Analysis**
```bash
# Check for errors in logs
grep -i "error\|failed\|exception" /var/log/class-*.log

# Check for warnings
grep -i "warning\|advertencia" /var/log/class-*.log
```

### **Performance Monitoring**
```bash
# Monitor script execution time
time node scripts/diagnose-class-tracking-issues.js

# Monitor memory usage
node --max-old-space-size=4096 scripts/diagnose-class-tracking-issues.js
```

## 🔧 **Configuration**

### **Environment Variables**
```bash
# Database configuration
export DATABASE_URL="your-database-url"

# Logging configuration
export LOG_LEVEL="info"
export LOG_FILE="/var/log/class-tracking.log"

# Performance configuration
export NODE_OPTIONS="--max-old-space-size=4096"
```

### **Script Configuration**
```javascript
// scripts/config.js
module.exports = {
  database: {
    url: process.env.DATABASE_URL,
    timeout: 30000
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || './logs/class-tracking.log'
  },
  performance: {
    maxMemory: '4GB',
    timeout: 300000 // 5 minutes
  }
}
```

## 📚 **Documentation**

### **Related Files**
- `DIAGNOSTIC_SCRIPTS_DOCUMENTATION.md` - Comprehensive documentation
- `WEEKLY_CLASS_GENERATION_SCHEDULING.md` - Weekly maintenance guide
- `GUIA_ACTUALIZACION_CLASES.md` - Frontend integration guide

### **API Endpoints**
- `POST /api/class-tracking/generate-missing-classes` - Generate missing classes
- `GET /api/class-tracking/diagnostic` - System health check
- `POST /api/class-tracking/generate-weekly-classes` - Weekly class generation

### **Frontend Integration**
- "Actualizar Clases" button in `/class-tracking`
- Automatic class generation on student creation
- Real-time error reporting and notifications

## 🎯 **Best Practices**

### **Before Running Scripts**
1. ✅ **Backup database** - Always backup before major changes
2. ✅ **Check system status** - Ensure system is stable
3. ✅ **Review logs** - Check for existing issues
4. ✅ **Test in development** - Run scripts in dev environment first

### **After Running Scripts**
1. ✅ **Verify results** - Check that issues were resolved
2. ✅ **Monitor system** - Watch for any new issues
3. ✅ **Update documentation** - Record any changes made
4. ✅ **Notify team** - Inform team of any significant changes

### **Regular Maintenance**
1. ✅ **Weekly diagnostics** - Run diagnostic scripts weekly
2. ✅ **Monthly reviews** - Review system health monthly
3. ✅ **Quarterly optimization** - Optimize system performance quarterly
4. ✅ **Annual updates** - Update scripts and documentation annually

## 🆘 **Support**

### **Getting Help**
- Check logs for error details
- Review documentation for common issues
- Test scripts in development environment
- Contact system administrator for critical issues

### **Reporting Issues**
When reporting issues, include:
- Script name and version
- Error messages and logs
- System configuration
- Steps to reproduce
- Expected vs actual behavior

---

**Last Updated**: 2024-01-15
**Version**: 1.0.0
**Maintainer**: System Administrator
