'use client'

import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Pagination } from '@/components/pagination'
import { LoadingSpinner } from '@/components/loading-spinner'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUp, ArrowDown, MessageCircle, Check } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface Question {
	id: string
	title: string
	description: string
	tags: string[]
	author: {
		id: string
		name: string
		avatarUrl?: string
	}
	createdAt: string
	voteScore: number
	answerCount: number
	hasAcceptedAnswer: boolean
	userVote?: 'UP' | 'DOWN' | null
}

interface QuestionListProps {}

export function QuestionList({}: QuestionListProps) {
	const [questions, setQuestions] = useState<Question[]>([])
	const [loading, setLoading] = useState(true)
	const [totalPages, setTotalPages] = useState(1)
	const [error, setError] = useState<string | null>(null)
	const { user } = useAuth()
	const searchParams = useSearchParams()
	const router = useRouter()
	const { toast } = useToast()

	// Convert searchParams to an object for easier use
	const searchParamsObj = {
		search: searchParams.get('search') || undefined,
		tags: searchParams.get('tags') || undefined,
		sort: searchParams.get('sort') || undefined,
		page: searchParams.get('page') || undefined,
	}

	useEffect(() => {
		fetchQuestions()
	}, [searchParams]) // Now listening to searchParams changes directly

	const fetchQuestions = async () => {
		try {
			setLoading(true)
			setError(null)

			const params = new URLSearchParams()
			if (searchParamsObj.search) params.set('search', searchParamsObj.search)
			if (searchParamsObj.tags) params.set('tags', searchParamsObj.tags)
			if (searchParamsObj.sort) params.set('sort', searchParamsObj.sort)
			if (searchParamsObj.page) params.set('page', searchParamsObj.page)

			const response = await fetch(`/api/questions?${params.toString()}`)
			if (!response.ok) {
				throw new Error('Failed to fetch questions')
			}

			const data = await response.json()
			setQuestions(data.questions)
			setTotalPages(data.pagination.totalPages)
		} catch (error) {
			console.error('Error fetching questions:', error)
			setError('Failed to load questions. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const handleVote = async (questionId: string, voteType: 'UP' | 'DOWN') => {
		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to vote on questions.',
				variant: 'destructive',
			})
			return
		}

		try {
			const response = await fetch('/api/votes', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					targetType: 'QUESTION',
					targetId: questionId,
					voteType,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				// Handle specific error messages from API
				throw new Error(data.error || 'Failed to vote')
			}

			// Update the question's vote score and user vote
			setQuestions((prev) =>
				prev.map((q) =>
					q.id === questionId
						? {
								...q,
								voteScore: data.voteScore,
								userVote: data.userVote,
						  }
						: q
				)
			)

			// Show success toast
			toast({
				title: 'Vote recorded',
				description: `Your ${voteType.toLowerCase()} vote has been recorded.`,
			})
		} catch (error) {
			console.error('Error voting:', error)
			toast({
				title: 'Voting failed',
				description: error instanceof Error ? error.message : 'Failed to record your vote. Please try again.',
				variant: 'destructive',
			})
		}
	}

	const handleSort = (sortType: string) => {
		const params = new URLSearchParams(searchParams)
		params.set('sort', sortType)
		params.delete('page') // Reset to first page when sorting
		router.push(`/?${params.toString()}`)
	}

	if (loading) {
		return <LoadingSpinner />
	}

	if (error) {
		return (
			<div className='text-center py-8'>
				<p className='text-muted-foreground mb-4'>{error}</p>
				<Button onClick={fetchQuestions} variant='outline'>
					Try Again
				</Button>
			</div>
		)
	}

	if (questions.length === 0) {
		return (
			<div className='text-center py-12'>
				<h3 className='text-lg font-semibold mb-2'>No questions found</h3>
				<p className='text-muted-foreground mb-4'>Be the first to ask a question in this community!</p>
				<Button asChild>
					<Link href='/ask'>Ask a Question</Link>
				</Button>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-4'>
				<h2 className='text-xl font-semibold'>
					{questions.length} Question{questions.length !== 1 ? 's' : ''}
				</h2>
				<div className='flex flex-wrap items-center gap-2'>
					<Button
						variant={searchParamsObj.sort === 'newest' ? 'default' : 'outline'}
						size='sm'
						onClick={() => handleSort('newest')}>
						Newest
					</Button>
					<Button
						variant={searchParamsObj.sort === 'popular' ? 'default' : 'outline'}
						size='sm'
						onClick={() => handleSort('popular')}>
						Most Voted
					</Button>
					<Button
						variant={searchParamsObj.sort === 'unanswered' ? 'default' : 'outline'}
						size='sm'
						onClick={() => handleSort('unanswered')}>
						Unanswered
					</Button>
				</div>
			</div>

			<div className='space-y-4'>
				{questions.map((question) => (
					<Card key={question.id} className='hover:shadow-md transition-shadow'>
						<CardHeader className='pb-3'>
							<div className='flex flex-col lg:flex-row lg:items-start gap-4'>
								<div className='flex-1 min-w-0'>
									<Link
										href={`/questions/${question.id}`}
										className='text-lg font-semibold hover:text-primary transition-colors block'>
										{question.title}
									</Link>
									<div
										className='text-muted-foreground mt-2 line-clamp-2 prose prose-sm max-w-none [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300'
										dangerouslySetInnerHTML={{ __html: question.description }}
									/>
								</div>

								{/* Stats - horizontal on mobile, vertical on desktop */}
								<div className='flex lg:flex-col items-center gap-4 lg:gap-2 flex-shrink-0'>
									<div className='flex lg:flex-col items-center gap-1'>
										<Button
											variant='ghost'
											size='sm'
											className={`h-8 w-8 p-0 ${
												question.userVote === 'UP'
													? 'text-green-600 bg-green-50 hover:bg-green-100'
													: 'hover:text-green-600'
											}`}
											onClick={() => handleVote(question.id, 'UP')}
											disabled={!user}>
											<ArrowUp className='w-4 h-4' />
										</Button>
										<span className='text-sm font-medium'>{question.voteScore}</span>
										<Button
											variant='ghost'
											size='sm'
											className={`h-8 w-8 p-0 ${
												question.userVote === 'DOWN' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'hover:text-red-600'
											}`}
											onClick={() => handleVote(question.id, 'DOWN')}
											disabled={!user}>
											<ArrowDown className='w-4 h-4' />
										</Button>
									</div>
									<div className='flex lg:flex-col items-center gap-1'>
										<div className='flex items-center space-x-1'>
											<MessageCircle className='w-4 h-4' />
											<span className='text-sm'>{question.answerCount}</span>
										</div>
										{question.hasAcceptedAnswer && <Check className='w-4 h-4 text-green-500' />}
									</div>
								</div>
							</div>
						</CardHeader>
						<CardContent className='pt-0'>
							<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
								<div className='flex flex-wrap gap-2'>
									{question.tags.map((tag) => (
										<Badge key={tag} variant='secondary' className='text-xs'>
											{tag}
										</Badge>
									))}
								</div>
								<div className='flex items-center space-x-2 text-sm text-muted-foreground flex-shrink-0'>
									<Avatar className='w-6 h-6'>
										<AvatarImage src={question.author.avatarUrl || '/placeholder.svg'} alt={question.author.name} />
										<AvatarFallback className='text-xs'>{question.author.name.charAt(0).toUpperCase()}</AvatarFallback>
									</Avatar>
									<span className='truncate'>{question.author.name}</span>
									<span className='hidden sm:inline'>•</span>
									<span className='hidden sm:inline'>
										{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
									</span>
									{/* Admin delete button */}
									{user?.role === 'ADMIN' && (
										<Button
											variant='destructive'
											size='sm'
											onClick={async () => {
												if (confirm('Are you sure you want to delete this question?')) {
													try {
														const res = await fetch(`/api/moderation/questions/${question.id}`, { method: 'DELETE' })
														if (!res.ok) throw new Error('Failed to delete question')
														setQuestions((prev) => prev.filter((q) => q.id !== question.id))
														toast({ title: 'Question deleted' })
													} catch (err) {
														toast({ title: 'Delete failed', variant: 'destructive' })
													}
												}
											}}>
											Delete
										</Button>
									)}
								</div>
							</div>
						</CardContent>
					</Card>
				))}
			</div>

			{totalPages > 1 && (
				<Pagination currentPage={Number.parseInt(searchParamsObj.page || '1')} totalPages={totalPages} />
			)}
		</div>
	)
}
