## Parent Portal Prototype — Preview & Local Seed

Quick instructions to preview the RTL Arabic Parent Portal prototype and seed the Firebase emulator with test data so the prototype displays realistic live data.

### Prerequisites
- Node.js (16+) and a package manager (pnpm / npm / yarn).
- Firebase CLI installed (`npm i -g firebase-tools`) and Firestore emulator available.
- `firebase.json` configured for the project (repository already contains emulator settings used by the app).

### Steps

1) Install dependencies

```bash
# from repo root
pnpm install
# or
npm install
```

2) Start the Firebase emulator (Firestore)

In one terminal, run:

```bash
firebase emulators:start --only firestore
```

This will run the Firestore emulator on the default port (usually `localhost:8080`). If you use a different host/port, set `FIRESTORE_EMULATOR_HOST` before running the seed script.

3) Seed the emulator with test data

Open a new terminal and run:

```bash
# from repo root
node tools/prototypes/seed-firebase-emulator.js
```

This script uses the Admin SDK and will write sample `students`, `announcements`, `attendance`, `courses`, `enrollments`, `assignments`, `grades`, and `conversations/messages` documents into the emulator. It will log created document ids.

4) Run the Next.js dev server

```bash
pnpm dev
# or
npm run dev
```

5) Preview the prototype

- Open http://localhost:3000/parent-portal/test-token — the dev `test-token` path renders the prototype and will use seeded Firestore data when available.
- Or open a real parent link and append `?prototype=1` to force the prototype UI for visual review.

### Notes
- The seed script will attempt to connect to the Firestore emulator. If `FIRESTORE_EMULATOR_HOST` is not set, the script will default to `localhost:8080`.
- The prototype also tries the timetable REST API (default `http://localhost:2034/api/timetable`). If you don't have that running, the prototype will fall back to seeded/mock timetable data.
- To clear seeded data, stop the emulator and remove the emulator data directory (or run `firebase emulators:exec` with cleanup flags).

If you want, I can add a npm script entry (e.g. `pnpm seed`) to run the seed script with the correct env values.
