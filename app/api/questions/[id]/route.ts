import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
	try {
		const question = await prisma.question.findUnique({
			where: { id: params.id },
			include: {
				author: {
					select: {
						id: true,
						name: true,
						avatarUrl: true,
					},
				},
				answers: {
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
						_count: {
							select: {
								votes: true,
							},
						},
					},
					orderBy: [
						{ isAccepted: 'desc' }, // Accepted answers first
						{ createdAt: 'asc' }, // Then by creation time
					],
				},
				votes: {
					select: {
						voteType: true,
						userId: true,
					},
				},
				_count: {
					select: {
						answers: true,
						votes: true,
					},
				},
			},
		})

		if (!question) {
			return new Response(JSON.stringify({ error: 'Question not found' }), {
				status: 404,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Calculate vote scores
		const questionVoteScore = question.votes.reduce((score, vote) => {
			return score + (vote.voteType === 'UP' ? 1 : -1)
		}, 0)

		const formattedAnswers = question.answers.map((answer) => ({
			id: answer.id,
			content: answer.content,
			author: answer.author,
			isAccepted: answer.isAccepted,
			createdAt: answer.createdAt,
			updatedAt: answer.updatedAt,
			voteScore: answer.votes.reduce((score, vote) => {
				return score + (vote.voteType === 'UP' ? 1 : -1)
			}, 0),
			votes: answer.votes,
		}))

		const formattedQuestion = {
			id: question.id,
			title: question.title,
			description: question.description,
			tags: question.tagNames,
			author: question.author,
			createdAt: question.createdAt,
			updatedAt: question.updatedAt,
			voteScore: questionVoteScore,
			votes: question.votes,
			answers: formattedAnswers,
			answerCount: question._count.answers,
		}

		return new Response(JSON.stringify({ question: formattedQuestion }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('Get question error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
