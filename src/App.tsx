import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { FiArrowLeft, FiMaximize, FiMinimize, FiPause, FiPlay, FiVolume2, FiVolumeX } from 'react-icons/fi'
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

type Letter = {
  id: string
  title: string
  subtitle: string
  type: 'image'
  src: string
  theme: 'rose' | 'gold' | 'blue' | 'green'
}

const letters: Letter[] = [
  { id: 'flor-azul', title: 'Mi flor azul', subtitle: 'Una carta especial', type: 'image', src: '/letters/flor-azul-html.jpg', theme: 'blue' },
  { id: 'flor-azul-pdf', title: 'Mi flor azul - PDF', subtitle: 'Versión imagen de la carta', type: 'image', src: '/letters/flor-azul.jpg', theme: 'blue' },
  { id: 'aniversario', title: 'Nuestro aniversario', subtitle: 'Seis meses juntos', type: 'image', src: '/letters/aniversario.jpg', theme: 'rose' },
  { id: 'medieval', title: 'Mi Pinwinita', subtitle: 'Carta medieval', type: 'image', src: '/letters/medieval.jpg', theme: 'gold' },
  { id: 'cita', title: 'Carta de cita', subtitle: 'Una invitacion muy especial', type: 'image', src: '/letters/carta-cita.jpg', theme: 'rose' },
  { id: 'indumentaria', title: 'Indumentaria', subtitle: 'Ideas para nuestra cita', type: 'image', src: '/letters/indumentaria-cita.jpg', theme: 'green' },
  { id: 'seis-meses', title: '6 meses a tu lado', subtitle: 'Nuestro tiempo juntas', type: 'image', src: '/letters/seis-meses.jpg', theme: 'rose' },
  { id: 'carta-moderna', title: 'Carta moderna', subtitle: 'Para mi persona favorita', type: 'image', src: '/letters/carta-moderna.png', theme: 'blue' },
]

