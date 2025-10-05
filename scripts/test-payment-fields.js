#!/usr/bin/env node

/**
 * Test script to verify payment fields implementation
 * This script tests the class generation function and database fields
 */

const { generateClassesFromStartDate } = require('../lib/class-generation.js')

async function testPaymentFields() {
  console.log('🧪 Testing Payment Fields Implementation')
  console.log('=' .repeat(50))
  
  try {
    // Test data
    const studentId = 1
    const courseId = 1
    const fixedSchedule = [
      {
        day_of_week: 1, // Monday
        start_time: '10:00',
        end_time: '11:00',
        subject: 'Matemáticas'
      }
    ]
    const startDate = '2024-01-15'
    const endDate = '2024-01-22'
    
    console.log('📋 Test Parameters:')
    console.log(`  Student ID: ${studentId}`)
    console.log(`  Course ID: ${courseId}`)
    console.log(`  Start Date: ${startDate}`)
    console.log(`  End Date: ${endDate}`)
    console.log(`  Schedule: ${JSON.stringify(fixedSchedule, null, 2)}`)
    console.log()
    
    // Generate classes
    console.log('🔄 Generating classes...')
    const classes = await generateClassesFromStartDate(
      studentId,
      courseId,
      fixedSchedule,
      startDate,
      endDate
    )
    
    console.log(`✅ Generated ${classes.length} classes`)
    console.log()
    
    // Verify each class has required fields
    console.log('🔍 Verifying class fields:')
    let allFieldsCorrect = true
    
    classes.forEach((cls, index) => {
      console.log(`  Class ${index + 1}:`)
      console.log(`    Date: ${cls.date}`)
      console.log(`    Time: ${cls.start_time} - ${cls.end_time}`)
      console.log(`    Status: ${cls.status}`)
      console.log(`    Payment Status: ${cls.payment_status}`)
      console.log(`    Payment Notes: "${cls.payment_notes}"`)
      console.log(`    Is Recurring: ${cls.is_recurring}`)
      console.log(`    Price: €${cls.price}`)
      
      // Check required fields
      const hasStatus = cls.status === 'scheduled'
      const hasPaymentStatus = cls.payment_status === 'unpaid'
      const hasPaymentNotes = cls.payment_notes === ''
      const hasIsRecurring = cls.is_recurring === true
      
      if (!hasStatus) {
        console.log(`    ❌ Status should be 'scheduled', got '${cls.status}'`)
        allFieldsCorrect = false
      } else {
        console.log(`    ✅ Status: ${cls.status}`)
      }
      
      if (!hasPaymentStatus) {
        console.log(`    ❌ Payment status should be 'unpaid', got '${cls.payment_status}'`)
        allFieldsCorrect = false
      } else {
        console.log(`    ✅ Payment Status: ${cls.payment_status}`)
      }
      
      if (!hasPaymentNotes) {
        console.log(`    ❌ Payment notes should be empty string, got '${cls.payment_notes}'`)
        allFieldsCorrect = false
      } else {
        console.log(`    ✅ Payment Notes: "${cls.payment_notes}"`)
      }
      
      if (!hasIsRecurring) {
        console.log(`    ❌ Is recurring should be true, got ${cls.is_recurring}`)
        allFieldsCorrect = false
      } else {
        console.log(`    ✅ Is Recurring: ${cls.is_recurring}`)
      }
      
      console.log()
    })
    
    // Summary
    console.log('📊 Test Summary:')
    console.log(`  Total classes generated: ${classes.length}`)
    console.log(`  All fields correct: ${allFieldsCorrect ? '✅ YES' : '❌ NO'}`)
    
    if (allFieldsCorrect) {
      console.log()
      console.log('🎉 SUCCESS: All payment fields are correctly set!')
      console.log('✅ Status: scheduled')
      console.log('✅ Payment Status: unpaid')
      console.log('✅ Payment Notes: empty string')
      console.log('✅ Is Recurring: true')
    } else {
      console.log()
      console.log('❌ FAILURE: Some fields are not set correctly!')
      console.log('Please check the generateClassesFromStartDate function.')
    }
    
    return allFieldsCorrect
    
  } catch (error) {
    console.error('❌ Error during test:', error.message)
    console.error(error.stack)
    return false
  }
}

// Run the test
testPaymentFields()
  .then(success => {
    if (success) {
      console.log('\n🎯 Test completed successfully!')
      process.exit(0)
    } else {
      console.log('\n💥 Test failed!')
      process.exit(1)
    }
  })
  .catch(error => {
    console.error('💥 Test crashed:', error)
    process.exit(1)
  })
