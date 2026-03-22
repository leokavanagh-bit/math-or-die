import { useRef, useCallback, useEffect } from 'react'

// 8-bit tension melody — A minor, 150 BPM, 8th notes
const NOTE_DUR = 60 / 150 / 2
const AHEAD    = 0.05 // 50ms lookahead: prevents notes being dropped if context just resumed
const MELODY = [440, 523, 659, 523, 494, 440, 392, 349, 392, 440, 523, 440, 392, 349, 330, 392]
const BASS   = [110, 110, 110, 110, 165, 165, 165, 165,  98,  98,  98,  98, 110, 110, 110, 110]

function note(ctx, freq, at, dur, type = 'square', vol = 0.2) {
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

  // Create AudioContext eagerly on mount. iOS starts it in 'suspended' — that's fine.
  // Document listeners call resume() on every touch/click so iOS unblocks it
  // the moment the user first interacts, without needing a manual unlock() call.
  useEffect(() => {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    ctxRef.current = new AC()

    const tryResume = () => ctxRef.current?.resume()
    document.addEventListener('touchstart', tryResume, { passive: true })
    document.addEventListener('click',      tryResume)

    return () => {
      document.removeEventListener('touchstart', tryResume)
      document.removeEventListener('click',      tryResume)
      clearTimeout(timerRef.current)
      ctxRef.current?.close()
    }
  }, [])

  function resume() {
    ctxRef.current?.resume()
  }

  function now() {
    return (ctxRef.current?.currentTime ?? 0) + AHEAD
  }

  const stopMusic = useCallback(() => {
    clearTimeout(timerRef.current)
    playingRef.current = false
  }, [])

  const startMusic = useCallback(() => {
    stopMusic()
    beatRef.current = 0
    playingRef.current = true
    resume()

    function tick() {
      if (!playingRef.current || !ctxRef.current) return
      resume() // keep retrying in case iOS suspended between beats
      const t = now()
      const b = beatRef.current % MELODY.length
      note(ctxRef.current, MELODY[b], t, NOTE_DUR * 0.85, 'square', 0.12)
      note(ctxRef.current, BASS[b],   t, NOTE_DUR * 1.9,  'square', 0.07)
      beatRef.current++
      timerRef.current = setTimeout(tick, NOTE_DUR * 1000)
    }
    tick()
  }, [stopMusic])

  const playCorrect = useCallback(() => {
    if (!ctxRef.current) return
    resume()
    const t = now()
    note(ctxRef.current, 523, t,        0.08)
    note(ctxRef.current, 659, t + 0.08, 0.08)
    note(ctxRef.current, 784, t + 0.16, 0.13)
  }, [])

  const playWrong = useCallback(() => {
    if (!ctxRef.current) return
    resume()
    const t = now()
    note(ctxRef.current, 233, t,       0.1,  'sawtooth', 0.3)
    note(ctxRef.current, 175, t + 0.1, 0.18, 'sawtooth', 0.2)
  }, [])

  const playPotion = useCallback(() => {
    if (!ctxRef.current) return
    resume()
    const t = now()
    ;[784, 988, 1175, 1568].forEach((f, i) =>
      note(ctxRef.current, f, t + i * 0.06, 0.1, 'square', 0.15)
    )
  }, [])

  const playVictory = useCallback(() => {
    if (!ctxRef.current) return
    resume()
    const t = now()
    ;[523, 659, 784, 1047].forEach((f, i) =>
      note(ctxRef.current, f, t + i * 0.16, 0.22, 'square', 0.2)
    )
  }, [])

  const playDefeat = useCallback(() => {
    if (!ctxRef.current) return
    resume()
    const t = now()
    ;[523, 466, 392, 311].forEach((f, i) =>
      note(ctxRef.current, f, t + i * 0.22, 0.28, 'square', 0.18)
    )
  }, [])

  return { startMusic, stopMusic, playCorrect, playWrong, playPotion, playVictory, playDefeat }
}
