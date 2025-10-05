#!/usr/bin/env node

/**
 * Weekly Class Generation Script
 * 
 * This script generates classes for the current week for all students with fixed schedules.
 * It's designed to be run as a cron job every Monday at 6:00 AM.
 * 
 * Usage:
 * - Manual execution: node scripts/weekly-class-generation.js
 * - Cron job: 0 6 * * 1 cd /path/to/project && node scripts/weekly-class-generation.js
 * 
 * Cron schedule: Every Monday at 6:00 AM
 * 0 6 * * 1
 */

const https = require('https')
const http = require('http')

// Configuration
const config = {
  // API endpoint for weekly class generation
  apiEndpoint: process.env.API_ENDPOINT || 'http://localhost:3000/api/class-tracking/generate-weekly-classes',
  
  // Timeout for API requests (in milliseconds)
  timeout: 30000, // 30 seconds
  
  // Retry configuration
  maxRetries: 3,
  retryDelay: 5000, // 5 seconds
}

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
}

function log(message, color = 'white') {
  const timestamp = new Date().toISOString()
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`)
}

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const isHttps = url.startsWith('https://')
    const client = isHttps ? https : http
    
    const requestOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Weekly-Class-Generator/1.0'
      },
      timeout: config.timeout,
      ...options
    }
    
    const req = client.request(url, requestOptions, (res) => {
      let data = ''
      
      res.on('data', (chunk) => {
        data += chunk
      })
      
      res.on('end', () => {
        try {
          const jsonData = JSON.parse(data)
          resolve({
            statusCode: res.statusCode,
            data: jsonData
          })
        } catch (error) {
          reject(new Error(`Invalid JSON response: ${error.message}`))
        }
      })
    })
    
    req.on('error', (error) => {
      reject(error)
    })
    
    req.on('timeout', () => {
      req.destroy()
      reject(new Error('Request timeout'))
    })
    
    req.end()
  })
}

async function generateWeeklyClasses() {
  log('🚀 Starting weekly class generation script', 'cyan')
  log(`📡 API Endpoint: ${config.apiEndpoint}`, 'blue')
  
  let attempt = 1
  let lastError = null
  
  while (attempt <= config.maxRetries) {
    try {
      log(`🔄 Attempt ${attempt}/${config.maxRetries}`, 'yellow')
      
      const response = await makeRequest(config.apiEndpoint)
      
      if (response.statusCode === 200) {
        const result = response.data
        
        log('✅ Weekly class generation completed successfully!', 'green')
        log(`📊 Results:`, 'blue')
        log(`   • Week: ${result.weekStart} to ${result.weekEnd}`, 'white')
        log(`   • Classes created: ${result.totalClassesCreated}`, 'white')
        log(`   • Students processed: ${result.studentsProcessed}`, 'white')
        
        if (result.results && result.results.length > 0) {
          log(`📋 Student details:`, 'blue')
          result.results.forEach(student => {
            const status = student.classesCreated > 0 ? '✅' : '⏭️'
            log(`   ${status} ${student.studentName}: ${student.classesCreated} classes - ${student.message}`, 'white')
          })
        }
        
        // Exit successfully
        process.exit(0)
        
      } else {
        throw new Error(`HTTP ${response.statusCode}: ${response.data?.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      lastError = error
      log(`❌ Attempt ${attempt} failed: ${error.message}`, 'red')
      
      if (attempt < config.maxRetries) {
        log(`⏳ Retrying in ${config.retryDelay/1000} seconds...`, 'yellow')
        await new Promise(resolve => setTimeout(resolve, config.retryDelay))
      }
      
      attempt++
    }
  }
  
  // All attempts failed
  log(`💥 All ${config.maxRetries} attempts failed`, 'red')
  log(`🔍 Last error: ${lastError?.message}`, 'red')
  process.exit(1)
}

// Handle process signals
process.on('SIGINT', () => {
  log('🛑 Script interrupted by user', 'yellow')
  process.exit(130)
})

process.on('SIGTERM', () => {
  log('🛑 Script terminated', 'yellow')
  process.exit(143)
})

// Handle uncaught exceptions
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

// Main execution
if (require.main === module) {
  generateWeeklyClasses()
    .catch((error) => {
      log(`💥 Script failed: ${error.message}`, 'red')
      console.error(error.stack)
      process.exit(1)
    })
}

module.exports = { generateWeeklyClasses, config }
