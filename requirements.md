# ALERA-FI Product Requirements Document

## 1. Product Overview

**ALERA-FI** adalah platform operasional flood monitoring dan communication support yang digunakan oleh relawan komunitas untuk:

1. Memantau kondisi hidrometeorologi.
2. Memahami perubahan kondisi melalui historical context.
3. Melihat forecast tinggi muka air 2–4 jam ke depan.
4. Memilih data monitoring yang relevan.
5. Mengubah data teknis menjadi informasi kewaspadaan yang mudah dipahami warga menggunakan AI.
6. Membagikan informasi tersebut ke WhatsApp.
7. Mencatat aktivitas diseminasi.

ALERA-FI ditujukan terutama untuk penggunaan melalui smartphone dan harus dapat digunakan oleh pengguna yang tidak memiliki latar belakang teknis, geospasial, atau hidrologi.

---

# 2. Operational Context

Wilayah operasional awal adalah Kecamatan Majalaya.

Kecamatan terdiri dari beberapa desa.

**Jaga Balai Majalaya** berperan sebagai koordinator/orchestrator dan menjadi **Admin ALERA-FI**.

Volunteer ALERA-FI adalah relawan baru yang merupakan perwakilan dari masing-masing desa.

Monitoring infrastructure terdiri dari beberapa sumber yang tersebar di berbagai lokasi, tidak harus berada di desa volunteer:

- AWLR
- ARR
- CCTV
- Satellite data

Tidak ada predefined mapping bahwa suatu desa hanya menggunakan monitoring post tertentu.

Setiap volunteer menentukan sendiri monitoring post yang relevan bagi mereka.

---

# 3. Product Principles

## 3.1 Mobile First

ALERA-FI harus dirancang terlebih dahulu untuk penggunaan smartphone.

Desktop merupakan secondary interface.

---

## 3.2 Simple First, Detail on Demand

Informasi utama harus dapat dipahami tanpa membaca grafik atau data teknis yang kompleks.

Detail teknis tersedia ketika user membutuhkannya.

Hierarchy:

**Map → Quick Condition → Detail → Historical Context**

---

## 3.3 Current → Context → Forecast

Monitoring information harus membantu user memahami:

**Apa yang terjadi sekarang → bagaimana kondisi berkembang → apa yang mungkin terjadi berikutnya.**

---

## 3.4 Human-in-the-Loop

ALERA-FI tidak menentukan secara otomatis bahwa suatu peringatan harus disebarkan.

Volunteer:

- memilih data;
- menilai relevansinya;
- mengedit pesan;
- memutuskan apakah informasi akan dikirim.

AI hanya membantu interpretasi dan komunikasi.

---

## 3.5 AI as Contextual Assistance

AI digunakan untuk membantu user memahami platform dan data, bukan menggantikan judgment volunteer.

AI memiliki empat fungsi:

1. Static terminology help.
2. Contextual explanation.
3. AI Assistant.
4. Community message drafting.

---

# 4. User Roles

## 4.1 Volunteer

Volunteer merupakan perwakilan desa.

Volunteer dapat:

- login;
- memilih monitoring posts;
- melihat seluruh monitoring data;
- melihat forecast;
- melihat historical/recent context;
- memilih monitoring data untuk diseminasi;
- generate message menggunakan AI;
- edit message;
- share message ke WhatsApp;
- mengkonfirmasi message telah dikirim;
- melihat activity log;
- menggunakan AI Assistant;
- mengubah selected monitoring posts di Account Settings.

Setiap Volunteer memiliki:

- account;
- village;
- selected monitoring posts.

---

## 4.2 Admin

Admin adalah Jaga Balai Majalaya.

Admin memiliki seluruh capability Volunteer ditambah:

- manage volunteers;
- manage villages;
- manage monitoring posts/data sources;
- melihat seluruh activity;
- manage AI knowledge base;
- manage relevant system configuration.

---

# 5. Core Application Flow

Primary operational flow:

```text
Login
  ↓
Main Monitoring Map
  ↓
View Monitoring Post
  ↓
Understand Current + Historical Context + Forecast
  ↓
Select Relevant Monitoring Posts
  ↓
Create Community Information
  ↓
AI Generates Draft
  ↓
Volunteer Reviews / Edits
  ↓
Share to WhatsApp
  ↓
Volunteer Sends Message
  ↓
Confirm Sent
  ↓
Activity Log
```

