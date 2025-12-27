/**
 * Centralized manager for AudioContext lifecycle and state management.
 * Handles creation, resume logic, and state change notifications.
 * Prevents duplicate resume attempts and provides a single source of truth.
 */
class AudioContextManager {
  private context: AudioContext | null = null
  private resumePromise: Promise<void> | null = null
  private stateListeners: Set<(state: AudioContextState) => void> = new Set()

  /**
   * Creates a new AudioContext if one doesn't exist.
   * @returns The AudioContext instance
   */
  createContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext()

      // Listen for state changes and notify listeners
      this.context.onstatechange = () => {
        const state = this.context?.state
        console.log(`AudioContext state changed: ${state}`)
        if (state) {
          this.stateListeners.forEach(listener => listener(state))
        }
      }
    }

    return this.context
  }

  /**
   * Ensures the AudioContext is running, resuming it if suspended.
   * Handles concurrent calls by reusing the same resume promise.
   * @returns Promise that resolves to true if running, false otherwise
   */
  async ensureRunning(): Promise<boolean> {
    if (!this.context) {
      console.warn('AudioContext not created yet')
      return false
    }

    // Already running
    if (this.context.state === 'running') {
      return true
    }

    // Not suspended (e.g., closed)
    if (this.context.state !== 'suspended') {
      console.warn(`AudioContext is in ${this.context.state} state, cannot resume`)
      return false
    }

    // Already resuming - return the existing promise to prevent duplicate calls
    if (this.resumePromise) {
      console.log('Resume already in progress, waiting...')
      await this.resumePromise
      // After async operation, state may have changed - check the current state
      // TypeScript can't track state changes across async operations, so we assert the type
      const currentState = this.context.state as AudioContextState
      return currentState === 'running'
    }

    // Start new resume attempt
    console.log('Resuming suspended audio context...')
    this.resumePromise = this.performResume()

    try {
      await this.resumePromise
      // After async operation, state may have changed - check the current state
      // TypeScript can't track state changes across async operations, so we assert the type
      const currentState = this.context.state as AudioContextState
      const isRunning = currentState === 'running'
      console.log(`Audio context state after resume: ${currentState}`)
      return isRunning
    } finally {
      // Clear the promise so future calls can create a new one if needed
      this.resumePromise = null
    }
  }

  /**
   * Internal method to perform the actual resume operation.
   */
  private async performResume(): Promise<void> {
    if (!this.context) return

    try {
      await this.context.resume()
      // Wait a small amount of time for the context to fully stabilize
      await new Promise(resolve => setTimeout(resolve, 50))
    } catch (error) {
      console.error('Failed to resume audio context:', error)
      throw error
    }
  }

  /**
   * Checks if the context is currently suspended.
   */
  get isSuspended(): boolean {
    return this.context?.state === 'suspended'
  }

  /**
   * Checks if the context is currently running.
   */
  get isRunning(): boolean {
    return this.context?.state === 'running'
  }

  /**
   * Gets the current time from the audio context.
   */
  get currentTime(): number {
    return this.context?.currentTime ?? 0
  }

  /**
   * Gets the current AudioContext state.
   */
  get state(): AudioContextState | null {
    return this.context?.state ?? null
  }

  /**
   * Gets the AudioContext instance.
   */
  getContext(): AudioContext | null {
    return this.context
  }

  /**
   * Register a listener for audio context state changes.
   * @param listener Callback function that receives the new state
   * @returns Cleanup function to remove the listener
   */
  onStateChange(listener: (state: AudioContextState) => void): () => void {
    this.stateListeners.add(listener)
    return () => {
      this.stateListeners.delete(listener)
    }
  }

  /**
   * Closes the audio context and cleans up resources.
   */
  dispose(): void {
    if (this.context) {
      this.context.close()
      this.context = null
      this.resumePromise = null
      this.stateListeners.clear()
    }
  }
}

// Singleton instance
export const audioContextManager = new AudioContextManager()
