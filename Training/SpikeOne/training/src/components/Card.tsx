export default function Card({ children }) {
  return (
    <div className="rounded-xl border shadow p-4 bg-white">
      {children}
    </div>
  );
}