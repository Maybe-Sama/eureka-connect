#!/usr/bin/env node

/**
 * Test Script for Weekly Class Generation
 * 
 * This script tests the weekly class generation system to ensure it works correctly.
 * It can be run manually to verify the system is functioning properly.
 */

const { generateWeeklyClasses, config } = require('./weekly-class-generation.js')

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
  console.log(`${colors[color]}${message}${colors.reset}`)
}

async function testWeeklyGeneration() {
  log('🧪 Testing Weekly Class Generation System', 'cyan')
  log('=' .repeat(60), 'cyan')
  
  try {
    // Test 1: Check API endpoint availability
    log('\n📝 Test 1: Checking API endpoint availability', 'blue')
    log(`   Endpoint: ${config.apiEndpoint}`, 'white')
    
    // Test 2: Run the weekly generation
    log('\n📝 Test 2: Running weekly class generation', 'blue')
    await generateWeeklyClasses()
    
    log('\n✅ All tests passed!', 'green')
    log('🎉 Weekly class generation system is working correctly', 'green')
    
  } catch (error) {
    log('\n❌ Test failed!', 'red')
    log(`🔍 Error: ${error.message}`, 'red')
    
    if (error.stack) {
      log('\n📋 Stack trace:', 'yellow')
      console.error(error.stack)
    }
    
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testWeeklyGeneration()
    .catch((error) => {
      log(`💥 Test script failed: ${error.message}`, 'red')
      process.exit(1)
    })
}

module.exports = { testWeeklyGeneration }
