# Firebase Studio

This is a NextJS starter in Firebase Studio.

To get started, take a look at src/app/page.tsx.

## Deployment

To deploy this application to Firebase, you will need to use the Firebase Command-Line Interface (CLI).

The CLI is a tool that allows you to manage and deploy your Firebase projects by typing commands into a terminal.

Once you have the Firebase CLI installed and you are logged in, you can deploy your application by running the following command in your project's root directory:

```bash
firebase deploy
```

CI trigger: test run

## Local development — Firebase

This project requires a Firebase public config for local development so the client can initialize Firestore.

1. Create a file named `.env.local` in the directory where you run `npm run dev` (either the repo root or `studio-project/`).
2. Copy values from `.env.local.example` and fill in your Firebase project's public values (these are *not* secrets):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

3. Restart the dev server:

```bash
cd studio-project
npm run dev
```

4. Quick diagnostic: run the included check script to confirm `.env.local` is detected:

```bash
npm run check-firebase
# or from repo root
node tools/check-firebase.js
```

If the banner `Firebase not configured` still appears after this, open the browser console and server logs and look for errors such as `auth/invalid-api-key`, `permission-denied`, or `project not found`.
 
