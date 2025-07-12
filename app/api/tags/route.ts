import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const search = searchParams.get('search')
		const limit = parseInt(searchParams.get('limit') || '20')

		// Get tags from the Tag model
		const where: any = {}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' }
		}

		const explicitTags = await prisma.tag.findMany({
			where,
			orderBy: { name: 'asc' },
			take: limit,
			select: {
				id: true,
				name: true,
				description: true,
			},
		})

		// Also get popular tags from questions (since you store tagNames directly)
		const questions = await prisma.question.findMany({
			select: {
				tagNames: true,
			},
		})

		// Count tag usage frequency
		const tagCounts: { [key: string]: number } = {}
		questions.forEach((question) => {
			question.tagNames.forEach((tagName) => {
				if (!search || tagName.toLowerCase().includes(search.toLowerCase())) {
					tagCounts[tagName] = (tagCounts[tagName] || 0) + 1
				}
			})
		})

		// Convert to array and sort by usage count
		const popularTags = Object.entries(tagCounts)
			.sort(([, a], [, b]) => b - a)
			.slice(0, limit)
			.map(([name, count]) => ({ id: name, name, description: `Used ${count} times`, count }))

		// Combine explicit tags and popular tags, avoiding duplicates
		const allTags = [...explicitTags, ...popularTags.filter((pt) => !explicitTags.some((et) => et.name === pt.name))]

		return new Response(JSON.stringify({ tags: allTags }), {
			status: 200,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error('Get tags error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
