"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Bell, MessageCircle, ArrowUp, AtSign } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: "answer" | "comment" | "mention" | "vote"
  title: string
  message: string
  createdAt: string
  read: boolean
  user?: {
    name: string
    avatar?: string
  }
  questionId?: string
}

export function NotificationDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Mock notifications data
    const mockNotifications: Notification[] = [
      {
        id: "1",
        type: "answer",
        title: "New answer on your question",
        message: "Someone answered your question about JWT authentication",
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        read: false,
        user: {
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        questionId: "1",
      },
      {
        id: "2",
        type: "vote",
        title: "Your answer was upvoted",
        message: "Your answer about React hooks received an upvote",
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        read: false,
        questionId: "2",
      },
      {
        id: "3",
        type: "mention",
        title: "You were mentioned",
        message: "@john mentioned you in a comment",
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        read: true,
        user: {
          name: "John Doe",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        questionId: "3",
      },
    ]

    setNotifications(mockNotifications)
    setUnreadCount(mockNotifications.filter((n) => !n.read).length)
  }, [])

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)))
    setUnreadCount((prev) => Math.max(0, prev - 1))
  }

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
    setUnreadCount(0)
  }

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "answer":
        return <MessageCircle className="w-4 h-4" />
      case "vote":
        return <ArrowUp className="w-4 h-4" />
      case "mention":
        return <AtSign className="w-4 h-4" />
      default:
        return <Bell className="w-4 h-4" />
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs p-0"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end">
        <div className="flex items-center justify-between p-2">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs">
              Mark all read
            </Button>
          )}
        </div>
        <DropdownMenuSeparator />

        {notifications.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No notifications yet</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            {notifications.map((notification) => (
              <DropdownMenuItem
                key={notification.id}
                className="p-3 cursor-pointer"
                onClick={() => {
                  markAsRead(notification.id)
                  if (notification.questionId) {
                    window.location.href = `/questions/${notification.questionId}`
                  }
                }}
              >
                <div className="flex items-start space-x-3 w-full">
                  <div className="flex-shrink-0 mt-1">
                    {notification.user ? (
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={notification.user.avatar || "/placeholder.svg"}
                          alt={notification.user.name}
                        />
                        <AvatarFallback className="text-xs">
                          {notification.user.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                        {getNotificationIcon(notification.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium truncate">{notification.title}</p>
                      {!notification.read && <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 ml-2" />}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
