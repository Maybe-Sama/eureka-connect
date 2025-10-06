'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

export default function DebugPage() {
  const { user, loading } = useAuth()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen p-8 bg-gray-100">
      <h1 className="text-2xl font-bold mb-4">Debug AuthContext</h1>
      
      <div className="bg-white p-4 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-2">Estado del AuthContext:</h2>
        <ul className="space-y-2">
          <li><strong>Loading:</strong> {loading ? 'true' : 'false'}</li>
          <li><strong>User:</strong> {user ? JSON.stringify(user, null, 2) : 'null'}</li>
          <li><strong>Mounted:</strong> {mounted ? 'true' : 'false'}</li>
        </ul>
      </div>

      <div className="mt-4">
        <a href="/login" className="text-blue-600 hover:underline">
          Ir a Login
        </a>
      </div>
    </div>
  )
}
