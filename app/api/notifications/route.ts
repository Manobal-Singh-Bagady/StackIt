import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
	try {
		const user = await getCurrentUser(request)
		if (!user) {
			return new Response(JSON.stringify({ error: 'Authentication required' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const { searchParams } = new URL(request.url)
		const limit = parseInt(searchParams.get('limit') || '10')
		const unreadOnly = searchParams.get('unreadOnly') === 'true'

		const where: any = { userId: user.id }
		if (unreadOnly) {
			where.isRead = false
		}

		const notifications = await prisma.notification.findMany({
			where,
			orderBy: { createdAt: 'desc' },
			take: limit,
			include: {
				relatedQuestion: {
					select: {
						id: true,
						title: true,
					},
				},
			},
		})

		const unreadCount = await prisma.notification.count({
			where: { userId: user.id, isRead: false },
		})

		return new Response(
			JSON.stringify({
				notifications,
				unreadCount,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		console.error('Get notifications error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}

export async function PATCH(request: NextRequest) {
	try {
		const user = await getCurrentUser(request)
		if (!user) {
			return new Response(JSON.stringify({ error: 'Authentication required' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const body = await request.json()
		const { markAllAsRead, notificationIds } = body

		if (markAllAsRead) {
			// Mark all notifications as read
			await prisma.notification.updateMany({
				where: { userId: user.id, isRead: false },
				data: { isRead: true },
			})
		} else if (notificationIds && Array.isArray(notificationIds)) {
			// Mark specific notifications as read
			await prisma.notification.updateMany({
				where: {
					id: { in: notificationIds },
					userId: user.id,
				},
				data: { isRead: true },
			})
		}

		return new Response(JSON.stringify({ success: true }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('Update notifications error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
