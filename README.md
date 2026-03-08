# Sahanubhuti
# 🌸 Sahanubhuti

> *"I'm here with you. You're not alone."*

Sahanubhuti (Sanskrit: सहानुभूति — *empathy, fellow-feeling*) is a warm, AI-powered emotional support companion. It provides a safe, judgment-free space for users to express their feelings, track their moods, and reflect through journaling.

---

## ✨ Features

- **💬 Compassionate Chat** — Real-time AI-powered conversations using Claude via OpenRouter. Sahanubhuti listens, validates, and responds with genuine empathy. Includes crisis detection with Indian helpline numbers.
- **📊 Mood Tracker** — Log your daily mood with one click. View your emotional patterns across the week with insights and streaks.
- **📝 Gentle Journaling** — Write freely with thoughtful prompts. All entries are saved privately in your browser.
- **🔐 Auth System** — Secure JWT-based registration and login. Guests can still chat using local fallback responses.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML, CSS, Vanilla JavaScript |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose) |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| AI | Claude via OpenRouter API |
| Hosting | Render (backend) + GitHub Pages (frontend) |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB Atlas account
- An OpenRouter API key (free tier available at [openrouter.ai](https://openrouter.ai))

### 1. Clone the repository

```bash
git clone https://github.com/akshat-shaw-509/Sahanubhuti.git
cd Sahanubhuti
```

### 2. Install backend dependencies

```bash
cd backend
npm install
```

### 3. Create your `.env` file

```bash
# backend/.env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sahanubhuti
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=1h
OPENROUTER_API_KEY=sk-or-v1-...
CLIENT_ORIGIN=http://127.0.0.1:5500
PORT=5000
```

### 4. Run the backend

```bash
node server.js
```

### 5. Open the frontend

Open `index.html` with Live Server (VS Code extension) or any static file server.

---

## 🌐 Deployment

### Backend — Render

1. Push your code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Root Directory** to `backend`
4. Set **Start Command** to `node server.js`
5. Add all environment variables from your `.env` under **Environment**
6. Deploy

### Frontend — GitHub Pages

1. Go to your repo → **Settings → Pages**
2. Set source to **Deploy from branch → main**
3. Your site will be live at `https://<your-username>.github.io/Sahanubhuti/`
4. Update `CLIENT_ORIGIN` in Render to match this URL

---

## 📁 Project Structure

```
Sahanubhuti/
├── index.html               # Home page
├── index.js                 # Root redirect script
├── pages/
│   ├── html/
│   │   ├── chat.html        # Chat page
│   │   ├── mood.html        # Mood tracker
│   │   └── journal.html     # Journal
│   ├── css/                 # Stylesheets
│   └── js/
│       ├── index.js         # Auth + modal logic
│       ├── chat.js          # Chat + AI integration
│       ├── mood.js          # Mood tracker logic
│       └── journal.js       # Journal logic
└── backend/
    ├── server.js            # Express entry point
    ├── config/
    │   └── db.js            # MongoDB connection
    ├── controllers/
    │   ├── authController.js
    │   └── chatController.js
    ├── middleware/
    │   └── authMiddleware.js
    ├── models/
    │   └── User.js
    ├── routes/
    │   ├── authRoutes.js
    │   └── chatRoutes.js
    └── utils/
        └── validateInput.js
```

---

## 🔒 Security

- Passwords are hashed with **bcrypt** (12 salt rounds)
- JWTs expire after 1 hour
- Rate limiting on auth routes (10 requests / 15 minutes per IP)
- CORS restricted to the configured `CLIENT_ORIGIN`
- Request body size capped at 10kb

---

## 🆘 Crisis Resources

Sahanubhuti is a supportive companion, **not a replacement for professional mental health care**. If you or someone you know is in crisis:

- **Emergency:** 112
- **iCall (India):** 9820466726
- **iCall Website:** [icallhelpline.org](https://icallhelpline.org)

---

## 📄 License

MIT License — feel free to fork, adapt, and build on this with care. 🌿

---

*Made with 💛 by the Sahanubhuti Team. Compassion, always.*
