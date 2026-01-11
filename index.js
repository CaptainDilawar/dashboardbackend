require('dotenv').config();
const express = require('express');
const cors = require('cors');
const spreadsheetsRouter = require('./api/spreadsheets');
const sheetRouter = require('./api/sheet');

const app = express();
const port = process.env.PORT || 3001;
const host = '0.0.0.0';

if (!process.env.APP_USERNAME || !process.env.APP_PASSWORD) {
  console.warn('Warning: APP_USERNAME or APP_PASSWORD is not set. Login will fail until you set them in a .env file or environment.');
}

const corsOptions = {
  origin: process.env.FRONTEND_ORIGIN || (process.env.NODE_ENV === 'production' ? '*' : 'http://localhost:5173'),
};
app.use(cors(corsOptions));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === process.env.APP_USERNAME && password === process.env.APP_PASSWORD) {
        res.status(200).json({ message: 'Login successful' });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// A wrapper to use async route handlers
const asyncHandler = (fn) => (req, res, next) => {
  return Promise
    .resolve(fn(req, res, next))
    .catch(next);
};

// Route for listing spreadsheets
app.get('/api/spreadsheets', asyncHandler(spreadsheetsRouter));

// Route for getting sheet data and metadata
app.get('/api/sheets/:sheetId', asyncHandler((req, res, next) => {
    req.query.sheetId = req.params.sheetId;
    sheetRouter(req, res).catch(next);
}));

// The metadata route was /api/sheets/:sheetId/metadata but it's handled by sheetRouter now with a query param
// So we need to make sure any calls to that are handled. The frontend code makes a call to /api/sheets/${ssId}/metadata
// So I will add that route.
app.get('/api/sheets/:sheetId/metadata', asyncHandler((req, res, next) => {
    // a bit of a hack to make it work with the existing sheetRouter
    req.query.sheetId = req.params.sheetId;
    req.query.metadata = 'true';
    sheetRouter(req, res).catch(next);
}));


app.listen(port, host, () => {
  console.log(`Backend server listening on ${host}:${port}`);
});