# API Documentation — Prince Gogoi Campaign Backend

Base URL (local dev): `http://localhost:4000`

All responses follow one of these two shapes:

**Success**
```json
{ "success": true, "data": { } }
```
or
```json
{ "success": true, "message": "..." }
```

**Error**
```json
{
  "success": false,
  "error": {
    "code": "SOME_ERROR_CODE",
    "message": "Human readable message"
  }
}
```

Common error codes: `VALIDATION_ERROR` (400), `UNAUTHORIZED` (401), `FORBIDDEN` (403),
`NOT_FOUND` (404), `PAYLOAD_TOO_LARGE` (413), `UNSUPPORTED_MEDIA_TYPE` (415),
`TOO_MANY_REQUESTS` (429), `INTERNAL_ERROR` (500).

---

## Health

### `GET /api/health`
- **Auth:** none
- **Response:**
```json
{ "success": true, "message": "Campaign backend is running." }
```

---

## PUBLIC APIs

### `GET /api/campaign/count`
- **Auth:** none
- **Response:**
```json
{ "success": true, "count": 0 }
```
Count is always read live from `campaign_members` — never hardcoded.

---

### `POST /api/campaign/join`
- **Auth:** none
- **Rate limit:** 5 requests / 15 minutes per IP
- **Request body:**
```json
{
  "full_name": "Jane Doe",
  "department": "Computer Science",
  "semester": "5th"
}
```
- **Validation:**
  - All three fields required, trimmed, non-empty
  - `full_name` / `department` max 150 chars, `semester` max 50 chars
  - `full_name` restricted to letters/numbers/basic punctuation
  - Any other field in the body (e.g. `isAdmin`, `id`) is silently ignored — never trusted
- **Response:**
```json
{ "success": true, "message": "Successfully joined the campaign." }
```
The inserted record is never echoed back.

---

### `GET /api/promises`
- **Auth:** none
- **Response:** `{ "success": true, "data": [ ...promise objects, or [] ] }`
- Fields per item: `id, title_en, title_as, description_en, description_as, status, completed_at, created_at, updated_at`

---

### `GET /api/gallery`
- **Auth:** none
- **Response:** `{ "success": true, "data": [ ...gallery items, or [] ] }`
- Fields per item: `id, image_url, caption_en, caption_as, created_at`

---

### `GET /api/completed-work`
- **Auth:** none
- **Response:** `{ "success": true, "data": [ ...work items, or [] ] }`
- Fields per item: `id, title_en, title_as, description_en, description_as, image_url, work_date, created_at, updated_at`

---

## ADMIN APIs

All admin routes require:
```
Authorization: Bearer <SUPABASE_ACCESS_TOKEN>
```
The token is verified against Supabase Auth, and the resulting user UUID must exist in
`admin_profiles`. Missing/invalid token → `401 UNAUTHORIZED`. Valid but non-admin user →
`403 FORBIDDEN`.

### `GET /api/admin/members`
Returns all campaign members, newest first.
- **Response fields:** `id, full_name, department, semester, joined_at`

---

### Promises

#### `GET /api/admin/promises`
Same shape as the public endpoint.

#### `POST /api/admin/promises`
- **Body:**
```json
{
  "title_en": "Better sports equipment",
  "title_as": "...",
  "description_en": "optional",
  "description_as": "optional",
  "status": "pending"
}
```
- `status` must be `"pending"` or `"completed"`. `created_at`/`updated_at`/`completed_at` are
  always server-derived — clients cannot set them.
- If `status` is `"completed"`, `completed_at` is set to the current time automatically.

#### `PUT /api/admin/promises/:id`
- `:id` must be a valid UUID.
- Same body shape as POST.
- If `status` changes to `"completed"` and `completed_at` isn't already set, it's set now.
- If `status` changes back to `"pending"`, `completed_at` is cleared.

#### `DELETE /api/admin/promises/:id`
Deletes only the specified promise. 404 if it doesn't exist.

---

### Gallery

#### `GET /api/admin/gallery`
Same shape as the public endpoint.

#### `POST /api/admin/gallery`
- **Content-Type:** `multipart/form-data`
- **Fields:** `caption_en` (optional), `caption_as` (optional)
- **File field:** `image` (required) — JPEG/PNG/WEBP/GIF/MP4/WEBM/MOV/OGG, max 50MB
- Uploads to Supabase Storage bucket `campaign-gallery` at `gallery/<generated-uuid>.<ext>`
  (client-provided filenames are never trusted). Saves the resulting public URL to
  `gallery.image_url` (rendered as a photo or video by the public site).

#### `PUT /api/admin/gallery/:id`
- Same as POST; `image` file is optional on update (captions can be updated alone).
- If new photo/video is uploaded, the old Storage object is removed after the DB update succeeds.

#### `DELETE /api/admin/gallery/:id`
- Deletes the DB record, then attempts to remove the corresponding Storage object.
  Storage-deletion failures are logged but do not fail the request (the DB record is
  already gone).

---

### Completed Work

#### `GET /api/admin/completed-work`
Same shape as the public endpoint.

#### `POST /api/admin/completed-work`
- **Content-Type:** `multipart/form-data`
- **Fields:** `title_en`, `title_as` (required), `description_en`, `description_as`,
  `work_date` (YYYY-MM-DD) — all optional
- **File field:** `image` (optional) — JPEG/PNG/WEBP/GIF/MP4/WEBM/MOV/OGG, max 50MB
- Uploads to Supabase Storage bucket `campaign-assets` at
  `completed-work/<generated-uuid>.<ext>`.

#### `PUT /api/admin/completed-work/:id`
- Same as POST; `image` optional on update. Old photo/video removed after successful DB update
  if a new one is uploaded.

#### `DELETE /api/admin/completed-work/:id`
- Deletes the DB record and attempts to remove its Storage image.

---

## Example requests

```bash
# Public: get member count
curl http://localhost:4000/api/campaign/count

# Public: join campaign
curl -X POST http://localhost:4000/api/campaign/join \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Jane Doe","department":"Computer Science","semester":"5th"}'

# Admin: list members
curl http://localhost:4000/api/admin/members \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>"

# Admin: create a promise
curl -X POST http://localhost:4000/api/admin/promises \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"title_en":"Better sports equipment","title_as":"...","status":"pending"}'

# Admin: upload a gallery image
curl -X POST http://localhost:4000/api/admin/gallery \
  -H "Authorization: Bearer <SUPABASE_ACCESS_TOKEN>" \
  -F "image=@/path/to/photo.jpg" \
  -F "caption_en=Sports Day 2026" \
  -F "caption_as=..."
```
