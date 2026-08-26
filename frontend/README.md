# Zaizub Frontend

Next.js 15 App Router + TypeScript + Tailwind frontend for Zaizub, an AI video-caption editor.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Before merging the backend, confirm the frontend still passes:

```bash
npx tsc --noEmit
npm run build
```

## Current structure

```text
app/
  page.tsx                 Landing page and language state
  layout.tsx               Fonts and global metadata
  globals.css              Theme, animations, scrollbar, global styles

components/
  Hero.tsx                 Link/file input and current demo generate flow
  Navbar.tsx               Header and language switcher
  PhoneMockup.tsx          Placeholder animated phone preview
  InteractiveDots.tsx      Hero background interaction
  HowItWorks.tsx           Marketing section
  Features.tsx             Marketing section
  Pricing.tsx              Pricing section
  Footer.tsx               Footer
  copy.ts                  English/Thai copy and demo captions
  SmoothScroll.tsx         Lenis scrolling provider
  CustomScrollbar.tsx      Custom page scrollbar

public/
  logo.png                 Existing raster asset
```

## Backend integration plan

Keep backend access out of visual components. Add these folders when the API is ready:

```text
lib/
  api.ts                   Shared fetch client and API error handling
  types.ts                 Shared request/response types

app/api/                   Only if Next.js proxies the backend
  ...

components/editor/
  EditorShell.tsx
  LeftToolbar.tsx
  RightInspector.tsx
  VideoCanvas.tsx
  Timeline.tsx
```

`Hero.tsx` should call a small client function such as `createJob()`, not contain raw fetch URLs, headers, or backend response parsing.

## Suggested API contract

The backend team can implement these endpoints, or map the names to their existing routes.

### Create a caption job

`POST /api/v1/jobs`

For a link:

```json
{
  "source": { "type": "url", "url": "https://example.com/video" },
  "language": "th",
  "captionStyle": "default"
}
```

For an uploaded file, use `multipart/form-data` with fields:

```text
file: video file
language: th | en | auto
captionStyle: default
```

Response:

```json
{
  "jobId": "job_123",
  "status": "queued",
  "sourceId": "source_123"
}
```

### Check job status

`GET /api/v1/jobs/:jobId`

```json
{
  "jobId": "job_123",
  "status": "queued | processing | complete | error",
  "progress": 0,
  "error": null,
  "result": null
}
```

`progress` should be a number from 0 to 100. The frontend should display real backend progress and should not simulate progress after the upload is complete.

### Completed result

```json
{
  "status": "complete",
  "progress": 100,
  "result": {
    "videoUrl": "https://...",
    "durationSeconds": 26.4,
    "captionsUrl": "https://...",
    "captions": [
      {
        "start": 0.2,
        "end": 1.8,
        "text": "รอแป๊บ…",
        "words": [
          { "text": "รอ", "start": 0.2, "end": 0.7 },
          { "text": "แป๊บ…", "start": 0.8, "end": 1.8 }
        ]
      }
    ]
  }
}
```

## Frontend environment variables

Create `.env.local` locally and never commit secrets:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

If the backend uses a browser-restricted API, configure CORS for the frontend origin. If it uses private credentials, proxy requests through a Next.js server route instead of exposing the secret in `NEXT_PUBLIC_*` variables.

## Merge checklist

Before connecting the frontend and backend, agree on:

- API base URL and environment names
- Authentication method and token refresh behavior
- Maximum file size and accepted video MIME types
- Upload method: direct multipart upload or signed storage URL
- Job status values and progress behavior
- Error shape, including invalid links and unsupported files
- Whether video/result URLs are public or require authorization
- CORS origins for local and production environments
- Caption timestamp units: seconds, never milliseconds mixed with seconds
- Thai/English language values: `th`, `en`, and `auto`

## Upload and generate flow

1. User pastes a URL or selects one video file.
2. Frontend clears the other source when one is chosen.
3. Frontend validates file type and size immediately.
4. Frontend uploads the file or submits the URL.
5. Backend returns a `jobId`.
6. Frontend polls `GET /jobs/:jobId` or subscribes through SSE/WebSocket.
7. The editor opens only after a completed result is available.
8. Errors remain in the current UI and offer a clear retry action.

## Important current limitations

- The Generate button currently replays the demo animation; it is not connected to an API yet.
- `PhoneMockup` uses placeholder visuals unless a real `videoSrc` is supplied.
- The editor route and timeline do not exist yet.
- Upload progress in `Hero.tsx` is currently a frontend preview and must be replaced with real upload progress.
- Marketing-section language support should stay threaded through every section before launch.

## Recommended editor boundary

The landing page should submit a job and navigate to `/edit/:jobId`. The editor should load the job by ID and own all editing state:

```text
Landing page → create job → /edit/:jobId
Editor       → load result → edit captions/styles/safe zones → export
```

Keep the backend contract stable even if the editor UI changes. This lets the frontend and backend teams merge independently.
