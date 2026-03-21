import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMaximize, FiMinimize, FiPause, FiPlay, FiVolume2, FiVolumeX } from 'react-icons/fi'
import './App.css'

const flowerCount = 140

export default function App() {
  const [phase, setPhase] = useState<'flowers-in' | 'video' | 'flowers-out'>(
    'flowers-in',
  )
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)

  // Precompute variaciones para que cada flor florezca diferente
  const flowers = useMemo(
    () =>
      Array.from({ length: flowerCount }).map(() => ({
        scale: 0.8 + Math.random() * 1.4,
        rotate: -14 + Math.random() * 28,
        delay: Math.random() * 1.1,
        y: -6 + Math.random() * 12,
        xPos: Math.random() * 100,
        yPos: Math.random() * 100,
      })),
    [],
  )

  const secretFlower = useMemo(
    () => ({
      xPos: 10 + Math.random() * 80,
      yPos: 10 + Math.random() * 80,
    }),
    [],
  )

  const handleVideoEnd = () => {
    setIsPlaying(false)
    setPhase('flowers-out')
  }

  const handleSecretClick = () => {
    setPhase('video')
    setProgress(0)
    setIsPlaying(true)
    setIsMuted(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
      videoRef.current.muted = true
      videoRef.current.play().catch(() => setIsPlaying(false))
    }
  }

  const restart = () => {
    setPhase('flowers-in')
    setProgress(0)
    setIsPlaying(true)
    setIsMuted(true)
    if (videoRef.current) {
      videoRef.current.currentTime = 0
    }
  }

  const togglePlay = () => {
    const v = videoRef.current
    if (!v) return
    if (v.paused) {
      v.play()
      setIsPlaying(true)
    } else {
      v.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    setIsMuted(v.muted)
  }

  const handleTimeUpdate = () => {
    const v = videoRef.current
    if (!v || !v.duration) return
    setProgress((v.currentTime / v.duration) * 100)
  }

  const handleLoaded = () => {
    const v = videoRef.current
    if (!v) return
    setDuration(v.duration)
    setProgress(0)
    setIsPlaying(true)
    setIsMuted(true)
    v.muted = true
    v.play().catch(() => setIsPlaying(false))
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v || !v.duration) return
    const value = Number(e.target.value)
    v.currentTime = (value / 100) * v.duration
    setProgress(value)
  }

  const toggleFullscreen = async () => {
    if (!frameRef.current) return
    try {
      if (!document.fullscreenElement) {
        await frameRef.current.requestFullscreen()
      } else {
        await document.exitFullscreen()
      }
    } catch {
      // Ignore failures (likely user gesture restrictions)
    }
  }

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullScreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullScreenChange)
  }, [])

  const formatTime = (seconds: number) => {
    if (!isFinite(seconds)) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="stage">
      <div className="title-banner">Para mi Bonita</div>
      <div className="vine-frame" aria-hidden="true">
        <div className="vine-top" />
        <div className="vine-bottom" />
      </div>
      <AnimatePresence>
        {(phase === 'flowers-in' || phase === 'flowers-out') && (
          <motion.div
            key="flowers"
            className="flower-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          >
            {flowers.map((spec, i) => (
              <motion.span
                key={i}
                className="flower"
                style={{
                  '--x': `${spec.xPos}`,
                  '--y': `${spec.yPos}`,
                } as CSSProperties}
                initial={{ y: spec.y, scale: 0.1, opacity: 0 }}
                animate={{ y: 0, scale: spec.scale, rotate: spec.rotate, opacity: 1 }}
                exit={{ y: -12, scale: 0.2, opacity: 0 }}
                transition={{ delay: spec.delay, duration: 0.9, ease: 'easeOut' }}
              />
            ))}
            <motion.span
              key="secret-flower"
              className="flower special"
              style={{ '--x': `${secretFlower.xPos}`, '--y': `${secretFlower.yPos}` } as CSSProperties}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              onClick={handleSecretClick}
              aria-label="Ver el video"
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === 'video' && (
          <motion.div
            key="video"
            className="video-wrap"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <div className="video-frame" ref={frameRef}>
              <div className="frame-decoration" aria-hidden="true" />
              <video
                ref={videoRef}
                src="/video.mp4"
                autoPlay
                muted
                playsInline
                onEnded={handleVideoEnd}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoaded}
                className="video"
              />
              <div className="controls">
                <button className="control icon" onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                <button className="control icon" onClick={toggleMute} aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}>
                  {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                </button>
                <button
                  className="control icon"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
                >
                  {isFullscreen ? <FiMinimize /> : <FiMaximize />}
                </button>
                <div className="time">
                  {formatTime((progress / 100) * duration)} / {formatTime(duration)}
                </div>
                <input
                  type="range"
                  className="slider"
                  min={0}
                  max={100}
                  step={0.1}
                  value={progress}
                  onChange={handleSeek}
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* La flor especial actúa como gatillo de reinicio, así que no se muestra un botón */}
    </div>
  )
}