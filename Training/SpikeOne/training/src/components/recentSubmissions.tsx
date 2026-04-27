import useSubmissionStore from '../store/useSubmissionStore'

export default function RecentSubmissions() {
    const submissions = useSubmissionStore((state) => state.submissions)
    
  return (
    <section>
      <h2 className='text-xl font-semibold mb-3'>Recent Submissions</h2>
      {submissions.length === 0 ? (
        <p>No data yet.</p>
      ) : (
        <ul className='list-disc pl-5'>
          {submissions.map((submission, index) => (
            <li key={index}>{submission}</li>
          ))}
        </ul>
      )}
    </section>
  )
}