# Smart Mentoring System — Security Build Setup

This build does **not** include or modify `backend/.env`. Keep your existing `.env` unchanged.

## Run backend

Open a terminal in `backend`:

```powershell
npm install
npm run dev
```

## Run frontend

Open a second terminal in `frontend`:

```powershell
npm install
npm run dev
```

## Database note

The application reads `MONGO_URI` from `backend/.env`. If you use MongoDB Atlas, the value must be the exact Atlas URI generated under **Database → Connect → Drivers**, with the real Database Access username/password and **no `:27017` port** in a `mongodb+srv://` URI.

This project cannot infer or repair missing Atlas credentials. The `.env` file is intentionally left untouched.

## Security build included

- Student academic records protected server-side from student edits
- JWT-authenticated Socket.IO connections and private rooms
- Duplicate socket message writer removed; REST authorization is the message path
- Auth rate limiting
- Account lockout
- Password reset flow
- Email verification flow
- Optional email OTP 2FA
- Helmet headers
- Production-safe error responses
- Access/refresh JWT support
- Joi validation
- Message delivered/read status handling
- Login activity history
- HOD audit logs for protected operations
- Multipart achievement upload with server-side limits
- CORS allowlist
- Password-strength validation
- Jest/Supertest smoke test scaffold
- ESLint/Prettier/Husky configuration

Some advanced features require SMTP configuration and a correctly configured MongoDB Atlas connection.


### Security additions in this build
The build includes refresh-token rotation/logout invalidation, HOD account recovery, student academic read-only enforcement in the UI and API, upload signature checks, and expanded audit events. Keep your existing `.env` unchanged; the ZIP intentionally excludes `.env`.
