"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { RichTextEditor } from "@/components/rich-text-editor"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"
import { ArrowUp, ArrowDown, Check, Flag } from "lucide-react"

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
  isUpvoted?: boolean
  isDownvoted?: boolean
}

interface Answer {
  id: string
  content: string
  author: {
    id: string
    name: string
    avatar?: string
  }
  createdAt: string
  votes: number
  isAccepted: boolean
  isUpvoted?: boolean
  isDownvoted?: boolean
}

export default function QuestionDetailPage() {
  const params = useParams()
  const { user } = useAuth()
  const { toast } = useToast()
  const [question, setQuestion] = useState<Question | null>(null)
  const [answers, setAnswers] = useState<Answer[]>([])
  const [newAnswer, setNewAnswer] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Mock data for demonstration
    const mockQuestion: Question = {
      id: params.id as string,
      title: "How to implement JWT authentication in Next.js?",
      description: `<p>I am trying to implement JWT authentication in my Next.js application but facing some issues with token storage and validation.</p>
      <p>Here's what I've tried so far:</p>
      <ol>
        <li>Using localStorage to store tokens</li>
        <li>Setting up middleware for route protection</li>
        <li>Creating login/logout functionality</li>
      </ol>
      <p>The main issue I'm facing is that the token seems to expire too quickly and users are getting logged out unexpectedly. Any suggestions?</p>`,
      tags: ["nextjs", "jwt", "authentication"],
      author: {
        id: "1",
        name: "John Doe",
        avatar: "/placeholder.svg?height=32&width=32",
      },
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      votes: 15,
    }

    const mockAnswers: Answer[] = [
      {
        id: "1",
        content: `<p>The issue you're experiencing is likely due to the JWT token expiration time being set too low. Here are some solutions:</p>
        <p><strong>1. Increase token expiration time:</strong></p>
        <pre><code>const token = jwt.sign(payload, secret, { expiresIn: '7d' })</code></pre>
        <p><strong>2. Implement refresh tokens:</strong></p>
        <p>Use a refresh token mechanism to automatically renew access tokens before they expire.</p>
        <p><strong>3. Use httpOnly cookies instead of localStorage:</strong></p>
        <p>This is more secure and prevents XSS attacks.</p>`,
        author: {
          id: "2",
          name: "Jane Smith",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        votes: 8,
        isAccepted: true,
      },
      {
        id: "2",
        content: `<p>I had a similar issue. Make sure you're handling token refresh properly in your middleware:</p>
        <pre><code>// middleware.js
export function middleware(request) {
  const token = request.cookies.get('token')
  
  if (!token || isTokenExpired(token)) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
}</code></pre>`,
        author: {
          id: "3",
          name: "Mike Johnson",
          avatar: "/placeholder.svg?height=32&width=32",
        },
        createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        votes: 3,
        isAccepted: false,
      },
    ]

    setTimeout(() => {
      setQuestion(mockQuestion)
      setAnswers(mockAnswers)
      setLoading(false)
    }, 500)
  }, [params.id])

  const handleVote = (type: "up" | "down", targetType: "question" | "answer", targetId?: string) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to vote.",
        variant: "destructive",
      })
      return
    }

    // Handle voting logic here
    toast({
      title: "Vote recorded",
      description: `Your ${type}vote has been recorded.`,
    })
  }

  const handleAcceptAnswer = (answerId: string) => {
    if (!user || !question || user.id !== question.author.id) {
      toast({
        title: "Permission denied",
        description: "Only the question author can accept answers.",
        variant: "destructive",
      })
      return
    }

    setAnswers((prev) =>
      prev.map((answer) => ({
        ...answer,
        isAccepted: answer.id === answerId ? !answer.isAccepted : false,
      })),
    )

    toast({
      title: "Answer accepted",
      description: "The answer has been marked as accepted.",
    })
  }

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to post an answer.",
        variant: "destructive",
      })
      return
    }

    if (!newAnswer.trim()) {
      toast({
        title: "Empty answer",
        description: "Please write an answer before submitting.",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const answer: Answer = {
        id: Date.now().toString(),
        content: newAnswer,
        author: user,
        createdAt: new Date().toISOString(),
        votes: 0,
        isAccepted: false,
      }

      setAnswers((prev) => [...prev, answer])
      setNewAnswer("")

      toast({
        title: "Answer posted!",
        description: "Your answer has been successfully posted.",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to post answer. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (!question) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Question not found</h1>
          <p className="text-muted-foreground">The question you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Question */}
        <Card>
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-start gap-4">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl font-bold mb-4 break-words">{question.title}</h1>
                <div
                  className="prose prose-sm sm:prose max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: question.description }}
                />
              </div>
              <div className="flex lg:flex-col items-center gap-2 lg:gap-1 flex-shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleVote("up", "question")}>
                  <ArrowUp className="w-4 h-4" />
                </Button>
                <span className="text-lg font-medium">{question.votes}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => handleVote("down", "question")}
                >
                  <ArrowDown className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap gap-2">
                {question.tags.map((tag) => (
                  <Badge key={tag} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground flex-shrink-0">
                <span>asked</span>
                <span className="hidden sm:inline">
                  {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                </span>
                <span className="sm:hidden">
                  {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true }).replace("about ", "")}
                </span>
                <span>by</span>
                <Avatar className="w-6 h-6">
                  <AvatarImage src={question.author.avatar || "/placeholder.svg"} alt={question.author.name} />
                  <AvatarFallback className="text-xs">{question.author.name.charAt(0).toUpperCase()}</AvatarFallback>
                </Avatar>
                <span className="font-medium truncate">{question.author.name}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Answers */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">
            {answers.length} Answer{answers.length !== 1 ? "s" : ""}
          </h2>

          {answers.map((answer) => (
            <Card key={answer.id} className={answer.isAccepted ? "border-green-500" : ""}>
              <CardContent className="pt-6">
                <div className="flex flex-col lg:flex-row lg:items-start space-y-4 lg:space-y-0 lg:space-x-4">
                  <div className="flex lg:flex-col items-center gap-2 lg:gap-1 order-2 lg:order-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleVote("up", "answer", answer.id)}
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <span className="text-lg font-medium">{answer.votes}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => handleVote("down", "answer", answer.id)}
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    {user && user.id === question.author.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-8 w-8 p-0 mt-2 ${answer.isAccepted ? "text-green-500" : ""}`}
                        onClick={() => handleAcceptAnswer(answer.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                  <div className="flex-1 order-1 lg:order-2">
                    {answer.isAccepted && (
                      <div className="flex items-center space-x-2 mb-3">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-green-500">Accepted Answer</span>
                      </div>
                    )}
                    <div
                      className="prose prose-sm sm:prose max-w-none dark:prose-invert mb-4"
                      dangerouslySetInnerHTML={{ __html: answer.content }}
                    />
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          <Flag className="w-4 h-4 mr-1" />
                          Report
                        </Button>
                      </div>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <span>answered</span>
                        <span className="hidden sm:inline">
                          {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                        </span>
                        <span>by</span>
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={answer.author.avatar || "/placeholder.svg"} alt={answer.author.name} />
                          <AvatarFallback className="text-xs">
                            {answer.author.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium truncate">{answer.author.name}</span>
                      </div>
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
              <h3 className="text-lg font-semibold">Your Answer</h3>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitAnswer} className="space-y-4">
                <RichTextEditor
                  value={newAnswer}
                  onChange={setNewAnswer}
                  placeholder="Write your answer here..."
                  className="min-h-[200px]"
                />
                <Button type="submit" disabled={submitting || !newAnswer.trim()}>
                  {submitting ? "Posting..." : "Post Your Answer"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-muted-foreground mb-4">You must be logged in to post an answer.</p>
                <Button asChild>
                  <a href="/login">Log In</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
