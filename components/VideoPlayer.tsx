'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { MouseEvent, KeyboardEvent } from 'react'
import type { PlayerProject } from '@/types'
import { drawFrame, getCanvasSize, locateScene } from '@/lib/renderer'
import SceneList from '@/components/SceneList'

interface VideoPlayerProps {
  project: PlayerProject
}

function formatSeconds(value: number): string {
  return `${+value.toFixed(1)}s`
}

export default function VideoPlayer({ project }: VideoPlayerProps) {
  const { width, height } = useMemo(() => getCanvasSize(project.aspectRatio), [project.aspectRatio])
  const total = project.totalDuration

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const timeRef = useRef<number>(0)
  const playingRef = useRef<boolean>(false)
  const dirtyRef = useRef<boolean>(true)
  const imagesRef = useRef<Record<string, HTMLImageElement>>({})
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const exportingRef = useRef<boolean>(false)

  const [playing, setPlaying] = useState<boolean>(false)
  const [currentTime, setCurrentTime] = useState<number>(0)
  const [exporting, setExporting] = useState<boolean>(false)
  const [exportMessage, setExportMessage] = useState<string>('')
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)

  const stopRecording = useCallback((): void => {
    const recorder = recorderRef.current
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop()
    }
  }, [])

  // Preload scene background images
  useEffect(() => {
    let cancelled = false
    project.scenes.forEach((scene) => {
      const url = scene.backgroundImage
      if (!url || imagesRef.current[url]) return
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        if (cancelled) return
        imagesRef.current[url] = img
        dirtyRef.current = true
      }
      const sep = url.includes('?') ? '&' : '?'
      img.src = `${url}${sep}w=${width}&h=${height}&fit=crop&auto=format,compress`
    })
    return () => {
      cancelled = true
    }
  }, [project, width, height])

  // Main animation loop
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    dirtyRef.current = true
    const interval = 1000 / project.fps
    let last = performance.now()
    let raf = 0

    const loop = (now: number): void => {
      raf = requestAnimationFrame(loop)
      const elapsed = now - last
      if (elapsed < interval - 1) return
      last = now

      if (playingRef.current) {
        let next = timeRef.current + Math.min(elapsed, 250) / 1000
        if (next >= total) {
          next = total
          playingRef.current = false
          setPlaying(false)
          if (exportingRef.current) {
            window.setTimeout(() => stopRecording(), 300)
          }
        }
        timeRef.current = next
        dirtyRef.current = true
      }

      if (dirtyRef.current) {
        drawFrame(ctx, width, height, project, timeRef.current, imagesRef.current)
        dirtyRef.current = false
        setCurrentTime(timeRef.current)
      }
    }

    raf = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(raf)
  }, [project, width, height, total, stopRecording])

  // Fullscreen state
  useEffect(() => {
    const onChange = (): void => {
      setIsFullscreen(document.fullscreenElement === containerRef.current)
    }
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const togglePlay = useCallback((): void => {
    if (exportingRef.current || total <= 0) return
    if (!playingRef.current && timeRef.current >= total) {
      timeRef.current = 0
    }
    playingRef.current = !playingRef.current
    dirtyRef.current = true
    setPlaying(playingRef.current)
  }, [total])

  const restart = useCallback((): void => {
    if (exportingRef.current) return
    timeRef.current = 0
    playingRef.current = true
    dirtyRef.current = true
    setPlaying(true)
    setCurrentTime(0)
  }, [])

  const seekTo = useCallback(
    (seconds: number): void => {
      if (exportingRef.current) return
      const clamped = Math.min(total, Math.max(0, seconds))
      timeRef.current = clamped
      dirtyRef.current = true
      setCurrentTime(clamped)
    },
    [total]
  )

  const handleSeek = (e: MouseEvent<HTMLDivElement>): void => {
    const rect = e.currentTarget.getBoundingClientRect()
    if (rect.width <= 0) return
    const ratio = (e.clientX - rect.left) / rect.width
    seekTo(ratio * total)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowRight') {
      e.preventDefault()
      seekTo(timeRef.current + 1)
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault()
      seekTo(timeRef.current - 1)
    } else if (e.key === 'Home') {
      e.preventDefault()
      seekTo(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      seekTo(total)
    } else if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      togglePlay()
    }
  }

  const toggleFullscreen = (): void => {
    const el = containerRef.current
    if (!el) return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void el.requestFullscreen().catch(() => undefined)
    }
  }

  const startExport = (): void => {
    const canvas = canvasRef.current
    if (!canvas || exportingRef.current) return
    if (typeof MediaRecorder === 'undefined' || typeof canvas.captureStream !== 'function') {
      setExportMessage('Your browser does not support canvas recording. Try Chrome, Edge or Firefox.')
      return
    }
    const candidates = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    const mimeType = candidates.find((c) => MediaRecorder.isTypeSupported(c))
    if (!mimeType) {
      setExportMessage('WebM recording is not supported in this browser.')
      return
    }

    const stream = canvas.captureStream(project.fps)
    const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 8000000 })
    chunksRef.current = []
    recorder.ondataavailable = (event: BlobEvent): void => {
      if (event.data.size > 0) chunksRef.current.push(event.data)
    }
    recorder.onstop = (): void => {
      stream.getTracks().forEach((track) => track.stop())
      const blob = new Blob(chunksRef.current, { type: 'video/webm' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${project.slug}.webm`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 5000)
      exportingRef.current = false
      recorderRef.current = null
      setExporting(false)
      setExportMessage('Export complete. Check your downloads for the WebM file.')
    }

    recorderRef.current = recorder
    exportingRef.current = true
    setExporting(true)
    setExportMessage('Recording in real time. Please keep this tab visible…')

    timeRef.current = 0
    dirtyRef.current = true
    recorder.start(250)
    playingRef.current = true
    setPlaying(true)
  }

  const pct = total > 0 ? Math.min(100, (currentTime / total) * 100) : 0
  const location = locateScene(project.scenes, currentTime)
  const activeIndex = location ? location.index : 0

  const segments = useMemo(() => {
    let start = 0
    return project.scenes.map((scene) => {
      const seg = {
        id: scene.id,
        left: total > 0 ? (start / total) * 100 : 0,
        width: total > 0 ? (scene.duration / total) * 100 : 0,
        color: scene.backgroundColor,
        start,
      }
      start += scene.duration
      return seg
    })
  }, [project.scenes, total])

  const ticks = useMemo(() => {
    const step = total <= 20 ? 1 : total <= 60 ? 5 : 10
    const result: number[] = []
    for (let s = 0; s <= Math.floor(total); s += step) result.push(s)
    return result
  }, [total])

  const canvasStyle = isFullscreen
    ? {
        height: 'calc(100vh - 150px)',
        width: 'auto',
        maxWidth: '100%',
        aspectRatio: String(project.aspectRatio),
      }
    : {
        width: '100%',
        height: 'auto',
        maxWidth: project.aspectRatio < 1 ? `${Math.round(project.aspectRatio * 75)}vh` : undefined,
        aspectRatio: String(project.aspectRatio),
      }

  return (
    <div className="space-y-6">
      <div
        ref={containerRef}
        className={`overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl shadow-violet-950/30 ${
          isFullscreen ? 'flex flex-col justify-center rounded-none border-0' : 'rounded-2xl'
        }`}
      >
        <div className="flex justify-center bg-black">
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onClick={togglePlay}
            className="block cursor-pointer bg-black"
            style={canvasStyle}
            aria-label={`${project.title} animation`}
          />
        </div>

        <div className="space-y-3 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={exporting}
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:opacity-50"
            >
              {playing ? '⏸ Pause' : '▶ Play'}
            </button>
            <button
              type="button"
              onClick={restart}
              disabled={exporting}
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 disabled:opacity-50"
            >
              ↺ Restart
            </button>
            <span className="ml-1 font-mono text-sm text-slate-300">
              {formatSeconds(currentTime)} / {formatSeconds(total)}
            </span>
            <div className="ml-auto flex flex-wrap gap-2">
              <button
                type="button"
                onClick={startExport}
                disabled={exporting}
                className="rounded-lg bg-fuchsia-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-500 disabled:opacity-60"
              >
                {exporting ? '⏺ Recording…' : '⬇ Export as WebM'}
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800"
              >
                {isFullscreen ? '⤡ Exit' : '⛶ Fullscreen'}
              </button>
            </div>
          </div>

          <div>
            <div
              role="slider"
              tabIndex={0}
              aria-label="Video progress"
              aria-valuemin={0}
              aria-valuemax={Math.round(total)}
              aria-valuenow={Math.round(currentTime)}
              onClick={handleSeek}
              onKeyDown={handleKeyDown}
              className="relative h-4 cursor-pointer overflow-hidden rounded-full border border-slate-700 bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-500"
            >
              {segments.map((seg) => (
                <div
                  key={seg.id}
                  className="absolute inset-y-0"
                  style={{
                    left: `${seg.left}%`,
                    width: `${seg.width}%`,
                    backgroundColor: seg.color,
                    opacity: 0.7,
                  }}
                />
              ))}
              <div
                className="absolute inset-y-0 left-0 bg-white/35"
                style={{ width: `${pct}%` }}
              />
              {segments.slice(1).map((seg) => (
                <div
                  key={`marker-${seg.id}`}
                  className="absolute inset-y-0 w-0.5 bg-white/80"
                  style={{ left: `${seg.left}%` }}
                />
              ))}
              <div
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow"
                style={{ left: `${pct}%` }}
              />
            </div>
            <div className="relative mt-2 h-4 text-[10px] text-slate-400">
              {ticks.map((sec) => {
                const left = total > 0 ? (sec / total) * 100 : 0
                const transform =
                  left <= 0 ? 'none' : left >= 99.5 ? 'translateX(-100%)' : 'translateX(-50%)'
                return (
                  <span
                    key={sec}
                    className="absolute"
                    style={{ left: `${left}%`, transform }}
                  >
                    {sec}s
                  </span>
                )
              })}
            </div>
          </div>

          {exportMessage ? (
            <p className="text-sm text-fuchsia-200" role="status">
              {exportMessage}
            </p>
          ) : null}
        </div>
      </div>

      <SceneList
        scenes={project.scenes}
        activeIndex={activeIndex}
        onSelect={(startSeconds) => seekTo(startSeconds)}
      />
    </div>
  )
}