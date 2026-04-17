interface CardProps {
  children: React.ReactNode
  className?: string
}

export default function Card({ children, className = '' }: CardProps) {
  return (
    <div className={`rounded-lg shadow p-5 border mb-5 ${className}`}>
      {children}
    </div>
  )
}