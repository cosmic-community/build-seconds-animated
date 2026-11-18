import type { StickmanAction } from '@/types'

// A limb is [upperAngle, lowerAngle] in radians, measured from straight down.
// Positive angles swing forward (the figure faces right).
type Limb = [number, number]

interface Pose {
  x: number // hip x position in px
  lift: number // height above the ground in px
  lean: number // torso lean in radians (positive = forward)
  armL: Limb
  armR: Limb
  legL: Limb
  legR: Limb
}

interface PoseInput {
  t: number // seconds since scene start
  p: number // scene progress 0..1
  w: number // canvas width
  H: number // figure scale (px)
}

export interface StickmanOptions {
  action: StickmanAction
  t: number
  p: number
  w: number
  h: number
  color: string
}

const TAU = Math.PI * 2
const clamp01 = (v: number): number => Math.min(1, Math.max(0, v))
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k

// Smoothly interpolates between [time, value] keyframes
function keyframe(u: number, frames: Array<[number, number]>): number {
  const first = frames[0]
  const last = frames[frames.length - 1]
  if (!first || !last) return 0
  if (u <= first[0]) return first[1]
  if (u >= last[0]) return last[1]
  for (let i = 1; i < frames.length; i++) {
    const a = frames[i - 1]
    const b = frames[i]
    if (!a || !b) continue
    if (u <= b[0]) {
      const k = (u - a[0]) / (b[0] - a[0])
      const s = k * k * (3 - 2 * k)
      return a[1] + (b[1] - a[1]) * s
    }
  }
  return last[1]
}

function walkPose({ t, p, w }: PoseInput): Pose {
  const ph = t * TAU * 0.95
  const leg = (phase: number): Limb => {
    const thigh = Math.sin(phase) * 0.55
    const bend = Math.max(0, Math.cos(phase)) * 0.9 + 0.05
    return [thigh, thigh - bend]
  }
  const swing = Math.sin(ph) * 0.5
  return {
    x: lerp(-0.1 * w, 0.5 * w, p),
    lift: 0,
    lean: 0.05,
    armL: [-swing, -swing + 0.5],
    armR: [swing, swing + 0.5],
    legL: leg(ph),
    legR: leg(ph + Math.PI),
  }
}

function runPose({ t, p, w, H }: PoseInput): Pose {
  const ph = t * TAU * 1.9
  const leg = (phase: number): Limb => {
    const thigh = Math.sin(phase) * 0.95
    const bend = Math.max(0, Math.cos(phase)) * 1.5 + 0.2
    return [thigh, thigh - bend]
  }
  const swing = Math.sin(ph) * 0.9
  return {
    x: lerp(-0.1 * w, 1.1 * w, p),
    lift: Math.abs(Math.cos(ph)) * 0.06 * H,
    lean: 0.28,
    armL: [-swing, -swing + 1.4],
    armR: [swing, swing + 1.4],
    legL: leg(ph),
    legR: leg(ph + Math.PI),
  }
}

function jumpPose({ t, w, H }: PoseInput): Pose {
  const period = 1.4
  const u = (t % period) / period
  const crouch = keyframe(u, [[0, 0], [0.25, 1], [0.35, 0], [0.8, 0], [0.88, 0.8], [1, 0]])
  const tuck = keyframe(u, [[0.35, 0], [0.5, 0.7], [0.7, 0.5], [0.8, 0]])
  const arm = keyframe(u, [[0, 0.1], [0.25, -0.9], [0.35, 2.6], [0.8, 2.3], [0.9, -0.6], [1, 0.1]])
  const q = clamp01((u - 0.35) / 0.45)
  const airborne = u >= 0.35 && u <= 0.8
  // Parabolic arc (gravity-like): peak height 0.6H
  const lift = airborne ? 4 * 0.6 * H * q * (1 - q) : 0
  const thigh = crouch * 0.9 + tuck * 0.6
  const bend = crouch * 1.6 + tuck * 1.2
  return {
    x: 0.5 * w,
    lift,
    lean: crouch * 0.35 - tuck * 0.05,
    armL: [arm - 0.15, arm + 0.1],
    armR: [arm, arm + 0.25],
    legL: [thigh - 0.1, thigh - 0.1 - bend],
    legR: [thigh, thigh - bend],
  }
}

function wavePose({ t, w }: PoseInput): Pose {
  const wave = Math.sin(t * TAU * 2.4) * 0.7
  const breath = Math.sin(t * TAU * 0.6) * 0.03
  return {
    x: 0.5 * w,
    lift: 0,
    lean: breath,
    armL: [-0.1 + breath, 0.1 + breath],
    armR: [2.75, 2.75 + wave],
    legL: [0.04, 0.04],
    legR: [-0.04, -0.04],
  }
}

function dancePose({ t, w, H }: PoseInput): Pose {
  const ph = t * TAU * 1.8
  const s = Math.sin(ph)
  const armLUpper = 1.5 + 1.0 * s
  const armRUpper = 1.5 - 1.0 * s
  const thighL = 0.3 * s
  const thighR = -0.3 * s
  const bendL = 0.3 + 0.5 * Math.max(0, s)
  const bendR = 0.3 + 0.5 * Math.max(0, -s)
  return {
    x: 0.5 * w + s * 0.05 * H,
    lift: 0,
    lean: 0.12 * s,
    armL: [armLUpper, armLUpper + 0.6],
    armR: [armRUpper, armRUpper + 0.6],
    legL: [thighL, thighL - bendL],
    legR: [thighR, thighR - bendR],
  }
}

