'use client'

import type React from 'react'

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
import { ArrowUp, ArrowDown, Check, Flag } from 'lucide-react'

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
	updatedAt: string
	voteScore: number
	votes: Array<{ voteType: 'UP' | 'DOWN'; userId: string }>
	answers: Answer[]
	answerCount: number
	userVote?: 'UP' | 'DOWN' | null
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
	votes: Array<{ voteType: 'UP' | 'DOWN'; userId: string }>
	isAccepted: boolean
	userVote?: 'UP' | 'DOWN' | null
	comments: Comment[]
	commentCount: number
}

interface Comment {
	id: string
	content: string
	author: {
		id: string
		name: string
		avatarUrl?: string
	}
	createdAt: string
	updatedAt: string
}

export default function QuestionDetailPage() {
	const params = useParams()
	const { user } = useAuth()
	const { toast } = useToast()
	const [question, setQuestion] = useState<Question | null>(null)
	const [newAnswer, setNewAnswer] = useState('')
	const [loading, setLoading] = useState(true)
	const [submitting, setSubmitting] = useState(false)
	const [newComments, setNewComments] = useState<Record<string, string>>({})
	const [submittingComments, setSubmittingComments] = useState<Record<string, boolean>>({})
	const [showComments, setShowComments] = useState<Record<string, boolean>>({})

	// Helper function to get user's vote for a target
	const getUserVote = (
		votes: Array<{ voteType: 'UP' | 'DOWN'; userId: string }>,
		userId?: string
	): 'UP' | 'DOWN' | null => {
		if (!userId) return null
		const userVote = votes.find((vote) => vote.userId === userId)
		return userVote ? userVote.voteType : null
	}

	useEffect(() => {
		const fetchQuestion = async () => {
			try {
				setLoading(true)
				const response = await fetch(`/api/questions/${params.id}`)
				const data = await response.json()

				if (!response.ok) {
					throw new Error(data.error || 'Failed to fetch question')
				}

				// Add user vote information to question and answers
				const questionWithUserVotes = {
					...data.question,
					userVote: getUserVote(data.question.votes, user?.id),
					answers: data.question.answers.map((answer: Answer) => ({
						...answer,
						userVote: getUserVote(answer.votes, user?.id),
					})),
				}

				setQuestion(questionWithUserVotes)
			} catch (error) {
				console.error('Error fetching question:', error)
				toast({
					title: 'Error',
					description: 'Failed to load question. Please try again.',
					variant: 'destructive',
				})
			} finally {
				setLoading(false)
			}
		}

		if (params.id) {
			fetchQuestion()
		}
	}, [params.id, toast, user?.id])

	const handleVote = async (type: 'up' | 'down', targetType: 'question' | 'answer', targetId?: string) => {
		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to vote.',
				variant: 'destructive',
			})
			return
		}

		const voteType = type.toUpperCase() as 'UP' | 'DOWN'
		const apiTargetType = targetType.toUpperCase() as 'QUESTION' | 'ANSWER'
		const actualTargetId = targetType === 'question' ? question?.id : targetId

		if (!actualTargetId) {
			toast({
				title: 'Error',
				description: 'Unable to vote on this item.',
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
					targetType: apiTargetType,
					targetId: actualTargetId,
					voteType,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to vote')
			}

			// Update the vote score and user vote in the UI
			if (targetType === 'question') {
				setQuestion((prev) => {
					if (!prev) return prev
					return {
						...prev,
						voteScore: data.voteScore,
						userVote: data.userVote,
					}
				})
			} else {
				// Update answer vote score and user vote
				setQuestion((prev) => {
					if (!prev) return prev
					return {
						...prev,
						answers: prev.answers.map((answer) =>
							answer.id === targetId
								? {
										...answer,
										voteScore: data.voteScore,
										userVote: data.userVote,
								  }
								: answer
						),
					}
				})
			}

			toast({
				title: 'Vote recorded',
				description: `Your ${type}vote has been recorded.`,
			})
		} catch (error) {
			console.error('Error voting:', error)
			let errorMessage = 'Failed to vote. Please try again.'

			if (error instanceof Error) {
				if (error.message.includes('cannot vote on your own')) {
					errorMessage = 'You cannot vote on your own content.'
				} else if (error.message.includes('Authentication required')) {
					errorMessage = 'Please log in to vote.'
				} else if (error.message.includes('not found')) {
					errorMessage = 'This content no longer exists.'
				}
			}

			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			})
		}
	}

	const handleAcceptAnswer = async (answerId: string) => {
		if (!user || !question || user.id !== question.author.id) {
			toast({
				title: 'Permission denied',
				description: 'Only the question author can accept answers.',
				variant: 'destructive',
			})
			return
		}

		const currentAnswer = question.answers.find((a) => a.id === answerId)
		if (!currentAnswer) {
			toast({
				title: 'Error',
				description: 'Answer not found.',
				variant: 'destructive',
			})
			return
		}

		const newAcceptedState = !currentAnswer.isAccepted

		try {
			const response = await fetch(`/api/answers/${answerId}`, {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					isAccepted: newAcceptedState,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to update answer')
			}

			// Update the question state to reflect the accepted answer change
			setQuestion((prev) => {
				if (!prev) return prev
				return {
					...prev,
					answers: prev.answers.map((answer) => ({
						...answer,
						isAccepted: answer.id === answerId ? newAcceptedState : false, // Only one answer can be accepted
					})),
				}
			})

			toast({
				title: newAcceptedState ? 'Answer accepted' : 'Answer unaccepted',
				description: newAcceptedState
					? 'The answer has been marked as accepted.'
					: 'The answer is no longer marked as accepted.',
			})
		} catch (error) {
			console.error('Error updating answer:', error)
			let errorMessage = 'Failed to update answer. Please try again.'

			if (error instanceof Error) {
				if (error.message.includes('Only the question author')) {
					errorMessage = 'Only the question author can accept answers.'
				} else if (error.message.includes('Authentication required')) {
					errorMessage = 'Please log in to accept answers.'
				} else if (error.message.includes('not found')) {
					errorMessage = 'This answer no longer exists.'
				}
			}

			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			})
		}
	}

	const handleSubmitAnswer = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to post an answer.',
				variant: 'destructive',
			})
			return
		}

		if (!newAnswer.trim()) {
			toast({
				title: 'Empty answer',
				description: 'Please write an answer before submitting.',
				variant: 'destructive',
			})
			return
		}

		setSubmitting(true)

		try {
			const response = await fetch('/api/answers', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: newAnswer,
					questionId: params.id,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to post answer')
			}

			setQuestion((prev) => {
				if (!prev) return prev
				return {
					...prev,
					answers: [...prev.answers, data.answer],
					answerCount: prev.answerCount + 1,
				}
			})
			setNewAnswer('')

			toast({
				title: 'Answer posted!',
				description: 'Your answer has been successfully posted.',
			})
		} catch (error) {
			console.error('Error posting answer:', error)
			let errorMessage = 'Failed to post answer. Please try again.'

			if (error instanceof Error) {
				if (error.message.includes('Invalid input')) {
					errorMessage = 'Your answer must be at least 20 characters long.'
				} else if (error.message.includes('Authentication required')) {
					errorMessage = 'Please log in to post an answer.'
				} else if (error.message.includes('Question not found')) {
					errorMessage = 'This question no longer exists.'
				}
			}

			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			})
		} finally {
			setSubmitting(false)
		}
	}

	const handleSubmitComment = async (answerId: string) => {
		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to post a comment.',
				variant: 'destructive',
			})
			return
		}

		const commentContent = newComments[answerId]?.trim()
		if (!commentContent) {
			toast({
				title: 'Empty comment',
				description: 'Please write a comment before submitting.',
				variant: 'destructive',
			})
			return
		}

		setSubmittingComments((prev) => ({ ...prev, [answerId]: true }))

		try {
			const response = await fetch('/api/comments', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					content: commentContent,
					answerId: answerId,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				throw new Error(data.error || 'Failed to post comment')
			}

			// Update the question state to include the new comment
			setQuestion((prev) => {
				if (!prev) return prev
				return {
					...prev,
					answers: prev.answers.map((answer) =>
						answer.id === answerId
							? {
									...answer,
									comments: [...answer.comments, data.comment],
									commentCount: answer.commentCount + 1,
							  }
							: answer
					),
				}
			})

			// Clear the comment input
			setNewComments((prev) => ({ ...prev, [answerId]: '' }))

			// Show comments section
			setShowComments((prev) => ({ ...prev, [answerId]: true }))

			toast({
				title: 'Comment posted!',
				description: 'Your comment has been successfully posted.',
			})
		} catch (error) {
			console.error('Error posting comment:', error)
			let errorMessage = 'Failed to post comment. Please try again.'

			if (error instanceof Error) {
				if (error.message.includes('Invalid input')) {
					errorMessage = 'Your comment must be at least 10 characters long.'
				} else if (error.message.includes('Authentication required')) {
					errorMessage = 'Please log in to post a comment.'
				} else if (error.message.includes('Answer not found')) {
					errorMessage = 'This answer no longer exists.'
				}
			}

			toast({
				title: 'Error',
				description: errorMessage,
				variant: 'destructive',
			})
		} finally {
			setSubmittingComments((prev) => ({ ...prev, [answerId]: false }))
		}
	}

	const toggleComments = (answerId: string) => {
		setShowComments((prev) => ({ ...prev, [answerId]: !prev[answerId] }))
	}

	if (loading) {
		return <LoadingSpinner />
	}

	if (!question) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<div className='text-center'>
					<h1 className='text-2xl font-bold mb-2'>Question not found</h1>
					<p className='text-muted-foreground'>The question you're looking for doesn't exist.</p>
				</div>
			</div>
		)
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='max-w-4xl mx-auto space-y-6'>
				{/* Question */}
				<Card>
					<CardHeader>
						<div className='flex flex-col lg:flex-row lg:items-start gap-4'>
							<div className='flex-1 min-w-0'>
								<h1 className='text-xl sm:text-2xl font-bold mb-4 break-words'>{question.title}</h1>
								<div
									className='prose prose-sm sm:prose max-w-none dark:prose-invert [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300'
									dangerouslySetInnerHTML={{ __html: question.description }}
								/>
							</div>
							<div className='flex lg:flex-col items-center gap-2 lg:gap-1 flex-shrink-0'>
								<Button
									variant='ghost'
									size='sm'
									className={`h-8 w-8 p-0 ${
										question.userVote === 'UP'
											? 'text-green-600 bg-green-50 hover:bg-green-100'
											: 'hover:text-green-600'
									}`}
									onClick={() => handleVote('up', 'question')}>
									<ArrowUp className='w-4 h-4' />
								</Button>
								<span className='text-lg font-medium'>{question.voteScore}</span>
								<Button
									variant='ghost'
									size='sm'
									className={`h-8 w-8 p-0 ${
										question.userVote === 'DOWN' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'hover:text-red-600'
									}`}
									onClick={() => handleVote('down', 'question')}>
									<ArrowDown className='w-4 h-4' />
								</Button>
							</div>
						</div>
					</CardHeader>
					<CardContent>
						<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
							<div className='flex flex-wrap gap-2'>
								{question.tags.map((tag) => (
									<Badge key={tag} variant='secondary'>
										{tag}
									</Badge>
								))}
							</div>
							<div className='flex items-center space-x-2 text-sm text-muted-foreground flex-shrink-0'>
								<span>asked</span>
								<span className='hidden sm:inline'>
									{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
								</span>
								<span className='sm:hidden'>
									{formatDistanceToNow(new Date(question.createdAt), { addSuffix: true }).replace('about ', '')}
								</span>
								<span>by</span>
								<Avatar className='w-6 h-6'>
									<AvatarImage src={question.author.avatarUrl || '/placeholder-user.jpg'} alt={question.author.name} />
									<AvatarFallback className='text-xs'>{question.author.name.charAt(0).toUpperCase()}</AvatarFallback>
								</Avatar>
								<span className='font-medium truncate'>{question.author.name}</span>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Answers */}
				<div className='space-y-4'>
					<h2 className='text-xl font-semibold'>
						{question.answers.length} Answer{question.answers.length !== 1 ? 's' : ''}
					</h2>

					{question.answers.map((answer) => (
						<Card key={answer.id} className={answer.isAccepted ? 'border-green-500' : ''}>
							<CardContent className='pt-6'>
								<div className='flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-4'>
									<div className='flex lg:flex-col items-center gap-2 lg:gap-1 order-2 lg:order-1'>
										<Button
											variant='ghost'
											size='sm'
											className={`h-8 w-8 p-0 ${
												answer.userVote === 'UP'
													? 'text-green-600 bg-green-50 hover:bg-green-100'
													: 'hover:text-green-600'
											}`}
											onClick={() => handleVote('up', 'answer', answer.id)}>
											<ArrowUp className='w-4 h-4' />
										</Button>
										<span className='text-lg font-medium'>{answer.voteScore}</span>
										<Button
											variant='ghost'
											size='sm'
											className={`h-8 w-8 p-0 ${
												answer.userVote === 'DOWN' ? 'text-red-600 bg-red-50 hover:bg-red-100' : 'hover:text-red-600'
											}`}
											onClick={() => handleVote('down', 'answer', answer.id)}>
											<ArrowDown className='w-4 h-4' />
										</Button>
										{user && user.id === question.author.id && (
											<Button
												variant='ghost'
												size='sm'
												className={`h-8 w-8 p-0 mt-2 ${answer.isAccepted ? 'text-green-500' : ''}`}
												onClick={() => handleAcceptAnswer(answer.id)}>
												<Check className='w-4 h-4' />
											</Button>
										)}
									</div>
									<div className='flex-1 order-1 lg:order-2'>
										{answer.isAccepted && (
											<div className='flex items-center space-x-2 mb-3'>
												<Check className='w-4 h-4 text-green-500' />
												<span className='text-sm font-medium text-green-500'>Accepted Answer</span>
											</div>
										)}
										<div
											className='prose prose-sm sm:prose max-w-none dark:prose-invert mb-4 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300'
											dangerouslySetInnerHTML={{ __html: answer.content }}
										/>
										<div className='flex flex-col sm:flex-row sm:items-center justify-between gap-3'>
											<div className='flex items-center space-x-2'>
												<Button variant='ghost' size='sm'>
													<Flag className='w-4 h-4 mr-1' />
													Report
												</Button>
											</div>
											<div className='flex items-center space-x-2 text-sm text-muted-foreground'>
												<span>answered</span>
												<span className='hidden sm:inline'>
													{formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
												</span>
												<span>by</span>
												<Avatar className='w-6 h-6'>
													<AvatarImage
														src={answer.author.avatarUrl || '/placeholder-user.jpg'}
														alt={answer.author.name}
													/>
													<AvatarFallback className='text-xs'>
														{answer.author.name.charAt(0).toUpperCase()}
													</AvatarFallback>
												</Avatar>
												<span className='font-medium truncate'>{answer.author.name}</span>
											</div>
										</div>

										{/* Comments Section */}
										<div className='mt-4 border-t pt-4'>
											<div className='flex items-center justify-between mb-3'>
												<Button
													variant='ghost'
													size='sm'
													onClick={() => toggleComments(answer.id)}
													className='text-muted-foreground hover:text-foreground'>
													{answer.commentCount} comment{answer.commentCount !== 1 ? 's' : ''}
													{showComments[answer.id] ? ' (hide)' : ' (show)'}
												</Button>
											</div>

											{showComments[answer.id] && (
												<div className='space-y-3'>
													{/* Existing Comments */}
													{answer.comments.map((comment) => (
														<div key={comment.id} className='flex space-x-3 p-3 bg-muted/30 rounded-lg'>
															<Avatar className='w-6 h-6 flex-shrink-0'>
																<AvatarImage
																	src={comment.author.avatarUrl || '/placeholder-user.jpg'}
																	alt={comment.author.name}
																/>
																<AvatarFallback className='text-xs'>
																	{comment.author.name.charAt(0).toUpperCase()}
																</AvatarFallback>
															</Avatar>
															<div className='flex-1 min-w-0'>
																<div className='text-sm'>
																	<span className='font-medium'>{comment.author.name}</span>
																	<span className='text-muted-foreground ml-2'>
																		{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
																	</span>
																</div>
																<p className='text-sm mt-1'>{comment.content}</p>
															</div>
														</div>
													))}

													{/* Add Comment Form */}
													{user && (
														<div className='flex space-x-3'>
															<Avatar className='w-6 h-6 flex-shrink-0'>
																<AvatarImage src={user.avatarUrl || '/placeholder-user.jpg'} alt={user.name} />
																<AvatarFallback className='text-xs'>{user.name.charAt(0).toUpperCase()}</AvatarFallback>
															</Avatar>
															<div className='flex-1 space-y-2'>
																<textarea
																	className='w-full p-2 text-sm border rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary'
																	rows={2}
																	placeholder='Add a comment...'
																	value={newComments[answer.id] || ''}
																	onChange={(e) => setNewComments((prev) => ({ ...prev, [answer.id]: e.target.value }))}
																/>
																<Button
																	size='sm'
																	onClick={() => handleSubmitComment(answer.id)}
																	disabled={submittingComments[answer.id] || !newComments[answer.id]?.trim()}>
																	{submittingComments[answer.id] ? 'Posting...' : 'Post Comment'}
																</Button>
															</div>
														</div>
													)}
												</div>
											)}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>

				{/* Answer Form */}
				{user ? (
					<Card>
						<CardHeader>
							<h3 className='text-lg font-semibold'>Your Answer</h3>
						</CardHeader>
						<CardContent>
							<form onSubmit={handleSubmitAnswer} className='space-y-4'>
								<RichTextEditor
									value={newAnswer}
									onChange={setNewAnswer}
									placeholder='Write your answer here...'
									className='min-h-[200px]'
								/>
								<Button type='submit' disabled={submitting || !newAnswer.trim()}>
									{submitting ? 'Posting...' : 'Post Your Answer'}
								</Button>
							</form>
						</CardContent>
					</Card>
				) : (
					<Card>
						<CardContent className='pt-6'>
							<div className='text-center'>
								<p className='text-muted-foreground mb-4'>You must be logged in to post an answer.</p>
								<Button asChild>
									<a href='/login'>Log In</a>
								</Button>
							</div>
						</CardContent>
					</Card>
				)}
			</div>
		</div>
	)
}
