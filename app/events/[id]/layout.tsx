import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/auth'
import Navbar from '@/components/Navbar'

export default async function EventLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireAuth()

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">{children}</main>
    </>
  )
}

