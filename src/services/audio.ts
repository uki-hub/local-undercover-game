import { useEffect } from 'react'
import trackUrl from '../assets/night-patrol.mp3'
import type { Match } from '../engine/model'
import { useGame } from '../store/session'

const notes = {
  tap: [660],
  round: [392, 523],
  suspense: [220, 233, 220],
  elimination: [330, 247, 196],
  victory: [392, 494, 587, 784],
  timer: [660, 880],
}
type Cue = keyof typeof notes
const announcements: Partial<Record<Match['phase'], Cue>> = {
  ready: 'round', mimeReveal: 'round', wheel: 'suspense', death: 'elimination', victory: 'victory',
}

let context: AudioContext | undefined
let track: AudioBuffer | undefined
let loading = false
let loop: AudioBufferSourceNode | undefined
let startedAt = 0
let offset = 0
let cue: OscillatorNode | undefined
let quiet = false
let pageActive = true

function syncMusic() {
  const ctx = context
  if (!ctx) return
  if (!pageActive || document.hidden || quiet || !useGame.getState().profile.music || ctx.state !== 'running') {
    if (loop && track) {
      offset = (ctx.currentTime - startedAt) % track.duration
      loop.stop()
      loop.disconnect()
      loop = undefined
    }
    return
  }
  if (loop || loading) return
  if (!track) {
    loading = true
    void fetch(trackUrl)
      .then(response => {
        if (!response.ok) throw Error()
        return response.arrayBuffer()
      })
      .then(bytes => ctx.decodeAudioData(bytes))
      .then(buffer => {
        track = buffer
        loading = false
        syncMusic()
      })
      .catch(() => { loading = false })
    return
  }
  loop = ctx.createBufferSource()
  loop.buffer = track
  loop.loop = true
  loop.connect(ctx.destination)
  startedAt = ctx.currentTime - offset
  loop.start(0, offset)
}

// Called inside a click, including keyboard activation and enabling a sound setting.
export function unlockAudio() {
  const { music, effects, audio } = useGame.getState().profile
  if ((!music && !effects && !audio) || document.hidden || !pageActive) return
  try {
    if (!context) {
      context = new AudioContext()
      context.onstatechange = syncMusic
    }
    if (context.state !== 'running') void context.resume().catch(() => {})
    syncMusic()
  } catch { /* Audio is optional on restricted devices. */ }
}

export function playCue(name: Cue) {
  const { audio, effects } = useGame.getState().profile
  const ctx = context
  if (!(name === 'timer' ? audio : effects) || !pageActive || document.hidden || ctx?.state !== 'running') return
  cue?.stop()
  const tone = ctx.createOscillator()
  const volume = ctx.createGain()
  const beat = name === 'tap' ? 0.055 : 0.14
  const start = ctx.currentTime
  tone.type = 'sine'
  tone.connect(volume)
  volume.connect(ctx.destination)
  for (const [i, hz] of notes[name].entries()) {
    const at = start + i * beat
    tone.frequency.setValueAtTime(hz, at)
    volume.gain.setValueAtTime(0, at)
    volume.gain.linearRampToValueAtTime(name === 'tap' ? 0.045 : 0.11, at + 0.008)
    volume.gain.exponentialRampToValueAtTime(0.0001, at + beat * 0.95)
  }
  cue = tone
  tone.onended = () => {
    tone.disconnect()
    volume.disconnect()
    if (cue === tone) cue = undefined
  }
  tone.start()
  tone.stop(start + notes[name].length * beat)
}

export function useGameAudio(phase?: Match['phase']) {
  const music = useGame(s => s.profile.music)
  useEffect(() => {
    quiet = phase === 'clue' || phase === 'discussion'
    syncMusic()
  }, [phase, music])

  useEffect(() => {
    const pause = () => {
      pageActive = false
      cue?.stop()
      syncMusic()
      void context?.suspend().catch(() => {})
    }
    const restore = () => {
      pageActive = !document.hidden
      if (pageActive && context) unlockAudio()
    }
    const visibility = () => { if (document.hidden) pause(); else restore() }
    restore()
    document.addEventListener('visibilitychange', visibility)
    window.addEventListener('pagehide', pause)
    window.addEventListener('pageshow', restore)
    const unsubscribe = useGame.subscribe((next, prev) => {
      if (next.match && next.match !== prev.match) {
        const sound = announcements[next.match.phase]
        if (sound) playCue(sound)
      }
    })
    return () => {
      unsubscribe()
      document.removeEventListener('visibilitychange', visibility)
      window.removeEventListener('pagehide', pause)
      window.removeEventListener('pageshow', restore)
      pause()
    }
  }, [])
}
