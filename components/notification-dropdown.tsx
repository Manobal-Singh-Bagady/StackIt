'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Bell, MessageCircle, ArrowUp, AtSign, CheckCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'

interface Notification {
	id: string
	type: 'ANSWER' | 'ACCEPTED' | 'COMMENT' | 'MENTION' | 'VOTE'
	title: string
	message: string
	createdAt: string
	isRead: boolean
	relatedQuestion?: {
		id: string
		title: string
	}
	relatedUserId?: string
}

export function NotificationDropdown() {
	const [notifications, setNotifications] = useState<Notification[]>([])
	const [unreadCount, setUnreadCount] = useState(0)
	const [loading, setLoading] = useState(false)
	const { user } = useAuth()
	const { toast } = useToast()

	useEffect(() => {
		if (user) {
			fetchNotifications()
		}
	}, [user])

	const fetchNotifications = async () => {
		try {
			setLoading(true)
			const response = await fetch('/api/notifications?limit=10')
			if (response.ok) {
				const data = await response.json()
				setNotifications(data.notifications)
				setUnreadCount(data.unreadCount)
			}
		} catch (error) {
			console.error('Error fetching notifications:', error)
		} finally {
			setLoading(false)
		}
	}

	const markAsRead = async (notificationIds: string[]) => {
		try {
			const response = await fetch('/api/notifications', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ notificationIds }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to mark notifications as read')
			}

			// Update local state
			setNotifications((prev) =>
				prev.map((notification) =>
					notificationIds.includes(notification.id) ? { ...notification, isRead: true } : notification
				)
			)
			setUnreadCount((prev) => Math.max(0, prev - notificationIds.length))
		} catch (error) {
			console.error('Error marking notifications as read:', error)
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to mark notifications as read.',
				variant: 'destructive',
			})
		}
	}

	const markAllAsRead = async () => {
		try {
			const response = await fetch('/api/notifications', {
				method: 'PATCH',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ markAllAsRead: true }),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || 'Failed to mark all notifications as read')
			}

			setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })))
			setUnreadCount(0)

			toast({
				title: 'Success',
				description: 'All notifications marked as read.',
			})
		} catch (error) {
			console.error('Error marking all notifications as read:', error)
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Failed to mark all notifications as read.',
				variant: 'destructive',
			})
		}
	}

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case 'ANSWER':
				return <MessageCircle className='h-4 w-4' />
			case 'ACCEPTED':
				return <CheckCircle className='h-4 w-4 text-green-600' />
			case 'VOTE':
				return <ArrowUp className='h-4 w-4' />
			case 'MENTION':
				return <AtSign className='h-4 w-4' />
			default:
				return <Bell className='h-4 w-4' />
		}
	}

	if (!user) return null

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant='ghost' size='icon' className='relative'>
					<Bell className='h-5 w-5' />
					{unreadCount > 0 && (
						<Badge
							variant='destructive'
							className='absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs'>
							{unreadCount > 9 ? '9+' : unreadCount}
						</Badge>
					)}
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align='end' className='w-80'>
				<DropdownMenuLabel className='flex items-center justify-between'>
					Notifications
					{unreadCount > 0 && (
						<Button variant='ghost' size='sm' onClick={markAllAsRead} className='h-auto p-1 text-xs'>
							Mark all read
						</Button>
					)}
				</DropdownMenuLabel>

				<DropdownMenuSeparator />

				{loading ? (
					<div className='p-4 text-center text-sm text-muted-foreground'>Loading...</div>
				) : notifications.length === 0 ? (
					<div className='p-4 text-center text-sm text-muted-foreground'>No notifications yet</div>
				) : (
					<div className='max-h-96 overflow-y-auto'>
						{notifications.map((notification) => (
							<DropdownMenuItem
								key={notification.id}
								className={`p-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
								onClick={() => {
									if (!notification.isRead) {
										markAsRead([notification.id])
									}
								}}>
								{notification.relatedQuestion ? (
									<Link
										href={`/questions/${notification.relatedQuestion.id}`}
										className='flex items-start space-x-3 w-full'>
										<div className='flex-shrink-0 mt-1'>{getNotificationIcon(notification.type)}</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium line-clamp-1'>{notification.title}</p>
											<p className='text-xs text-muted-foreground line-clamp-2 mt-1'>{notification.message}</p>
											<p className='text-xs text-muted-foreground mt-2'>
												{formatDistanceToNow(new Date(notification.createdAt), {
													addSuffix: true,
												})}
											</p>
										</div>
										{!notification.isRead && <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2' />}
									</Link>
								) : (
									<div className='flex items-start space-x-3 w-full'>
										<div className='flex-shrink-0 mt-1'>{getNotificationIcon(notification.type)}</div>
										<div className='flex-1 min-w-0'>
											<p className='text-sm font-medium line-clamp-1'>{notification.title}</p>
											<p className='text-xs text-muted-foreground line-clamp-2 mt-1'>{notification.message}</p>
											<p className='text-xs text-muted-foreground mt-2'>
												{formatDistanceToNow(new Date(notification.createdAt), {
													addSuffix: true,
												})}
											</p>
										</div>
										{!notification.isRead && <div className='w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2' />}
									</div>
								)}
							</DropdownMenuItem>
						))}
					</div>
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
