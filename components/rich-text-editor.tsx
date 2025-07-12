'use client'

import type React from 'react'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
	Bold,
	Italic,
	Strikethrough,
	List,
	ListOrdered,
	LinkIcon,
	ImageIcon,
	AlignLeft,
	AlignCenter,
	AlignRight,
	Smile,
} from 'lucide-react'

interface RichTextEditorProps {
	value: string
	onChange: (value: string) => void
	placeholder?: string
	className?: string
}

const emojis = ['😀', '😂', '😍', '🤔', '👍', '👎', '❤️', '🔥', '💯', '🎉']

export function RichTextEditor({ value, onChange, placeholder, className }: RichTextEditorProps) {
	const editorRef = useRef<HTMLDivElement>(null)
	const [linkUrl, setLinkUrl] = useState('')
	const [linkText, setLinkText] = useState('')
	const [isTyping, setIsTyping] = useState(false)
	const [savedSelection, setSavedSelection] = useState<Range | null>(null)
	const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

	// Only update innerHTML when value changes externally (not when typing)
	useEffect(() => {
		if (editorRef.current && !isTyping && editorRef.current.innerHTML !== value) {
			editorRef.current.innerHTML = value
		}
	}, [value, isTyping])

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
			}
		}
	}, [])

	const handleTypingStart = () => {
		setIsTyping(true)
		// Clear any existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}
	}

	const handleTypingEnd = () => {
		// Clear any existing timeout
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}
		// Set a longer timeout for fast typing
		typingTimeoutRef.current = setTimeout(() => {
			setIsTyping(false)
		}, 500) // Increased from 100ms to 500ms
	}

	// Save current cursor position and get selected text for link
	const saveSelection = () => {
		const selection = window.getSelection()
		if (selection && selection.rangeCount > 0) {
			const range = selection.getRangeAt(0)
			// Only save selection if it's within our editor
			if (editorRef.current && editorRef.current.contains(range.commonAncestorContainer)) {
				setSavedSelection(range.cloneRange())

				// If there's selected text, use it as the link text
				const selectedText = selection.toString().trim()
				if (selectedText) {
					setLinkText(selectedText)
				}
			}
		}
	}

	// Restore cursor position
	const restoreSelection = () => {
		if (savedSelection && editorRef.current) {
			const selection = window.getSelection()
			if (selection) {
				selection.removeAllRanges()
				selection.addRange(savedSelection)
				editorRef.current.focus()
			}
		}
	}

	const execCommand = (command: string, value?: string) => {
		// Temporarily disable typing detection for commands
		setIsTyping(false)
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}

		// Focus the editor first
		if (editorRef.current) {
			editorRef.current.focus()
		}

		// Execute the command
		document.execCommand(command, false, value)

		// Update the content
		if (editorRef.current) {
			onChange(editorRef.current.innerHTML)
		}

		// Re-enable typing detection after a short delay
		setTimeout(() => {
			setIsTyping(false)
		}, 50)
	}

	const insertEmoji = (emoji: string) => {
		// Focus the editor and insert emoji at cursor position
		if (editorRef.current) {
			editorRef.current.focus()
		}
		execCommand('insertText', emoji)
	}

	const insertList = (listType: 'ordered' | 'unordered') => {
		// Focus the editor first
		if (editorRef.current) {
			editorRef.current.focus()
		}

		// Temporarily disable typing detection
		setIsTyping(false)
		if (typingTimeoutRef.current) {
			clearTimeout(typingTimeoutRef.current)
		}

		// Create list command
		const command = listType === 'ordered' ? 'insertOrderedList' : 'insertUnorderedList'
		document.execCommand(command, false)

		// Update content and ensure focus
		if (editorRef.current) {
			onChange(editorRef.current.innerHTML)
			editorRef.current.focus()
		}
	}

	const insertLink = () => {
		if (linkUrl && linkText) {
			// Temporarily disable typing detection
			setIsTyping(false)
			if (typingTimeoutRef.current) {
				clearTimeout(typingTimeoutRef.current)
			}

			// Restore cursor position and focus
			restoreSelection()

			// Create the link element
			const linkElement = document.createElement('a')
			linkElement.href = linkUrl
			linkElement.target = '_blank'
			linkElement.rel = 'noopener noreferrer'
			linkElement.textContent = linkText

			// Insert the link at cursor position
			const selection = window.getSelection()
			if (selection && selection.rangeCount > 0) {
				const range = selection.getRangeAt(0)
				range.deleteContents()
				range.insertNode(linkElement)

				// Move cursor after the link
				range.setStartAfter(linkElement)
				range.setEndAfter(linkElement)
				selection.removeAllRanges()
				selection.addRange(range)
			}

			// Update content
			if (editorRef.current) {
				onChange(editorRef.current.innerHTML)
			}

			// Clear form
			setLinkUrl('')
			setLinkText('')
			setSavedSelection(null)

			// Re-enable typing detection after a short delay
			setTimeout(() => {
				setIsTyping(false)
			}, 50)
		}
	}

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = (e) => {
				const result = e.target?.result as string

				// Focus the editor first
				if (editorRef.current) {
					editorRef.current.focus()
				}

				execCommand('insertHTML', `<img src="${result}" alt="Uploaded image" style="max-width: 100%; height: auto;" />`)
			}
			reader.readAsDataURL(file)
		}
		// Reset the input value to allow re-uploading the same file
		e.target.value = ''
	}

	return (
		<div className={`border rounded-lg ${className}`}>
			<div className='flex flex-wrap items-center gap-1 p-2 border-b bg-muted/50'>
				{/* Basic formatting */}
				<div className='flex items-center gap-1'>
					<Button type='button' variant='ghost' size='sm' onClick={() => execCommand('bold')}>
						<Bold className='w-4 h-4' />
					</Button>
					<Button type='button' variant='ghost' size='sm' onClick={() => execCommand('italic')}>
						<Italic className='w-4 h-4' />
					</Button>
					<Button type='button' variant='ghost' size='sm' onClick={() => execCommand('strikeThrough')}>
						<Strikethrough className='w-4 h-4' />
					</Button>
				</div>

				<Separator orientation='vertical' className='h-6 hidden sm:block' />

				{/* Lists */}
				<div className='flex items-center gap-1'>
					<Button type='button' variant='ghost' size='sm' onClick={() => insertList('unordered')}>
						<List className='w-4 h-4' />
					</Button>
					<Button type='button' variant='ghost' size='sm' onClick={() => insertList('ordered')}>
						<ListOrdered className='w-4 h-4' />
					</Button>
				</div>

				<Separator orientation='vertical' className='h-6 hidden sm:block' />

				{/* Links and images */}
				<div className='flex items-center gap-1'>
					<Popover>
						<PopoverTrigger asChild>
							<Button type='button' variant='ghost' size='sm' onClick={saveSelection}>
								<LinkIcon className='w-4 h-4' />
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-80'>
							<div className='space-y-4'>
								<div className='space-y-2'>
									<Label htmlFor='link-text'>Link Text</Label>
									<Input
										id='link-text'
										value={linkText}
										onChange={(e) => setLinkText(e.target.value)}
										placeholder='Enter link text'
									/>
								</div>
								<div className='space-y-2'>
									<Label htmlFor='link-url'>URL</Label>
									<Input
										id='link-url'
										value={linkUrl}
										onChange={(e) => setLinkUrl(e.target.value)}
										placeholder='https://example.com'
									/>
								</div>
								<Button onClick={insertLink} className='w-full'>
									Insert Link
								</Button>
							</div>
						</PopoverContent>
					</Popover>

					<Button type='button' variant='ghost' size='sm' asChild>
						<label>
							<ImageIcon className='w-4 h-4' />
							<input type='file' accept='image/*' onChange={handleImageUpload} className='hidden' />
						</label>
					</Button>
				</div>

				{/* Alignment - hidden on mobile */}
				<div className='hidden sm:flex items-center gap-1'>
					<Separator orientation='vertical' className='h-6' />
					<Button type='button' variant='ghost' size='sm' onClick={() => execCommand('justifyLeft')}>
						<AlignLeft className='w-4 h-4' />
					</Button>
					<Button type='button' variant='ghost' size='sm' onClick={() => execCommand('justifyCenter')}>
						<AlignCenter className='w-4 h-4' />
					</Button>
					<Button type='button' variant='ghost' size='sm' onClick={() => execCommand('justifyRight')}>
						<AlignRight className='w-4 h-4' />
					</Button>
				</div>

				{/* Emoji */}
				<div className='flex items-center gap-1'>
					<Separator orientation='vertical' className='h-6 hidden sm:block' />
					<Popover>
						<PopoverTrigger asChild>
							<Button type='button' variant='ghost' size='sm'>
								<Smile className='w-4 h-4' />
							</Button>
						</PopoverTrigger>
						<PopoverContent className='w-64'>
							<div className='grid grid-cols-5 gap-2'>
								{emojis.map((emoji) => (
									<Button
										key={emoji}
										type='button'
										variant='ghost'
										size='sm'
										onClick={() => insertEmoji(emoji)}
										className='text-lg'>
										{emoji}
									</Button>
								))}
							</div>
						</PopoverContent>
					</Popover>
				</div>
			</div>

			<div
				ref={editorRef}
				contentEditable
				className='min-h-[200px] p-3 sm:p-4 focus:outline-none text-sm sm:text-base [&_ul]:list-disc [&_ul]:ml-6 [&_ol]:list-decimal [&_ol]:ml-6 [&_li]:my-1 [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800 dark:[&_a]:text-blue-400 dark:[&_a:hover]:text-blue-300 [&_strong]:font-bold [&_em]:italic [&_s]:line-through'
				onInput={(e) => {
					handleTypingStart()
					onChange(e.currentTarget.innerHTML)
					handleTypingEnd()
				}}
				onKeyDown={(e) => {
					handleTypingStart()

					// Ctrl+K or Cmd+K for link insertion
					if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
						e.preventDefault()
						saveSelection()
					}
				}}
				onKeyUp={handleTypingEnd}
				onFocus={handleTypingStart}
				onBlur={() => {
					// Clear timeout and immediately set typing to false on blur
					if (typingTimeoutRef.current) {
						clearTimeout(typingTimeoutRef.current)
					}
					setIsTyping(false)
				}}
				data-placeholder={placeholder}
				style={{
					wordBreak: 'break-word',
				}}
				suppressContentEditableWarning={true}
			/>
		</div>
	)
}