function kickPose({ t, w }: PoseInput): Pose {
  const period = 1.6
  const u = (t % period) / period
  const thigh = keyframe(u, [[0, 0.05], [0.22, -0.5], [0.4, 1.55], [0.58, 1.55], [0.8, 0.1], [1, 0.05]])
  const bend = keyframe(u, [[0, 0.1], [0.22, 1.3], [0.37, 0.9], [0.44, 0], [0.58, 0.05], [0.8, 1.0], [1, 0.1]])
  const strength = keyframe(u, [[0, 0], [0.22, 0.1], [0.4, 1], [0.58, 1], [0.8, 0], [1, 0]])
  const armBack = keyframe(u, [[0, 0.3], [0.4, -1.0], [0.8, 0.2], [1, 0.3]])
  const armFwd = keyframe(u, [[0, -0.2], [0.4, 1.3], [0.8, -0.1], [1, -0.2]])
  const support = 0.1 * strength + 0.05
  return {
    x: 0.5 * w,
    lift: 0,
    lean: -0.2 * strength + 0.05,
    armL: [armBack, armBack + 0.5],
    armR: [armFwd, armFwd + 0.5],
    legL: [support, support - 0.2],
    legR: [thigh, thigh - bend],
  }
}

function getPose(action: StickmanAction, input: PoseInput): Pose {
  switch (action) {
    case 'Walk':
      return walkPose(input)
    case 'Run':
      return runPose(input)
    case 'Jump':
      return jumpPose(input)
    case 'Wave':
      return wavePose(input)
    case 'Dance':
      return dancePose(input)
    case 'Kick':
      return kickPose(input)
    default:
      return wavePose(input)
  }
}

function drawLimb(
  ctx: CanvasRenderingContext2D,
  ox: number,
  oy: number,
  limb: Limb,
  l1: number,
  l2: number,
  foot: number
): void {
  const mx = ox + Math.sin(limb[0]) * l1
  const my = oy + Math.cos(limb[0]) * l1
  const ex = mx + Math.sin(limb[1]) * l2
  const ey = my + Math.cos(limb[1]) * l2
  ctx.beginPath()
  ctx.moveTo(ox, oy)
  ctx.lineTo(mx, my)
  ctx.lineTo(ex, ey)
  if (foot > 0) {
    ctx.lineTo(ex + Math.cos(limb[1]) * foot, ey - Math.sin(limb[1]) * foot)
  }
  ctx.stroke()
}

export function drawStickman(ctx: CanvasRenderingContext2D, options: StickmanOptions): void {
  const { action, t, p, w, h, color } = options
  const H = Math.min(h * 0.36, w * 0.55)
  const ground = h * 0.84
  const pose = getPose(action, { t, p, w, H })

  const headR = 0.075 * H
  const neck = 0.03 * H
  const torso = 0.3 * H
  const upperArm = 0.17 * H
  const foreArm = 0.16 * H
  const thigh = 0.22 * H
  const shin = 0.22 * H
  const foot = 0.07 * H

  const footY = (leg: Limb): number => Math.cos(leg[0]) * thigh + Math.cos(leg[1]) * shin
  const hipY = ground - pose.lift - Math.max(footY(pose.legL), footY(pose.legR))
  const hipX = pose.x

  const shoulderX = hipX + Math.sin(pose.lean) * torso
  const shoulderY = hipY - Math.cos(pose.lean) * torso
  const headX = shoulderX + Math.sin(pose.lean) * (neck + headR)
  const headY = shoulderY - Math.cos(pose.lean) * (neck + headR)

  const baseAlpha = ctx.globalAlpha
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  ctx.lineWidth = Math.max(3, H * 0.035)
  ctx.strokeStyle = color
  ctx.fillStyle = color

  // Ground line
  ctx.globalAlpha = baseAlpha * 0.4
  ctx.beginPath()
  ctx.moveTo(w * 0.04, ground)
  ctx.lineTo(w * 0.96, ground)
  ctx.stroke()

  // Shadow shrinks and fades as the figure leaves the ground
  const air = Math.min(pose.lift / H, 0.7)
  ctx.globalAlpha = baseAlpha * 0.3 * (1 - air * 0.8)
  ctx.fillStyle = 'rgba(0,0,0,1)'
  ctx.beginPath()
  ctx.ellipse(hipX, ground + 0.015 * H, 0.3 * H * (1 - air * 0.5), 0.05 * H, 0, 0, TAU)
  ctx.fill()
  ctx.fillStyle = color

  // Far limbs
  ctx.globalAlpha = baseAlpha * 0.5
  drawLimb(ctx, hipX, hipY, pose.legL, thigh, shin, foot)
  drawLimb(ctx, shoulderX, shoulderY, pose.armL, upperArm, foreArm, 0)

  // Torso and head
  ctx.globalAlpha = baseAlpha
  ctx.beginPath()
  ctx.moveTo(hipX, hipY)
  ctx.lineTo(shoulderX, shoulderY)
  ctx.stroke()
  ctx.beginPath()
  ctx.arc(headX, headY, headR, 0, TAU)
  ctx.fill()

  // Near limbs
  drawLimb(ctx, hipX, hipY, pose.legR, thigh, shin, foot)
  drawLimb(ctx, shoulderX, shoulderY, pose.armR, upperArm, foreArm, 0)

  ctx.restore()
}