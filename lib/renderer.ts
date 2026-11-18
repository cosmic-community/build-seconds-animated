import type { PlayerProject, PlayerScene } from '@/types'
import { drawStickman } from '@/lib/stickman'

const TRANSITION_SECONDS = 0.6

export interface SceneLocation {
  index: number
  localTime: number
  start: number
}

export function getCanvasSize(aspect: number): { width: number; height: number } {
  const safe = aspect > 0 ? aspect : 16 / 9
  if (safe >= 1) {
    return { width: 1280, height: Math.round(1280 / safe) }
  }
  return { width: Math.round(1280 * safe), height: 1280 }
}

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
const easeOutCubic = (x: number): number => 1 - Math.pow(1 - x, 3)

function easeOutBounce(x: number): number {
  const n1 = 7.5625
  const d1 = 2.75
  if (x < 1 / d1) return n1 * x * x
  if (x < 2 / d1) {
    const y = x - 1.5 / d1
    return n1 * y * y + 0.75
  }
  if (x < 2.5 / d1) {
    const y = x - 2.25 / d1
    return n1 * y * y + 0.9375
  }
  const y = x - 2.625 / d1
  return n1 * y * y + 0.984375
}

export function locateScene(scenes: PlayerScene[], time: number): SceneLocation | null {
  let start = 0
  for (let i = 0; i < scenes.length; i++) {
    const scene = scenes[i]
    if (!scene) continue
    const isLast = i === scenes.length - 1
    if (time < start + scene.duration || isLast) {
      return { index: i, localTime: Math.min(Math.max(0, time - start), scene.duration), start }
    }
    start += scene.duration
  }
  return null
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: PlayerScene,
  images: Record<string, HTMLImageElement>,
  alpha: number
): void {
  ctx.save()
  ctx.globalAlpha = alpha
  ctx.fillStyle = scene.backgroundColor
  ctx.fillRect(0, 0, w, h)

  const img = scene.backgroundImage ? images[scene.backgroundImage] : undefined
  if (img && img.complete && img.naturalWidth > 0) {
    const scale = Math.max(w / img.naturalWidth, h / img.naturalHeight)
    const dw = img.naturalWidth * scale
    const dh = img.naturalHeight * scale
    ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh)
    ctx.globalAlpha = alpha * 0.5
    ctx.fillStyle = scene.backgroundColor
    ctx.fillRect(0, 0, w, h)
    ctx.globalAlpha = alpha
  }

  const gradient = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.75)
  gradient.addColorStop(0, 'rgba(255,255,255,0.08)')
  gradient.addColorStop(1, 'rgba(0,0,0,0.28)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
  ctx.restore()
}

function wrapLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let current = ''
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word
    if (!current || ctx.measureText(candidate).width <= maxWidth) {
      current = candidate
    } else {
      lines.push(current)
      current = word
    }
  }
  if (current) lines.push(current)
  return lines.slice(0, maxLines)
}

function drawSceneText(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  scene: PlayerScene,
  localTime: number,
  isLast: boolean
): void {
  const t = Math.max(0, localTime - 0.15)
  const e = easeOutCubic(clamp01(t / 0.9))
  let alpha = e
  let offsetY = 0
  let scale = 1

  switch (scene.animationStyle) {
    case 'Slide Up':
      offsetY = (1 - e) * h * 0.1
      break
    case 'Bounce':
      alpha = clamp01(t / 0.25)
      offsetY = -(1 - easeOutBounce(clamp01(t / 1.1))) * h * 0.18
      break
    case 'Zoom In':
      scale = 0.55 + 0.45 * e
      break
    default:
      break
  }

  if (!isLast) {
    alpha *= clamp01((scene.duration - localTime) / 0.4)
  }
  if (alpha <= 0.001) return

  const headSize = Math.min(w * 0.075, h * 0.1)
  const subSize = headSize * 0.42
  const maxWidth = w * 0.84

  ctx.save()
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'

  ctx.font = `800 ${headSize}px Inter, system-ui, sans-serif`
  const headLines = wrapLines(ctx, scene.headline, maxWidth, 3)
  ctx.font = `500 ${subSize}px Inter, system-ui, sans-serif`
  const subLines = scene.subtext ? wrapLines(ctx, scene.subtext, maxWidth, 2) : []

  const headHeight = headLines.length * headSize * 1.12
  const subHeight = subLines.length > 0 ? subSize * 0.6 + subLines.length * subSize * 1.3 : 0
  const blockHeight = headHeight + subHeight

  ctx.globalAlpha = Math.min(1, Math.max(0, alpha))
  ctx.translate(w / 2, h * 0.08 + blockHeight / 2 + offsetY)
  ctx.scale(scale, scale)
  ctx.fillStyle = scene.textColor
  ctx.shadowColor = 'rgba(0,0,0,0.28)'
  ctx.shadowBlur = 14

  let y = -blockHeight / 2
  ctx.font = `800 ${headSize}px Inter, system-ui, sans-serif`
  headLines.forEach((line) => {
    ctx.fillText(line, 0, y)
    y += headSize * 1.12
  })

  if (subLines.length > 0) {
    y += subSize * 0.6
    ctx.globalAlpha = Math.min(1, Math.max(0, alpha)) * 0.85
    ctx.font = `500 ${subSize}px Inter, system-ui, sans-serif`
    subLines.forEach((line) => {
      ctx.fillText(line, 0, y)
      y += subSize * 1.3
    })
  }
  ctx.restore()
}

export function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  project: PlayerProject,
  time: number,
  images: Record<string, HTMLImageElement>
): void {
  const scenes = project.scenes
  ctx.save()
  ctx.globalAlpha = 1
  ctx.fillStyle = '#000000'
  ctx.fillRect(0, 0, w, h)

  const clampedTime = Math.min(Math.max(0, time), project.totalDuration)
  const location = locateScene(scenes, clampedTime)
  const scene = location ? scenes[location.index] : undefined
  if (!location || !scene) {
    ctx.fillStyle = '#0f172a'
    ctx.fillRect(0, 0, w, h)
    ctx.restore()
    return
  }

  const prev = location.index > 0 ? scenes[location.index - 1] : undefined
  const fade = prev ? clamp01(location.localTime / TRANSITION_SECONDS) : 1

  if (prev) {
    drawBackground(ctx, w, h, prev, images, 1)
  }
  drawBackground(ctx, w, h, scene, images, fade)

  // Outgoing stickman fades out while the new one fades in
  if (prev && fade < 1 && prev.stickmanAction) {
    ctx.save()
    ctx.globalAlpha = 1 - fade
    drawStickman(ctx, {
      action: prev.stickmanAction,
      t: prev.duration,
      p: 1,
      w,
      h,
      color: prev.textColor,
    })
    ctx.restore()
  }

  if (scene.stickmanAction) {
    ctx.save()
    ctx.globalAlpha = fade
    drawStickman(ctx, {
      action: scene.stickmanAction,
      t: location.localTime,
      p: scene.duration > 0 ? clamp01(location.localTime / scene.duration) : 0,
      w,
      h,
      color: scene.textColor,
    })
    ctx.restore()
  }

  drawSceneText(ctx, w, h, scene, location.localTime, location.index === scenes.length - 1)
  ctx.restore()
}