import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

const createCommentSchema = z.object({
	content: z.string().min(10, 'Comment must be at least 10 characters'),
	answerId: z.string(),
})

export async function POST(request: NextRequest) {
	try {
		const user = await getCurrentUser(request)
		if (!user) {
			return new Response(JSON.stringify({ error: 'Authentication required' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const body = await request.json()
		const { content, answerId } = createCommentSchema.parse(body)

		// Verify answer exists
		const answer = await prisma.answer.findUnique({
			where: { id: answerId },
			include: {
				author: {
					select: { id: true, name: true },
				},
				question: {
					select: { id: true, title: true },
				},
			},
		})

		if (!answer) {
			return new Response(JSON.stringify({ error: 'Answer not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Create the comment
		const comment = await prisma.comment.create({
			data: {
				content,
				answerId,
				authorId: user.id,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						avatarUrl: true,
					},
				},
			},
		})

		// Create notification for answer author (if not self)
		if (answer.author.id !== user.id) {
			await prisma.notification.create({
				data: {
					userId: answer.author.id,
					type: 'COMMENT',
					title: 'New comment on your answer',
					message: `${user.name} commented on your answer to "${answer.question.title}"`,
					relatedQuestionId: answer.question.id,
					relatedUserId: user.id,
				},
			})
		}

		return new Response(
			JSON.stringify({
				success: true,
				comment: {
					id: comment.id,
					content: comment.content,
					author: comment.author,
					createdAt: comment.createdAt,
					updatedAt: comment.updatedAt,
				},
			}),
			{ status: 201, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		console.error('Create comment error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
