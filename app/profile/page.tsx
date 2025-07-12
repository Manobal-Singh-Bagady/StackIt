"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LoadingSpinner } from "@/components/loading-spinner"
import { useAuth } from "@/hooks/use-auth"
import { formatDistanceToNow } from "date-fns"
import { Calendar, MessageCircle, HelpCircle, Award, TrendingUp, ArrowUp, Check, Settings } from "lucide-react"

interface UserStats {
  questionsAsked: number
  answersGiven: number
  totalVotes: number
  acceptedAnswers: number
  reputation: number
  joinDate: string
}

interface Question {
  id: string
  title: string
  votes: number
  answers: number
  hasAcceptedAnswer: boolean
  createdAt: string
  tags: string[]
}

interface Answer {
  id: string
  questionId: string
  questionTitle: string
  votes: number
  isAccepted: boolean
  createdAt: string
  content: string
}

export default function ProfilePage() {
  const { user } = useAuth()
  const [stats, setStats] = useState<UserStats | null>(null)
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Answer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return

    // Mock data - replace with actual API calls
    const mockStats: UserStats = {
      questionsAsked: 12,
      answersGiven: 28,
      totalVotes: 156,
      acceptedAnswers: 15,
      reputation: 1250,
      joinDate: "2024-01-15T00:00:00Z",
    }

    const mockQuestions: Question[] = [
      {
        id: "1",
        title: "How to implement JWT authentication in Next.js?",
        votes: 15,
        answers: 3,
        hasAcceptedAnswer: true,
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tags: ["nextjs", "jwt", "authentication"],
      },
      {
        id: "2",
        title: "Best practices for React state management",
        votes: 8,
        answers: 2,
        hasAcceptedAnswer: false,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ["react", "state-management"],
      },
      {
        id: "3",
        title: "TypeScript generic constraints explained",
        votes: 23,
        answers: 5,
        hasAcceptedAnswer: true,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        tags: ["typescript", "generics"],
      },
    ]

    const mockAnswers: Answer[] = [
      {
        id: "1",
        questionId: "4",
        questionTitle: "How to optimize React performance?",
        votes: 12,
        isAccepted: true,
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        content: "Use React.memo for component memoization and useMemo for expensive calculations...",
      },
      {
        id: "2",
        questionId: "5",
        questionTitle: "CSS Grid vs Flexbox - when to use which?",
        votes: 8,
        isAccepted: false,
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        content: "Grid is better for 2D layouts while Flexbox excels at 1D layouts...",
      },
    ]

    setTimeout(() => {
      setStats(mockStats)
      setQuestions(mockQuestions)
      setAnswers(mockAnswers)
      setLoading(false)
    }, 500)
  }, [user])

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">You need to be logged in to view your profile.</p>
            <Button asChild className="w-full">
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Profile Header */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="w-24 h-24 md:w-32 md:h-32">
                <AvatarImage src={user.avatar || "/placeholder.svg"} alt={user.name} />
                <AvatarFallback className="text-2xl md:text-3xl">{user.name.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>

              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                    <Calendar className="w-4 h-4" />
                    <span>Joined {formatDistanceToNow(new Date(stats?.joinDate || ""), { addSuffix: true })}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center gap-2">
                    <Award className="w-5 h-5 text-yellow-500" />
                    <span className="font-semibold">{stats?.reputation}</span>
                    <span className="text-sm text-muted-foreground">reputation</span>
                  </div>
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    {user.role === "admin" ? "Administrator" : "Member"}
                  </Badge>
                </div>
              </div>

              <Button asChild>
                <Link href="/settings">
                  <Settings className="w-4 h-4 mr-2" />
                  Edit Profile
                </Link>
              </Button>
              {/* Admin delete user button (not for own profile) */}
              {user.role === 'ADMIN' && user.id !== undefined && (
                <Button
                  variant="destructive"
                  className="ml-2"
                  onClick={async () => {
                    if (confirm('Are you sure you want to delete this user?')) {
                      try {
                        const res = await fetch(`/api/moderation/users/${user.id}`, { method: 'DELETE' })
                        if (!res.ok) throw new Error('Failed to delete user')
                        alert('User deleted')
                        window.location.href = '/'
                      } catch (err) {
                        alert('Delete failed')
                      }
                    }
                  }}
                >
                  Delete User
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.questionsAsked}</p>
                  <p className="text-sm text-muted-foreground">Questions</p>
                </div>
                <HelpCircle className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.answersGiven}</p>
                  <p className="text-sm text-muted-foreground">Answers</p>
                </div>
                <MessageCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.totalVotes}</p>
                  <p className="text-sm text-muted-foreground">Total Votes</p>
                </div>
                <ArrowUp className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">{stats?.acceptedAnswers}</p>
                  <p className="text-sm text-muted-foreground">Accepted</p>
                </div>
                <Check className="w-8 h-8 text-emerald-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Tabs */}
        <Tabs defaultValue="questions" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:w-auto md:grid-cols-2">
            <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
            <TabsTrigger value="answers">Answers ({answers.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="questions" className="space-y-4">
            {questions.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No questions yet</h3>
                    <p className="text-muted-foreground mb-4">Start by asking your first question!</p>
                    <Button asChild>
                      <Link href="/ask">Ask a Question</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              questions.map((question) => (
                <Card key={question.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-4 h-4" />
                          <span>{question.votes}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          <span>{question.answers}</span>
                        </div>
                        {question.hasAcceptedAnswer && <Check className="w-4 h-4 text-green-500" />}
                      </div>

                      <div className="flex-1">
                        <Link
                          href={`/questions/${question.id}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {question.title}
                        </Link>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {question.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(question.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="answers" className="space-y-4">
            {answers.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No answers yet</h3>
                    <p className="text-muted-foreground mb-4">Help others by answering their questions!</p>
                    <Button asChild>
                      <Link href="/">Browse Questions</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              answers.map((answer) => (
                <Card key={answer.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex flex-col md:flex-row md:items-start gap-4">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <ArrowUp className="w-4 h-4" />
                          <span>{answer.votes}</span>
                        </div>
                        {answer.isAccepted && (
                          <div className="flex items-center gap-1 text-green-500">
                            <Check className="w-4 h-4" />
                            <span>Accepted</span>
                          </div>
                        )}
                      </div>

                      <div className="flex-1">
                        <Link
                          href={`/questions/${answer.questionId}`}
                          className="text-lg font-semibold hover:text-primary transition-colors"
                        >
                          {answer.questionTitle}
                        </Link>
                        <p className="text-muted-foreground mt-2 line-clamp-2">
                          {answer.content.replace(/<[^>]*>/g, "").substring(0, 150)}...
                        </p>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(answer.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
