# Diagnostic and Correction Scripts Documentation

## 🎯 Overview

This document provides comprehensive documentation for the diagnostic and correction scripts used in the class tracking system. These scripts are essential for maintaining data integrity and ensuring the system functions correctly.

## 📋 Scripts Analysis

### ✅ **Scripts Found and Analyzed**

#### **1. Diagnostic Script**
**File**: `scripts/diagnose-class-tracking-issues.js`

##### **Purpose**
- Comprehensive analysis of the class tracking system
- Identifies data inconsistencies and missing information
- Provides detailed reports on system health

##### **What It Checks**
- ✅ **Student data validation** - start_date, fixed_schedule presence
- ✅ **Schedule validation** - JSON parsing, array structure, content validation
- ✅ **Class count analysis** - Compares existing vs expected classes
- ✅ **Date range validation** - Checks for future dates, missing classes
- ✅ **Data integrity** - Identifies orphaned or inconsistent data

##### **Output Categories**
```javascript
const issues = {
  missingStartDate: [],        // Students without start_date
  missingFixedSchedule: [],    // Students without fixed_schedule
  invalidFixedSchedule: [],    // Invalid JSON or structure
  emptyFixedSchedule: [],      // Empty schedule arrays
  futureStartDate: [],         // Students with future start dates
  missingClasses: [],         // Students with missing classes
  classCountMismatch: [],     // Students with extra/missing classes
  workingCorrectly: []        // Students with no issues
}
```

#### **2. Correction Script**
**File**: `scripts/fix-class-tracking-issues.js`

##### **Purpose**
- Automatically fixes identified issues
- Generates missing classes for students
- Maintains data integrity

##### **What It Does**
- ✅ **Validates student data** - Checks for required fields
- ✅ **Generates missing classes** - Creates classes from start_date to today
- ✅ **Prevents duplicates** - Uses compound key validation
- ✅ **Error handling** - Comprehensive error reporting
- ✅ **Progress tracking** - Detailed logging of corrections

##### **Correction Process**
1. **Data Validation** - Ensures student has start_date and fixed_schedule
2. **Class Generation** - Uses `generateClassesFromStartDate()` function
3. **Duplicate Prevention** - Compares with existing classes
4. **Batch Insertion** - Creates only missing classes
5. **Result Reporting** - Provides detailed statistics

## 🔧 **Current Usage Analysis**

### ❌ **Not Used Regularly**
Based on the analysis, these scripts are **NOT** integrated into regular maintenance workflows:

- **No automated scheduling** - Scripts are run manually only
- **No CI/CD integration** - Not part of deployment pipelines
- **No monitoring alerts** - No automated health checks
- **No documentation** - Limited usage instructions

### ✅ **Manual Usage Found**
The scripts are used manually in these scenarios:
- **Troubleshooting** - When issues are reported
- **Data migration** - After system updates
- **Maintenance** - Periodic manual execution
- **Debugging** - When investigating problems

## 📖 **Usage Documentation**

### **Diagnostic Script Usage**

#### **When to Run**
- ✅ **Weekly maintenance** - Check system health
- ✅ **After data changes** - Verify integrity after updates
- ✅ **Troubleshooting** - When issues are reported
- ✅ **Before major updates** - Ensure clean state
- ✅ **After student creation** - Verify new students are correct

#### **How to Run**
```bash
# Navigate to project directory
cd /path/to/your/project

# Run diagnostic script
node scripts/diagnose-class-tracking-issues.js

# With output redirection (optional)
node scripts/diagnose-class-tracking-issues.js > diagnostic-report.log 2>&1
```

#### **Interpreting Output**

##### **✅ Healthy System**
```
✅ Alumnos funcionando correctamente: 15
   • Juan Pérez (45 clases)
   • María García (32 clases)
   • Carlos López (28 clases)
```

##### **⚠️ Issues Found**
```
⚠️ Alumnos con clases faltantes: 3
   • Ana Martín - Faltan 12 clases (tiene 20, debería tener 32)
   • Pedro Ruiz - Faltan 8 clases (tiene 15, debería tener 23)
```

##### **❌ Critical Issues**
```
❌ Alumnos sin start_date: 2
   • Luis Fernández
   • Carmen Díaz

❌ Alumnos sin fixed_schedule: 1
   • Elena Vargas
```

### **Correction Script Usage**

#### **When to Run**
- ✅ **After diagnostic shows issues** - Fix identified problems
- ✅ **After student data updates** - Regenerate classes
- ✅ **System maintenance** - Regular cleanup
- ✅ **Data migration** - After importing data

#### **How to Run**
```bash
# Run correction script
node scripts/fix-class-tracking-issues.js

# With verbose output
node scripts/fix-class-tracking-issues.js 2>&1 | tee correction-log.txt
```

