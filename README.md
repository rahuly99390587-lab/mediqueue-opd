# 🏥 MediQueue — Hospital OPD Management System v2.0

A **complete, production-ready** Hospital OPD Management System built for real clinics and hospitals. Clean code, no bugs, ready to sell.

---

## 🔥 Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18 + React Router 6 + Recharts            |
| Styling   | Tailwind CSS (CDN) + Google Fonts (Outfit + Plus Jakarta Sans) |
| Backend   | Node.js + Express 4                             |
| Database  | SQLite via `sqlite3`                            |
| Auth      | JWT (jsonwebtoken) + bcryptjs                   |
| API       | Centralized axios with `REACT_APP_API_URL`      |

---

## 📁 Project Structure

```
mediqueue-opd-system/
├── backend/
│   ├── server.js          # All API routes (10 endpoints)
│   ├── db.js              # sqlite3 with promise wrappers, schema, seed
│   ├── .env.example       # Environment variable template
│   └── package.json       # sqlite3, express, jwt, bcryptjs, cors
│
├── frontend/
│   ├── public/
│   │   └── index.html     # Tailwind CDN, Google Fonts, FIXED print CSS
│   └── src/
│       ├── api/
│       │   └── index.js         # ✅ Centralized axios (REACT_APP_API_URL)
│       ├── context/
│       │   └── AuthContext.js   # JWT session management
│       ├── components/
│       │   ├── AdminLayout.js   # Sidebar + topbar shell
│       │   ├── PrintSlip.js     # ✅ FIXED: Isolated print (no full-page print)
│       │   └── UI.js            # Reusable: Button, Card, Alert, StatCard...
│       ├── pages/
│       │   ├── RegisterPage.js      # 2-step mobile-first patient registration
│       │   ├── TokenPage.js         # Big token confirmation screen
│       │   ├── LoginPage.js         # Admin login
│       │   ├── DashboardPage.js     # Stats + Area/Pie/Bar charts
│       │   ├── QueuePage.js         # Today's queue + status filters
│       │   ├── SearchPage.js        # Search by token / mobile / name
│       │   ├── VisitPage.js         # Visit detail + doctor update + print
│       │   ├── PatientHistoryPage.js # Timeline + medicines + frequent badge
│       │   └── PatientsListPage.js  # Paginated all patients
│       ├── App.js
│       └── index.js
│
├── package.json           # Root: concurrently scripts
└── README.md
```

---

## 🚀 Local Setup (Step by Step)

### Prerequisites
- Node.js v18 or higher
- npm v9 or higher

### Step 1: Install dependencies

```bash
# Install root deps (concurrently)
npm install

# Install backend deps
cd backend
npm install
cd ..

# Install frontend deps
cd frontend
npm install
cd ..
```

### Step 2: Configure environment

**Backend:**
```bash
cd backend
cp .env.example .env
# Edit .env if needed (defaults work for local)
```

**Frontend:**
```bash
cd frontend
# Create .env file
echo "REACT_APP_API_URL=http://localhost:5001" > .env
```

### Step 3: Start both services

**Option A — Run together (from root):**
```bash
npm start
```

**Option B — Run separately:**
```bash
# Terminal 1
cd backend && node server.js

# Terminal 2
cd frontend && npm start
```

### Step 4: Open in browser

| URL | Description |
|-----|-------------|
| `http://localhost:3000` | Patient registration (public) |
| `http://localhost:3000/admin/login` | Admin login |
| `http://localhost:3000/admin/dashboard` | Dashboard |
| `http://localhost:5001/health` | Backend health check |

---

## 🔐 Default Admin Login

```
Username: admin
Password: admin123
```

> ⚠️ Change this in production via `backend/db.js` before deploying.

---

## 📱 QR Code for Registration

1. Deploy the frontend to a public URL
2. Generate a QR code for: `https://your-frontend.render.com/register`
3. Print and place at the hospital reception counter

---

