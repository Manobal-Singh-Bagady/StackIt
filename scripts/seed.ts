import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
	console.log('🌱 Starting seed...')

	// Create users
	const hashedPassword = await bcrypt.hash('password123', 12)

	const user1 = await prisma.user.upsert({
		where: { email: 'john@example.com' },
		update: {},
		create: {
			name: 'John Doe',
			email: 'john@example.com',
			password: hashedPassword,
			role: 'USER',
		},
	})

	const user2 = await prisma.user.upsert({
		where: { email: 'jane@example.com' },
		update: {},
		create: {
			name: 'Jane Smith',
			email: 'jane@example.com',
			password: hashedPassword,
			role: 'USER',
		},
	})

	const admin = await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: {
			name: 'Admin User',
			email: 'admin@example.com',
			password: hashedPassword,
			role: 'ADMIN',
		},
	})

	// Create tags
	const tags = [
		{ name: 'javascript', description: 'Questions about JavaScript programming' },
		{ name: 'react', description: 'Questions about React library' },
		{ name: 'nextjs', description: 'Questions about Next.js framework' },
		{ name: 'typescript', description: 'Questions about TypeScript' },
		{ name: 'nodejs', description: 'Questions about Node.js runtime' },
		{ name: 'css', description: 'Questions about CSS styling' },
		{ name: 'html', description: 'Questions about HTML markup' },
		{ name: 'database', description: 'Questions about databases' },
		{ name: 'mongodb', description: 'Questions about MongoDB' },
		{ name: 'api', description: 'Questions about APIs' },
	]

	for (const tag of tags) {
		await prisma.tag.upsert({
			where: { name: tag.name },
			update: {},
			create: tag,
		})
	}

	// Create questions
	const question1 = await prisma.question.create({
		data: {
			title: 'How to implement JWT authentication in Next.js?',
			description: `<p>I'm trying to implement JWT authentication in my Next.js application but facing some issues with token storage and validation. Here are my specific questions:</p>

<ol>
  <li>Where should I store the JWT token? localStorage, cookies, or somewhere else?</li>
  <li>How do I validate the token on each request?</li>
  <li>What's the best way to handle token refresh?</li>
</ol>

<p>Any help would be appreciated!</p>`,
			authorId: user1.id,
			tagNames: ['nextjs', 'javascript', 'api'],
		},
	})

	const question2 = await prisma.question.create({
		data: {
			title: 'React useState vs useReducer - When to use which?',
			description: `<p>I'm confused about when to use <code>useState</code> and when to use <code>useReducer</code> in React. Can someone explain:</p>

<ul>
  <li>The differences between them</li>
  <li>Use cases for each</li>
  <li>Performance implications</li>
</ul>

<p>Examples would be great!</p>`,
			authorId: user2.id,
			tagNames: ['react', 'javascript'],
		},
	})

	const question3 = await prisma.question.create({
		data: {
			title: 'Best practices for MongoDB schema design',
			description: `<p>I'm designing a MongoDB schema for a social media application and need advice on:</p>

<ol>
  <li><strong>Embedding vs References:</strong> When should I embed documents vs create references?</li>
  <li><strong>Indexing:</strong> What indexes should I create for optimal performance?</li>
  <li><strong>Data modeling:</strong> How should I model relationships like followers/following?</li>
</ol>

<p>Any experienced MongoDB developers willing to share their insights?</p>`,
			authorId: user1.id,
			tagNames: ['mongodb', 'database'],
		},
	})

	// Create answers
	const answer1 = await prisma.answer.create({
		data: {
			content: `<p>Great question! Here's my approach to JWT authentication in Next.js:</p>

<h3>1. Token Storage</h3>
<p>I recommend using <strong>HTTP-only cookies</strong> for security reasons:</p>
<ul>
  <li>Prevents XSS attacks</li>
  <li>Automatically sent with requests</li>
  <li>Can be secured with SameSite and Secure flags</li>
</ul>

<h3>2. Token Validation</h3>
<p>Use middleware to validate tokens on each request:</p>
<pre><code>// middleware.ts
export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')
  // Validate token here
}</code></pre>

<h3>3. Token Refresh</h3>
<p>Implement refresh tokens with shorter access token lifetimes for better security.</p>`,
			questionId: question1.id,
			authorId: user2.id,
			isAccepted: true,
		},
	})

	const answer2 = await prisma.answer.create({
		data: {
			content: `<p>Here's a simple breakdown:</p>

<h3>useState</h3>
<ul>
  <li>Simple state updates</li>
  <li>Independent state variables</li>
  <li>Direct state setting</li>
</ul>

<h3>useReducer</h3>
<ul>
  <li>Complex state logic</li>
  <li>Multiple related state variables</li>
  <li>State transitions based on actions</li>
</ul>

<p>Use <code>useReducer</code> when you have complex state logic that involves multiple sub-values or when the next state depends on the previous one.</p>`,
			questionId: question2.id,
			authorId: user1.id,
		},
	})

	// Create some votes
	await prisma.vote.createMany({
		data: [
			{ userId: user2.id, targetType: 'QUESTION', targetId: question1.id, voteType: 'UP' },
			{ userId: admin.id, targetType: 'QUESTION', targetId: question1.id, voteType: 'UP' },
			{ userId: user1.id, targetType: 'QUESTION', targetId: question2.id, voteType: 'UP' },
			{ userId: admin.id, targetType: 'ANSWER', targetId: answer1.id, voteType: 'UP' },
			{ userId: user1.id, targetType: 'ANSWER', targetId: answer1.id, voteType: 'UP' },
		],
	})

	// Create notifications
	await prisma.notification.createMany({
		data: [
			{
				userId: user1.id,
				type: 'ANSWER',
				title: 'New answer on your question',
				message: 'Jane Smith answered your question about JWT authentication',
				relatedQuestionId: question1.id,
				relatedUserId: user2.id,
			},
			{
				userId: user2.id,
				type: 'VOTE',
				title: 'Your answer was upvoted',
				message: 'Your answer about JWT authentication received an upvote',
				relatedQuestionId: question1.id,
				relatedUserId: admin.id,
			},
		],
	})

	console.log('✅ Seed completed successfully!')
	console.log('👤 Test users created:')
	console.log('   john@example.com / password123')
	console.log('   jane@example.com / password123')
	console.log('   admin@example.com / password123')
}

main()
	.catch((e) => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})
