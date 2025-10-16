import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Qualis <span className="text-blue-600">Digital</span>
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Comprehensive care management system for UK care companies
        </p>
        <div className="space-y-4">
          <Button asChild size="lg">
            <Link href="/auth">Get Started</Link>
          </Button>
          <br />
          <Button asChild variant="outline" size="lg">
            <Link href="/dashboard">View Demo</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}