// app.js - Main server file
const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const { analyzeImage, compareImages } = require('./services/ai-service');
const { searchMissingPersons } = require('./services/search-service');
const missingPersonRoutes = require('./routes/missingPerson');
const userRoutes = require('./routes/user');
const config = require('./config');

const app = express();
const PORT = process.env.PORT || 5500;

// Middleware setup
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

// Storage configuration for uploaded images
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Database connection
mongoose.connect(config.databaseUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Database connection successful'))
.catch(err => console.error('Database connection error:', err));

// Route setup
app.use('/api/missing-persons', missingPersonRoutes);
app.use('/api/users', userRoutes);

// Serve index.html by default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Search missing persons by parameters
app.post('/api/search', async (req, res) => {
  try {
    const { name, location, age, additionalInfo } = req.body;
    const results = await searchMissingPersons({ name, location, age, additionalInfo });
    res.json(results);
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search execution error', error: error.message });
  }
});

// Image search endpoint with AI
app.post('/api/search/image', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image selected' });
    }
    
    // Analyze image using AI
    const imageAnalysis = await analyzeImage(req.file.path);
    
    // Search for matches in database
    const matches = await compareImages(imageAnalysis, config.similarityThreshold);
    
    res.json({
      matches,
      imageAnalysis: {
        age: imageAnalysis.estimatedAge,
        gender: imageAnalysis.gender,
        identifyingFeatures: imageAnalysis.identifyingFeatures
      }
    });
  } catch (error) {
    console.error('Image search error:', error);
    res.status(500).json({ message: 'Image analysis error', error: error.message });
  }
});

// Add new missing person endpoint
app.post('/api/missing-persons', upload.array('images', 5), async (req, res) => {
  // Logic should be implemented in missingPersonRoutes
  res.status(501).json({ message: 'This feature is still in development' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;