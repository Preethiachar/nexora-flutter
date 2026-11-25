# Nexora — Civic Innovation Platform

> **MERN Stack + Flutter** | Real-time collaboration, mentor assignment, AI ATS, civic feed

---

## 🗂️ Project Structure

```
mernova/
├── server/              # Node.js + Express + MongoDB + Socket.io
│   ├── index.js         # Entry point
│   ├── models/          # Mongoose schemas (User, StudentIdea, IdeaGroup, GroupMessage, FeedPost)
│   ├── routes/          # auth, marketplace, messages, ai, search, feed
│   ├── middleware/       # JWT auth, Multer file upload
│   ├── uploads/         # Uploaded documents (served statically)
│   └── scripts/seed.js  # Sample data seeder
│
├── client/              # React 18 + Vite + Tailwind CSS
│   └── src/
│       ├── pages/       # auth, ideas, groups, ats, feed, profile
│       ├── components/  # Layout (sidebar + topbar)
│       ├── context/     # AuthContext (JWT + socket management)
│       └── services/    # Axios API client, Socket.io client
│
├── flutter_app/         # Flutter 3.x (iOS + Android)
│   └── lib/
│       ├── views/       # auth, home, ideas, groups, ats, feed
│       ├── services/    # AuthService, ApiService (Dio), SocketService
│       └── config/      # Router (GoRouter), Theme, Constants
│
└── docker-compose.yml   # One-command deployment
```

---

## ⚡ Quick Start

### 1. Prerequisites
- Node.js ≥ 18 & npm ≥ 9
- MongoDB (local or Atlas URI)
- Flutter SDK ≥ 3.0 (for mobile)

### 2. Backend

```bash
cd server
cp .env.example .env        # Edit MONGODB_URI and JWT_SECRET
npm install
npm run seed                 # Populate demo data
npm run dev                  # Starts on http://localhost:5000
```

### 3. React Frontend

```bash
cd client
npm install
npm run dev                  # Starts on http://localhost:3000
```

### 4. Flutter Mobile

```bash
cd flutter_app
flutter pub get
flutter run                  # Android emulator or connected device
# For APK release:
flutter build apk --release
```

---

## 🔐 Demo Accounts (after seeding)

| Email | Password | Role |
|-------|----------|------|
| student@nexora.com | password123 | Student |
| mentor@nexora.com | password123 | Mentor |
| recruiter@nexora.com | password123 | Recruiter |
| priya@nexora.com | password123 | Student |

---

## 🛠️ Core Features

### 1. Role-Based Civic Auth
- JWT authentication with `student`, `mentor`, `recruiter` roles
- Civic hours, badges (Eco Leader, Civic Innovator), skills

### 2. Idea Marketplace
- Students pitch civic ideas with domain, skill slots, milestones
- Apply to join; author accepts/rejects applicants
- **Auto-creates IdeaGroup** when first member is accepted

### 3. Mentor Assignment
- Browse certified mentors at `GET /api/v1/marketplace/mentors`
- Assign mentor to idea: `POST /api/v1/marketplace/ideas/:id/mentor`
- Mentor auto-added to group chat

### 4. Group Collaboration Chat (Real-time)
- Socket.io room per group
- **Document attachments**: `.pdf`, `.doc`, `.docx`, `.ppt`, `.pptx` (up to 15 MB)
- Files served from `/uploads/documents/` with download links
- Typing indicators

### 5. AI ATS Resume Scanner
- Pure JS TF-IDF keyword extraction (no external AI dependency)
- Returns: match %, matched keywords, missing keywords, career advice
- Upgrade path: swap `routes/ai.js` extraction with OpenAI/Claude API

### 6. Civic Feed
- Post types: general, milestone, announcement, volunteer, idea-launch
- Likes, comments, real-time new post broadcast via Socket.io

### 7. Global Search
- `GET /api/v1/search?q=...&category=all|people|ideas|posts`
- Unified MongoDB regex query across Users, Ideas, FeedPosts

---

## 🐳 Docker Deployment

```bash
# Build and start all services (MongoDB + Server + React frontend)
docker-compose up --build
```

App will be available at `http://localhost:3000`

---

## ☁️ Render / Railway Deployment

### Backend (Node.js Web Service)
- Root: `server/`
- Build: `npm install`
- Start: `node index.js`
- Env vars: `MONGODB_URI`, `JWT_SECRET`, `CLIENT_URL`, `PORT`

### Frontend (Static Site)
- Root: `client/`
- Build: `npm run build`
- Publish dir: `dist/`
- Set `VITE_API_URL` if proxying to external backend

---

## 📱 Flutter Production Notes

- Change `AppConstants.baseUrl` and `AppConstants.socketUrl` to your deployed server URL
- For Android: use real device IP or deployed HTTPS URL
- Permissions needed: `INTERNET`, `READ_EXTERNAL_STORAGE` (for file picker)
- Add `<uses-permission android:name="android.permission.INTERNET" />` to `AndroidManifest.xml`

---

## 🧩 API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login, returns JWT |
| GET | `/api/v1/auth/me` | Current user profile |
| GET | `/api/v1/marketplace/ideas` | List ideas (filter by domain/status/search) |
| POST | `/api/v1/marketplace/ideas` | Create idea (student only) |
| POST | `/api/v1/marketplace/ideas/:id/apply` | Apply to idea |
| POST | `/api/v1/marketplace/ideas/:id/accept-member` | Accept/reject applicant → auto-create group |
| GET | `/api/v1/marketplace/mentors` | List certified mentors |
| POST | `/api/v1/marketplace/ideas/:id/mentor` | Assign mentor |
| GET | `/api/v1/messages/groups` | My groups |
| GET | `/api/v1/messages/groups/:id/messages` | Group messages |
| POST | `/api/v1/messages/groups/:id/send` | Send text message |
| POST | `/api/v1/messages/groups/:id/upload` | Upload Word/PDF/PPT (15 MB max) |
| POST | `/api/v1/ai/resume-ats` | AI ATS resume scan |
| GET | `/api/v1/feed` | Civic feed posts |
| POST | `/api/v1/feed` | Create post |
| GET | `/api/v1/search?q=&category=` | Global search |

---

## 🛡️ License

MIT © Nexora Platform
