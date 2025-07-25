'use client'

import type React from 'react'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Search, Filter, X } from 'lucide-react'

export function SearchAndFilters() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
	const [selectedTags, setSelectedTags] = useState<string[]>(searchParams.get('tags')?.split(',').filter(Boolean) || [])
	const [availableTags, setAvailableTags] = useState<string[]>([])
	const [loadingTags, setLoadingTags] = useState(false)
	const [tagSearchQuery, setTagSearchQuery] = useState('')
	const [filteredTags, setFilteredTags] = useState<string[]>([])

	// Fetch all available tags from the backend
	useEffect(() => {
		const fetchAllTags = async () => {
			try {
				setLoadingTags(true)
				const response = await fetch('/api/tags?limit=100') // Get more tags
				if (!response.ok) {
					throw new Error('Failed to fetch tags')
				}
				const data = await response.json()
				// Extract just the tag names from the response
				const tagNames = data.tags.map((tag: any) => tag.name)
				setAvailableTags(tagNames)
				setFilteredTags(tagNames)
			} catch (error) {
				console.error('Error fetching tags:', error)
				// Fallback to some basic tags if fetch fails
				const fallbackTags = ['javascript', 'react', 'nextjs', 'typescript', 'nodejs', 'python', 'css', 'html']
				setAvailableTags(fallbackTags)
				setFilteredTags(fallbackTags)
			} finally {
				setLoadingTags(false)
			}
		}

		fetchAllTags()
	}, [])

	// Filter tags based on search query
	useEffect(() => {
		if (tagSearchQuery.trim() === '') {
			setFilteredTags(availableTags)
		} else {
			const filtered = availableTags.filter((tag) => tag.toLowerCase().includes(tagSearchQuery.toLowerCase()))
			setFilteredTags(filtered)
		}
	}, [tagSearchQuery, availableTags])

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault()
		updateURL()
	}

	const updateURL = () => {
		const params = new URLSearchParams()
		if (searchQuery.trim()) params.set('search', searchQuery.trim())
		if (selectedTags.length > 0) params.set('tags', selectedTags.join(','))

		const queryString = params.toString()
		router.push(queryString ? `/?${queryString}` : '/')
	}

	const addTag = (tag: string) => {
		if (!selectedTags.includes(tag)) {
			const newTags = [...selectedTags, tag]
			setSelectedTags(newTags)
			// Update URL immediately when tag is added
			updateURLWithTags(newTags)
		}
	}

	const addCustomTag = () => {
		const trimmedTag = tagSearchQuery.trim().toLowerCase()
		if (trimmedTag && !selectedTags.includes(trimmedTag)) {
			const newTags = [...selectedTags, trimmedTag]
			setSelectedTags(newTags)
			setTagSearchQuery('') // Clear the search
			// Update URL immediately when tag is added
			updateURLWithTags(newTags)
		}
	}

	const removeTag = (tag: string) => {
		const newTags = selectedTags.filter((t) => t !== tag)
		setSelectedTags(newTags)
		// Update URL immediately when tag is removed
		updateURLWithTags(newTags)
	}

	const updateURLWithTags = (tags: string[]) => {
		const params = new URLSearchParams()
		if (searchQuery.trim()) params.set('search', searchQuery.trim())
		if (tags.length > 0) params.set('tags', tags.join(','))

		const queryString = params.toString()
		router.push(queryString ? `/?${queryString}` : '/')
	}

	const clearFilters = () => {
		setSearchQuery('')
		setSelectedTags([])
		router.push('/')
	}

	return (
		<div className='space-y-4 mb-8'>
			<form onSubmit={handleSearch} className='flex flex-col sm:flex-row gap-2'>
				<div className='relative flex-1'>
					<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
					<Input
						type='search'
						placeholder='Search questions...'
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						className='pl-10'
					/>
				</div>
				<div className='flex gap-2'>
					<Popover>
						<PopoverTrigger asChild>
							<Button variant='outline' type='button' className='flex-1 sm:flex-none bg-transparent'>
								<Filter className='w-4 h-4 mr-2' />
								Tags
								{selectedTags.length > 0 && (
									<Badge variant='secondary' className='ml-2'>
										{selectedTags.length}
									</Badge>
								)}
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-80'>
							<div className='space-y-4'>
								<h4 className='font-medium'>Filter by tags</h4>

								{/* Tag search input */}
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4' />
									<Input
										type='search'
										placeholder='Search tags...'
										value={tagSearchQuery}
										onChange={(e) => setTagSearchQuery(e.target.value)}
										className='pl-10'
									/>
								</div>

								{/* Tags display */}
								<div className='flex flex-wrap gap-2 max-h-60 overflow-y-auto'>
									{loadingTags ? (
										<div className='text-sm text-muted-foreground'>Loading tags...</div>
									) : filteredTags.length > 0 ? (
										filteredTags.map((tag) => (
											<Button
												key={tag}
												type='button'
												variant={selectedTags.includes(tag) ? 'default' : 'outline'}
												size='sm'
												onClick={() => (selectedTags.includes(tag) ? removeTag(tag) : addTag(tag))}>
												{tag}
											</Button>
										))
									) : tagSearchQuery.trim() ? (
										<div className='text-center w-full space-y-2'>
											<div className='text-sm text-muted-foreground'>No tags found matching "{tagSearchQuery}"</div>
											<Button type='button' variant='outline' size='sm' onClick={addCustomTag} className='text-xs'>
												Add "{tagSearchQuery.trim().toLowerCase()}" as filter
											</Button>
										</div>
									) : (
										<div className='text-sm text-muted-foreground'>No tags available</div>
									)}
								</div>
							</div>
						</PopoverContent>
					</Popover>
					<Button type='submit' className='flex-1 sm:flex-none'>
						Search
					</Button>
				</div>
			</form>

			{(selectedTags.length > 0 || searchQuery) && (
				<div className='flex items-start gap-2 flex-wrap'>
					<span className='text-sm text-muted-foreground flex-shrink-0'>Active filters:</span>
					<div className='flex flex-wrap gap-2'>
						{searchQuery && (
							<Badge variant='outline' className='text-xs'>
								Search: {searchQuery}
								<Button variant='ghost' size='sm' className='h-4 w-4 p-0 ml-1' onClick={() => setSearchQuery('')}>
									<X className='w-3 h-3' />
								</Button>
							</Badge>
						)}
						{selectedTags.map((tag) => (
							<Badge key={tag} variant='outline' className='text-xs'>
								{tag}
								<Button variant='ghost' size='sm' className='h-4 w-4 p-0 ml-1' onClick={() => removeTag(tag)}>
									<X className='w-3 h-3' />
								</Button>
							</Badge>
						))}
					</div>
					<Button variant='ghost' size='sm' onClick={clearFilters} className='text-xs'>
						Clear all
					</Button>
				</div>
			)}
		</div>
	)
}
