import { Navigate, Route, Routes } from 'react-router-dom'

import { DailyBriefScreen, UserBriefScreen } from './screens/daily-brief-screen.tsx'
import { MapScreen } from './screens/map-screen.tsx'
import { AppShell } from './shell/app-shell.tsx'
import { PATH } from './shell/navigation.constants.ts'

export function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path={PATH.MAP} element={<MapScreen />} />
        <Route path={PATH.BRIEF} element={<DailyBriefScreen />} />
        <Route path={PATH.BRIEF_USER} element={<UserBriefScreen />} />
        <Route path="*" element={<Navigate to={PATH.MAP} replace />} />
      </Route>
    </Routes>
  )
}
