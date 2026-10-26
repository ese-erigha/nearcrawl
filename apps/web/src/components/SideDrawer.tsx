export function SideDrawer() {
  return (
    <aside className="flex w-full shrink-0 flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/80 p-4 md:w-80">
      <h2 className="text-sm font-medium tracking-wide text-slate-200">Bookmarks</h2>
      <p className="text-sm leading-6 text-slate-400">
        Saved articles stay in this browser, including after they leave the live feed.
      </p>
    </aside>
  )
}
