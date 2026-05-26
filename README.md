# Angular Auth Backend - Klein Ople

Authentication API built with Node.js, Express, and MySQL.

## 🚀 Live Deployment

- **API Base URL:** https://klykly-auth-backend.onrender.com
- **API Documentation (Swagger):** https://klykly-auth-backend.onrender.com/api-docs
- **Frontend Application:** https://klykly-auth-frontend.onrender.com

## 📋 Features

- User Registration with Email Verification
- User Login with JWT Authentication
- Refresh Token Mechanism
- Forgot Password / Reset Password
- Email Notifications via Brevo
- Admin Dashboard & User Management
- Role-Based Access Control (User/Admin)
- Swagger API Documentation

## 🛠️ Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** MySQL
- **Authentication:** JWT
- **Email Service:** Brevo
- **Documentation:** Swagger/OpenAPI

## 📦 Installation

### Prerequisites

- Node.js (v18 or higher)
- MySQL Database
- Brevo API Key

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/Kly-kly/angular-auth-boilerplate-backend.git
   cd angular-auth-boilerplate-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file:
   ```env
   PORT=4000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:4200

   DB_HOST=153.92.15.31
   DB_PORT=3306
   DB_USER=u875409848_ople
   DB_PASSWORD=2qW^sUg=M
   DB_NAME=u875409848_ople

   JWT_SECRET=klein_ople_jwt_secret
   JWT_REFRESH_SECRET=klein_ople_refresh_secret
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   BREVO_API_KEY=your_brevo_api_key
   EMAIL_FROM=noreply@kleinople.com
   ```

4. Create database table:
   ```sql
   CREATE TABLE users (
     id INT AUTO_INCREMENT PRIMARY KEY,
     title VARCHAR(10),
     firstName VARCHAR(255) NOT NULL,
     lastName VARCHAR(255) NOT NULL,
     email VARCHAR(255) UNIQUE NOT NULL,
     password VARCHAR(255) NOT NULL,
     role VARCHAR(50) DEFAULT 'User',
     isVerified BOOLEAN DEFAULT FALSE,
     verificationToken VARCHAR(255),
     resetToken VARCHAR(255),
     resetTokenExpires DATETIME,
     refreshTokens TEXT DEFAULT '[]',
     createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
   );
   ```

5. Start the server:
   ```bash
   npm run dev
   ```

## 🔗 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/accounts/register` | Register new user |
| POST | `/accounts/verify-email` | Verify email |
| POST | `/accounts/authenticate` | Login user |
| POST | `/accounts/refresh-token` | Refresh JWT token |
| POST | `/accounts/revoke-token` | Logout |
| POST | `/accounts/forgot-password` | Request password reset |
| POST | `/accounts/reset-password` | Reset password |
| GET | `/accounts` | Get all users (Admin only) |
| GET | `/accounts/:id` | Get user by ID |
| PUT | `/accounts/:id` | Update user |
| DELETE | `/accounts/:id` | Delete user |

## 📄 License

ISC
