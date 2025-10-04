import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Simple test working'
    })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Error in simple test' },
      { status: 500 }
    )
  }
}