export default function App() {
  const [phase, setPhase] = useState<'flowers-in' | 'gallery' | 'letter' | 'video' | 'flowers-out'>(
    'flowers-in',
  )
  const [selectedLetter, setSelectedLetter] = useState<Letter | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const frameRef = useRef<HTMLDivElement | null>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(1)
  const [progress, setProgress] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [videoTheme, setVideoTheme] = useState<'yellow' | 'blue' | 'red'>('yellow')

  // Precompute variaciones para que cada flor florezca diferente
  const flowers = useMemo(() => flowerSpecs, [])

  const secretFlower = useMemo(
    () => ({
      red: {
        xPos: 50,
        yPos: 38,
      },
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

  const openGallery = () => {
    setVideoTheme('red')
    setPhase('gallery')
  }

  const openLetter = (letter: Letter) => {
    setSelectedLetter(letter)
    setPhase('letter')
  }

  const closeLetter = () => {
    setSelectedLetter(null)
    setPhase('gallery')
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
    const nextMuted = !v.muted
    v.muted = nextMuted
    if (!nextMuted && v.volume === 0) {
      v.volume = volume > 0 ? volume : 0.5
    }
    setIsMuted(nextMuted)
  }

  const handleVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = videoRef.current
    if (!v) return
    const nextVolume = Number(e.target.value)
    v.volume = nextVolume
    v.muted = nextVolume === 0
    setVolume(nextVolume)
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

  const returnToFlowers = () => {
    const v = videoRef.current
    if (v) v.pause()

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => undefined)
    } else {
      const webkitDocument = document as Document & {
        webkitFullscreenElement?: Element | null
        webkitExitFullscreen?: () => Promise<void> | void
      }
      if (webkitDocument.webkitFullscreenElement) {
        webkitDocument.webkitExitFullscreen?.()
      }
    }

    setIsPlaying(false)
    setPhase('flowers-in')
  }

  const toggleFullscreen = async () => {
    const frame = frameRef.current
    const video = videoRef.current
    if (!frame) return

    type WebkitDocument = Document & {
      webkitFullscreenElement?: Element | null
      webkitExitFullscreen?: () => Promise<void> | void
    }
    type WebkitFrame = HTMLDivElement & {
      webkitRequestFullscreen?: () => Promise<void> | void
    }
    type WebkitVideo = HTMLVideoElement & {
      webkitEnterFullscreen?: () => void
    }

    const webkitDocument = document as WebkitDocument
    const webkitFrame = frame as WebkitFrame
    const webkitVideo = video as WebkitVideo | null
    const fullscreenElement = document.fullscreenElement ?? webkitDocument.webkitFullscreenElement

    try {
      if (!fullscreenElement) {
        if (frame.requestFullscreen) {
          await frame.requestFullscreen()
        } else if (webkitFrame.webkitRequestFullscreen) {
          await webkitFrame.webkitRequestFullscreen()
        } else if (webkitVideo?.webkitEnterFullscreen) {
          webkitVideo.webkitEnterFullscreen()
        } else {
          return
        }
      } else {
        if (document.exitFullscreen) {
          await document.exitFullscreen()
        } else if (webkitDocument.webkitExitFullscreen) {
          await webkitDocument.webkitExitFullscreen()
        }
      }
    } catch {
      // The browser can reject fullscreen outside a direct user gesture.
    }
  }

  useEffect(() => {
    const onFullScreenChange = () => {
      setIsFullscreen(Boolean(
        document.fullscreenElement ??
        (document as Document & { webkitFullscreenElement?: Element | null }).webkitFullscreenElement,
      ))
    }
    document.addEventListener('fullscreenchange', onFullScreenChange)
    document.addEventListener('webkitfullscreenchange', onFullScreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', onFullScreenChange)
      document.removeEventListener('webkitfullscreenchange', onFullScreenChange)
    }
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
              key="red-gallery-flower"
              className="flower special special-red"
              style={{ '--x': `${secretFlower.red.xPos}`, '--y': `${secretFlower.red.yPos}` } as CSSProperties}
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{ scale: 1.12, opacity: 1 }}
              exit={{ scale: 0.2, opacity: 0 }}
              whileHover={{ scale: 1.22 }}
              whileTap={{ scale: 0.96 }}
              transition={{ delay: 0.45, duration: 0.7, ease: 'easeOut' }}
              onClick={openGallery}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') openGallery()
              }}
              aria-label="Abrir la galeria de cartas"
            />
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
        {phase === 'gallery' && (
          <motion.section
            key="gallery"
            className="letter-gallery"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.45 }}
            aria-label="Galeria de cartas"
          >
            <header className="gallery-header">
              <button className="gallery-back" onClick={() => setPhase('flowers-in')} aria-label="Volver a la pantalla principal">
                <FiArrowLeft /> Volver
              </button>
              <div>
                <p className="gallery-kicker">Para mi Bonita</p>
                <h1>Nuestras cartas</h1>
              </div>
            </header>
            <div className="letter-grid">
              {letters.map((letter) => (
                <motion.button
                  type="button"
                  className={`letter-card theme-${letter.theme}`}
                  key={letter.id}
                  onClick={() => openLetter(letter)}
                  whileHover={{ y: -6 }}
                  whileTap={{ scale: 0.98 }}
                  aria-label={`Abrir ${letter.title}`}
                >
                  <span className="letter-preview" aria-hidden="true">
                    {letter.type === 'image' ? (
                      <img src={letter.src} alt="" />
                    ) : (
                      <>
                        <span className="preview-seal" />
                        <span className="preview-line" />
                        <span className="preview-line short" />
                      </>
                    )}
                  </span>
                  <span className="letter-meta">
                    <strong>{letter.title}</strong>
                    <small>{letter.subtitle}</small>
                  </span>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {phase === 'letter' && selectedLetter && (
          <motion.section
            key="letter"
            className="letter-view"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35 }}
            aria-label={selectedLetter.title}
          >
            <header className="letter-toolbar">
              <div className="letter-actions">
                <button className="gallery-back" onClick={closeLetter} aria-label="Volver a la galeria">
                  <FiArrowLeft /> Galeria
                </button>
                <button
                  className="gallery-back"
                  onClick={() => {
                    setSelectedLetter(null)
                    setPhase('flowers-in')
                  }}
                  aria-label="Volver a la pantalla principal con las flores"
                >
                  <FiArrowLeft /> Inicio
                </button>
              </div>
              <h2>{selectedLetter.title}</h2>
            </header>
            <div className="letter-document">
              <img src={selectedLetter.src} alt={selectedLetter.title} />
            </div>
          </motion.section>
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
                <button
                  className="control return-control"
                  onClick={returnToFlowers}
                  aria-label="Volver a la pantalla principal con las flores"
                >
                  <FiArrowLeft /> Inicio
                </button>
                <button className="control icon" onClick={togglePlay} aria-label={isPlaying ? 'Pausar' : 'Reproducir'}>
                  {isPlaying ? <FiPause /> : <FiPlay />}
                </button>
                <button className="control icon" onClick={toggleMute} aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}>
                  {isMuted ? <FiVolumeX /> : <FiVolume2 />}
                </button>
                <input
                  type="range"
                  className="volume-slider"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolume}
                  aria-label="Volumen"
                />
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