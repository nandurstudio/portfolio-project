# KKM Smart Vote Production Update - 2026-04-16

## Scope
This document records production changes applied for database alignment, API recovery, image serving fix, and SEO/Open Graph metadata values.

## SEO and Open Graph Metadata
- SEO Title: KKM Smart Vote | Platform Voting Digital KKM
- Canonical URL: https://kkmsmartvote.web.id/
- SEO Description: Platform voting digital KKM Smart Vote untuk pemilihan yang cepat, transparan, dan aman. Lihat kandidat, verifikasi, dan berikan suara secara online.
- OG Image URL: https://kkmsmartvote.web.id/assets/image/og-kkmsmartvote.jpg
- OG Title: KKM Smart Vote - Voting Digital Cepat, Transparan, Aman
- OG Description: Ikuti pemilihan KKM secara online dengan sistem voting digital yang mudah digunakan, aman, dan transparan untuk seluruh anggota.

## Production Changes Applied
1. Database source synchronization from localhost dump to server database and reseed alignment.
2. KKM Smart Vote database runtime configuration fixed to use dedicated `KOPERASI_DB_*` variables.
3. Docker environment updated so KKM Smart Vote resolves to MySQL database `koperasi_vote`.
4. Election settings and candidate seeders updated to match current live data baseline.
5. Nginx fix applied for candidate photo 404:
   - Added dedicated `location ^~ /uploads/` in `services/nginx/conf.d/default.conf`.
   - Mapped uploads to `/var/www/html/kkmsmartvote/backend/public/uploads/`.
   - Validated with `nginx -t`, restarted nginx, and verified image URL returns HTTP 200.

## Verification Snapshot
- `GET /api/election/info` returns HTTP 200 with active election payload.
- Candidate image path under `/uploads/candidates/...` returns HTTP 200.

## Notes
- Keep `web/kkmsmartvote/` as source of truth.
- Use Laragon copy for local testing only.
