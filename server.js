// Import dependencies
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Configure CORS
const corsOptions = {
  origin: [
    'http://localhost:3000', 
    'https://jeddynzila.netlify.app',
    'https://my-portfolio-backend-srry.onrender.com'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// Configure PostgreSQL connection
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false } // Required for Render
});

// Test database connection
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err));

// 📨 Save Contact Form Message
app.post('/api/contact', async (req, res) => {
  console.log('📩 Received contact form submission');

  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    // Insert into database
    const query = `
      INSERT INTO contact_messages (name, email, message, created_at) 
      VALUES ($1, $2, $3, NOW()) RETURNING id
    `;
    const result = await pool.query(query, [name.trim(), email.trim(), message.trim()]);

    console.log('✅ Message stored in database with ID:', result.rows[0].id);
    res.status(200).json({ success: true, message: 'Message received. I will get back to you soon!' });

  } catch (error) {
    console.error('❌ Error storing message:', error);
    res.status(500).json({ success: false, message: 'Unable to process your request' });
  }
});

// 📩 Retrieve Contact Messages
app.get('/api/contact', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, messages: result.rows });

  } catch (error) {
    console.error('❌ Error retrieving messages:', error);
    res.status(500).json({ success: false, message: 'Error retrieving messages' });
  }
});

// 🌍 Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
