export interface CosmicImage {
  url: string
  imgix_url: string
}

export interface CosmicObject {
  id: string
  slug: string
  title: string
  content?: string
  metadata: Record<string, any>
  type: string
  created_at: string
  modified_at: string
  published_at?: string
}

export type AnimationStyle = 'Fade' | 'Slide Up' | 'Bounce' | 'Zoom In'
export type StickmanAction = 'Walk' | 'Run' | 'Jump' | 'Wave' | 'Dance' | 'Kick'

export interface Scene extends CosmicObject {
  type: 'scenes'
  metadata: {
    headline?: string
    subtext?: string
    duration_seconds?: number
    animation_style?: AnimationStyle
    background_color?: string
    text_color?: string
    background_image?: CosmicImage
    stickman_action?: StickmanAction
  }
}

export interface VideoProject extends CosmicObject {
  type: 'video-projects'
  metadata: {
    description?: string
    duration_seconds?: number
    fps?: number
    aspect_ratio?: string
    scenes?: Scene[]
  }
}

// Plain, client-safe structures used by the canvas player
export interface PlayerScene {
  id: string
  headline: string
  subtext: string
  duration: number
  animationStyle: AnimationStyle
  backgroundColor: string
  textColor: string
  backgroundImage: string
  stickmanAction: StickmanAction | ''
}

export interface PlayerProject {
  id: string
  slug: string
  title: string
  description: string
  fps: number
  aspectRatio: number
  aspectLabel: string
  totalDuration: number
  scenes: PlayerScene[]
}