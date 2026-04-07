# Ding — USCIS Case Tracker

Track your USCIS immigration case status in real-time. Get instant push and email notifications the moment your case moves.

## Features

- **Case tracking** — Add any USCIS receipt number (EAC, WAC, LIN, SRC, IOE, MSC, NBC, YSC, ZAR, ZCH) and track its status
- **Real-time status** — Proxies USCIS's case status endpoint and parses the response
- **Auto polling** — Vercel cron job checks all cases every 4 hours automatically
- **Push notifications** — Firebase Cloud Messaging browser push on status change
- **Email alerts** — Resend-powered emails with a clean dark-mode template
- **Full history timeline** — Every status change is logged with date and description
- **Visa Bulletin** — Live employment-based and family-based priority date tables scraped from travel.state.gov
- **Dark mode** — Dark by default, toggleable, persisted to localStorage
- **Fully responsive** — Mobile-first, works on iPhone and desktop

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Styling | Tailwind CSS + Framer Motion |
| Auth | Firebase Auth (Google + email/password) |
| Database | Firebase Firestore |
| Push | Firebase Cloud Messaging (FCM) |
| Email | Resend |
| Deployment | Vercel |

## Project Structure

```
/app
  /dashboard          → cases overview with stats
  /cases/[id]         → case detail + full status timeline
  /notifications      → notification history + preferences
  /visa-bulletin      → latest EB/FB priority date tables
  /login              → Google + email auth
  /api
    /status           → USCIS proxy (POST, 5-min cache)
    /cases            → list + add cases
    /cases/[id]       → delete + manual refresh (30-min rate limit)
    /notifications    → list + mark-read
    /cron/poll        → background polling (runs every 4h via Vercel cron)
    /visa-bulletin    → scrape travel.state.gov (24h cache)
/components
  CaseCard.tsx        → case tile with refresh + delete
  StatusBadge.tsx     → color-coded status pill
  Timeline.tsx        → case history timeline
  NotificationToggle.tsx → push/email/granularity toggles
  AddCaseModal.tsx    → receipt number + nickname input
  Navbar.tsx          → responsive nav with theme toggle
  StatsCard.tsx       → dashboard stat tiles
  ProtectedRoute.tsx  → auth guard with loading state
/lib
  firebase.ts         → Firebase client SDK
  firebase-admin.ts   → Firebase Admin SDK (server only)
  uscis.ts            → fetch + parse USCIS responses
  notifications.ts    → FCM + Resend helpers
  utils.ts            → cn, timeAgo, date formatters
/context
  AuthContext.tsx
  ThemeContext.tsx
  ToastContext.tsx
/types
  index.ts
```

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/your-username/ding.git
cd ding
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Firebase Client (from Firebase Console → Project Settings → General)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=       # Cloud Messaging → Web push certificates

# Firebase Admin (Project Settings → Service Accounts → Generate new private key)
# Paste the downloaded JSON as a single-line string
FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}

# Resend (https://resend.com → API Keys)
RESEND_API_KEY=re_...

# Random secret — add same value to Vercel env vars
CRON_SECRET=your_random_secret
```

### 3. Firebase setup

1. Enable **Authentication** → Sign-in methods: Google + Email/Password
2. Create a **Firestore** database (start in production mode)
3. Add these Firestore security rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    match /cases/{caseId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow create: if request.auth != null;
    }
    match /notifications/{notifId} {
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/dashboard` → `/login` if not authenticated.

## Deploying to Vercel

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables from `.env.local`
4. Deploy — the cron job in `vercel.json` runs automatically every 4 hours

```json
{
  "crons": [{ "path": "/api/cron/poll", "schedule": "0 */4 * * *" }]
}
```

The cron endpoint is protected by `CRON_SECRET` — Vercel sets the `Authorization: Bearer <secret>` header automatically.

## Receipt Number Format

Valid format: `AAA##########` (3 letters + 10 digits, e.g. `EAC2190123456`)

Supported service center prefixes:

| Prefix | Center |
|--------|--------|
| EAC | Eastern (Vermont) |
| WAC | Western (California) |
| LIN | Nebraska |
| SRC | Texas |
| IOE | USCIS Electronic System |
| MSC / NBC | National Benefits Center |
| YSC | Potomac |
| ZAR | Arlington Asylum |
| ZCH | Chicago Asylum |

## License

MIT
