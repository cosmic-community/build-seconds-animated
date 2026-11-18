import { getCosmic } from '@/lib/cosmic-preview'
import type {
  AnimationStyle,
  PlayerProject,
  PlayerScene,
  Scene,
  StickmanAction,
  VideoProject,
} from '@/types'

export function hasStatus(error: unknown): error is { status: number } {
  return typeof error === 'object' && error !== null && 'status' in error
}

export function getMetafieldValue(field: unknown): string {
  if (field === null || field === undefined) return ''
  if (typeof field === 'string') return field
  if (typeof field === 'number' || typeof field === 'boolean') return String(field)
  if (typeof field === 'object' && field !== null && 'value' in field) {
    return String((field as { value: unknown }).value)
  }
  if (typeof field === 'object' && field !== null && 'key' in field) {
    return String((field as { key: unknown }).key)
  }
  return ''
}

export function getDateValue(item: {
  published_at?: string | null
  modified_at?: string | null
  created_at?: string | null
}): number {
  const raw = item.published_at || item.modified_at || item.created_at
  const time = raw ? Date.parse(raw) : NaN
  return Number.isNaN(time) ? 0 : time
}

const PROJECT_PROPS = ['id', 'title', 'slug', 'type', 'metadata', 'created_at', 'modified_at']

export async function getProjects(): Promise<VideoProject[]> {
  try {
    const { cosmic, previewToken } = await getCosmic()
    const query = cosmic.objects
      .find({ type: 'video-projects' })
      .props(PROJECT_PROPS)
      .depth(2)
    const response = previewToken ? await query.status('any') : await query
    const projects = [...(response.objects as VideoProject[])]
    return projects.sort((a, b) => {
      if (a.slug === 'stickman-animation') return -1
      if (b.slug === 'stickman-animation') return 1
      return getDateValue(b) - getDateValue(a)
    })
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return []
    }
    throw error
  }
}

export async function getProjectBySlug(slug: string): Promise<VideoProject | null> {
  try {
    const { cosmic, previewToken } = await getCosmic()
    const query = cosmic.objects
      .findOne({ type: 'video-projects', slug })
      .props(PROJECT_PROPS)
      .depth(2)
    const { object } = previewToken ? await query.status('any') : await query
    if (!object) return null
    return object as VideoProject
  } catch (error) {
    if (hasStatus(error) && error.status === 404) {
      return null
    }
    throw error
  }
}

const ANIMATION_STYLES: AnimationStyle[] = ['Fade', 'Slide Up', 'Bounce', 'Zoom In']
const STICKMAN_ACTIONS: StickmanAction[] = ['Walk', 'Run', 'Jump', 'Wave', 'Dance', 'Kick']

function toAnimationStyle(value: string): AnimationStyle {
  const found = ANIMATION_STYLES.find((s) => s.toLowerCase() === value.trim().toLowerCase())
  return found ?? 'Fade'
}

function toStickmanAction(value: string): StickmanAction | '' {
  const found = STICKMAN_ACTIONS.find((s) => s.toLowerCase() === value.trim().toLowerCase())
  return found ?? ''
}

function toPositiveNumber(value: unknown, fallback: number): number {
  const n = Number(getMetafieldValue(value))
  return Number.isFinite(n) && n > 0 ? n : fallback
}

function isSceneObject(value: unknown): value is Scene {
  return (
    typeof value === 'object' &&
    value !== null &&
    'metadata' in value &&
    typeof (value as { metadata: unknown }).metadata === 'object' &&
    (value as { metadata: unknown }).metadata !== null
  )
}

function parseAspect(raw: string): { ratio: number; label: string } {
  const match = raw.match(/(\d+(?:\.\d+)?)\s*[:x\/]\s*(\d+(?:\.\d+)?)/i)
  if (match && match[1] && match[2]) {
    const a = Number(match[1])
    const b = Number(match[2])
    if (a > 0 && b > 0) {
      return { ratio: a / b, label: `${match[1]}:${match[2]}` }
    }
  }
  return { ratio: 16 / 9, label: '16:9' }
}

function toPlayerScene(scene: Scene): PlayerScene {
  const m = scene.metadata
  return {
    id: scene.id,
    headline: getMetafieldValue(m.headline) || scene.title,
    subtext: getMetafieldValue(m.subtext),
    duration: toPositiveNumber(m.duration_seconds, 5),
    animationStyle: toAnimationStyle(getMetafieldValue(m.animation_style)),
    backgroundColor: getMetafieldValue(m.background_color).trim() || '#0f172a',
    textColor: getMetafieldValue(m.text_color).trim() || '#ffffff',
    backgroundImage: m.background_image?.imgix_url ?? '',
    stickmanAction: toStickmanAction(getMetafieldValue(m.stickman_action)),
  }
}

export function toPlayerProject(project: VideoProject): PlayerProject {
  const rawScenes: unknown[] = Array.isArray(project.metadata?.scenes)
    ? project.metadata.scenes
    : []
  const scenes: PlayerScene[] = rawScenes.filter(isSceneObject).map(toPlayerScene)
  const aspect = parseAspect(getMetafieldValue(project.metadata?.aspect_ratio))
  const fpsRaw = toPositiveNumber(project.metadata?.fps, 30)
  const fps = Math.min(60, Math.max(12, Math.round(fpsRaw)))
  const sceneTotal = scenes.reduce((sum, s) => sum + s.duration, 0)

  return {
    id: project.id,
    slug: project.slug,
    title: project.title,
    description: getMetafieldValue(project.metadata?.description),
    fps,
    aspectRatio: aspect.ratio,
    aspectLabel: aspect.label,
    totalDuration: sceneTotal,
    scenes,
  }
}