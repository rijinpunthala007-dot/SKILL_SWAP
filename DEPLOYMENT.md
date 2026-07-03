# SkillSwap — Full Deployment Guide

> Deploy the entire SkillSwap stack for **free** using MongoDB Atlas, Upstash Redis, Render, and Vercel.

---

## Architecture (Deployed)

```
Browser
  │
  ▼
Vercel (React + Vite Frontend)
  │  REST API + WebSockets
  ▼
Render (Express + Node.js Backend)
  │                    │
  ▼                    ▼
MongoDB Atlas      Upstash Redis
(Database)         (Sessions + Socket.IO)
```

---

## Step 0 — Fix MongoDB Atlas IP Whitelist ⚠️

> **Do this first — this is why `npm run seed` keeps failing!**

1. Go to → https://cloud.mongodb.com
2. Click your cluster (**Cluster0**)
3. Left sidebar → **Security → Network Access**
4. Click **+ ADD IP ADDRESS** (green button)
5. Click **ALLOW ACCESS FROM ANYWHERE** → adds `0.0.0.0/0`
6. Click **Confirm** and wait ~30 seconds
7. Now run `npm run seed` from `server/` — it will work ✅

---

## Step 1 — Get Your Atlas Connection String

1. Go to https://cloud.mongodb.com → **Cluster0 → Connect → Drivers**
2. Select **Node.js**
3. Copy the connection string — looks like:
   ```
   mongodb+srv://user:password@cluster0.nyhhcic.mongodb.net/skillswap?retryWrites=true&w=majority
   ```
4. Save it for Step 3

---

## Step 2 — Get Your Upstash Redis URL

1. Go to https://console.upstash.com
2. Click your Redis database
3. Copy the **Redis URL**:
   ```
   rediss://default:<password>@<host>.upstash.io:6379
   ```
4. Save it for Step 3

---

## Step 3 — Deploy Backend on Render

### 3a. Sign Up
- Go to https://render.com → Sign up with GitHub

### 3b. Create Web Service
1. Click **New + → Web Service**
2. Connect your GitHub repo (**SKILL_SWAP**)
3. Fill in these settings:

| Setting | Value |
|---|---|
| **Name** | `skillswap-api` |
| **Region** | `Singapore` (closest to India) |
| **Branch** | `main` |
| **Root Directory** | `server` |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npm run build` |
| **Start Command** | `node dist/index.js` |
| **Instance Type** | `Free` |

### 3c. Add Environment Variables

| Key | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | *(Atlas URI from Step 1)* |
| `REDIS_URL` | *(Upstash URL from Step 2)* |
| `JWT_ACCESS_SECRET` | *(random 32+ char string — see tip below)* |
| `JWT_REFRESH_SECRET` | *(different random 32+ char string)* |
| `JWT_ACCESS_EXPIRES_IN` | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | `7d` |
| `CLIENT_URL` | *(leave blank for now — add after Step 4)* |
| `RATE_LIMIT_WINDOW_MS` | `900000` |
| `RATE_LIMIT_MAX` | `100` |
| `AUTH_RATE_LIMIT_MAX` | `10` |

> 💡 **Generate a random secret** in PowerShell:
> ```powershell
> -join ((65..90)+(97..122)+(48..57) | Get-Random -Count 40 | % {[char]$_})
> ```
> Run it **twice** — once for ACCESS, once for REFRESH secret.

### 3d. Deploy
- Click **Create Web Service** → wait 2–4 minutes
- You'll get a URL like: `https://skillswap-api.onrender.com`

### 3e. Verify Backend is Live
```
https://skillswap-api.onrender.com/api/health
```
Expected:
```json
{ "status": "healthy", "services": { "database": "up", "redis": "up" } }
```

---

## Step 4 — Deploy Frontend on Vercel

### 4a. Sign Up
- Go to https://vercel.com → Sign up with GitHub

### 4b. Create Project
1. **Add New → Project** → import your GitHub repo
2. Configure:

| Setting | Value |
|---|---|
| **Framework Preset** | `Vite` *(auto-detected)* |
| **Root Directory** | `client` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 4c. Add Environment Variables

| Key | Value |
|---|---|
| `VITE_API_URL` | `https://skillswap-api.onrender.com/api` |
| `VITE_SOCKET_URL` | `https://skillswap-api.onrender.com` |

### 4d. Deploy
- Click **Deploy** → ~1 minute
- You'll get a URL like: `https://skillswap.vercel.app`

---

## Step 5 — Wire Frontend ↔ Backend (CORS)

1. Go to **Render → skillswap-api → Environment**
2. Set `CLIENT_URL` = your Vercel URL (e.g., `https://skillswap.vercel.app`)
3. Click **Save Changes** → Render auto-redeploys

---

## Step 6 — Seed Production Database

1. Render dashboard → your service → **Shell** tab
2. Run:
   ```bash
   npm run seed
   ```

---

## Step 7 — Test the Full App

Open your Vercel URL and log in:
- **Email:** `alice@test.com`
- **Password:** `Password123!`

Test: matches, exchange requests, real-time chat, skill quizzes, leaderboard.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `npm run seed` fails locally | Whitelist your IP in Atlas → Step 0 |
| Render shows DB error | Check `MONGODB_URI`; re-check Atlas IP whitelist |
| Frontend blank page | Check `VITE_API_URL` on Vercel — no trailing slash |
| CORS error in browser | `CLIENT_URL` on Render must exactly match Vercel URL |
| Chat/WebSocket not working | `VITE_SOCKET_URL` must be Render URL **without** `/api` |
| Render first load ~30s slow | Normal — free tier sleeps after 15 min of inactivity |
| Avatar uploads not persisting | Add Cloudinary keys to Render env vars (see below) |

---

## Optional: Cloudinary for Avatar Uploads

Without Cloudinary, avatar uploads use local disk which resets on every Render deploy.

1. Sign up free at https://cloudinary.com
2. Copy: Cloud Name, API Key, API Secret
3. Add to Render environment variables:

| Key | Value |
|---|---|
| `CLOUDINARY_CLOUD_NAME` | *(your cloud name)* |
| `CLOUDINARY_API_KEY` | *(your API key)* |
| `CLOUDINARY_API_SECRET` | *(your API secret)* |

---

## Free Services Summary

| Service | Purpose | Free Limit |
|---|---|---|
| [MongoDB Atlas](https://cloud.mongodb.com) | Database | 512 MB |
| [Upstash Redis](https://upstash.com) | Cache + Sockets | 10,000 req/day |
| [Render](https://render.com) | Node.js Backend | 750 hrs/month |
| [Vercel](https://vercel.com) | React Frontend | Unlimited |
| [Cloudinary](https://cloudinary.com) | Avatar Storage | 25 credits/month |
