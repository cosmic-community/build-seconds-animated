# Build Seconds Animated
![App Preview](https://imgix.cosmicjs.com/ddae1080-e37f-11f1-8bde-eb83efbf437d-autopilot-photo-1451187580459-43490279c0fa-1795027374461.jpeg?w=1200&h=630&fit=crop&auto=format,compress)

A creative Next.js portfolio that plays code-driven animated videos built from [Cosmic](https://www.cosmicjs.com) content. Scenes are rendered on a canvas with a procedurally animated stickman, and the result can be exported as a WebM file.

## Features
- Home page listing every video project, with the featured project playable inline
- `/projects/[slug]` player with play/pause, restart, progress bar, second ticks, scene markers and fullscreen
- Procedural stickman actions: Walk, Run, Jump, Wave, Dance and Kick
- Scene animation styles: Fade, Slide Up, Bounce and Zoom In, with crossfaded transitions
- Honors each project's `aspect_ratio` and `fps`
- One-click **Export as WebM** recording
- Responsive dark design built with Tailwind CSS

## Clone this Project

Want to create your own version of this project with all the content and structure? Clone this Cosmic bucket and code repository to get started instantly:

[![Clone this Project](https://img.shields.io/badge/Clone%20this%20Project-29abe2?style=for-the-badge&logo=cosmic&logoColor=white)](https://app.cosmicjs.com/projects/new?clone_bucket=6afdf18348f83858e228faba&clone_repository=6afdf34948f83858e228fb1a)

## Prompts

This application was built using the following prompts to generate the content structure and code:

### Content Model Prompt

> "Create content models for: Build me a 15 seconds to the animated style of video using code"

### Code Generation Prompt

> Build a Next.js application for a creative portfolio called "Build Seconds Animated". The content is managed in Cosmic CMS with the following object types: video-projects, scenes. Create a beautiful, modern, responsive design with a homepage and pages for each content type.
>
> User instructions: A Next.js web app that plays code-driven animated videos built from Cosmic content. Video Projects contain ordered Scenes (headline, subtext, duration_seconds, animation_style, background_color, text_color, optional background_image, and a new stickman_action select: Walk, Run, Jump, Wave, Dance, Kick).
>
> Key feature: a fully code-generated 2D stickman animation rendered on an HTML5 <canvas> (or SVG) with requestAnimationFrame — no video files. The stickman is drawn with lines and a circle head, with jointed arms and legs (shoulder/elbow, hip/knee) animated using sine-wave kinematics. Implement each stickman_action: Walk (leg/arm swing while translating across the screen), Run (faster, leaning), Jump (crouch, jump arc with gravity, land), Wave (one arm waving overhead), Dance (alternating arm pumps and hip sway), Kick (leg kick). Add a simple ground line and subtle shadow.
>
> The featured project "stickman-animation" is 15 seconds: Scene 1 (5s) Walk in, Scene 2 (5s) Jump & Dance, Scene 3 (5s) Wave goodbye. Each scene shows its headline/subtext with its animation_style (Fade, Slide Up, Bounce, Zoom In) over its background_color, with smooth transitions between scenes.
>
> Pages: Home lists all video projects; /projects/[slug] has a player with play/pause, restart, a progress bar with timeline seconds, scene markers, and a fullscreen button, honoring the project's aspect_ratio and fps. Include an 'Export as WebM' button that records the canvas using MediaRecorder + canvas.captureStream so users can download the 15-second video file. Clean, modern, responsive design.

The app has been tailored to work with your existing Cosmic content structure and includes all the features requested above.

## Technologies
- [Next.js 16](https://nextjs.org) (App Router, Server Components)
- React 19 and TypeScript (strict)
- Tailwind CSS 3
- [Cosmic](https://www.cosmicjs.com/docs) SDK for content
- HTML5 Canvas, `requestAnimationFrame`, `MediaRecorder`

## Getting Started

### Prerequisites
- [Bun](https://bun.sh) installed
- A Cosmic bucket with the `video-projects` and `scenes` object types

### Installation
```bash
bun install
bun run dev
```
Set `COSMIC_BUCKET_SLUG`, `COSMIC_READ_KEY` and `COSMIC_WRITE_KEY` in your environment.

## Cosmic SDK Examples
```typescript
const { cosmic } = await getCosmic()
const { objects } = await cosmic.objects
  .find({ type: 'video-projects' })
  .props(['id', 'title', 'slug', 'metadata'])
  .depth(2)
```

## Cosmic CMS Integration
Video Projects reference Scenes through an objects metafield. Fetching with `depth(2)` returns each scene's metadata inline, which is then normalized into a plain, client-safe structure for the canvas player. See the [Cosmic docs](https://www.cosmicjs.com/docs) for more.

## Deployment Options
- **Vercel**: import the repository and set the three Cosmic environment variables.
- **Netlify**: use the Next.js runtime and set the same variables.

Export uses `MediaRecorder` with WebM, which works best in Chrome, Edge and Firefox.
<!-- README_END -->