---

# 6. Registration and Monitoring Setup

## 6.1 Volunteer Registration

During registration/onboarding, Volunteer must:

1. Create/login to account.
2. Select their village.
3. Select monitoring posts they want to monitor.

Monitoring post selection is used only for personalization.

It must **not restrict access** to other monitoring posts.

---

## 6.2 Monitoring Preference

Selected monitoring posts become the user's default monitoring set.

User may change their selected monitoring posts at any time through:

**Account Settings → Monitoring Preferences**

---

# 7. Main Monitoring Map

The Main Map is the primary application workspace.

It serves three purposes:

1. Situation monitoring.
2. Data exploration.
3. Data selection for dissemination.

---

## 7.1 Map Filters

Map must provide:

### Monitoring scope

- **Pos Saya**
- **Semua Pos**

Default: **Pos Saya**

### Data type filters

- AWLR
- ARR
- CCTV
- Satellite layer where applicable

---

# 8. Monitoring Post Marker

Monitoring posts appear as interactive markers.

Marker should display:

- monitoring type;
- primary measurement;
- current classification/status.

Example AWLR:

```text
AWLR
3.4 m
WASPADA
```

Example ARR:

```text
ARR
32 mm/h
HUJAN LEBAT
```

---

## 8.1 Marker Status Visualization

Marker visual state must change according to monitoring status.

Can include:

- color;
- marker emphasis;
- pulse/blink for high-priority conditions.

Animation should only be used for conditions requiring attention to prevent visual overload.

---

## 8.2 Data Freshness

Each monitoring observation must include its latest timestamp.

Stale or unavailable data must be clearly distinguishable from active observations.

Unavailable data must never appear as current data.

---

# 9. Monitoring Post Bottom Sheet

When user taps a monitoring post, a bottom sheet is opened.

Bottom sheet provides quick contextual understanding without leaving the map.

---

# 10. AWLR Monitoring

AWLR bottom sheet should show:

### Current Condition

- current water level;
- classification/status;
- observation timestamp.

### Recent Historical Context

Examples:

- water-level change over recent period;
- trend direction;
- duration of increasing/decreasing trend.

Example:

```text
Current TMA
3.4 m

Status
Waspada

Change
↑ +45 cm in 2 hours

Trend
Increasing since 18:30
```

---

# 11. Water-Level Forecast

Where forecast is available for an AWLR target, the bottom sheet must show:

- current water level;
- predicted water levels;
- prediction horizon.

Forecast horizon:

**2–4 hours ahead.**

Example:

```text
Now       +2h       +3h       +4h

3.4 m →   3.8 m →   4.2 m →   4.5 m
```

The prediction model primarily forecasts **water level**.

Operational classifications may be derived from configured station thresholds.

Current observation and forecast must be visually differentiated.

Example:

```text
NOW
Normal

FORECAST +4H
Siaga
```

Forecast status must never be presented as if it were the current status.

---

# 12. ARR Monitoring

ARR bottom sheet should show:

### Current Condition

- current rainfall measurement;
- rainfall classification/status;
- timestamp.

### Recent Rainfall Context

When supported by source data:

- rainfall duration;
- rolling accumulation;
- recent rainfall trend.

Recommended rolling accumulation:

- 1 hour;
- 3 hours;
- 6 hours.

Example:

```text
Current Rainfall
32 mm/h

Status
Hujan Lebat

Rainfall Duration
2h 15m

Accumulation
1h: 24 mm
3h: 51 mm
6h: 68 mm
```

Rolling rainfall accumulation must be calculated from timestamped historical ARR observations.

Accumulation must not be estimated from a single current rainfall-intensity value.

---

# 13. CCTV Monitoring

CCTV monitoring post should provide:

- preview or available feed;
- location;
- latest availability/update status.

CCTV is used as contextual visual information and does not determine alert status automatically.

---

# 14. Satellite Information

Satellite data acts primarily as contextual map information.

Satellite visualization may be exposed as:

- optional map layer;
- summarized contextual information.

Satellite data does not need to behave as a selectable monitoring post unless required by implementation.

