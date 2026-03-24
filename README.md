# NodeMaster – Distributed Process Migration Simulator

## 🚀 How to Run

### Requirements
- Node.js installed (download from https://nodejs.org)
- Two terminal windows open

---

### Step 1: Create the Backend .env file
Create a file called `.env` inside the `backend/` folder with this content:

```
PORT=5004
SUPABASE_URL=https://nqhclplqmwidvzeyhpig.supabase.co
SUPABASE_KEY=sb_publishable_Lpf01vlPWKsaoo-naTlbUg_HJcW0h1_
```

---

### Step 2: Install and Start Backend
```bash
cd backend
npm install
node server.js
```
You should see: `Server running on port 5004`

---

### Step 3: Install and Start Frontend
Open a second terminal:
```bash
cd frontend
npm install
npm run dev
```
You should see: `VITE ready at http://localhost:5173`

---

### Step 4: Open Browser
Go to: **http://localhost:5173**

---

## 🎮 Demo Instructions

1. Go to **Nodes** page → Click `+ Add Node` to add computers
2. Go to **Processes** page → Set CPU slider to **65%+** → Type a name → Click **SPAWN**
3. Go back to **Nodes** → The overloaded computer turns **RED** and shakes
4. Wait ~3 seconds → **Blue migration animation** fires automatically
5. Go to **Monitor** → See the live graph spike + migration history log
