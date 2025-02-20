// Import dependencies
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// CORS configuration
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

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection()
  .then(connection => {
    console.log('Successfully connected to the database.');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to the database:', err);
  });

// Contact form endpoint - Save message
app.post('/api/contact', async (req, res) => {
  console.log('Received contact form submission');
  
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Insert into database
    const query = `
      INSERT INTO contact_messages 
      (name, email, message, created_at) 
      VALUES (?, ?, ?, NOW())
    `;

    const [result] = await pool.execute(query, [
      name.trim(),
      email.trim(),
      message.trim()
    ]);

    console.log('Message stored in database with ID:', result.insertId);

    res.status(200).json({
      success: true,
      message: 'Thank you for your message. I will get back to you soon!'
    });
    
  } catch (error) {
    console.error('Error storing message:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to process your request. Please try again later.'
    });
  }
});

// Retrieve messages
app.get('/api/contact', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT * FROM contact_messages ORDER BY created_at DESC');
    res.json({ success: true, messages: rows });
  } catch (error) {
    console.error('Error retrieving messages:', error);
    res.status(500).json({ success: false, message: 'Error retrieving messages' });
  }
});

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
