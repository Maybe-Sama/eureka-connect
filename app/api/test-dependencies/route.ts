import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {}
    }

    // Test 1: bcryptjs
    try {
      const bcrypt = require('bcryptjs')
      const testPassword = 'test123'
      const hash = bcrypt.hashSync(testPassword, 12)
      const isValid = bcrypt.compareSync(testPassword, hash)
      
      results.tests.bcryptjs = {
        status: '✅ OK',
        hashWorks: true,
        verifyWorks: isValid,
        version: '3.0.2' // Versión fija para evitar error de package.json
      }
    } catch (error: any) {
      results.tests.bcryptjs = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 2: jspdf
    try {
      const { jsPDF } = require('jspdf')
      const doc = new jsPDF()
      doc.text('Test PDF', 10, 10)
      
      results.tests.jspdf = {
        status: '✅ OK',
        version: require('jspdf/package.json').version,
        pdfGeneration: true
      }
    } catch (error: any) {
      results.tests.jspdf = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 3: qrcode
    try {
      const QRCode = require('qrcode')
      
      results.tests.qrcode = {
        status: '✅ OK',
        version: require('qrcode/package.json').version,
        available: true
      }
    } catch (error: any) {
      results.tests.qrcode = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 4: html2canvas
    try {
      const html2canvas = require('html2canvas')
      
      results.tests.html2canvas = {
        status: '✅ OK',
        version: require('html2canvas/package.json').version,
        available: true
      }
    } catch (error: any) {
      results.tests.html2canvas = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Resumen
    const allTests = Object.values(results.tests)
    const successCount = allTests.filter((test: any) => test.status === '✅ OK').length
    const totalTests = allTests.length
    
    results.summary = {
      total: totalTests,
      passed: successCount,
      failed: totalTests - successCount,
      successRate: `${Math.round((successCount / totalTests) * 100)}%`
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error ejecutando tests',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
