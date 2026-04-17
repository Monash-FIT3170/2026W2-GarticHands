interface Props {
  phase: string
}

export default function Placeholder({ phase }: Props) {
  return (
    <div className="text-center mt-16">
      <h1 className="text-3xl font-bold mb-4">{phase}</h1>
      <p className="text-gray-500">Coming soon.</p>
    </div>
  )
}