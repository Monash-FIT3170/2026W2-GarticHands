import { NavLink } from 'react-router-dom'

const phases = [1, 2, 3, 4, 5]

export default function Nav() {
  return (
    <nav className="border-b mb-8 py-3 flex gap-4 px-4">
      {phases.map(n => (
        <NavLink
          key={n}
          to={`/phase-${n}`}
          className={({ isActive }) =>
            `text-sm font-medium px-3 py-1 rounded transition-colors ${
              isActive
                ? 'bg-gray-800 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`
          }
        >
          Phase {n}
        </NavLink>
      ))}
    </nav>
  )
}