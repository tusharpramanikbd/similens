export function Sidebar(): React.JSX.Element {
  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-stroke bg-surface px-5 py-6 md:flex">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-control bg-brand text-lg font-bold text-white">
          S
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-tight text-foreground">Similens</h1>
          <p className="text-xs text-muted">Photo culling</p>
        </div>
      </div>

      {/* Workspace */}
      <div className="mt-10">
        <p className="px-3 text-xs font-semibold uppercase tracking-wider text-muted">Workspace</p>

        <div className="mt-3 rounded-control bg-brand/10 px-3 py-2.5 text-sm font-medium text-brand">
          Photo Review
        </div>
      </div>

      {/* Footer */}
      <div className="mt-auto border-t border-stroke pt-4">
        <p className="text-xs leading-5 text-muted">Local AI for smarter photo culling.</p>
      </div>
    </aside>
  )
}
