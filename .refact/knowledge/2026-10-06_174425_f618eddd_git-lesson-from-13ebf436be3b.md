---
id: 76b1c328-6f9c-4123-bde3-ca4b04b0dc98
title: Git lesson from 13ebf436be3b
tags:
- git
- lesson
created: 2026-10-06
updated: 2026-10-06
filenames:
- mobile/lib/api.ts
- mobile/types/api.ts
- server/src/routes/bookings.routes.ts
- server/src/routes/stats.routes.ts
links: []
kind: lesson
status: proposed
superseded_by: null
deprecated_at: null
review_after: 2026-10-06
source_chat_id: null
created_at: 2026-10-06T12:14:25.111744+00:00
summary: null
description: null
entities: []
related_files: []
related_entities: []
content_hash: e64eeb962f1338c657e896eb723bd9281c25879864dd784eff2a34d838eb39c2
source_tool: buddy_memory_lifecycle:git
source_confidence: 0.8600000143051147
source_trajectory_id: null
source_message_range: null
source_commit: 13ebf436be3b292c309b957b080bf0579294ec65
topic: null
last_used_at: null
use_count: 0
last_injected_at: null
dismissed_count: 0
source_content_hash: e64eeb962f1338c657e896eb723bd9281c25879864dd784eff2a34d838eb39c2
review_needed: true
occurrences: 0
---

Git lesson from 13ebf436be3b

Source commit: 13ebf436be3b
Paths: mobile/lib/api.ts, mobile/types/api.ts, server/src/routes/bookings.routes.ts, server/src/routes/stats.routes.ts
Summary: Fix technician monthly earnings and lock pay on OTP-flow completion Technician stats' headline "earnings" figure was always all-time, while attendance/visit analytics on the same screen were scoped to the selected month — confusing when they didn't match. Now scopes earnings to the selected month too, exposing both m