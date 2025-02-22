// Load environment variables early
require('dotenv').config();

// Import dependencies
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 8000;

// Configure CORS
app.use(cors({
  origin: 'https://jeddynzila.netlify.app/' // Replace with your Netlify URL
}));

// app.use(cors(corsOptions));
app.use(express.json());

// Configure PostgreSQL connection using DATABASE_URL
const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // Use DATABASE_URL directly
  ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false } // Required for Render
});

// Handle unexpected PostgreSQL errors
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL error:', err);
});

// Test database connection
(async () => {
  try {
    const client = await pool.connect();
    console.log('✅ Connected to PostgreSQL');
    client.release();
  } catch (err) {
    console.error('❌ PostgreSQL connection error:', err.message);
  }
})();

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
    const { rows } = await pool.query(query, [name.trim(), email.trim(), message.trim()]);

    console.log('✅ Message stored in database with ID:', rows[0].id);
    res.status(200).json({ success: true, message: 'Message received. I will get back to you soon!' });

  } catch (error) {
    console.error('❌ Error storing message:', error.message);
    res.status(500).json({ success: false, message: 'Unable to process your request' });
  }
});

// 📩 Retrieve Contact Messages
app.get('/api/contact', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, messages: result.rows });

  } catch (error) {
    console.error('❌ Error retrieving messages:', error.message);
    res.status(500).json({ success: false, message: 'Error retrieving messages' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
