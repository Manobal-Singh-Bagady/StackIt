import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser(request)

		if (!user) {
			return new Response(JSON.stringify({ error: 'Not authenticated' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		return new Response(JSON.stringify({ user }), { status: 200, headers: { 'Content-Type': 'application/json' } })
	} catch (error) {
		console.error('Me endpoint error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
