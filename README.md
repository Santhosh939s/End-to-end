# CipherLink: End-to-End Encrypted Messaging Platform 🔒

**CipherLink** is a modern, highly secure, full-stack web application designed to provide absolute privacy for digital communication. Built from the ground up with a custom zero-knowledge architecture, it features military-grade End-to-End Encryption (E2EE), Biometric Face Login, and an enterprise-grade Admin security dashboard.

---

## 🌟 Core Features

### 🔐 True Zero-Knowledge End-to-End Encryption
CipherLink ensures that the server **never** sees your plaintext messages. 
- **Asymmetric Cryptography:** Every user receives an RSA-OAEP public/private key pair upon registration.
- **Symmetric Cryptography:** Every message payload is encrypted locally in the browser using a randomly generated AES-256 key, which is then encrypted using the recipient's RSA Public Key.
- **Result:** Not even the database administrators can read the messages. Absolute privacy.

### 🤖 Biometric Face Login
Passwordless, high-tech security powered by AI.
- Utilizes `face-api.js` (TensorFlow) for 68-point facial landmark detection.
- The biometric payload is encrypted locally, transmitted securely to the server, and mathematically compared against a stored vector array to grant access.

### 📧 100% Secure Email Verification
Say goodbye to bot registrations.
- Fully integrated `Nodemailer` + Gmail SMTP pipeline.
- Generates 6-digit OTPs that are aggressively hashed using `bcrypt` before being stored in MongoDB.
- Codes automatically self-destruct after 10 minutes.

### 👑 Enterprise Admin Dashboard (Sudo Mode)
A dedicated Role-Based Access Control (RBAC) panel for platform governance.
- **Sudo Verification:** Before executing destructive actions, Admins must re-authenticate (via Password or Face Scan).
- **Data Sanitization (Wipe Protocol):** When a user is deleted, the system physically overwrites their encrypted chat history payloads with system placeholders to guarantee compliance and privacy.

### 🚀 Lightning-Fast UI & Discovery
- Built with React and TailwindCSS for a premium, responsive "Glassmorphism" design.
- Features optimized server-side query limitations to search and load the user database instantly.
- Consent-based Friend Request routing to prevent spam messaging.

---

## 🛠️ Technology Stack

**Frontend Layer:**
- React (Vite)
- Tailwind CSS & Lucide Icons
- Web Crypto API (Client-Side Encryption)
- Face-api.js (Biometrics)

**Backend Layer:**
- Node.js & Express.js
- Zod (Input Validation)
- Bcrypt & JSON Web Tokens (Stateless Session Security)
- Nodemailer

**Database Layer:**
- MongoDB Atlas (NoSQL)
- Mongoose ODM

---

## ⚙️ Local Installation & Setup

If you wish to run CipherLink locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/Santhosh939s/End-to-end.git
cd End-to-end
```

### 2. Backend Setup
```bash
cd backend
npm install
```
Create a `.env` file in the `/backend` directory:
```env
PORT=3000
FRONTEND_URL=http://localhost:5173
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
SERVER_SECRET=your_server_biometric_escrow_key
EMAIL_USER=your_gmail_address
EMAIL_PASS=your_16_character_google_app_password
```
Start the backend:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the `/frontend` directory:
```env
VITE_API_URL=http://localhost:3000/api
```
Start the frontend:
```bash
npm run dev
```

---

## 🔒 Security Architecture Note
CipherLink prioritizes security above all else. The frontend heavily utilizes the native browser `window.crypto.subtle` API to generate RSA key pairs. Because private keys are incredibly sensitive, they are symmetrically encrypted using AES-GCM (derived from the user's master password) *before* ever leaving the browser. The backend only ever stores the encrypted blob of the private key, ensuring a completely trustless, Zero-Knowledge design.

---
*Built with passion and a focus on digital privacy.*
