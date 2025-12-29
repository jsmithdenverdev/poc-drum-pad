import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertTriangle, RefreshCw, Copy, Check } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  copied: boolean
}

export class AudioErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null, errorInfo: null, copied: false }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo)
    this.setState({ errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null, copied: false })
  }

  handleRefresh = () => {
    window.location.reload()
  }

  handleCopy = async () => {
    const { error, errorInfo } = this.state
    const errorText = [
      `Error: ${error?.message || 'Unknown error'}`,
      '',
      'Stack trace:',
      error?.stack || 'No stack trace',
      '',
      'Component stack:',
      errorInfo?.componentStack || 'No component stack',
    ].join('\n')

    try {
      await navigator.clipboard.writeText(errorText)
      this.setState({ copied: true })
      setTimeout(() => this.setState({ copied: false }), 2000)
    } catch {
      // Fallback for older browsers
      console.log(errorText)
    }
  }

  getErrorDetails = () => {
    const { error, errorInfo } = this.state
    return [
      error?.message || 'Unknown error',
      '',
      error?.stack || '',
      errorInfo?.componentStack || '',
    ].join('\n')
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
              <h1 className="text-2xl font-bold text-foreground">Something went wrong</h1>
              <p className="text-muted-foreground">
                An unexpected error occurred. Try refreshing the page.
              </p>
            </div>

            {this.state.error && (
              <details className="w-full text-left">
                <summary className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                  Technical details
                </summary>
                <div className="mt-2 space-y-2">
                  <pre className="p-3 bg-secondary rounded-md text-xs text-foreground overflow-auto max-h-48 whitespace-pre-wrap break-words">
                    {this.getErrorDetails()}
                  </pre>
                  <Button
                    onClick={this.handleCopy}
                    variant="outline"
                    size="sm"
                    className="gap-2 w-full"
                  >
                    {this.state.copied ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy error details
                      </>
                    )}
                  </Button>
                </div>
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
