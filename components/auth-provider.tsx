'use client'

import type React from 'react'

import { createContext, useState, useEffect } from 'react'
import { useToast } from '@/hooks/use-toast'

interface User {
	id: string
	name: string
	email: string
	avatarUrl?: string
	role: 'USER' | 'ADMIN'
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
	const { toast } = useToast()

	useEffect(() => {
		// Check for current user session
		checkAuth()
	}, [])

	const checkAuth = async () => {
		try {
			const response = await fetch('/api/auth/me')
			if (response.ok) {
				const data = await response.json()
				setUser(data.user)
			}
		} catch (error) {
			console.error('Auth check failed:', error)
		} finally {
			setLoading(false)
		}
	}

	const login = async (email: string, password: string) => {
		try {
			const response = await fetch('/api/auth/login', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ email, password }),
			})

			const data = await response.json()

			if (!response.ok) {
				// Handle validation errors with specific messages
				if (data.details && Array.isArray(data.details)) {
					const validationMessage = data.details[0]?.message || data.error || 'Login failed'
					throw new Error(validationMessage)
				}
				throw new Error(data.error || 'Login failed')
			}

			setUser(data.user)
			toast({
				title: 'Success',
				description: 'Logged in successfully!',
			})
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Login failed',
				variant: 'destructive',
			})
			throw error
		}
	}

	const register = async (name: string, email: string, password: string) => {
		try {
			const response = await fetch('/api/auth/register', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({ name, email, password }),
			})

			const data = await response.json()

			if (!response.ok) {
				// Handle validation errors with specific messages
				if (data.details && Array.isArray(data.details)) {
					const validationMessage = data.details[0]?.message || data.error || 'Registration failed'
					throw new Error(validationMessage)
				}
				throw new Error(data.error || 'Registration failed')
			}

			setUser(data.user)
			toast({
				title: 'Success',
				description: 'Account created successfully!',
			})
		} catch (error) {
			toast({
				title: 'Error',
				description: error instanceof Error ? error.message : 'Registration failed',
				variant: 'destructive',
			})
			throw error
		}
	}

	const logout = async () => {
		try {
			await fetch('/api/auth/logout', { method: 'POST' })
			setUser(null)
			toast({
				title: 'Success',
				description: 'Logged out successfully!',
			})
		} catch (error) {
			console.error('Logout error:', error)
			// Still logout on frontend even if API call fails
			setUser(null)
		}
	}

	return <AuthContext.Provider value={{ user, login, register, logout, loading }}>{children}</AuthContext.Provider>
}
