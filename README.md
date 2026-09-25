# ALERA-FI — volunteer workflow prototype

This branch implements the scope in `requirements.md` as an Indonesian, mobile-first demonstration. It is not an operational flood-warning service.

## Run

```sh
npm install
npm run dev
```

Open http://localhost:8080. No backend, environment variables, or API credentials are required. Choose the volunteer or Jaga Balai Majalaya admin demo account. Create a demo volunteer to show village selection and monitoring onboarding.

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
8. Enter Admin to manage volunteers, villages, sources, thresholds, knowledge and demo configuration.

## Scope and limitations

- Monitoring observations and forecasts are deterministic simulated fixtures, timestamped when the demo is first opened. ARR totals integrate timestamped 15-minute measurements; they are not extrapolated from one reading.
- Demo login is a local account selector, not secure authentication. Local storage is per-browser and stores demo accounts, preferences, messages, snapshots and activity. Do not enter sensitive information.
- AI drafting/context explanations are local deterministic simulations. Assistant responses search enabled Admin knowledge and identify their source; no language model is connected.
- CCTV and satellite are explicitly unavailable, rather than fabricated live feeds.
- WhatsApp handoff is user initiated. Confirmation records only the volunteer's statement; it does not verify delivery.
- The map uses OpenStreetMap tiles and needs internet access. The list of posts remains usable if tiles fail. Google Fonts is optional; system fonts are the fallback.
- Source statuses and thresholds are configurable demo metadata. Production data freshness, classifications, forecasting and ingestion still require the engineering decisions listed in PRD section 35.
- Browser-local role separation is for demonstration only; production requires server-side authorization and data storage.

Removed from this branch: public marketing landing page, citizen flood reporting, Telegram connection/automation, citizen/community role model, legacy backend, GIS risk/3D tools, and standalone data-table navigation. Historical research and geospatial assets are retained as reference, not exposed as product features.

Palette: navy `#16324F`, teal `#178C8C`, light teal `#BFE3DF`, warm white `#F7F5EF`, charcoal `#202A2E`, gray `#D9E0DE`.
