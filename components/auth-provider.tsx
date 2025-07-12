"use client"

import type React from "react"

import { createContext, useState, useEffect } from "react"

interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: "user" | "admin"
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for stored user session
    const storedUser = localStorage.getItem("stackit-user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    // Mock login - replace with actual API call
    const mockUser: User = {
      id: "1",
      name: "John Doe",
      email,
      avatar: "/placeholder.svg?height=32&width=32",
      role: "user",
    }

    setUser(mockUser)
    localStorage.setItem("stackit-user", JSON.stringify(mockUser))
  }

  const register = async (name: string, email: string, password: string) => {
    // Mock registration - replace with actual API call
    const mockUser: User = {
      id: Date.now().toString(),
      name,
      email,
      avatar: "/placeholder.svg?height=32&width=32",
      role: "user",
    }

    setUser(mockUser)
    localStorage.setItem("stackit-user", JSON.stringify(mockUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("stackit-user")
  }

  return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}
