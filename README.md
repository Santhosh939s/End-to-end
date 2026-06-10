# CipherLink

CipherLink is a secure, full-stack, end-to-end encrypted messaging platform. It is built as a portfolio-grade project with clean architecture and separation of concerns.

## Features
- **End-to-End Encryption:** Messages are encrypted using AES-GCM (for symmetric message encryption) and RSA-OAEP (for secure key exchange) via the Web Crypto API.
- **Friend Request System:** Search users, send, and accept friend requests to start messaging securely.
- **Responsive UI:** Fully responsive design that works beautifully on desktop (sidebar) and mobile (bottom nav).
- **Premium Dark Theme:** Built with Tailwind CSS v4 featuring glassmorphism and subtle animations.

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, Zustand, React Router, Radix UI (Lucide Icons)
- **Backend:** Node.js, Express, TypeScript, better-sqlite3 (Lightweight storage), JWT, bcrypt
- **Security:** Web Crypto API, Zod Validation

## Setup Instructions

### 1. Backend Setup
```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

---

## 🚀 How to Migrate this project to MongoDB
CipherLink currently uses a lightweight `better-sqlite3` backend database via a clean Repository Pattern. It is intentionally designed to make migrating to MongoDB easy.

1. **Replace Repository Layer:**
   - In `backend/src/repositories/`, replace the SQLite queries in `UserRepository`, `FriendRepository`, and `ChatRepository` with Mongoose model queries (e.g., `UserModel.create()`, `UserModel.findOne()`).
   
2. **MongoDB Collection Design:**
   - **Users:** `_id`, `username` (indexed), `email` (indexed), `passwordHash`, `publicKey`, `encryptedPrivateKey`, `keySalt`.
   - **Friendships:** `_id`, `user1Id` (indexed), `user2Id` (indexed), `senderId`, `status`. Create a compound unique index on `{ user1Id: 1, user2Id: 1 }`.
   - **Conversations:** `_id`, `user1Id` (indexed), `user2Id` (indexed).
   - **Messages:** `_id`, `conversationId` (indexed), `senderId`, `encryptedContent`, `iv`, `encryptedKeyForReceiver`, `encryptedKeyForSender`, `createdAt`.

3. **Indexes:**
   - Add indexes to `username`, `email`, and `conversationId` for fast retrieval.

4. **Future Improvements (WebSocket Support):**
   - For real-time messaging, integrate `socket.io` in `backend/src/index.ts`. Emit events when a message is saved to MongoDB, and listen for them in `frontend/src/pages/Chats.tsx`.

## Security Limitations
This is an educational prototype. While it uses genuine cryptography (Web Crypto API):
- Private keys are decrypted and stored in browser memory during an active session.
- Perfect Forward Secrecy (PFS) is not implemented (messages use static RSA keys for exchange).
- In a production app, use advanced protocols like the Signal Protocol.
