export function GlobeCanvas() {
  return (
    <section
      aria-label="Globe"
      className="relative min-h-96 flex-1 overflow-hidden rounded-2xl border border-white/10 bg-[#071018] md:min-h-0"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,#123044_0%,#071018_62%)]" />
      <p className="absolute bottom-4 left-4 text-sm text-slate-300">Globe canvas</p>
    </section>
  )
}
