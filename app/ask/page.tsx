'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { RichTextEditor } from '@/components/rich-text-editor'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'
import { X } from 'lucide-react'

export default function AskQuestionPage() {
	const { user } = useAuth()
	const router = useRouter()
	const { toast } = useToast()
	const [title, setTitle] = useState('')
	const [description, setDescription] = useState('')
	const [tags, setTags] = useState<string[]>([])
	const [newTag, setNewTag] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [suggestedTags, setSuggestedTags] = useState<string[]>([])
	const [loadingTags, setLoadingTags] = useState(true)

	// Fetch suggested tags from database
	useEffect(() => {
		const fetchTags = async () => {
			try {
				const response = await fetch('/api/tags')
				if (response.ok) {
					const data = await response.json()
					// Get the most popular tags (you could sort by usage count)
					setSuggestedTags(data.tags.map((tag: any) => tag.name).slice(0, 12))
				}
			} catch (error) {
				console.error('Failed to fetch tags:', error)
				// Fallback to hardcoded tags
				setSuggestedTags([
					'javascript',
					'react',
					'nextjs',
					'typescript',
					'nodejs',
					'python',
					'css',
					'html',
					'api',
					'database',
					'authentication',
				])
			} finally {
				setLoadingTags(false)
			}
		}

		fetchTags()
	}, [])

	const addTag = (tag: string) => {
		const trimmedTag = tag.trim().toLowerCase()
		if (trimmedTag && !tags.includes(trimmedTag) && tags.length < 5) {
			setTags([...tags, trimmedTag])
			setNewTag('')
		}
	}

	const removeTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove))
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!user) {
			toast({
				title: 'Authentication required',
				description: 'Please log in to ask a question.',
				variant: 'destructive',
			})
			return
		}

		if (!title.trim() || !description.trim() || tags.length === 0) {
			toast({
				title: 'Missing information',
				description: 'Please fill in all fields and add at least one tag.',
				variant: 'destructive',
			})
			return
		}

		setIsSubmitting(true)

		try {
			const response = await fetch('/api/questions', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					title: title.trim(),
					description: description.trim(),
					tags,
				}),
			})

			const data = await response.json()

			if (!response.ok) {
				// Handle specific validation errors
				if (response.status === 400 && data.details) {
					// Show validation errors from Zod
					const errorMessages = data.details
						.map((detail: any) => `${detail.path.join('.')}: ${detail.message}`)
						.join(', ')
					throw new Error(errorMessages)
				}
				throw new Error(data.error || 'Failed to post question')
			}

			toast({
				title: 'Question posted!',
				description: 'Your question has been successfully posted.',
			})

			router.push(`/questions/${data.question.id}`)
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to post question. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setIsSubmitting(false)
		}
	}

	if (!user) {
		return (
			<div className='container mx-auto px-4 py-8'>
				<Card className='max-w-md mx-auto'>
					<CardHeader>
						<CardTitle>Authentication Required</CardTitle>
					</CardHeader>
					<CardContent>
						<p className='text-muted-foreground mb-4'>You need to be logged in to ask a question.</p>
						<Button asChild className='w-full'>
							<a href='/login'>Log In</a>
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='max-w-4xl mx-auto'>
				<div className='mb-6 sm:mb-8'>
					<h1 className='text-2xl sm:text-3xl font-bold mb-2'>Ask a Question</h1>
					<p className='text-muted-foreground text-sm sm:text-base'>
						Get help from the community by asking a clear, detailed question.
					</p>
				</div>

				<form onSubmit={handleSubmit} className='space-y-6'>
					<Card>
						<CardHeader>
							<CardTitle className='text-lg sm:text-xl'>Question Details</CardTitle>
						</CardHeader>
						<CardContent className='space-y-6'>
							<div className='space-y-2'>
								<Label htmlFor='title'>
									Title <span className='text-destructive'>*</span>
								</Label>
								<Input
									id='title'
									value={title}
									onChange={(e) => setTitle(e.target.value)}
									placeholder="Be specific and imagine you're asking a question to another person"
									maxLength={200}
									className='text-sm sm:text-base'
								/>
								<p className='text-xs sm:text-sm text-muted-foreground'>{title.length}/200 characters</p>
							</div>

							<div className='space-y-2'>
								<Label htmlFor='description'>
									Description <span className='text-destructive'>*</span>
								</Label>
								<RichTextEditor
									value={description}
									onChange={setDescription}
									placeholder='Provide all the details someone would need to understand and answer your question...'
									className='min-h-[250px] sm:min-h-[300px]'
								/>
							</div>

							<div className='space-y-2'>
								<Label>
									Tags <span className='text-destructive'>*</span>
								</Label>
								<div className='flex flex-wrap gap-2 mb-2'>
									{tags.map((tag) => (
										<Badge key={tag} variant='secondary' className='text-xs sm:text-sm'>
											{tag}
											<Button
												type='button'
												variant='ghost'
												size='sm'
												className='h-4 w-4 p-0 ml-1'
												onClick={() => removeTag(tag)}>
												<X className='w-3 h-3' />
											</Button>
										</Badge>
									))}
								</div>
								<div className='flex flex-col sm:flex-row gap-2'>
									<Input
										value={newTag}
										onChange={(e) => setNewTag(e.target.value)}
										placeholder='Add a tag...'
										className='flex-1'
										onKeyPress={(e) => {
											if (e.key === 'Enter') {
												e.preventDefault()
												addTag(newTag)
											}
										}}
									/>
									<Button
										type='button'
										variant='outline'
										onClick={() => addTag(newTag)}
										disabled={!newTag.trim() || tags.length >= 5}
										className='sm:w-auto w-full'>
										Add
									</Button>
								</div>
								<p className='text-xs sm:text-sm text-muted-foreground'>
									Add up to 5 tags to describe what your question is about. ({tags.length}/5)
								</p>

								<div className='space-y-2'>
									<p className='text-sm font-medium'>Suggested tags:</p>
									{loadingTags ? (
										<p className='text-xs text-muted-foreground'>Loading suggestions...</p>
									) : (
										<div className='flex flex-wrap gap-2'>
											{suggestedTags
												.filter((tag) => !tags.includes(tag))
												.slice(0, 8)
												.map((tag) => (
													<Button
														key={tag}
														type='button'
														variant='outline'
														size='sm'
														onClick={() => addTag(tag)}
														disabled={tags.length >= 5}
														className='text-xs'>
														{tag}
													</Button>
												))}
										</div>
									)}
								</div>
							</div>
						</CardContent>
					</Card>

					<div className='flex flex-col sm:flex-row gap-4'>
						<Button
							type='submit'
							disabled={isSubmitting || !title.trim() || !description.trim() || tags.length === 0}
							className='min-w-[120px] w-full sm:w-auto'>
							{isSubmitting ? 'Posting...' : 'Post Question'}
						</Button>
						<Button type='button' variant='outline' onClick={() => router.back()} className='w-full sm:w-auto'>
							Cancel
						</Button>
					</div>
				</form>
			</div>
		</div>
	)
}
