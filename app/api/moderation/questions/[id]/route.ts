import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

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

	// Delete the question and related answers, votes, notifications, etc.
	try {
		await prisma.question.delete({
			where: { id: params.id },
		})
		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		return new Response(JSON.stringify({ error: 'Failed to delete question' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
