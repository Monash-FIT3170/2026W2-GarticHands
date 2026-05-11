import { useState } from "react";

const ROOM_CODE = "K9L3F";

const PLAYERS = [
  { id: 1, name: "Adrian", color: "bg-purple-600 text-purple-200", status: "host" },
  { id: 2, name: "Lily", color: "bg-teal-700 text-teal-200",   status: "ready" },
  { id: 3, name: "Sam", color: "bg-red-600 text-red-200",     status: "waiting" },
  { id: 4, name: "Max", color: "bg-orange-600 text-orange-200", status: "waiting" },
];

const Badge = ({ status }: { status: string }) => {
  if (status === "host")
    return <span className="text-xs font-bold px-3 py-0.5 rounded-full">Host</span>;
  if (status === "ready")
    return <span className="text-xs font-bold px-3 py-0.5 rounded-full">Ready</span>;
  return <span className="text-xs font-bold px-3 py-0.5 rounded-full">Waiting</span>;
};

export default function hostingPage() {
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(ROOM_CODE).catch(() => {});
    showToast("Room code copied!");
  };

  return (
    <div className="hosting-page">
      <h1 className="text-4xl font-bold mb-6">Hosting Page</h1>
      <div className="mb-4">
        <span className="text-lg font-mono tracking-wide bg-neutral-500 rounded cursor-pointer" onClick={copyCode}>
          {ROOM_CODE}
        </span>
      </div>
      <div className="space-y-3">
        {PLAYERS.map((player) => (
          <div className={`flex items-center space-x-4 p-3 rounded ${player.color}`}>
            <div className="flex-1">
              <div className="font-semibold">{player.name}</div>
            </div>
            <Badge status={player.status} />
          </div>
        ))}
      </div>

      {/* Toast notification */}
      {toastVisible && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded">
          {toast}
        </div>
      )}
    </div>
  )
}