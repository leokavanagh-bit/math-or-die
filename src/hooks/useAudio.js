import { useRef, useCallback, useEffect } from 'react'

// 8-bit tension melody — A minor, 150 BPM, 8th notes
const NOTE_DUR = 60 / 150 / 2
const MELODY = [440, 523, 659, 523, 494, 440, 392, 349, 392, 440, 523, 440, 392, 349, 330, 392]
const BASS   = [110, 110, 110, 110, 165, 165, 165, 165,  98,  98,  98,  98, 110, 110, 110, 110]

function scheduleNote(ctx, freq, at, dur, type = 'square', vol = 0.2) {
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.connect(env)
  env.connect(ctx.destination)
  osc.type = type
  osc.frequency.value = freq
  env.gain.setValueAtTime(0, at)
  env.gain.linearRampToValueAtTime(vol, at + 0.01)
  env.gain.exponentialRampToValueAtTime(0.001, at + dur * 0.95)
  osc.start(at)
  osc.stop(at + dur)
}

export default function useAudio() {
  const ctxRef     = useRef(null)
  const timerRef   = useRef(null)
  const beatRef    = useRef(0)
  const playingRef = useRef(false)

  // Lazily create the AudioContext. Called from within user-gesture handlers
  // so iOS accepts the context immediately.
  function getCtx() {
    if (!ctxRef.current) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (AC) ctxRef.current = new AC()
    }
    return ctxRef.current
  }

  // Returns a Promise that resolves once the context is actually running.
  // Must be awaited before scheduling any notes — iOS resume() is async and
  // notes scheduled on a still-suspended context are silently dropped.
  function readyCtx() {
    const c = getCtx()
    if (!c) return Promise.resolve(null)
    if (c.state === 'running') return Promise.resolve(c)
    return c.resume().then(() => c)
  }

  useEffect(() => () => {
    clearTimeout(timerRef.current)
    ctxRef.current?.close()
  }, [])

  const stopMusic = useCallback(() => {
    clearTimeout(timerRef.current)
    playingRef.current = false
  }, [])

  const startMusic = useCallback(() => {
    stopMusic()
    beatRef.current = 0
    playingRef.current = true

    // Await the context being truly running before scheduling the first note.
    // This is the critical iOS fix — resume() is async; calling scheduleNote
    // before it resolves means currentTime hasn't started ticking yet.
    readyCtx().then(c => {
      if (!c || !playingRef.current) return

      function tick() {
        if (!playingRef.current || !ctxRef.current) return
        const t = ctxRef.current.currentTime + 0.05
        const b = beatRef.current % MELODY.length
        scheduleNote(ctxRef.current, MELODY[b], t, NOTE_DUR * 0.85, 'square', 0.12)
        scheduleNote(ctxRef.current, BASS[b],   t, NOTE_DUR * 1.9,  'square', 0.07)
        beatRef.current++
        timerRef.current = setTimeout(tick, NOTE_DUR * 1000)
      }
      tick()
    })
  }, [stopMusic]) // eslint-disable-line react-hooks/exhaustive-deps

  const playCorrect = useCallback(() => {
    readyCtx().then(c => {
      if (!c) return
      const t = c.currentTime + 0.05
      scheduleNote(c, 523, t,        0.08)
      scheduleNote(c, 659, t + 0.08, 0.08)
      scheduleNote(c, 784, t + 0.16, 0.13)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const playWrong = useCallback(() => {
    readyCtx().then(c => {
      if (!c) return
      const t = c.currentTime + 0.05
      scheduleNote(c, 233, t,       0.1,  'sawtooth', 0.3)
      scheduleNote(c, 175, t + 0.1, 0.18, 'sawtooth', 0.2)
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const playPotion = useCallback(() => {
    readyCtx().then(c => {
      if (!c) return
      const t = c.currentTime + 0.05
      ;[784, 988, 1175, 1568].forEach((f, i) =>
        scheduleNote(c, f, t + i * 0.06, 0.1, 'square', 0.15)
      )
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const playVictory = useCallback(() => {
    readyCtx().then(c => {
      if (!c) return
      const t = c.currentTime + 0.05
      ;[523, 659, 784, 1047].forEach((f, i) =>
        scheduleNote(c, f, t + i * 0.16, 0.22, 'square', 0.2)
      )
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const playDefeat = useCallback(() => {
    readyCtx().then(c => {
      if (!c) return
      const t = c.currentTime + 0.05
      ;[523, 466, 392, 311].forEach((f, i) =>
        scheduleNote(c, f, t + i * 0.22, 0.28, 'square', 0.18)
      )
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return { startMusic, stopMusic, playCorrect, playWrong, playPotion, playVictory, playDefeat }
}
