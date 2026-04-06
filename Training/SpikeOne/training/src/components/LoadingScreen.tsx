import { ClipLoader } from 'react-spinners'

export default function LoadingScreen({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <ClipLoader size={42} />
      <div className="text-sm text-gray-600">{label}</div>
    </div>
  )
}

