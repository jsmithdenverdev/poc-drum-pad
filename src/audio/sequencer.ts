import { audioEngine } from './audio-engine'
import type { SequencerPattern } from '@/types/audio.types'

type SequencerCallback = (step: number) => void

class Sequencer {
  private isPlaying = false
  private currentStep = 0
  private pattern: SequencerPattern | null = null
  private nextStepTime = 0
  private schedulerTimer: number | null = null
  private stepCallbacks: Set<SequencerCallback> = new Set()

  // How far ahead to schedule audio (seconds)
  private readonly scheduleAhead = 0.1
  // How often to check for notes to schedule (milliseconds)
  private readonly lookAhead = 25

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

  start(): void {
    if (this.isPlaying || !this.pattern) return

    this.isPlaying = true
    this.currentStep = 0
    this.nextStepTime = audioEngine.getCurrentTime()
    this.scheduler()
  }

  stop(): void {
    this.isPlaying = false
    this.currentStep = 0
    if (this.schedulerTimer !== null) {
      clearTimeout(this.schedulerTimer)
      this.schedulerTimer = null
    }
    this.stepCallbacks.forEach(cb => cb(0))
  }

  private scheduler(): void {
    if (!this.isPlaying || !this.pattern) return

    const currentTime = audioEngine.getCurrentTime()

    while (this.nextStepTime < currentTime + this.scheduleAhead) {
      this.scheduleStep(this.currentStep, this.nextStepTime)
      this.advanceStep()
    }

    this.schedulerTimer = window.setTimeout(() => this.scheduler(), this.lookAhead)
  }

  private scheduleStep(step: number, time: number): void {
    if (!this.pattern) return

    // Schedule sounds for this step
    this.pattern.tracks.forEach(track => {
      if (track.steps[step]?.active) {
        audioEngine.schedulePlay(track.soundId, time)
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
    this.currentStep = (this.currentStep + 1) % 16 // 16 steps per pattern
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
