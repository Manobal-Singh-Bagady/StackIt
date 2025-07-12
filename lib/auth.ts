import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { NextRequest } from 'next/server'
import { prisma } from './db'
import { User } from '@prisma/client'

if (!process.env.JWT_SECRET) {
	throw new Error('JWT_SECRET environment variable is not set')
}

const JWT_SECRET = process.env.JWT_SECRET

export type JWTPayload = {
	userId: string
	email: string
	role: string
}

export async function hashPassword(password: string) {
	return bcrypt.hash(password, 12)
}

export async function comparePassword(password: string, hashedPassword: string) {
	return bcrypt.compare(password, hashedPassword)
}

export function generateToken(payload: JWTPayload) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' })
}

export function verifyToken(token: string) {
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
	} catch (error) {
		console.error('Error getting current user:', error)
		return null
	}
}

export function createAuthResponse(user: User, token: string) {
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