## 🌐 Deploy to Railway (Backend) + Render (Frontend)

### Backend → Railway

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the `backend/` folder as root
4. Set environment variables:
   ```
   PORT=5001
   JWT_SECRET=your_strong_secret_here
   NODE_ENV=production
   ALLOWED_ORIGINS=https://your-frontend.render.com
   ```
5. Add a **Volume** at `/app` for the SQLite database persistence
6. Note your Railway backend URL (e.g., `https://mediqueue-backend.up.railway.app`)

### Frontend → Render

1. Go to [render.com](https://render.com) → New → Static Site
2. Connect your GitHub repo
3. Settings:
   - Root Directory: `frontend`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `build`
4. Add environment variable:
   ```
   REACT_APP_API_URL=https://mediqueue-backend.up.railway.app
   ```
5. Deploy

---

## 🧪 Testing the Full Flow

### Patient Registration Flow:
1. Open `http://localhost:3000`
2. Enter any 10-digit mobile number → Continue
3. Fill name, age, address, problem → Get Token
4. See the large token number on confirmation screen
5. Register again with the **same mobile** → auto-fills, new token

### Admin Flow:
1. Login at `http://localhost:3000/admin/login` with `admin` / `admin123`
2. Dashboard shows today's stats and charts
3. Go to **Today's Queue** → see the registered patient
4. Click on any patient → View Visit
5. Click **Edit** → Fill in diagnosis, medicines, notes → Save
6. Click **Print Slip** → Preview modal → Click "Print Slip" → A4 slip prints (ONLY the slip, not the page)

### Token System:
- Tokens are `T-1, T-2, T-3...` per day
- On the next day, they reset to `T-1` automatically
- No duplicates — uses atomic SQLite query

---

## 🖨️ Print System (Fixed)

The print system works by injecting an isolated `<div>` **outside the React tree** with class `mediqueue-print-area`.

The CSS in `index.html` does:
```css
@media print {
  body > * { display: none }              /* Hide EVERYTHING */
  .mediqueue-print-area { display: block } /* Show ONLY the slip */
}
```

This guarantees:
- ✅ Only the A4 slip prints
- ✅ No sidebar, no navbar, no other content
- ✅ Works in Chrome, Firefox, Safari, Edge

---

## 🔌 API Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/health` | ❌ | Health check |
| `POST` | `/api/admin/login` | ❌ | Admin login → JWT |
| `GET` | `/api/admin/me` | ✅ | Verify session |
| `GET` | `/api/patient/check/:mobile` | ❌ | Check existing patient |
| `POST` | `/api/register` | ❌ | Register patient + generate token |
| `GET` | `/api/dashboard` | ✅ | Stats, charts, analytics |
| `GET` | `/api/queue/today` | ✅ | Today's queue (filterable by status) |
| `GET` | `/api/search?q=&type=&date=` | ✅ | Search by token/mobile/name |
| `GET` | `/api/patient/:mobile/history` | ✅ | Full patient history |
| `GET` | `/api/visit/:id` | ✅ | Single visit details |
| `PUT` | `/api/visit/:id` | ✅ | Doctor update |
| `GET` | `/api/patients?page=&limit=` | ✅ | Paginated patients list |

---

## 🔒 Security Notes

- JWT tokens expire in 12 hours
- Passwords hashed with bcrypt (cost factor 12)
- CORS restricted to allowed origins in production
- Input validated on both client and server
- SQL injection prevented via parameterized queries

---

## 📦 Production Checklist

- [ ] Set strong `JWT_SECRET` (32+ random chars)
- [ ] Set `NODE_ENV=production`
- [ ] Update `ALLOWED_ORIGINS` to your frontend URL
- [ ] Add persistent volume for SQLite on Railway
- [ ] Change default admin password
- [ ] Set `REACT_APP_API_URL` to Railway backend URL

---

Built with ❤️ for real-world hospital workflows. Ready to sell to clinics.
