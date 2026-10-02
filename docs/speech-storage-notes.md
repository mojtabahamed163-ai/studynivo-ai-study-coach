# Speech and storage implementation notes

- Speech transcription endpoint: `POST $MANUS_API_URL/v1/audio/transcriptions` with multipart form fields `file`, `model=whisper-1`, optional `prompt`; supported audio formats: webm, mp3, wav, ogg, m4a.
- The verbose response includes `task`, `language`, `duration`, `text`, and `segments`; segments may include `start`, `end`, and confidence metadata. Persist transcript text and timestamp segments when later study behavior needs them.
- Upload validation belongs on the trusted server. Show unsupported-format and size errors; retry only transient failures.
- Durable objects use `GET /v1/storage/presign/put?path=...` and `GET /v1/storage/presign/get?path=...` with the runtime bearer credential. Store application ownership/index records in the database and stable `/manus-storage/<key>` addresses; signed URLs are temporary and must not be persisted as the canonical address.
- Source guidance: `/home/ubuntu/skills/webdev/references/speech.md` and `/home/ubuntu/skills/webdev/references/storage.md`.
