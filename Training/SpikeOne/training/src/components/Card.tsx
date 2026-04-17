import type { ReactNode } from 'react'

export default function Card({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border shadow p-4 bg-white">
      {children}
    </div>
  );
}