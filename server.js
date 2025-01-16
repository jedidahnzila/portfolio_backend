require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Middleware
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://jeddynzila.netlify.app',
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: false,
};

app.use(cors(corsOptions));
app.use(express.json());

// Debugging middleware
app.use((req, res, next) => {
  console.log(`Incoming request: ${req.method} ${req.url}`);
  next();
});

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
fs.mkdir(dataDir, { recursive: true }).catch(console.error);

// Health check endpoint for Render
app.get('/', (req, res) => {
  res.send('Server is running');
});

// Handle preflight requests explicitly (if necessary)
app.options('/api/contact', cors(corsOptions));

// API endpoint to handle contact form submissions
app.post('/api/contact', async (req, res) => {
  console.log('Received contact form submission');
  console.log('Request body:', req.body);
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
      });
    }

    const timestamp = new Date().toISOString();
    const data = {
      timestamp,
      name,
      email,
      message,
    };

    const filename = path.join(dataDir, `contact_${timestamp.replace(/[:.]/g, '-')}.json`);
    await fs.writeFile(filename, JSON.stringify(data, null, 2));

    res.status(200).json({
      success: true,
      message: 'Thank you for your message. I will get back to you soon!',
    });
  } catch (error) {
    console.error('Error saving contact form data:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process your request. Please try again later.',
    });
  }
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
