import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createAnswerSchema = z.object({
	content: z.string().min(20, 'Answer must be at least 20 characters'),
	questionId: z.string(),
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
		const { content, questionId } = createAnswerSchema.parse(body)

		// Verify question exists
		const question = await prisma.question.findUnique({
			where: { id: questionId },
			select: { id: true, authorId: true, title: true },
		})

		if (!question) {
			return new Response(JSON.stringify({ error: 'Question not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Create the answer
		const answer = await prisma.answer.create({
			data: {
				content,
				questionId,
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

		// Create notification for question author (if not self)
		if (question.authorId !== user.id) {
			await prisma.notification.create({
				data: {
					userId: question.authorId,
					type: 'ANSWER',
					title: 'New answer to your question',
					message: `${user.name} answered your question "${question.title}"`,
					relatedQuestionId: questionId,
					relatedUserId: user.id,
				},
			})
		}

		return new Response(
			JSON.stringify({
				success: true,
				answer: {
					id: answer.id,
					content: answer.content,
					author: answer.author,
					isAccepted: answer.isAccepted,
					createdAt: answer.createdAt,
					voteScore: 0,
					votes: [],
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

		console.error('Create answer error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
