// server.js
const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL, // Replace with your frontend URL in production
  credentials: true
}));
app.use(express.json());

// Create data directory if it doesn't exist
const dataDir = path.join(__dirname, 'data');
fs.mkdir(dataDir, { recursive: true }).catch(console.error);

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// API endpoint to handle contact form submissions
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Server-side validation
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required' 
      });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid email format' 
      });
    }

    if (name.length > 100) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name must be less than 100 characters' 
      });
    }

    if (email.length > 255) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email must be less than 255 characters' 
      });
    }

    if (message.length > 1000) {
      return res.status(400).json({ 
        success: false, 
        message: 'Message must be less than 1000 characters' 
      });
    }

    const timestamp = new Date().toISOString();
    const data = {
      timestamp,
      name,
      email,
      message
    };

    // Create a unique filename for each submission
    const filename = path.join(dataDir, `contact_${timestamp.replace(/[:.]/g, '-')}.json`);
    
    // Write the data to a file
    await fs.writeFile(filename, JSON.stringify(data, null, 2));
    
    // Send success response
    res.status(200).json({
      success: true,
      message: 'Thank you for your message. I will get back to you soon!'
    });

  } catch (error) {
    console.error('Error saving contact form data:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Unable to process your request. Please try again later.' 
    });
  }
});

const PORT = process.env.PORT || 8000; // Matching the port in your frontend code
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});