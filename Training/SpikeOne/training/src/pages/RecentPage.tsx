import Card from "../components/Card";
import submission from "../store/useSubmissionStore";

function RecentPage() {
  const submissions = submission((state) => state.submissions);

  return (
    <Card>
      <div className="text-2xl font-bold mb-4">Recent Submissions</div>
      {submissions.length === 0 ? (
        <p className="text-gray-400 italic">No submissions yet</p>
      ) : (
        <ul className="space-y-2">
          {submissions.map((sub) => (
            <li key={sub.id} className="p-2 bg-gray-50 rounded">
              <p>{sub.content}</p>
              <p className="text-xs text-gray-400">
                {new Date(sub.createdAt).toLocaleString()}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

export default RecentPage;
