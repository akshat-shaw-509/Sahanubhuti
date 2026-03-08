# 🌸 Sahanubhuti

> **“I'm here with you. You're not alone.”**

Sahanubhuti (Sanskrit: सहानुभूति — *empathy*) is an **AI-powered emotional support companion** that provides a safe and judgment-free space for users to express their feelings.

Users can **chat with an empathetic AI, track their mood patterns, and maintain private journals** to reflect on their emotional well-being.

# ✨ Features

### 💬 AI Emotional Companion

* Real-time empathetic conversations
* Crisis detection with **Indian mental health helplines**

### 📊 Mood Tracker

* Track daily emotional states
* Visual weekly mood insights
* Streak tracking for consistency

### 📝 Private Journaling

* Write freely using thoughtful prompts
* Entries stored securely in the browser
* Reflection-focused journaling system

### 🔐 Authentication

* JWT-based login & registration
* Password hashing using **bcrypt**
* Guest chat mode with fallback responses

---

# 🛠️ Tech Stack

| Layer          | Technology                    |
| -------------- | ----------------------------- |
| Frontend       | HTML, CSS, Vanilla JavaScript |
| Backend        | Node.js, Express.js           |
| Database       | MongoDB Atlas                 |
| Authentication | JWT + bcrypt                  |
| AI Integration | Claude (via OpenRouter API)   |
| Deployment     | Render + GitHub Pages         |

---

# 📁 Project Structure

```
Sahanubhuti
│
├── index.html
├── index.js
│
├── pages
│   ├── html
│   │   ├── chat.html
│   │   ├── mood.html
│   │   └── journal.html
│   │
│   ├── css
│   └── js
│       ├── chat.js
│       ├── mood.js
│       ├── journal.js
│       └── index.js
│
└── backend
    ├── server.js
    │
    ├── config
    │   └── db.js
    │
    ├── controllers
    │   ├── authController.js
    │   └── chatController.js
    │
    ├── middleware
    │   └── authMiddleware.js
    │
    ├── models
    │   └── User.js
    │
    ├── routes
    │   ├── authRoutes.js
    │   └── chatRoutes.js
    │
    └── utils
        └── validateInput.js
```

---

# ⚙️ Getting Started

## Prerequisites

* Node.js **v18+**
* MongoDB Atlas
* OpenRouter API key

Get API key here
[https://openrouter.ai](https://openrouter.ai)

---

## 1️⃣ Clone Repository

```bash
git clone https://github.com/akshat-shaw-509/Sahanubhuti.git
cd Sahanubhuti
```

---

## 2️⃣ Install Backend Dependencies

```bash
cd backend
npm install
```

---

## 3️⃣ Configure Environment Variables

Create `.env` inside **backend**

```
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1h
OPENROUTER_API_KEY=your_api_key
CLIENT_ORIGIN=http://127.0.0.1:5500
PORT=5000
```

---

## 4️⃣ Run Backend

```bash
node server.js
```

---

## 5️⃣ Run Frontend

Open:

```
index.html
```

using **Live Server (VSCode)** or any static server.

---

# 🔒 Security

* Password hashing using **bcrypt**
* JWT authentication with **1 hour expiration**
* Rate limiting on authentication routes
* Strict CORS configuration
* Request body size limited to **10kb**

---

# 🆘 Crisis Resources

Sahanubhuti is **not a replacement for professional help**.

If you or someone you know is struggling:

| Resource    | Contact                                                |
| ----------- | ------------------------------------------------------ |
| Emergency   | 112                                                    |
| iCall India | +91 9820466726                                         |
| Website     | [https://icallhelpline.org](https://icallhelpline.org) |

---

# 📄 License

MIT License

---

# 👨‍💻 Author

**Akshat Shaw**

GitHub
[https://github.com/akshat-shaw-509](https://github.com/akshat-shaw-509)
