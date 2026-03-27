# Authentication Module Backend

A production-ready authentication module built for an internship project.

## Tech Stack
- Node.js & Express.js
- TypeScript
- MongoDB & Mongoose
- JWT (Access & Refresh tokens)
- OTP Verification (Nodemailer setup for email)
- Zod (Input validation)
- bcrypt (Password hashing)

## Features
- User Registration with Email/Phone verification via OTP
- Standard Login & Passwordless OTP Login
- JWT protected routes and Role-Based Access Control (RBAC)
- Token Refreshing to maintain secure sessions
- Forgot Password & Reset Password flows
- Security enhancements (Helmet, Rate Limiting, CORS configuration)

## Database Schema Explanation
The database consists of three core entities:
1. **User**: Stores personal information (name, email, phone), password (hashed), role (user/admin/super_admin), and verification status. Unique constraints prevent duplicate emails or phone numbers.
2. **OTP**: Stores 6-digit OTP codes. Uses Mongoose TTL index to automatically remove the document when `expiresAt` is reached (5-minute expiry).
3. **RefreshToken**: Stores valid refresh tokens associated with users to issue new access tokens. Uses TTL index for 7-day expiry.

## Setup Instructions
1. Install dependencies: `npm install`
2. Create a `.env` file based on `.env.example`
3. Add your MongoDB URI and Gmail SMTP App Credentials to `.env`
4. Start development server: `npm run dev`
5. Compile to JavaScript: `npm run build`
6. Start production server: `npm start`

## API Documentation
A Postman collection is provided in this repository for full API testing.

- `POST /auth/register` - Register a new user
- `POST /auth/verify-otp` - Verify email/phone using 6-digit OTP
- `POST /auth/login` - Standard email + password login
- `POST /auth/login-otp` - Request OTP for passwordless login
- `POST /auth/refresh-token` - Get new access token using refresh token
- `POST /auth/forgot-password` - Request a password reset OTP
- `POST /auth/reset-password` - Reset password using the OTP
- `POST /auth/logout` - Invalidate the refresh token
- `GET /auth/me` - Get current user info (Requires valid Bearer Token)
