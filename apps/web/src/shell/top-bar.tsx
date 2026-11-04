import { GithubLogo } from '@phosphor-icons/react'
import { NavLink } from 'react-router-dom'

import { GEOAPIFY_URL, OPENSTREETMAP_COPYRIGHT_URL, PATH, REPOSITORY_URL } from './navigation.constants.ts'
import { Ticker } from './ticker.tsx'

const LINK = 'flex h-8 items-center rounded-full px-3.5 text-[13px] whitespace-nowrap text-ink-2 hover:text-ink'
const CURRENT = 'flex h-8 items-center rounded-full bg-white/10 px-3.5 text-[13px] whitespace-nowrap text-ink'

export function TopBar() {
  return (
    <header className="flex shrink-0 items-center gap-4 bg-space px-5 pt-3.5 pb-3.5">
      <div className="flex shrink-0 items-center gap-3">
        <NavLink
          to={PATH.MAP}
          className="font-semicondensed text-[19px] leading-none font-bold tracking-[-0.01em] whitespace-nowrap text-ink"
        >
          NearCrawl
        </NavLink>
        <p className="flex items-center gap-1.5 text-[12px] whitespace-nowrap text-ink-4">
          <a href={GEOAPIFY_URL} target="_blank" rel="noreferrer" className="hover:text-ink-2">
            Powered by Geoapify
          </a>
          <span aria-hidden>·</span>
          <a href={OPENSTREETMAP_COPYRIGHT_URL} target="_blank" rel="noreferrer" className="hover:text-ink-2">
            © OpenStreetMap contributors
          </a>
        </p>
      </div>
      <div className="min-w-0 flex-1">
        <Ticker />
      </div>
      <nav className="ml-auto flex shrink-0 items-center gap-0.5 rounded-full bg-surface p-1 shadow-[inset_0_0_0_1px_var(--color-hairline)]">
        <NavLink to={PATH.MAP} end className={({ isActive }) => (isActive ? CURRENT : LINK)}>
          Map
        </NavLink>
        <NavLink to={PATH.BRIEF} className={({ isActive }) => (isActive ? CURRENT : LINK)}>
          Daily brief
        </NavLink>
        <a
          href={REPOSITORY_URL}
          target="_blank"
          rel="noreferrer"
          aria-label="Source code on GitHub"
          className="flex size-8 items-center justify-center rounded-full text-ink-3 hover:bg-white/7 hover:text-ink"
        >
          <GithubLogo size={16} />
        </a>
        <button
          type="button"
          className="ml-0.5 flex h-8 items-center rounded-full bg-ink px-3.5 text-[13px] font-medium whitespace-nowrap text-space"
        >
          Sign in
        </button>
      </nav>
    </header>
  )
}