---

# 15. Detailed Monitoring View

User may open:

**Lihat Detail**

from a monitoring bottom sheet.

Detail view may include:

- time-series chart;
- longer historical window;
- full forecast;
- station metadata;
- data timestamps.

The detail page is secondary to the Main Map workflow.

---

# 16. Contextual Learning

ALERA-FI must help new users learn while using the platform.

Learning support has three levels.

---

## 16.1 Static Help

Used for simple terminology.

Examples:

- AWLR
- ARR
- rainfall accumulation
- water level
- forecast

Static definitions should not require AI.

---

## 16.2 Contextual AI Explanation

Monitoring bottom sheets provide:

**Jelaskan kondisi ini**

AI receives the current monitoring context automatically.

Example context:

```text
AWLR Majalaya

Current TMA: 3.4 m
Change: +45 cm / 2h
Status: Waspada
Forecast +4h: 4.4 m
```

AI generates a plain-language explanation.

AI explanation must:

- use simple language;
- distinguish observations from forecast;
- avoid making autonomous warning decisions.

---

## 16.3 AI Assistant

A dedicated AI Chat is available throughout the application.

Example questions:

- Apa itu AWLR?
- Kenapa hujan di hulu penting?
- Apa arti akumulasi hujan 3 jam?
- Bagaimana membaca forecast?
- Bagaimana memilih pos yang perlu dipantau?
- Bagaimana cara membuat informasi untuk warga?

The AI Assistant must use an Admin-managed knowledge base where relevant.

---

# 17. Monitoring Data Selection

Monitoring data can be selected directly from the map.

Each monitoring bottom sheet provides:

**+ Pilih untuk Informasi**

User may select multiple monitoring posts.

Example:

```text
✓ AWLR Majalaya
✓ ARR Kertasari
✓ AWLR Wangisagara
```

Selected marker should display a visible selected state.

---

## 17.1 Selection Tray

When one or more monitoring posts are selected, a persistent mobile action area appears:

```text
3 informasi dipilih

Lihat Pilihan

Buat Informasi untuk Warga
```

User may:

- inspect selection;
- remove monitoring posts;
- continue selecting;
- proceed to message generation.

---

# 18. Context Included in Data Selection

Volunteer selects **monitoring posts**, not individual metrics.

ALERA-FI automatically includes relevant context for selected posts.

Example AWLR context:

- current water level;
- current classification;
- recent trend;
- recent change;
- forecast.

Example ARR context:

- current rainfall;
- rainfall classification;
- rainfall duration;
- rainfall accumulation.

This prevents users from manually selecting individual technical fields.

---

# 19. AI Community Message Generation

When Volunteer selects:

**Buat Informasi untuk Warga**

ALERA-FI sends the selected monitoring context to the AI message generator.

The generated message must:

- convert technical measurements into plain language;
- clearly identify relevant monitoring locations;
- distinguish current conditions from forecasts;
- describe meaningful trends where applicable;
- avoid unsupported conclusions;
- remain editable;
- not automatically send anything.

---

## 19.1 Example

Selected data:

```text
AWLR Majalaya
Current: 3.4 m
Status: Waspada
Change: +45 cm / 2h
Forecast +4h: 4.5 m

ARR Kertasari
Current: 32 mm/h
Status: Hujan Lebat
Accumulation 3h: 51 mm
```

Possible draft:

```text
Informasi Kewaspadaan

Curah hujan lebat masih terpantau di Pos Kertasari dengan
akumulasi 51 mm dalam tiga jam terakhir.

Tinggi muka air di Pos Majalaya saat ini berada pada status
Waspada dan telah meningkat sekitar 45 cm dalam dua jam.

Berdasarkan prakiraan, tinggi muka air masih berpotensi
meningkat dalam beberapa jam ke depan.

Warga diimbau tetap memantau perkembangan informasi dan
meningkatkan kewaspadaan.
```

Volunteer is responsible for reviewing the final content.

---

# 20. Message Editor

Generated message opens in an editable page.

Page contains:

### Draft Message

Editable text area.

### Supporting Data

List of selected monitoring posts and key data used.

### Actions

- Edit message
- Change selected data
- Regenerate where appropriate
- Continue to Share

