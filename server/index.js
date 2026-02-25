// Load .env only in local development — Render/Railway inject env vars directly
if (process.env.NODE_ENV !== 'production') {
    try { require('dotenv').config(); } catch { }
}

const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/menu', require('./routes/menu'));
app.use('/api/orders', require('./routes/orders'));

// ── Production: serve React build ──────────────────────────
const isProd = process.env.NODE_ENV === 'production';
const distDir = path.join(__dirname, '..', 'client', 'dist');

if (isProd) {
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
        res.sendFile(path.join(distDir, 'index.html'));
    });
}

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Server running on port ${PORT} [${isProd ? 'production' : 'development'}]`);
});
