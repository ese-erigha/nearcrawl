import { Outlet } from 'react-router-dom'

import { TopBar } from './top-bar.tsx'

export function AppShell() {
  return (
    <div className="flex h-svh flex-col overflow-hidden bg-space text-ink">
      <TopBar />
      <div className="relative min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