---

# 21. WhatsApp Dissemination

ALERA-FI does **not** autonomously send messages through an unofficial WhatsApp automation.

User initiates sharing.

Flow:

```text
Final Message
  ↓
Share to WhatsApp
  ↓
WhatsApp opens with prefilled text
  ↓
Volunteer selects target group
  ↓
Volunteer presses Send
  ↓
Return to ALERA-FI
```

ALERA-FI does not claim WhatsApp delivery confirmation.

---

# 22. Dissemination Confirmation

After returning to ALERA-FI, user is asked:

```text
Apakah informasi sudah dikirim?

Belum

Ya, sudah dikirim
```

When confirmed, the dissemination activity is stored.

Status represents:

**Confirmed Sent by Volunteer**

not:

**WhatsApp Delivered**

---

# 23. Activity Log

Volunteer can view operational activities relevant to their account.

Example:

```text
14:02
Monitoring information selected

14:03
AI draft generated

14:05
Message edited

14:06
Opened in WhatsApp

14:07
Confirmed sent
```

Activity should include:

- user;
- village;
- selected monitoring posts;
- message content;
- creation timestamp;
- dissemination confirmation timestamp.

Admin can access broader activity across users.

---

# 24. Account Settings

Volunteer settings include:

### Profile

- name;
- village;
- account information.

### Monitoring Preferences

- selected monitoring posts;
- add monitoring post;
- remove monitoring post.

Changing preferences affects only the default **Pos Saya** view.

All monitoring posts remain accessible through **Semua Pos**.

---

# 25. Admin: Volunteer Management

Admin must be able to:

- create/invite volunteer;
- activate/deactivate volunteer;
- assign village;
- review volunteer accounts.

---

# 26. Admin: Monitoring Source Management

Admin can manage monitoring sources available to the platform.

Monitoring post metadata should include where applicable:

- ID;
- name;
- type;
- location;
- source;
- unit;
- data status;
- classification thresholds;
- forecast availability.

Types include:

- AWLR;
- ARR;
- CCTV.

---

# 27. Admin: AI Knowledge Management

Admin manages knowledge used by the AI Assistant.

Knowledge may include:

- ALERA-FI user guides;
- monitoring terminology;
- flood preparedness material;
- operational SOP;
- local context;
- verified disaster-management guidance.

Admin should be able to:

- add knowledge;
- update knowledge;
- remove/disable knowledge;
- upload supported documents where implementation allows.

---

# 28. Core Data Entities

Minimum conceptual entities:

```text
User
- id
- name
- role
- village_id
- account_status

Village
- id
- name

MonitoringPost
- id
- name
- type
- latitude
- longitude
- source
- status

UserMonitoringPreference
- user_id
- monitoring_post_id

Observation
- monitoring_post_id
- timestamp
- value
- unit
- classification

Forecast
- target_monitoring_post_id
- generated_at
- forecast_time
- predicted_water_level
- predicted_classification

CommunityMessage
- id
- user_id
- village_id
- generated_content
- final_content
- status
- created_at

CommunityMessageSource
- message_id
- monitoring_post_id
- observation_reference
- forecast_reference

ActivityLog
- user_id
- action
- entity
- timestamp
```

---

# 29. Message Lifecycle

Minimum message states:

```text
Draft
  ↓
Ready to Share
  ↓
WhatsApp Handoff
  ↓
Confirmed Sent
```

Optional terminal states:

```text
Cancelled
```

No separate Analyst approval stage is required for the current product model.

---

# 30. Primary Navigation

Recommended mobile navigation:

```text
Monitoring
Activity
AI Assistant
Account
```

Admin receives additional administrative access:

```text
Admin
```

Monitoring remains the default landing page.

---

# 31. Core Functional Requirements

### FR-01 Authentication
Users must authenticate before accessing operational functionality.

### FR-02 Village Assignment
Each Volunteer must be associated with a village.

### FR-03 Monitoring Preference
Volunteer must be able to select monitoring posts during onboarding and modify them later.

### FR-04 Monitoring Scope Filter
User must be able to switch between **Pos Saya** and **Semua Pos**.

### FR-05 Integrated Map
System must display available AWLR, ARR, and CCTV monitoring locations on an interactive map.

