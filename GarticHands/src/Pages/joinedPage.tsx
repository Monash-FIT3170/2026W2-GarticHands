import { useState, useEffect } from "react";
import { getRoom } from "../api/room";
import { useParams, useLocation } from "react-router-dom";

// const ROOM_CODE = "K9L3F";

//const PLAYERS = [
//  { id: 1, name: "Adrian", color: "bg-purple-600 text-purple-200", status: "host" },
//  { id: 2, name: "Lily", color: "bg-teal-700 text-teal-200",   status: "ready" },
//  { id: 3, name: "Sam", color: "bg-red-600 text-red-200",     status: "ready" },
//  { id: 4, name: "Max", color: "bg-orange-600 text-orange-200", status: "ready" },
//];

const Badge = ({ status }: { status: string }) => {
  if (status === "host")
    return <span className="text-xs font-bold px-3 py-0.5 rounded-full">Host</span>;
  if (status === "ready")
    return <span className="text-xs font-bold px-3 py-0.5 rounded-full">Ready</span>;
  return <span className="text-xs font-bold px-3 py-0.5 rounded-full">Waiting</span>;
};

export default function joinedPage() {
  const { roomCode } = useParams();
  const location = useLocation();

  const [players, setPlayers] = useState<any[]>(location.state?.room?.players || []);
  const [toast, setToast] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!roomCode) return;

    async function loadRoom() {
      const data = await getRoom(roomCode as string);

      if (data.success) {
        setPlayers(data.room.players);
      }
    }

    loadRoom();

    const interval = setInterval(loadRoom, 1000);

    return () => clearInterval(interval);
  }, [roomCode])

  const showToast = (msg: string) => {
    setToast(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  };

  const copyCode = () => {
    if (!roomCode) return;
    navigator.clipboard.writeText(roomCode).catch(() => {});
    showToast("Room code copied!");
  };
  
  const handleReady = () => {
    setReady((prev) => !prev);
  };

  const readyCount = players.filter(
    (p) => p.status === "ready" || p.status === "host"
  ).length;

  return (
    <div className="joined-page">
      <h1 className="text-4xl font-bold mb-6">Lobby</h1>

      <div className="mb-4">
        <span
          className="text-lg font-mono tracking-wide bg-neutral-500 rounded cursor-pointer px-3 py-1"
          onClick={copyCode}
        >
          {roomCode}
        </span>
      </div>

      <div className="space-y-3">
        {players.map((player, index) => (
          <div
            key={index}
            className="flex items-center space-x-4 p-3 rounded bg-neutral-700 text-white"
          >
            <div className="flex-1">
              <div className="font-semibold">{player.name}</div>
            </div>
            <Badge status={player.status} />
          </div>
        ))}
      </div>

      <button
        onClick={handleReady}
        className={`mt-6 px-6 py-3 rounded font-bold 
          ${ready ? "bg-green-600 text-white hover:bg-green-700" : "bg-gray-500 text-gray-300"}`}
      >
        {ready ? "Ready" : "Not Ready"}
      </button>

      <p className="mt-4 text-sm text-gray-400">
        {readyCount} of {players.length} players are ready
      </p>

      {toastVisible && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-700 text-white px-4 py-2 rounded">
          {toast}
        </div>
      )}
    </div>
  );
}