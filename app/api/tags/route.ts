import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
	try {
		const { searchParams } = new URL(request.url)
		const search = searchParams.get('search')
		const limit = parseInt(searchParams.get('limit') || '20')

		const where: any = {}
		if (search) {
			where.name = { contains: search, mode: 'insensitive' }
		}

		const tags = await prisma.tag.findMany({
			where,
			orderBy: { name: 'asc' },
			take: limit,
			select: {
				id: true,
				name: true,
				description: true,
			},
		})

		return new Response(JSON.stringify({ tags }), { status: 200, headers: { 'Content-Type': 'application/json' } })
	} catch (error) {
		console.error('Get tags error:', error)
		return new Response(JSON.stringify({ error: 'Internal server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
