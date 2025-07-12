import { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  const response = new Response(
    JSON.stringify({ success: true, message: 'Logged out successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  )
  
  // Clear the auth cookie
  response.headers.set(
    'Set-Cookie',
    'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict'
  )
  
  return response
}
