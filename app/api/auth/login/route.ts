import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { comparePassword, generateToken, createAuthResponse } from '@/lib/auth'

export const runtime = 'nodejs'

const loginSchema = z.object({
	email: z.string().email('Invalid email address'),
	password: z.string().min(1, 'Password is required'),
})

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const { email, password } = loginSchema.parse(body)

		// Find user by email
		const user = await prisma.user.findUnique({
			where: { email },
		})

		if (!user) {
			return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Verify password
		const isPasswordValid = await comparePassword(password, user.password)
		if (!isPasswordValid) {
			return new Response(JSON.stringify({ error: 'Invalid email or password' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Generate token
		const token = generateToken({
			userId: user.id,
			email: user.email,
			role: user.role,
		})

		return createAuthResponse(user, token)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		console.error('Login error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
