"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Pagination } from "@/components/pagination"
import { LoadingSpinner } from "@/components/loading-spinner"
import { formatDistanceToNow } from "date-fns"
import { ArrowUp, ArrowDown, MessageCircle, Check } from "lucide-react"

interface Question {
  id: string
  title: string
  description: string
  tags: string[]
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  votes: number
  answerCount: number
  hasAcceptedAnswer: boolean
  isUpvoted?: boolean
  isDownvoted?: boolean
}

interface QuestionListProps {
  searchParams: {
    search?: string
    tags?: string
    sort?: string
    page?: string
  }
}

export function QuestionList({ searchParams }: QuestionListProps) {
  const [questions, setQuestions] = useState<Question[]>([])
  const [loading, setLoading] = useState(true)
  const [totalPages, setTotalPages] = useState(1)

  // Mock data for demonstration
  useEffect(() => {
    const mockQuestions: Question[] = [
      {
        id: "1",
        title: "How to implement JWT authentication in Next.js?",
        description:
          "I am trying to implement JWT authentication in my Next.js application but facing some issues with token storage and validation.",
        tags: ["nextjs", "jwt", "authentication"],
        author: {
          id: "1",
          name: "John Doe",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        votes: 15,
        answerCount: 3,
        hasAcceptedAnswer: true,
      },
      {
        id: "2",
        title: "React useState vs useReducer - When to use which?",
        description:
          "I am confused about when to use useState and when to use useReducer in React. Can someone explain the differences and use cases?",
        tags: ["react", "hooks", "state-management"],
        author: {
          id: "2",
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
        votes: 8,
        answerCount: 2,
        hasAcceptedAnswer: false,
      },
      {
        id: "3",
        title: "Best practices for TypeScript in large projects",
        description:
          "What are some best practices for using TypeScript in large-scale applications? Looking for advice on project structure, type definitions, and performance.",
        tags: ["typescript", "best-practices", "architecture"],
        author: {
          id: "3",
          name: "Mike Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        votes: 23,
        answerCount: 5,
        hasAcceptedAnswer: true,
      },
    ]

    // Simulate API call delay
    setTimeout(() => {
      setQuestions(mockQuestions)
      setTotalPages(1)
      setLoading(false)
    }, 500)
  }, [searchParams])

  if (loading) {
    return <LoadingSpinner />
  }

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-semibold mb-2">No questions found</h3>
        <p className="text-muted-foreground mb-4">Be the first to ask a question in this community!</p>
        <Button asChild>
          <Link href="/ask">Ask a Question</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-xl font-semibold">
          {questions.length} Question{questions.length !== 1 ? "s" : ""}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm">
            Newest
          </Button>
          <Button variant="ghost" size="sm">
            Most Voted
          </Button>
          <Button variant="ghost" size="sm">
            Unanswered
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {questions.map((question) => (
          <Card key={question.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                <div className="flex-1 min-w-0">
                  <Link
                    href={`/questions/${question.id}`}
                    className="text-lg font-semibold hover:text-primary transition-colors block"
                  >
                    {question.title}
                  </Link>
                  <p className="text-muted-foreground mt-2 line-clamp-2">{question.description}</p>
                </div>

                {/* Stats - horizontal on mobile, vertical on desktop */}
                <div className="flex lg:flex-col items-center gap-4 lg:gap-2 flex-shrink-0">
                  <div className="flex lg:flex-col items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <span className="text-sm font-medium">{question.votes}</span>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="flex lg:flex-col items-center gap-1">
                    <div className="flex items-center space-x-1">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-sm">{question.answerCount}</span>
                    </div>
                    {question.hasAcceptedAnswer && <Check className="w-4 h-4 text-green-500" />}
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2">
                  {question.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center space-x-2 text-sm text-muted-foreground flex-shrink-0">
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
                    <AvatarFallback className="text-xs">{question.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <span className="truncate">{question.author.name}</span>
                  <span className="hidden sm:inline">•</span>
                  <span className="hidden sm:inline">
                    {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {totalPages > 1 && <Pagination currentPage={Number.parseInt(searchParams.page || "1")} totalPages={totalPages} />}
    </div>
  )
}
