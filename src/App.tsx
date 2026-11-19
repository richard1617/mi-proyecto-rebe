import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiMaximize, FiMinimize, FiPause, FiPlay, FiVolume2, FiVolumeX } from 'react-icons/fi'
import './App.css'

const flowerCount = 140

const createFlowerSpecs = () => {
  let seed = 1617
  const random = () => {
    seed = (seed * 48271) % 2147483647
    return seed / 2147483647
  }

  return Array.from({ length: flowerCount }, () => ({
    scale: 0.8 + random() * 1.4,
    rotate: -14 + random() * 28,
    delay: random() * 1.1,
    y: -6 + random() * 12,
    xPos: random() * 100,
    yPos: random() * 100,
  }))
}

const flowerSpecs = createFlowerSpecs()

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
  const [videoTheme, setVideoTheme] = useState<'yellow' | 'blue'>('yellow')

  // Precompute variaciones para que cada flor florezca diferente
  const flowers = useMemo(() => flowerSpecs, [])

  const secretFlower = useMemo(
    () => ({
      yellow: {
        xPos: 24,
        yPos: 34,
      },
      blue: {
        xPos: 76,
        yPos: 68,
      },
    }),
    [],
  )

  const handleVideoEnd = () => {
    setIsPlaying(false)
    setPhase('flowers-out')
  }

  const handleSecretClick = (theme: 'yellow' | 'blue') => {
    setVideoTheme(theme)
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
    <div className={`stage theme-${videoTheme}`}>
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
              key="yellow-secret-flower"
              className="flower special special-yellow"
              style={{ '--x': `${secretFlower.yellow.xPos}`, '--y': `${secretFlower.yellow.yPos}` } as CSSProperties}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              onClick={() => handleSecretClick('yellow')}
              aria-label="Ver el video amarillo"
            />
            <motion.span
              key="blue-secret-flower"
              className="flower special special-blue"
              style={{ '--x': `${secretFlower.blue.xPos}`, '--y': `${secretFlower.blue.yPos}` } as CSSProperties}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              onClick={() => handleSecretClick('blue')}
              aria-label="Ver el video azul"
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
                src={videoTheme === 'blue' ? '/video2.mp4' : '/video.mp4'}
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