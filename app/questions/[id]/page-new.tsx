'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { RichTextEditor } from '@/components/rich-text-editor'
import { LoadingSpinner } from '@/components/loading-spinner'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { formatDistanceToNow } from 'date-fns'
import { ArrowUp, ArrowDown, Check, MessageCircle } from 'lucide-react'

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
	votes: Array<{ voteType: string; userId: string }>
	answers: Answer[]
	answerCount: number
}

interface Answer {
	id: string
	content: string
	author: {
		id: string
		name: string
		avatarUrl?: string
	}
	createdAt: string
	updatedAt: string
	voteScore: number
	votes: Array<{ voteType: string; userId: string }>
	isAccepted: boolean
}

export default function QuestionDetailPage() {
	const params = useParams()
	const { user } = useAuth()
	const { toast } = useToast()
	const [question, setQuestion] = useState<Question | null>(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState<string | null>(null)
	const [newAnswer, setNewAnswer] = useState('')
	const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false)

	useEffect(() => {
		if (params.id) {
			fetchQuestion()
		}
	}, [params.id])

	const fetchQuestion = async () => {
		try {
			setLoading(true)
			setError(null)

			const response = await fetch(`/api/questions/${params.id}`)
			if (!response.ok) {
				if (response.status === 404) {
					setError('Question not found')
				} else {
					throw new Error('Failed to fetch question')
				}
				return
			}

			const data = await response.json()
			setQuestion(data.question)
		} catch (error) {
			console.error('Error fetching question:', error)
			setError('Failed to load question. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	const handleVote = async (targetType: 'QUESTION' | 'ANSWER', targetId: string, voteType: 'UP' | 'DOWN') => {
		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to vote',
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
					targetType,
					targetId,
					voteType,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to vote')
			}

			// Update the vote score in the state
			if (targetType === 'QUESTION' && question) {
				setQuestion((prev) => (prev ? { ...prev, voteScore: data.voteScore } : null))
			} else if (targetType === 'ANSWER' && question) {
				setQuestion((prev) =>
					prev
						? {
								...prev,
								answers: prev.answers.map((answer) =>
									answer.id === targetId ? { ...answer, voteScore: data.voteScore } : answer
								),
						  }
						: null
				)
			}
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to vote',
				variant: 'destructive',
			})
		}
	}

	const handleAcceptAnswer = async (answerId: string, isAccepted: boolean) => {
		if (!user || !question || question.author.id !== user.id) {
			toast({
				title: 'Permission denied',
				description: 'Only the question author can accept answers',
				variant: 'destructive',
			})
			return
		}

		try {
			const response = await fetch(`/api/answers/${answerId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ isAccepted: !isAccepted }),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to update answer')
			}

			// Update the answer in the state
			setQuestion((prev) =>
				prev
					? {
							...prev,
							answers: prev.answers.map((answer) =>
								answer.id === answerId
									? { ...answer, isAccepted: !isAccepted }
									: answer.id !== answerId && isAccepted
									? answer // If we're accepting an answer, unaccept others is handled by API
									: answer
							),
					  }
					: null
			)

			toast({
				title: 'Success',
				description: !isAccepted ? 'Answer accepted!' : 'Answer unaccepted',
			})
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to update answer',
				variant: 'destructive',
			})
		}
	}

	const handleSubmitAnswer = async () => {
		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to answer',
				variant: 'destructive',
			})
			return
		}

		if (!newAnswer.trim()) {
			toast({
				title: 'Answer required',
				description: 'Please enter an answer',
				variant: 'destructive',
			})
			return
		}

		setIsSubmittingAnswer(true)

		try {
			const response = await fetch('/api/answers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: newAnswer.trim(),
					questionId: params.id,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to submit answer')
			}

			// Add the new answer to the question
			setQuestion((prev) =>
				prev
					? {
							...prev,
							answers: [...prev.answers, data.answer],
							answerCount: prev.answerCount + 1,
					  }
					: null
			)

			setNewAnswer('')
			toast({
				title: 'Success',
				description: 'Your answer has been posted!',
			})
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to submit answer',
				variant: 'destructive',
			})
		} finally {
			setIsSubmittingAnswer(false)
		}
	}

	if (loading) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<LoadingSpinner />
			</div>
		)
	}

	if (error || !question) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<Card className='max-w-2xl mx-auto'>
					<CardContent className='p-8 text-center'>
						<h2 className='text-xl font-semibold mb-2'>{error || 'Question not found'}</h2>
						<p className='text-muted-foreground mb-4'>
							The question you're looking for doesn't exist or has been removed.
						</p>
						<Button onClick={() => window.history.back()}>Go Back</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	const getUserVote = (votes: Array<{ voteType: string; userId: string }>) => {
		if (!user) return null
		return votes.find((vote) => vote.userId === user.id)?.voteType || null
	}

	const questionUserVote = getUserVote(question.votes)

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='max-w-4xl mx-auto space-y-6'>
				{/* Question */}
				<Card>
					<CardHeader>
						<div className='flex items-start justify-between gap-4'>
							<div className='flex-1'>
								<h1 className='text-2xl font-bold mb-3'>{question.title}</h1>
								<div className='flex flex-wrap gap-2 mb-4'>
									{question.tags.map((tag) => (
										<Badge key={tag} variant='secondary'>
											{tag}
										</Badge>
									))}
								</div>
							</div>

							{/* Vote buttons */}
							<div className='flex flex-col items-center gap-1'>
								<Button
									variant={questionUserVote === 'UP' ? 'default' : 'ghost'}
									size='sm'
									onClick={() => handleVote('QUESTION', question.id, 'UP')}
									disabled={!user}
									className='h-8 w-8 p-0'>
									<ArrowUp className='h-4 w-4' />
								</Button>
								<span className='text-lg font-semibold'>{question.voteScore}</span>
								<Button
									variant={questionUserVote === 'DOWN' ? 'default' : 'ghost'}
									size='sm'
									onClick={() => handleVote('QUESTION', question.id, 'DOWN')}
									disabled={!user}
									className='h-8 w-8 p-0'>
									<ArrowDown className='h-4 w-4' />
								</Button>
							</div>
						</div>
					</CardHeader>

					<CardContent>
						<div
							className='prose prose-sm max-w-none mb-6'
							dangerouslySetInnerHTML={{ __html: question.description }}
						/>

						<div className='flex items-center justify-between'>
							<div className='flex items-center gap-2'>
								<Avatar className='h-8 w-8'>
									<AvatarImage src={question.author.avatarUrl} />
									<AvatarFallback>{question.author.name.charAt(0).toUpperCase()}</AvatarFallback>
								</Avatar>
								<div className='text-sm'>
									<span className='font-medium'>{question.author.name}</span>
									<span className='text-muted-foreground ml-2'>
										asked {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
									</span>
								</div>
							</div>

							<div className='flex items-center gap-1 text-sm text-muted-foreground'>
								<MessageCircle className='h-4 w-4' />
								<span>{question.answerCount} answers</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Answers */}
				{question.answers.length > 0 && (
					<div className='space-y-4'>
						<h2 className='text-xl font-semibold'>
							{question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}
						</h2>

						{question.answers.map((answer) => {
							const answerUserVote = getUserVote(answer.votes)

							return (
								<Card key={answer.id} className={answer.isAccepted ? 'border-green-200 bg-green-50' : ''}>
									<CardContent className='p-6'>
										<div className='flex items-start gap-4'>
											{/* Vote buttons */}
											<div className='flex flex-col items-center gap-1'>
												<Button
													variant={answerUserVote === 'UP' ? 'default' : 'ghost'}
													size='sm'
													onClick={() => handleVote('ANSWER', answer.id, 'UP')}
													disabled={!user}
													className='h-8 w-8 p-0'>
													<ArrowUp className='h-4 w-4' />
												</Button>
												<span className='text-lg font-semibold'>{answer.voteScore}</span>
												<Button
													variant={answerUserVote === 'DOWN' ? 'default' : 'ghost'}
													size='sm'
													onClick={() => handleVote('ANSWER', answer.id, 'DOWN')}
													disabled={!user}
													className='h-8 w-8 p-0'>
													<ArrowDown className='h-4 w-4' />
												</Button>

												{/* Accept answer button (only for question author) */}
												{user && question.author.id === user.id && (
													<Button
														variant={answer.isAccepted ? 'default' : 'ghost'}
														size='sm'
														onClick={() => handleAcceptAnswer(answer.id, answer.isAccepted)}
														className='h-8 w-8 p-0 mt-2'
														title={answer.isAccepted ? 'Unaccept answer' : 'Accept answer'}>
														<Check className={`h-4 w-4 ${answer.isAccepted ? 'text-white' : 'text-gray-400'}`} />
													</Button>
												)}

												{answer.isAccepted && <div className='text-xs text-green-600 font-medium mt-1'>Accepted</div>}
											</div>

											{/* Answer content */}
											<div className='flex-1'>
												<div
													className='prose prose-sm max-w-none mb-4'
													dangerouslySetInnerHTML={{ __html: answer.content }}
												/>

												<div className='flex items-center justify-between'>
													<div className='flex items-center gap-2'>
														<Avatar className='h-6 w-6'>
															<AvatarImage src={answer.author.avatarUrl} />
															<AvatarFallback className='text-xs'>
																{answer.author.name.charAt(0).toUpperCase()}
															</AvatarFallback>
														</Avatar>
														<div className='text-sm'>
															<span className='font-medium'>{answer.author.name}</span>
															<span className='text-muted-foreground ml-2'>
																answered {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
															</span>
														</div>
													</div>
												</div>
											</div>
										</div>
									</CardContent>
								</Card>
							)
						})}
					</div>
				)}

				{/* Answer form */}
				{user && (
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>Your Answer</h3>
						</CardHeader>
						<CardContent>
							<div className='space-y-4'>
								<RichTextEditor
									value={newAnswer}
									onChange={setNewAnswer}
									placeholder='Write your answer here...'
									className='min-h-[200px]'
								/>
								<div className='flex justify-end'>
									<Button onClick={handleSubmitAnswer} disabled={isSubmittingAnswer || !newAnswer.trim()}>
										{isSubmittingAnswer ? 'Posting...' : 'Post Your Answer'}
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{!user && (
					<Card>
						<CardContent className='p-6 text-center'>
							<p className='text-muted-foreground mb-4'>You need to be logged in to post an answer.</p>
							<Button asChild>
								<a href='/login'>Log In</a>
							</Button>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
