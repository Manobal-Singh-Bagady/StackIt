'use client'

import type React from 'react'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { Eye, EyeOff } from 'lucide-react'

export default function RegisterPage() {
	const { register } = useAuth()
	const router = useRouter()
	const { toast } = useToast()
	const [name, setName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirmPassword, setShowConfirmPassword] = useState(false)

const passwordRequirements = [
	'At least 8 characters',
	'At least 1 uppercase letter',
	'At least 1 lowercase letter',
	'At least 1 number',
]

function isPasswordValid(pw: string) {
	return (
		pw.length >= 8 &&
		/[A-Z]/.test(pw) &&
		/[a-z]/.test(pw) &&
		/[0-9]/.test(pw)
	)
}

const handleSubmit = async (e: React.FormEvent) => {
	e.preventDefault()

	if (!isPasswordValid(password)) {
		toast({
			title: 'Invalid password',
			description: 'Password must be at least 8 characters long and include uppercase, lowercase, and a number.',
			variant: 'destructive',
		})
		return
	}

	if (password !== confirmPassword) {
		toast({
			title: 'Password mismatch',
			description: 'Passwords do not match. Please try again.',
			variant: 'destructive',
		})
		return
	}

	setIsLoading(true)

		try {
			await register(name, email, password)
			toast({
				title: 'Account created!',
				description: 'Welcome to StackIt! You can now start asking questions.',
			})
			router.push('/')
		} catch (error) {
			toast({
				title: 'Registration failed',
				description: 'Something went wrong. Please try again.',
				variant: 'destructive',
			})
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='container mx-auto px-4 py-8'>
			<Card className='max-w-md mx-auto'>
				<CardHeader>
					<CardTitle>Create an account</CardTitle>
					<CardDescription>Join StackIt to start asking and answering questions</CardDescription>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className='space-y-4'>
						<div className='space-y-2'>
							<Label htmlFor='name'>Full Name</Label>
							<Input
								id='name'
								type='text'
								value={name}
								onChange={(e) => setName(e.target.value)}
								placeholder='Enter your full name'
								required
							/>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='email'>Email</Label>
							<Input
								id='email'
								type='email'
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								placeholder='Enter your email'
								required
							/>
						</div>
						<div className='space-y-2'>
					<Label htmlFor='password'>Password</Label>
					<ul className='mb-1 ml-4 list-disc text-xs text-gray-500'>
						{passwordRequirements.map((req) => (
							<li key={req}>{req}</li>
						))}
					</ul>
					<div className='relative'>
						<Input
							id='password'
							type={showPassword ? 'text' : 'password'}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder='Create a password'
							required
						/>
						<button
							type='button'
							onClick={() => setShowPassword(!showPassword)}
							className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
							aria-label={showPassword ? 'Hide password' : 'Show password'}>
							{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
						</button>
					</div>
						</div>
						<div className='space-y-2'>
							<Label htmlFor='confirmPassword'>Confirm Password</Label>
							<div className='relative'>
								<Input
									id='confirmPassword'
									type={showConfirmPassword ? 'text' : 'password'}
									value={confirmPassword}
									onChange={(e) => setConfirmPassword(e.target.value)}
									placeholder='Confirm your password'
									required
								/>
								<button
									type='button'
									onClick={() => setShowConfirmPassword(!showConfirmPassword)}
									className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700'
									aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}>
									{showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							</div>
						</div>
						<Button type='submit' className='w-full' disabled={isLoading}>
							{isLoading ? 'Creating account...' : 'Create account'}
						</Button>
					</form>
					<div className='mt-4 text-center text-sm'>
						Already have an account?{' '}
						<Link href='/login' className='text-primary hover:underline'>
							Sign in
						</Link>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
