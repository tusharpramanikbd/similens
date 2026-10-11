import type { ReactNode } from 'react'

import { Sidebar } from './Sidebar'

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps): React.JSX.Element {
  return (
    <div className="flex h-dvh overflow-hidden bg-canvas text-foreground">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Compact window header */}
        <header className="shrink-0 border-b border-stroke bg-surface px-5 py-3 md:hidden">
          <span className="text-lg font-bold text-brand">Similens</span>
        </header>

        {/* Main content */}
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
