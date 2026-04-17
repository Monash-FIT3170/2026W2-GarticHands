import { ClipLoader } from 'react-spinners'

export default function LoadingSpinner() {
  return (
    <div className="flex justify-center items-center mt-16">
      <ClipLoader size={50} color="#1f2937" />
    </div>
  )
}