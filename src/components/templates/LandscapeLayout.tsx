import { cn } from '@/lib/utils'

interface LandscapeLayoutProps {
  children: React.ReactNode
  header?: React.ReactNode
  className?: string
}

export function LandscapeLayout({ children, header, className }: LandscapeLayoutProps) {
  return (
    <div
      className={cn(
        'h-full w-full flex flex-col',
        'safe-area-inset',
        className
      )}
      style={{
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {header && (
        <header className="flex-shrink-0 px-4 py-2 border-b border-border">
          {header}
        </header>
      )}
      <main className="flex-1 overflow-auto flex items-center justify-center">
        {children}
      </main>
    </div>
  )
}
