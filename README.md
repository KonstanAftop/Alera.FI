# ALERA-FI — volunteer workflow prototype

This branch implements the scope in `requirements.md` as an Indonesian, mobile-first demonstration. It is not an operational flood-warning service.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:8080. No backend, environment variables, or API credentials are required. Choose the volunteer or Jaga Balai Majalaya admin demo account. Create a demo volunteer to show village selection and pending approval. New accounts can read monitoring immediately; an admin must approve them under Admin → Relawan before they can write.

```sh
npm run build
npm run lint
npm test
npx tsc --noEmit -p tsconfig.app.json
```

## Demonstration

1. Enter a demo account → Monitoring (default Pos Saya).
2. Switch to Semua Pos; inspect AWLR / ARR / CCTV markers or their accessible cards.
3. Inspect historical data, separate +2 / +3 / +4 hour forecasts, and contextual explanation.
4. Select several posts → review → generate a simulated AI draft → edit → ready to share.
5. Open WhatsApp manually. Return and choose Belum or explicitly confirm sent.
6. Inspect Activity. Incomplete messages can be resumed there after a reload.
7. Change Account monitoring preferences; other posts remain accessible.
8. Enter Admin to manage volunteers, villages, knowledge and demo configuration.

## Scope and limitations

- Monitoring observations and forecasts are deterministic simulated fixtures, timestamped when the demo is first opened. ARR totals integrate timestamped 15-minute measurements; they are not extrapolated from one reading.
- Demo login is a local account selector, not secure authentication. Local storage is per-browser and stores demo accounts, preferences, messages, snapshots and activity. Do not enter sensitive information.
- AI drafting/context explanations are local deterministic simulations. Assistant responses search enabled Admin knowledge and identify their source; no language model is connected.
- CCTV and satellite are explicitly unavailable, rather than fabricated live feeds.
- WhatsApp handoff is user initiated. Confirmation records only the volunteer's statement; it does not verify delivery.
- The map uses OpenStreetMap tiles and needs internet access. The list of posts remains usable if tiles fail. Google Fonts is optional; system fonts are the fallback.
- CCTV is an optional facility on a monitoring post; Majalaya combines AWLR and CCTV in one marker and selection. Camera availability is independent of AWLR status.
- Knowledge uploads support TXT/Markdown up to 200 KB with a title. Text and filename persist locally and enabled text is searchable by the simulated assistant. PDF/DOCX ingestion is not implemented.
- Source statuses and thresholds are demo metadata. Production data freshness, classifications, forecasting and ingestion still require the engineering decisions listed in PRD section 35.
- Browser-local role separation is for demonstration only; production requires server-side authorization and data storage.

Removed from this branch: public marketing landing page, citizen flood reporting, Telegram connection/automation, citizen/community role model, legacy backend, GIS risk/3D tools, and standalone data-table navigation. Historical research and geospatial assets are retained as reference, not exposed as product features.

Visual refresh uses the supplied blue / brown / green / yellow palette: deep blue `#163F78`, blue `#246EAA`, water blue `#539FC5`, pale blue `#C5E6EF`, earth brown `#936D46`, green `#36744E`, and yellow `#F6D95E`, with neutral backgrounds. Colors are approximated from the reference image. Green and yellow indicate conditions; blue outlines indicate selection. Labels preserve meaning without relying on color.

The light map highlights a local subset of the existing OpenStreetMap river geometry (`public/geo/majalaya-rivers.geojson`, derived from `rivers_bandung.geojson`). These river lines are geographic context, not flood extent or a new monitoring layer. No workflow or operational feature was added in the visual refresh.

Account approval: new volunteer accounts (including admin-created accounts) start pending with read-only access. Admin approval unlocks profile/preferences and dissemination writes. Existing accounts migrate as approved. Activation remains separate from approval. This is browser-local workflow enforcement, not production authorization.

First-login guidance highlights map controls and explains approval. One continuous tour automatically opens the real snapshot, detail, source review, draft editor, and confirmation panels for all accounts, including pending accounts; it never opens WhatsApp or sends/saves messages. Next, Back, Skip, and Account → Ulangi pengenalan are available; progress is stored per account in this browser, including for read-only users. Training selections and drafts are temporary; the guide never saves messages or records sending.
