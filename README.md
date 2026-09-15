# Nagaon University Campaign Backend — Prince Gogoi

Backend/API layer for the campaign website of **Prince Gogoi**, candidate for
**Assistant Secretary — Outdoor Sports**, Nagaon University.

This is the **backend only**. No frontend UI is included; it is designed to be consumed
by a separate React/Vite frontend.

## 1. Project Overview

A lightweight Express + TypeScript API sitting in front of an existing Supabase
project (Postgres database + Storage). It exposes:

- Public read endpoints for campaign promises, gallery, completed work, and member count
- A public "join the campaign" submission endpoint
- Admin-only CRUD endpoints (gated by Supabase Auth + an `admin_profiles` allowlist) for
  managing promises, gallery images, and completed-work entries

No database schema is created or modified by this backend — it strictly reads/writes the
tables and Storage buckets that already exist.

## 2. Requirements

- Node.js 18+
- An existing Supabase project with the tables and Storage buckets described in
  `API.md` / the original spec (`campaign_members`, `promises`, `gallery`,
  `completed_work`, `admin_profiles`, and the `campaign-gallery` / `campaign-assets`
  Storage buckets)

## 3. Installation

```bash
npm install
```

## 4. Environment Variables

Copy `.env.example` to `.env` and fill in real values:

```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
PORT=4000
CORS_ORIGINS=http://localhost:5173
```

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | **Backend only.** Bypasses RLS — never expose this to the frontend, never log it, never commit it. |
| `PORT` | no (default 4000) | Port the Express server listens on |
| `CORS_ORIGINS` | no (default `http://localhost:5173`) | Comma-separated list of allowed frontend origins |

## 5. Supabase Setup Assumptions

This backend assumes the following already exist in Supabase (see `API.md` for full
field lists):

- Tables: `campaign_members`, `promises`, `gallery`, `completed_work`, `admin_profiles`
- Storage buckets: `campaign-gallery`, `campaign-assets` (both public-readable, with
  upload/update/delete already restricted via Storage policies to authenticated users
  present in `admin_profiles`). Set the bucket file-size limit to at least 50MB so
  the application-level media limit can be used.
- An admin becomes an admin by having a row in `admin_profiles` whose `id` matches their
  Supabase Auth user UUID. This backend does not create Auth users or admin_profiles rows —
  that's a separate provisioning step (e.g. via the Supabase dashboard).

## 6. Development

```bash
npm run dev
```
Runs the server with `tsx watch` (auto-restarts on file changes) against `src/server.ts`.

## 7. Production

```bash
npm run build
npm start
```
`npm run build` compiles TypeScript to `dist/`; `npm start` runs the compiled server.

## 8. API Overview

See [`API.md`](./API.md) for the full endpoint reference. Summary:

**Public**
- `GET /api/health`
- `GET /api/campaign/count`
- `POST /api/campaign/join`
- `GET /api/promises`
- `GET /api/gallery`
- `GET /api/completed-work`

**Admin** (all require `Authorization: Bearer <token>`)
- `GET /api/admin/members`
- `GET|POST /api/admin/promises`, `PUT|DELETE /api/admin/promises/:id`
- `GET|POST /api/admin/gallery`, `PUT|DELETE /api/admin/gallery/:id`
- `GET|POST /api/admin/completed-work`, `PUT|DELETE /api/admin/completed-work/:id`

## 9. Authentication Flow

1. The frontend authenticates the admin user directly against Supabase Auth (e.g. email/password
   sign-in), obtaining a Supabase session/access token.
2. The frontend sends that token on every admin request:
   `Authorization: Bearer <access_token>`.
3. The backend's `requireAdmin` middleware:
   - Verifies the token via `supabase.auth.getUser(token)`.
   - Looks up the resulting user UUID in `admin_profiles`.
   - Rejects with `401` if the token is missing/invalid, or `403` if the user is
     authenticated but not present in `admin_profiles`.
4. There is no separate/parallel auth system — Supabase Auth plus `admin_profiles` is the
   single source of truth for admin status. A client can never self-declare `isAdmin: true`.

## 10. Storage Upload Flow

1. Admin submits a `multipart/form-data` request with an `image` file field (gallery /
   completed-work create or update endpoints). The field accepts both photos and videos.
2. `multer` (in-memory storage) validates the MIME type (JPEG/PNG/WEBP/GIF/MP4/WEBM/MOV/OGG)
   and enforces a 50MB size limit before the request reaches the controller.
3. The service layer generates a random UUID-based filename (the client's original
   filename is never trusted) and uploads the buffer directly to the appropriate Supabase
   Storage bucket/path:
    - Gallery media → `campaign-gallery/gallery/<uuid>.<ext>`
    - Completed-work media → `campaign-assets/completed-work/<uuid>.<ext>`
4. The bucket's public URL for that object is saved into the relevant `image_url` column.
5. On update with a new image, the old Storage object is removed only after the DB row
   updates successfully. On delete, the DB row is removed first, then the Storage object;
   a Storage-deletion failure is logged but does not fail the request.

## 11. Security Notes

- The Supabase **service-role key** lives only in backend environment variables. It is
  never returned in any API response and never bundled into frontend code.
- CORS is restricted to explicit origins via `CORS_ORIGINS` — `origin: "*"` is never used.
- `helmet` sets standard secure HTTP headers.
- Request bodies are size-limited (1MB JSON); uploaded photos/videos are limited to 50MB
  and restricted to the documented media-MIME allowlist.
- `POST /api/campaign/join` is rate-limited (5 requests / 15 min / IP) in addition to a
  global baseline rate limit across the whole API.
- All admin routes require a verified Supabase Auth token **and** membership in
  `admin_profiles` — there is no client-supplied admin flag anywhere.
- No endpoint accepts arbitrary table names or raw SQL; all Supabase access goes through
  fixed, hardcoded table/column references in the services layer.
- Errors returned to clients never include stack traces, Supabase credentials, or raw
  database error text — those are logged server-side only.

## 12. Connecting the Future React/Vite Frontend

- Set the frontend's API base URL to wherever this backend is deployed (e.g.
  `http://localhost:4000` in dev).
- Add the frontend's dev/prod origin(s) to the backend's `CORS_ORIGINS` env var.
- For public pages (promises, gallery, completed work, member count, join form), call the
  public endpoints directly — no auth needed.
- For the admin dashboard, use `@supabase/supabase-js` on the frontend to sign the admin
  in via Supabase Auth, then attach the resulting session's access token as
  `Authorization: Bearer <token>` on every request to `/api/admin/*`.
- For gallery/completed-work media uploads from the admin dashboard, submit
  `multipart/form-data` with an `image` file field plus the relevant text fields (see
  `API.md` for exact field names). The saved public URL is rendered as an image or
  native HTML video on the public campaign site.
