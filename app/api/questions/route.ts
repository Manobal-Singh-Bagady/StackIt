import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'

const createQuestionSchema = z.object({
	title: z.string().min(10, 'Title must be at least 10 characters'),
	description: z.string().min(20, 'Description must be at least 20 characters'),
	tags: z.array(z.string()).min(1, 'At least one tag is required').max(5, 'Maximum 5 tags allowed'),
})

const querySchema = z.object({
	search: z.string().optional(),
	tags: z.string().optional(),
	sort: z.enum(['newest', 'oldest', 'popular']).optional().default('newest'),
	page: z.string().optional().default('1'),
	limit: z.string().optional().default('10'),
})

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const query = querySchema.parse({
			search: searchParams.get('search') || undefined,
			tags: searchParams.get('tags') || undefined,
			sort: searchParams.get('sort') || 'newest',
			page: searchParams.get('page') || '1',
			limit: searchParams.get('limit') || '10',
		})

		const page = parseInt(query.page)
		const limit = parseInt(query.limit)
		const skip = (page - 1) * limit

		// Build filter conditions
		const where: any = {}

		if (query.search) {
			where.OR = [
				{ title: { contains: query.search, mode: 'insensitive' } },
				{ description: { contains: query.search, mode: 'insensitive' } },
			]
		}

		if (query.tags) {
			const tagArray = query.tags.split(',').map((tag) => tag.trim())
			where.tagNames = { hasSome: tagArray }
		}

		// Build sort conditions
		let orderBy: any = { createdAt: 'desc' }
		if (query.sort === 'oldest') {
			orderBy = { createdAt: 'asc' }
		} else if (query.sort === 'popular') {
			// For now, sort by number of answers. Later we can add vote count
			orderBy = { answers: { _count: 'desc' } }
		}

		const [questions, total] = await Promise.all([
			prisma.question.findMany({
				where,
				orderBy,
				skip,
				take: limit,
				include: {
					author: {
						select: {
							id: true,
							name: true,
							avatarUrl: true,
						},
					},
					answers: {
						select: {
							id: true,
							isAccepted: true,
						},
					},
					votes: {
						select: {
							voteType: true,
						},
					},
					_count: {
						select: {
							answers: true,
							votes: true,
						},
					},
				},
			}),
			prisma.question.count({ where }),
		])

		// Calculate vote scores and format response
		const formattedQuestions = questions.map((question) => ({
			id: question.id,
			title: question.title,
			description: question.description,
			tags: question.tagNames,
			author: question.author,
			createdAt: question.createdAt,
			updatedAt: question.updatedAt,
			answerCount: question._count.answers,
			voteScore: question.votes.reduce((score, vote) => {
				return score + (vote.voteType === 'UP' ? 1 : -1)
			}, 0),
			hasAcceptedAnswer: question.answers.some((answer) => answer.isAccepted),
		}))

		return new Response(
			JSON.stringify({
				questions: formattedQuestions,
				pagination: {
					total,
					page,
					limit,
					totalPages: Math.ceil(total / limit),
				},
			}),
			{ status: 200, headers: { 'Content-Type': 'application/json' } }
		)
	} catch (error) {
		console.error('Get questions error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}

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
		const { title, description, tags } = createQuestionSchema.parse(body)

		// Ensure tags exist in the database
		const existingTags = await prisma.tag.findMany({
			where: { name: { in: tags } },
		})

		const existingTagNames = existingTags.map((tag) => tag.name)
		const newTagNames = tags.filter((tag) => !existingTagNames.includes(tag))

		// Create new tags
		if (newTagNames.length > 0) {
			for (const name of newTagNames) {
				await prisma.tag.upsert({
					where: { name },
					update: {},
					create: { name },
				})
			}
		}

		// Create the question
		const question = await prisma.question.create({
			data: {
				title,
				description,
				authorId: user.id,
				tagNames: tags,
			},
			include: {
				author: {
					select: {
						id: true,
						name: true,
						avatarUrl: true,
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

		return new Response(
			JSON.stringify({
				success: true,
				question: {
					id: question.id,
					title: question.title,
					description: question.description,
					tags: question.tagNames,
					author: question.author,
					createdAt: question.createdAt,
					answerCount: question._count.answers,
					voteScore: 0,
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

		console.error('Create question error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
