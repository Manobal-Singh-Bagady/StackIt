import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { prisma } from './db'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production'

export interface JWTPayload {
	userId: string
	email: string
	role: string
}

export async function hashPassword(password: string): Promise<string> {
	return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
	return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload): string {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string): JWTPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JWTPayload
	} catch {
		return null
	}
}

export async function getCurrentUser(request: NextRequest) {
	try {
		const token =
			request.cookies.get('auth-token')?.value || request.headers.get('authorization')?.replace('Bearer ', '')

		if (!token) return null

		const payload = verifyToken(token)
		if (!payload) return null

		const user = await prisma.user.findUnique({
			where: { id: payload.userId },
			select: {
				id: true,
				name: true,
				email: true,
				role: true,
				avatarUrl: true,
				createdAt: true,
			},
		})

		return user
	} catch {
		return null
	}
}

export function createAuthResponse(user: any, token: string) {
	const response = new Response(
		JSON.stringify({
			success: true,
			user: {
				id: user.id,
				name: user.name,
				email: user.email,
				role: user.role,
				avatarUrl: user.avatarUrl,
			},
			token,
		}),
		{
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		}
	)

	// Set HTTP-only cookie
	response.headers.set(
		'Set-Cookie',
		`auth-token=${token}; HttpOnly; Path=/; Max-Age=${7 * 24 * 60 * 60}; SameSite=Strict`
	)

	return response
}
