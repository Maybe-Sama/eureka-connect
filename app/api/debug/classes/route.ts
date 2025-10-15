// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server'
import { dbOperations } from '@/lib/database'

export async function GET(request: NextRequest) {
  try {
    // Get all classes with raw data
    const allClasses = await dbOperations.getAllClasses()
    
    // Get classes by student ID 1 (if exists)
    const studentClasses = allClasses.filter((cls: any) => cls.student_id === 1)
    
    return NextResponse.json({
      allClasses,
      studentClasses,
      totalClasses: allClasses.length,
      totalStudentClasses: studentClasses.length
    })
  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json({ error: 'Debug error' }, { status: 500 })
  }
}

