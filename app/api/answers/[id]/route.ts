import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const user = await getCurrentUser(request)
		if (!user) {
			return new Response(JSON.stringify({ error: 'Authentication required' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		const body = await request.json()
		const { isAccepted } = body

		// Get the answer and check permissions
		const answer = await prisma.answer.findUnique({
			where: { id: params.id },
			include: {
				question: {
					select: {
						id: true,
						authorId: true,
						title: true,
					},
				},
				author: {
					select: {
						id: true,
						name: true,
					},
				},
			},
		})

		if (!answer) {
			return new Response(JSON.stringify({ error: 'Answer not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Only question author can accept/unaccept answers
		if (answer.question.authorId !== user.id) {
			return new Response(JSON.stringify({ error: 'Only the question author can accept answers' }), {
				status: 403,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// If accepting this answer, unaccept all other answers for this question
		if (isAccepted) {
			await prisma.answer.updateMany({
				where: {
					questionId: answer.question.id,
					isAccepted: true,
				},
				data: { isAccepted: false },
			})
		}

		// Update the answer
		const updatedAnswer = await prisma.answer.update({
			where: { id: params.id },
			data: { isAccepted },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						avatarUrl: true,
					},
				},
				votes: {
					select: {
						voteType: true,
						userId: true,
					},
				},
			},
		})

		// Create notification for answer author (if accepting and not self)
		if (isAccepted && answer.author.id !== user.id) {
			await prisma.notification.create({
				data: {
					userId: answer.author.id,
					type: 'ACCEPTED',
					title: 'Your answer was accepted!',
					message: `Your answer to "${answer.question.title}" was accepted by ${user.name}`,
					relatedQuestionId: answer.question.id,
					relatedUserId: user.id,
				},
			})
		}

		return new Response(
			JSON.stringify({
				success: true,
				answer: {
					id: updatedAnswer.id,
					content: updatedAnswer.content,
					author: updatedAnswer.author,
					isAccepted: updatedAnswer.isAccepted,
					createdAt: updatedAnswer.createdAt,
					updatedAt: updatedAnswer.updatedAt,
					voteScore: updatedAnswer.votes.reduce((score, vote) => {
						return score + (vote.voteType === 'UP' ? 1 : -1)
					}, 0),
					votes: updatedAnswer.votes,
				},
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		console.error('Update answer error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
