import { GlobeCanvas } from './components/GlobeCanvas.tsx'
import { SideDrawer } from './components/SideDrawer.tsx'

export default function App() {
  return (
    <div className="flex min-h-svh flex-col bg-slate-950 text-slate-100">
      <header className="flex items-baseline justify-between gap-4 px-5 py-4">
        <h1 className="text-lg font-semibold tracking-tight">NearCrawl</h1>
        <p className="text-sm text-slate-400">Spatial news</p>
      </header>
      <main className="grid min-h-0 flex-1 content-start gap-4 px-5 pb-5 md:grid-cols-[minmax(0,1fr)_20rem] md:content-stretch">
        <GlobeCanvas />
        <SideDrawer />
      </main>
    </div>
  )
}
