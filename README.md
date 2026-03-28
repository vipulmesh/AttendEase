# Attendance Manager

A production-ready web application for managing student attendance, built for Vercel and Android WebView.

## Tech Stack
- **Frontend**: HTML5, CSS3, Vanilla JS
- **Backend**: Node.js Serverless Functions (Vercel)
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Tokens)

## Project Initialization

1. Obtain your MongoDB Connection String from MongoDB Atlas.
2. Choose a secure string for your JWT secret.
3. In your Vercel Project Dashboard, or in your local `.env` file, add these environment variables:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/attendance?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key
ADMIN_EMAIL=admin@attendance.com
ADMIN_PASSWORD=admin123
```

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```
2. Run the Vercel Development Server:
   ```bash
   vercel dev
   ```
3. Visit `http://localhost:3000`

## Vercel Deployment

1. Make sure you have the Vercel CLI installed: `npm i -g vercel`
2. Run the deployment command in the root folder:
   ```bash
   vercel
   ```
3. Answer the prompts (default settings are fine).
4. For production deployment, run:
   ```bash
   vercel --prod
   ```
5. **Important**: Go to your Vercel Dashboard -> Project Settings -> Environment Variables, and add `MONGODB_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD`.

## Android WebView Setup

If using inside an Android App via WebView:
- Ensure the WebView has JavaScript enabled (`setJavaScriptEnabled(true)`).
- Ensure DOM Storage is enabled (`setDomStorageEnabled(true)`) so `localStorage` works for the JWT token.
- Access the deployment URL via HTTPS.

## Default Admin Credentials

- **Email**: `admin@attendance.com` (configurable via `ADMIN_EMAIL` env variable)
- **Password**: `admin123` (configurable via `ADMIN_PASSWORD` env variable)
