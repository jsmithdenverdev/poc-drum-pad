import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class AudioErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Audio Error:', error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex items-center justify-center min-h-screen w-full bg-background"
          style={{
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          }}
        >
          <div className="flex flex-col items-center justify-center gap-6 p-8 text-center max-w-md">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">Audio Error</h1>
              <p className="text-muted-foreground">
                Unable to initialize audio. This may happen if audio permissions are denied or the device doesn't support Web Audio.
              </p>
            </div>

            {this.state.error && (
              <details className="w-full text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Technical details
                </summary>
                <pre className="mt-2 p-3 bg-secondary rounded-md text-xs text-foreground overflow-auto max-h-32">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="flex gap-3 w-full sm:w-auto">
              <Button
                onClick={this.handleRetry}
                variant="default"
                className="gap-2 flex-1 sm:flex-initial"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </Button>
              <Button
                onClick={this.handleRefresh}
                variant="outline"
                className="gap-2 flex-1 sm:flex-initial"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
