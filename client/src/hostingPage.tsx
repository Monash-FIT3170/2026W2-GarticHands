
const ROOM_CODE = "K9L3F";

const PLAYERS = [
  { id: 1, name: "Adrian", color: "bg-purple-600 text-purple-200", status: "host" },
  { id: 2, name: "Lily", color: "bg-teal-700 text-teal-200",   status: "ready" },
  { id: 3, name: "Sam", color: "bg-red-600 text-red-200",     status: "waiting" },
  { id: 4, name: "Max", color: "bg-orange-600 text-orange-200", status: "waiting" },
];

const Badge = ({ status }: { status: string }) => {
  if (status === "host")
    return <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-purple-500/20 text
      .purple-300 border border-purple-500/40">Host</span>;
  if (status === "ready")
    return <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/40">Ready</span>;
  return <span className="text-xs font-bold px-3 py-0.5 rounded-full bg-white/5 text-white/30 border border-white/10">Waiting…</span>;
};

export default function hostingPage() {
  return (
    <div className="hosting-page">
      <h1>Hosting Page</h1>
      <p>Room Code: {ROOM_CODE}</p>
      <div className="players">
        {PLAYERS.map((player) => (
          <div key={player.id} className={`player ${player.color}`}>
            <span className="name">{player.name}</span>
            <Badge status={player.status} />
          </div>
        ))}
      </div>
    </div>
  )
}