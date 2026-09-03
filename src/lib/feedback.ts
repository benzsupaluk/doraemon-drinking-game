'use client'

/**
 * Sound and vibration for turn alerts.
 *
 * Tones are synthesised with the Web Audio API so there are no audio files to
 * load. iOS does not support navigator.vibrate at all, which is why sound has
 * to be the primary channel.
 */

import { isSoundEnabled } from './session'

let ctx: AudioContext | null = null

function getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (ctx) return ctx
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
    return ctx
}

/** Must be called from a real user event the first time, or the browser blocks audio. */
export function unlockAudio() {
    const audio = getContext()
    if (audio && audio.state === 'suspended') void audio.resume()
}

interface ToneOptions {
    freq: number
    duration: number
    delay?: number
    type?: OscillatorType
    gain?: number
}

function tone({ freq, duration, delay = 0, type = 'sine', gain = 0.16 }: ToneOptions) {
    const audio = getContext()
    if (!audio) return
    if (audio.state === 'suspended') void audio.resume()

    const start = audio.currentTime + delay
    const osc = audio.createOscillator()
    const amp = audio.createGain()

    osc.type = type
    osc.frequency.setValueAtTime(freq, start)
    amp.gain.setValueAtTime(0.0001, start)
    amp.gain.exponentialRampToValueAtTime(gain, start + 0.012)
    amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)

    osc.connect(amp).connect(audio.destination)
    osc.start(start)
    osc.stop(start + duration + 0.02)
}

export function vibrate(pattern: number | number[]) {
    if (typeof navigator === 'undefined') return
    if (typeof navigator.vibrate !== 'function') return
    try {
        navigator.vibrate(pattern)
    } catch {
        // Some browsers block this outright; skip it.
    }
}

/** Our turn: a three-note bell plus a long vibration. */
export function notifyMyTurn() {
    vibrate([0, 180, 90, 180, 90, 320])
    if (!isSoundEnabled()) return
    tone({ freq: 880, duration: 0.16, type: 'triangle', gain: 0.2 })
    tone({ freq: 1174.7, duration: 0.16, delay: 0.16, type: 'triangle', gain: 0.2 })
    tone({ freq: 1567.98, duration: 0.5, delay: 0.32, type: 'triangle', gain: 0.22 })
    tone({ freq: 783.99, duration: 0.5, delay: 0.32, type: 'sine', gain: 0.1 })
}

/** Card flip. */
export function playFlip() {
    vibrate(35)
    if (!isSoundEnabled()) return
    tone({ freq: 420, duration: 0.09, type: 'square', gain: 0.05 })
    tone({ freq: 720, duration: 0.14, delay: 0.07, type: 'triangle', gain: 0.09 })
}

/** Drink up (cards A-4). */
export function playDrink() {
    if (!isSoundEnabled()) return
    tone({ freq: 300, duration: 0.18, type: 'sawtooth', gain: 0.07 })
    tone({ freq: 200, duration: 0.32, delay: 0.14, type: 'sawtooth', gain: 0.07 })
}

/** Someone joined the room. */
export function playJoin() {
    if (!isSoundEnabled()) return
    tone({ freq: 659.25, duration: 0.12, type: 'sine', gain: 0.12 })
    tone({ freq: 987.77, duration: 0.2, delay: 0.1, type: 'sine', gain: 0.12 })
}

/** Game start. */
export function playStart() {
    vibrate([0, 60, 60, 60])
    if (!isSoundEnabled()) return
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) =>
        tone({ freq, duration: 0.22, delay: i * 0.1, type: 'triangle', gain: 0.16 })
    )
}

export function playTap() {
    if (!isSoundEnabled()) return
    tone({ freq: 620, duration: 0.06, type: 'sine', gain: 0.06 })
}
