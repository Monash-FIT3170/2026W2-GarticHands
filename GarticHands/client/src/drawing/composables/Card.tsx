import type { ReactNode } from 'react'

interface CardProps {
  children: ReactNode
}

export default function Card({ children }: CardProps) {
  return (
    <div className="rounded-xl border shadow p-4 bg-white">
      {children}
    </div>
  )
}