#### **Interpreting Output**

##### **✅ Successful Correction**
```
✅ Alumnos corregidos: 5
✅ Total de clases creadas: 45

Detalle de correcciones:
  • Ana Martín: 12 clases creadas
  • Pedro Ruiz: 8 clases creadas
  • Luis García: 15 clases creadas
```

##### **⚠️ Partial Success**
```
⏭️ Alumnos omitidos: 2
Motivos:
  • Elena Vargas: Sin fixed_schedule
  • Carlos Díaz: Fecha de inicio futura
```

## 🚀 **Integration Recommendations**

### **Option 1: Automated Weekly Maintenance**

#### **Cron Job Setup**
```bash
# Add to crontab (every Monday at 2:00 AM)
crontab -e

# Add this line
0 2 * * 1 cd /path/to/your/project && node scripts/diagnose-class-tracking-issues.js >> /var/log/class-diagnostic.log 2>&1

# If issues found, run correction (every Monday at 2:30 AM)
30 2 * * 1 cd /path/to/your/project && node scripts/fix-class-tracking-issues.js >> /var/log/class-correction.log 2>&1
```

#### **Automated Workflow**
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
    
    # Send notification (optional)
    echo "📧 Sending maintenance report..."
    # Add email notification here
else
    echo "✅ No issues found, system is healthy"
fi

echo "🎉 Weekly maintenance completed"
```

### **Option 2: CI/CD Integration**

#### **GitHub Actions Workflow**
```yaml
# .github/workflows/class-tracking-maintenance.yml
name: Class Tracking Maintenance

on:
  schedule:
    - cron: '0 2 * * 1'  # Every Monday at 2:00 AM
  workflow_dispatch:  # Manual trigger

jobs:
  maintenance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm install
        
      - name: Run diagnostic
        run: node scripts/diagnose-class-tracking-issues.js
        
      - name: Run correction if needed
        run: |
          if [ $? -eq 0 ]; then
            node scripts/fix-class-tracking-issues.js
          fi
