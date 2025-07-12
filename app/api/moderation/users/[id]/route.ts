import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
	const user = await getCurrentUser(request)
	if (!user) {
		return new Response(JSON.stringify({ error: 'Authentication required' }), {
			status: 401,
			headers: { 'Content-Type': 'application/json' },
		})
	}
	if (user.role !== 'ADMIN') {
		return new Response(JSON.stringify({ error: 'Admin access required' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	// Prevent admin from deleting themselves
	if (user.id === params.id) {
		return new Response(JSON.stringify({ error: 'Admins cannot delete themselves' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	try {
		await prisma.user.delete({
			where: { id: params.id },
		})
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to delete user' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
