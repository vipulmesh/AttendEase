import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';

// Import routes & middleware
import apiRoutes from './routes/apiRoutes.js';
import { globalErrorHandler } from './middlewares/errorHandler.js';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🔥 Properly configure dotenv for ES Modules using absolute path
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3000;




// 🔥 MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB Connected");

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch(err => {
    console.error("❌ MongoDB Connection Error:", err);
    process.exit(1);
  });

// 🌐 CORS (WebView friendly)
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// 📊 Logging
app.use(morgan('dev'));

// 📦 Body Parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// 📁 Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));


// 🚀 API Routes
app.use('/api', apiRoutes);


// ❤️ Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: "OK" });
});


// 🔁 SPA fallback
app.use((req, res, next) => {
  if (req.method === 'GET' && !req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    next();
  }
});


// ❌ Global Error Handler
app.use(globalErrorHandler);


// 🚀 Start Server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});