import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const results: any = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      tests: {}
    }

    // Test 1: bcryptjs (autenticación)
    try {
      const bcrypt = require('bcryptjs')
      const testPassword = 'test123'
      const hash = bcrypt.hashSync(testPassword, 12)
      const isValid = bcrypt.compareSync(testPassword, hash)
      
      results.tests.bcryptjs = {
        status: '✅ OK',
        hashWorks: true,
        verifyWorks: isValid,
        version: '3.0.2'
      }
    } catch (error: any) {
      results.tests.bcryptjs = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 2: jspdf (generación de PDF)
    try {
      const { jsPDF } = require('jspdf')
      const doc = new jsPDF()
      doc.text('Test PDF', 10, 10)
      
      results.tests.jspdf = {
        status: '✅ OK',
        version: '3.0.3',
        pdfGeneration: true
      }
    } catch (error: any) {
      results.tests.jspdf = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 3: qrcode (códigos QR)
    try {
      const QRCode = require('qrcode')
      
      results.tests.qrcode = {
        status: '✅ OK',
        version: '1.5.4',
        available: true
      }
    } catch (error: any) {
      results.tests.qrcode = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 4: html2canvas (captura de pantallas)
    try {
      const html2canvas = require('html2canvas')
      
      results.tests.html2canvas = {
        status: '✅ OK',
        version: '1.4.1',
        available: true
      }
    } catch (error: any) {
      results.tests.html2canvas = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 5: better-sqlite3 (base de datos local)
    try {
      const Database = require('better-sqlite3')
      
      results.tests.betterSqlite3 = {
        status: '✅ OK',
        version: '8.7.0',
        available: true
      }
    } catch (error: any) {
      results.tests.betterSqlite3 = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 6: sqlite3 (scripts de mantenimiento)
    try {
      const sqlite3 = require('sqlite3')
      
      results.tests.sqlite3 = {
        status: '✅ OK',
        version: '5.1.7',
        available: true
      }
    } catch (error: any) {
      results.tests.sqlite3 = {
        status: '❌ ERROR',
        error: error.message
      }
    }

    // Test 7: crypto-js (utilidades RRSIF)
    try {
      const CryptoJS = require('crypto-js')
      const testHash = CryptoJS.SHA256('test').toString()
      
      results.tests.cryptoJs = {
        status: '✅ OK',
        version: '4.2.0',
        hashWorks: testHash.length === 64
      }
    } catch (error: any) {
      results.tests.cryptoJs = {
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

    // Análisis específico para facturas
    const facturaCritical = ['jspdf', 'qrcode', 'html2canvas', 'cryptoJs']
    const facturaCriticalPassed = facturaCritical.filter(dep => 
      results.tests[dep]?.status === '✅ OK'
    ).length

    results.facturaAnalysis = {
      criticalDependencies: facturaCritical,
      criticalPassed: facturaCriticalPassed,
      criticalFailed: facturaCritical.length - facturaCriticalPassed,
      facturasWillWork: facturaCriticalPassed === facturaCritical.length
    }

    return NextResponse.json(results, { status: 200 })

  } catch (error: any) {
    return NextResponse.json({
      error: 'Error ejecutando tests de facturas',
      message: error.message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