### FR-06 Monitoring Status
Monitoring marker must display latest value and operational classification.

### FR-07 Data Freshness
System must display observation freshness and clearly identify unavailable/stale data.

### FR-08 Historical Context
System must derive recent monitoring context from historical observations where supported.

### FR-09 Rainfall Accumulation
System must calculate rolling rainfall accumulation from timestamped ARR observations.

### FR-10 Water-Level Forecast
System must display water-level forecasts for supported target stations with a horizon of approximately 2–4 hours.

### FR-11 Observation vs Forecast
System must clearly distinguish current observations from predicted values.

### FR-12 Monitoring Selection
Volunteer must be able to select multiple monitoring posts directly from the monitoring interface.

### FR-13 Automatic Context Collection
System must automatically include relevant current, historical, and forecast context associated with selected monitoring posts.

### FR-14 AI Message Drafting
System must generate community-friendly draft messages from selected monitoring data.

### FR-15 Message Editing
Volunteer must be able to edit the generated message before sharing.

### FR-16 WhatsApp Handoff
System must provide a user-initiated mechanism to open/share the final message to WhatsApp with prefilled text where supported.

### FR-17 Dissemination Confirmation
Volunteer must be able to confirm that a message has been sent.

### FR-18 Activity Logging
System must log significant operational actions.

### FR-19 Contextual Explanation
System must allow Volunteer to request plain-language explanation of monitoring conditions.

### FR-20 AI Assistant
System must provide conversational assistance grounded in available platform and Admin-managed knowledge.

### FR-21 User Management
Admin must be able to manage Volunteer accounts.

### FR-22 AI Knowledge Management
Admin must be able to manage knowledge used by AI assistance.

---

# 32. UX Requirements

The platform must:

- prioritize mobile interaction;
- minimize technical terminology;
- use plain Indonesian language;
- avoid requiring GIS knowledge;
- make primary conditions visible without opening detailed charts;
- provide detail progressively;
- preserve observation timestamps;
- distinguish current conditions from forecast;
- minimize required steps from monitoring to dissemination;
- maintain human control over final communication.

---

# 33. Main MVP Screens

Minimum MVP screens:

1. Login / Registration
2. Volunteer Onboarding
3. Monitoring Post Selection
4. Main Monitoring Map
5. Monitoring Bottom Sheet
6. Monitoring Detail
7. Selected Information Review
8. AI Message Generator / Editor
9. WhatsApp Share / Dissemination Confirmation
10. Activity
11. AI Assistant
12. Account Settings
13. Monitoring Preferences
14. Admin — Volunteer Management
15. Admin — Monitoring Source Management
16. Admin — AI Knowledge Management

---

# 34. Out of Scope for MVP

The following are not required for the initial implementation:

- autonomous flood-warning decisions;
- automatic WhatsApp group sending through unofficial automation;
- WhatsApp delivery/read confirmation;
- automatic determination of which monitoring posts are relevant to each village;
- replacement or installation of physical sensors;
- dedicated native mobile application;
- complex GIS editing by Volunteers;
- fully automated alert dissemination.

---

# 35. Open Technical Decisions

The following still require engineering/data confirmation before implementation:

1. Exact source format and polling frequency for each AWLR/ARR provider.
2. Definition of stale data for each source.
3. Operational classification thresholds per monitoring post.
4. Exact rainfall episode/duration calculation.
5. Final rolling rainfall windows.
6. CCTV delivery method: stream, snapshot, or external source.
7. Satellite data source and visualization format.
8. Final forecasting model and required model inputs.
9. Forecast generation/update frequency.
10. Exact mobile WhatsApp handoff implementation.
11. AI model and retrieval/knowledge architecture.
12. AI knowledge document management implementation.

These decisions must not change the core user flow described in this PRD.

---

# 36. Product Success Definition

ALERA-FI succeeds when a newly trained village volunteer can independently complete the following flow:

**Open platform → understand current conditions → understand recent trend and forecast → select relevant monitoring information → generate an understandable community message → review/edit it → share it through WhatsApp → record the dissemination activity.**

The platform should reduce the need for Volunteers to interpret fragmented raw hydrometeorological data manually while preserving human judgment in flood communication.
