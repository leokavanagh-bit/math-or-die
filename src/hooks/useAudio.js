import { useRef, useCallback, useEffect } from 'react'

// 8-bit tension melody — A minor, 150 BPM, 8th notes (0.2s each)
const NOTE_DUR = 60 / 150 / 2
const MELODY = [440, 523, 659, 523, 494, 440, 392, 349, 392, 440, 523, 440, 392, 349, 330, 392]
const BASS   = [110, 110, 110, 110, 165, 165, 165, 165,  98,  98,  98,  98, 110, 110, 110, 110]

function makeNote(ctx, freq, startTime, duration, type = 'square', gainPeak = 0.25) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.connect(env)
  env.connect(ctx.destination)
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0, startTime)
  env.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, startTime + duration * 0.95)
  osc.start(startTime)
  osc.stop(startTime + duration)
}

export default function useAudio() {
  const ctxRef      = useRef(null)
  const timerRef    = useRef(null)
  const beatRef     = useRef(0)
  const playingRef  = useRef(false)

  function ctx() {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || window.webkitAudioContext)()
    }
    if (ctxRef.current.state === 'suspended') ctxRef.current.resume()
    return ctxRef.current
  }

  const stopMusic = useCallback(() => {
    clearTimeout(timerRef.current)
    playingRef.current = false
  }, [])

  const startMusic = useCallback(() => {
    stopMusic()
    beatRef.current = 0
    playingRef.current = true

    function tick() {
      if (!playingRef.current) return
      const c = ctx()
      const t = c.currentTime
      const b = beatRef.current % MELODY.length
      makeNote(c, MELODY[b], t, NOTE_DUR * 0.85, 'square', 0.12)
      makeNote(c, BASS[b],   t, NOTE_DUR * 1.9,  'square', 0.07)
      beatRef.current++
      timerRef.current = setTimeout(tick, NOTE_DUR * 1000)
    }
    tick()
  }, [stopMusic])

  const playCorrect = useCallback(() => {
    const c = ctx()
    const t = c.currentTime
    makeNote(c, 523, t,        0.08)         // C5
    makeNote(c, 659, t + 0.07, 0.08)         // E5
    makeNote(c, 784, t + 0.14, 0.13)         // G5
  }, [])

  const playWrong = useCallback(() => {
    const c = ctx()
    const t = c.currentTime
    makeNote(c, 233, t,       0.1, 'sawtooth', 0.3)
    makeNote(c, 175, t + 0.09, 0.18, 'sawtooth', 0.2)
  }, [])

  const playPotion = useCallback(() => {
    const c = ctx()
    const t = c.currentTime
    ;[784, 988, 1175, 1568].forEach((f, i) =>
      makeNote(c, f, t + i * 0.06, 0.1, 'square', 0.15)
    )
  }, [])

  const playVictory = useCallback(() => {
    const c = ctx()
    const t = c.currentTime
    // C5 E5 G5 C6 — happy fanfare
    ;[523, 659, 784, 1047].forEach((f, i) =>
      makeNote(c, f, t + i * 0.16, 0.22, 'square', 0.2)
    )
  }, [])

  const playDefeat = useCallback(() => {
    const c = ctx()
    const t = c.currentTime
    // Descending minor — C5 Bb4 G4 Eb4
    ;[523, 466, 392, 311].forEach((f, i) =>
      makeNote(c, f, t + i * 0.22, 0.28, 'square', 0.18)
    )
  }, [])

  useEffect(() => () => {
    clearTimeout(timerRef.current)
    ctxRef.current?.close()
  }, [])

  return { startMusic, stopMusic, playCorrect, playWrong, playPotion, playVictory, playDefeat }
}
