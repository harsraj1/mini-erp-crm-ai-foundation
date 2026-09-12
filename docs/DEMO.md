# 5–7 minute submission demo

Record this yourself against a demo database. This guide is not a recorded video.

1. **0:00–0:45 — Login and roles.** Show Admin login and the four navigation entries. Explain Admin creates work; Operations manages inventory/transfers; Sales reserves orders. Briefly point to backend role middleware.
2. **0:45–2:00 — Inventory.** As Admin add item Cotton / COT-001 / Raw material. Add Factory and Main warehouse. Add batch B-001 opening quantities60 at Factory and50 at Main warehouse. Show physical/reserved/available and transaction history.
3. **2:00–3:00 — Work order.** Create at Factory for Cotton, required100, assigned Demo operations. Show shortage40 and available50 at Main warehouse. Sign in as Operations and start the assigned work. Work status does not consume stock.
4. **3:00–4:30 — Transfer.** Request40 from Main warehouse B-001 to Factory. Dispatch and show source10, destination still60. Receive and show destination100. Show the received status has no second receive button; mention backend duplicate-receipt test.
5. **4:30–5:45 — Reservation.** Sign in as Sales. Create customer Asha Shah order for60 from Factory B-001. Show physical100, reserved60, available40. Attempt another50: show insufficient-stock error and retained form values. Sales cannot create work or dispatch transfers.
6. **5:45–6:45 — Correctness and delivery.** Show passing mandatory tests, row-lock transaction code, ER diagram and environment/setup instructions. Explain concurrent80+50 reservations against100 permit only one. Mention current explicit limitations without presenting future interview exercises as implemented.

Keep test passwords demo-only. Do not show `.env`, connection URLs, bearer tokens or provider secrets while recording. Existing accounts retain their password when seeding; use the credentials actually configured for your demo database.

Before submission: review changes, commit coherent reviewed units (schema/backend/tests, frontend integration, documentation), push to your repository, record the video, verify shared access. Preserve real development history; do not fabricate earlier commits or rewrite dates. No new commits/push are performed by this implementation task.
