import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

export const runtime = 'nodejs'

const voteSchema = z.object({
	targetType: z.enum(['QUESTION', 'ANSWER']),
	targetId: z.string(),
	voteType: z.enum(['UP', 'DOWN']),
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
		const { targetType, targetId, voteType } = voteSchema.parse(body)

		// Check if target exists
		if (targetType === 'QUESTION') {
			const question = await prisma.question.findUnique({
				where: { id: targetId },
				select: { id: true, authorId: true, title: true },
			})
			if (!question) {
				return new Response(JSON.stringify({ error: 'Question not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				})
			}

			// Users can't vote on their own questions
			if (question.authorId === user.id) {
				return new Response(JSON.stringify({ error: 'You cannot vote on your own question' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				})
			}
		} else {
			const answer = await prisma.answer.findUnique({
				where: { id: targetId },
				select: { id: true, authorId: true },
			})
			if (!answer) {
				return new Response(JSON.stringify({ error: 'Answer not found' }), {
					status: 404,
					headers: { 'Content-Type': 'application/json' },
				})
			}

			// Users can't vote on their own answers
			if (answer.authorId === user.id) {
				return new Response(JSON.stringify({ error: 'You cannot vote on your own answer' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				})
			}
		}

		// Check for existing vote
		const existingVote = await prisma.vote.findUnique({
			where: {
				userId_targetType_targetId: {
					userId: user.id,
					targetType,
					targetId,
				},
			},
		})

		let vote
		if (existingVote) {
			if (existingVote.voteType === voteType) {
				// Same vote - remove it
				await prisma.vote.delete({
					where: { id: existingVote.id },
				})
				vote = null
			} else {
				// Different vote - update it
				vote = await prisma.vote.update({
					where: { id: existingVote.id },
					data: { voteType },
				})
			}
		} else {
			// New vote - create it
			vote = await prisma.vote.create({
				data: {
					userId: user.id,
					targetType,
					targetId,
					voteType,
				},
			})
		}

		// Get updated vote count
		const votes = await prisma.vote.findMany({
			where: { targetType, targetId },
			select: { voteType: true },
		})

		const voteScore = votes.reduce((score, v) => {
			return score + (v.voteType === 'UP' ? 1 : -1)
		}, 0)

		return new Response(
			JSON.stringify({
				success: true,
				voteScore,
				userVote: vote?.voteType || null,
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		if (error instanceof z.ZodError) {
			return new Response(JSON.stringify({ error: 'Invalid input', details: error.errors }), {
				status: 400,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		console.error('Vote error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
