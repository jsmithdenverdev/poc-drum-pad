import { audioEngine } from './audio-engine'
import { audioContextManager } from './audio-context-manager'
import type { SequencerPattern, StepCount } from '@/types/audio.types'

type SequencerCallback = (step: number) => void

class Sequencer {
  private isPlaying = false
  private currentStep = 0
  private pattern: SequencerPattern | null = null
  private nextStepTime = 0
  private schedulerTimer: number | null = null
  private stepCallbacks: Set<SequencerCallback> = new Set()
  private stopCallbacks: Set<() => void> = new Set()
  private stepCount: StepCount = 16
  private mutedTracks: Set<string> = new Set()

  // How far ahead to schedule audio (seconds)
  private readonly scheduleAhead = 0.1
  // How often to check for notes to schedule (milliseconds)
  private readonly lookAhead = 25

  constructor() {
    // Stop sequencer when page becomes hidden (phone locked, tab switched)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden' && this.isPlaying) {
        console.log('Page hidden, stopping sequencer')
        this.stop()
      }
    })
  }

  get playing(): boolean {
    return this.isPlaying
  }

  get step(): number {
    return this.currentStep
  }

  setPattern(pattern: SequencerPattern): void {
    this.pattern = pattern
  }

  onStep(callback: SequencerCallback): () => void {
    this.stepCallbacks.add(callback)
    return () => this.stepCallbacks.delete(callback)
  }

  onStop(callback: () => void): () => void {
    this.stopCallbacks.add(callback)
    return () => this.stopCallbacks.delete(callback)
  }

  async start(): Promise<boolean> {
    if (this.isPlaying || !this.pattern) return false

    // Ensure audio context is running before starting sequencer
    const isRunning = await audioContextManager.ensureRunning()
    if (!isRunning) {
      console.log('Cannot start sequencer - failed to resume audio')
      return false
    }

    this.isPlaying = true
    this.currentStep = 0
    // Get fresh current time after ensuring audio is running
    this.nextStepTime = audioEngine.getCurrentTime()
    console.log(`Sequencer starting at time: ${this.nextStepTime}`)
    this.scheduler()
    return true
  }

  stop(): void {
    this.isPlaying = false
    this.currentStep = 0
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer)
      this.schedulerTimer = null
    }
    this.stepCallbacks.forEach(cb => cb(0))
    this.stopCallbacks.forEach(cb => cb())
  }

  private scheduler(): void {
    if (!this.isPlaying || !this.pattern) return

    // Stop if audio context became suspended
    if (audioContextManager.isSuspended) {
      console.log('Audio context suspended, stopping sequencer')
      this.stop()
      return
    }

    const currentTime = audioEngine.getCurrentTime()

    while (this.nextStepTime < currentTime + this.scheduleAhead) {
      this.scheduleStep(this.currentStep, this.nextStepTime)
      this.advanceStep()
    }

    this.schedulerTimer = window.setTimeout(() => this.scheduler(), this.lookAhead)
  }

  private scheduleStep(step: number, time: number): void {
    if (!this.pattern) return

    // Schedule sounds for this step (skip muted tracks)
    this.pattern.tracks.forEach(track => {
      if (track.steps[step]?.active && !this.mutedTracks.has(track.soundId)) {
        const isSynth = track.soundType === 'synth'
        audioEngine.schedulePlay(track.soundId, time, isSynth)
      }
    })

    // Notify callbacks (for visual feedback)
    // Use setTimeout to sync with audio
    const delay = Math.max(0, (time - audioEngine.getCurrentTime()) * 1000)
    setTimeout(() => {
      this.stepCallbacks.forEach(cb => cb(step))
    }, delay)
  }

  private advanceStep(): void {
    if (!this.pattern) return

    const stepsPerBeat = 4 // 16th notes
    const secondsPerBeat = 60 / this.pattern.bpm
    const secondsPerStep = secondsPerBeat / stepsPerBeat

    this.nextStepTime += secondsPerStep
    this.currentStep = (this.currentStep + 1) % this.stepCount
  }

  setStepCount(count: StepCount): void {
    this.stepCount = count
    // Reset current step if it's beyond the new count
    if (this.currentStep >= count) {
      this.currentStep = 0
    }
  }

  getStepCount(): StepCount {
    return this.stepCount
  }

  setMutedTracks(muted: Set<string>): void {
    this.mutedTracks = muted
  }

  setBpm(bpm: number): void {
    if (this.pattern) {
      this.pattern.bpm = Math.max(60, Math.min(200, bpm))
    }
  }

  getBpm(): number {
    return this.pattern?.bpm ?? 120
  }
}

export const sequencer = new Sequencer()
