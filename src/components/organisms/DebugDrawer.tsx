import { useState, useEffect, useRef } from 'react'
import { Bug, X, Trash2, Copy, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface LogEntry {
  type: 'log' | 'warn' | 'error'
  message: string
  timestamp: Date
}

export function DebugDrawer() {
  const [isOpen, setIsOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [copied, setCopied] = useState(false)
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const originalLog = console.log
    const originalWarn = console.warn
    const originalError = console.error

    const addLog = (type: LogEntry['type'], args: unknown[]) => {
      const message = args
        .map(arg =>
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(' ')

      setLogs(prev => [...prev.slice(-99), { type, message, timestamp: new Date() }])
    }

    console.log = (...args) => {
      originalLog.apply(console, args)
      addLog('log', args)
    }

    console.warn = (...args) => {
      originalWarn.apply(console, args)
      addLog('warn', args)
    }

    console.error = (...args) => {
      originalError.apply(console, args)
      addLog('error', args)
    }

    return () => {
      console.log = originalLog
      console.warn = originalWarn
      console.error = originalError
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [logs, isOpen])

  const copyLogs = async () => {
    const text = logs
      .map(l => `[${l.timestamp.toLocaleTimeString()}] [${l.type.toUpperCase()}] ${l.message}`)
      .join('\n')

    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-4 right-4 z-50 rounded-full w-12 h-12 bg-background"
        onClick={() => setIsOpen(true)}
      >
        <Bug className="w-5 h-5" />
        {logs.some(l => l.type === 'error') && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full" />
        )}
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 flex flex-col">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <h2 className="text-lg font-bold">Debug Logs</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={copyLogs}>
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setLogs([])}>
                <Trash2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-auto p-4 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-muted-foreground">No logs yet...</p>
            ) : (
              logs.map((log, i) => (
                <div
                  key={i}
                  className={cn(
                    'py-1 border-b border-border/50',
                    log.type === 'error' && 'text-red-400',
                    log.type === 'warn' && 'text-yellow-400'
                  )}
                >
                  <span className="text-muted-foreground">
                    {log.timestamp.toLocaleTimeString()}
                  </span>{' '}
                  <span className="uppercase text-[10px] opacity-50">[{log.type}]</span>{' '}
                  <span className="whitespace-pre-wrap break-all">{log.message}</span>
                </div>
              ))
            )}
            <div ref={logsEndRef} />
          </div>
        </div>
      )}
    </>
  )
}