```

### **Option 3: Monitoring Integration**

#### **Health Check Endpoint**
```typescript
// app/api/health/class-tracking/route.ts
export async function GET() {
  try {
    // Run diagnostic checks
    const issues = await runDiagnosticChecks()
    
    const healthStatus = {
      status: issues.critical > 0 ? 'unhealthy' : 'healthy',
      timestamp: new Date().toISOString(),
      issues: {
        critical: issues.critical,
        warnings: issues.warnings,
        total: issues.total
      }
    }
    
    return NextResponse.json(healthStatus)
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 })
  }
}
```

## 📊 **Frontend Integration Analysis**

### **"Update Classes" Button**

#### **Location**
- **Component**: `components/class-tracking/ClassTrackingDashboard.tsx`
- **Function**: `handleGenerateMissingClasses()`
- **API Endpoint**: `POST /api/class-tracking/generate-missing-classes`

#### **Current Implementation**
```typescript
const handleGenerateMissingClasses = async () => {
  try {
    setIsLoading(true)
    toast.info('Generando clases faltantes... Esto puede tardar unos momentos')
    
    const response = await fetch('/api/class-tracking/generate-missing-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    
    if (response.ok) {
      const result = await response.json()
      toast.success(`✅ ${result.totalClassesCreated} clases generadas para ${result.studentsProcessed} estudiantes`)
      fetchData() // Refresh data
    } else {
      const error = await response.json()
      toast.error(`Error: ${error.error || 'No se pudieron generar las clases'}`)
    }
  } catch (error) {
    console.error('Error generating missing classes:', error)
    toast.error('Error al generar las clases faltantes')
  } finally {
    setIsLoading(false)
  }
}
```

#### **Button UI**
```tsx
<Button 
  onClick={handleGenerateMissingClasses} 
  variant="outline" 
  className="flex items-center bg-green-500/10 border-green-500 hover:bg-green-500/20"
>
  <RefreshCw size={20} className="mr-2" />
  Actualizar Clases
</Button>
```

### **Integration with Scripts**

#### **Current State**
- ✅ **Frontend button exists** - "Actualizar Clases" button is implemented
- ✅ **API endpoint works** - Calls `/api/class-tracking/generate-missing-classes`
- ❌ **No diagnostic integration** - Button doesn't run diagnostics first
- ❌ **No error reporting** - Limited error information shown to user

#### **Recommended Enhancements**

##### **1. Add Diagnostic Step**
```typescript
const handleUpdateClasses = async () => {
  try {
    setIsLoading(true)
    
    // Step 1: Run diagnostic
    toast.info('🔍 Analizando sistema...')
    const diagnosticResponse = await fetch('/api/class-tracking/diagnostic')
    const diagnostic = await diagnosticResponse.json()
    
    if (diagnostic.issues.critical > 0) {
      toast.error(`❌ Se encontraron ${diagnostic.issues.critical} problemas críticos`)
      return
    }
    
    // Step 2: Generate missing classes
    toast.info('🔄 Generando clases faltantes...')
    const response = await fetch('/api/class-tracking/generate-missing-classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    
    if (response.ok) {
      const result = await response.json()
      toast.success(`✅ ${result.totalClassesCreated} clases generadas`)
      fetchData()
    }
  } catch (error) {
    toast.error('Error al actualizar las clases')
  } finally {
    setIsLoading(false)
  }
}
```

##### **2. Add Diagnostic API Endpoint**
```typescript
// app/api/class-tracking/diagnostic/route.ts
export async function GET() {
  try {
    // Run diagnostic checks
    const issues = await runDiagnosticChecks()
    
    return NextResponse.json({
      status: 'healthy',
      issues: {
        critical: issues.critical,
        warnings: issues.warnings,
        total: issues.total
      },
      recommendations: issues.recommendations
    })
  } catch (error) {
    return NextResponse.json({ 
      status: 'error', 
      error: error.message 
    }, { status: 500 })
  }
}
```

## 🎯 **Best Practices**

### **Regular Maintenance Schedule**

#### **Daily Checks**
- ✅ **Automated health monitoring** - Check for critical issues
- ✅ **Error logging** - Monitor for system errors
- ✅ **Performance metrics** - Track system performance

#### **Weekly Maintenance**
- ✅ **Full diagnostic run** - Complete system analysis
- ✅ **Data integrity check** - Verify all data is correct
- ✅ **Class generation** - Ensure all classes are up to date

#### **Monthly Reviews**
- ✅ **System optimization** - Review and optimize performance
- ✅ **Data cleanup** - Remove old or unnecessary data
- ✅ **Documentation updates** - Keep documentation current

### **Error Handling**

#### **Script Error Handling**
```javascript
// Add to both scripts
process.on('uncaughtException', (error) => {
  log(`💥 Uncaught exception: ${error.message}`, 'red')
  console.error(error.stack)
  process.exit(1)
})

process.on('unhandledRejection', (reason, promise) => {
  log(`💥 Unhandled rejection: ${reason}`, 'red')
  console.error('Promise:', promise)
  process.exit(1)
})
```

#### **Frontend Error Handling**
```typescript
// Enhanced error handling in frontend
const handleUpdateClasses = async () => {
  try {
    setIsLoading(true)
    
    // Add timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30s timeout
    
    const response = await fetch('/api/class-tracking/generate-missing-classes', {
      method: 'POST',
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Error del servidor')
    }
    
    const result = await response.json()
    toast.success(`✅ ${result.totalClassesCreated} clases generadas`)
    fetchData()
    
  } catch (error) {
    if (error.name === 'AbortError') {
      toast.error('⏰ La operación tardó demasiado tiempo')
    } else {
      toast.error(`❌ Error: ${error.message}`)
    }
  } finally {
    setIsLoading(false)
  }
}
```

## 📈 **Monitoring and Alerts**

### **Health Check Dashboard**
```typescript
// components/ClassTrackingHealth.tsx
export const ClassTrackingHealth = () => {
  const [healthStatus, setHealthStatus] = useState(null)
  
  const checkHealth = async () => {
    try {
      const response = await fetch('/api/class-tracking/diagnostic')
      const health = await response.json()
      setHealthStatus(health)
    } catch (error) {
      console.error('Error checking health:', error)
    }
  }
  
  useEffect(() => {
    checkHealth()
    const interval = setInterval(checkHealth, 300000) // 5 minutes
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="health-dashboard">
      {healthStatus?.issues.critical > 0 && (
        <Alert className="border-red-500 bg-red-50">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problemas Críticos</AlertTitle>
          <AlertDescription>
            Se encontraron {healthStatus.issues.critical} problemas críticos
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
```

## 🎉 **Conclusion**

The diagnostic and correction scripts are essential tools for maintaining the class tracking system. While they are not currently integrated into automated workflows, they provide:

1. **Comprehensive diagnostics** - Identify system issues
2. **Automatic corrections** - Fix identified problems
3. **Detailed reporting** - Provide actionable insights
4. **Data integrity** - Ensure system consistency

**Recommendations:**
- ✅ **Integrate into weekly maintenance** - Automated execution
- ✅ **Add frontend integration** - Better user experience
- ✅ **Implement monitoring** - Proactive issue detection
- ✅ **Create documentation** - Clear usage instructions

**Status**: ✅ Scripts analyzed and documented
**Next Steps**: Implement automated integration and monitoring
