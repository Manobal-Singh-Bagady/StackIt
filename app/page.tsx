import { Suspense } from 'react'
import { QuestionList } from '@/components/question-list'
import { SearchAndFilters } from '@/components/search-and-filters'
import { LoadingSpinner } from '@/components/loading-spinner'

export default function HomePage() {
	return (
		<div className='container mx-auto px-4 py-8'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold mb-2'>Welcome to StackIt</h1>
				<p className='text-muted-foreground'>A minimal Q&A platform for collaborative learning and knowledge sharing</p>
			</div>

			<SearchAndFilters />

			<Suspense fallback={<LoadingSpinner />}>
				<QuestionList />
			</Suspense>
		</div>
	)
}
