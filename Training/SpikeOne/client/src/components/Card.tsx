import './Card.css'

interface CardProps {
  children: React.ReactNode
}

export default function Card({ children }: CardProps) {
  return (
    <div className="card">
      {children}
    </div>
  )
}