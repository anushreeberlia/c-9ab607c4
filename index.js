const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || '/data/data.json';

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.url} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Database helpers
function loadData() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const data = fs.readFileSync(DB_PATH, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading data:', error);
  }
  return {
    reflections: [],
    states: [],
    insights: []
  };
}

function saveData(data) {
  try {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving data:', error);
  }
}

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Consciousness API is running', timestamp: new Date().toISOString() });
});

// Get all reflections
app.get('/api/reflections', (req, res) => {
  const data = loadData();
  res.json(data.reflections.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Create reflection
app.post('/api/reflections', (req, res) => {
  const { content, mood, tags } = req.body;
  
  if (!content) {
    return res.status(400).json({ error: 'Content is required' });
  }
  
  const reflection = {
    id: uuidv4(),
    content,
    mood: mood || 'neutral',
    tags: tags || [],
    createdAt: new Date().toISOString()
  };
  
  const data = loadData();
  data.reflections.push(reflection);
  saveData(data);
  
  res.status(201).json(reflection);
});

// Get consciousness states
app.get('/api/states', (req, res) => {
  const data = loadData();
  res.json(data.states.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
});

// Record consciousness state
app.post('/api/states', (req, res) => {
  const { awareness, focus, presence, notes } = req.body;
  
  if (awareness === undefined || focus === undefined || presence === undefined) {
    return res.status(400).json({ error: 'Awareness, focus, and presence levels are required' });
  }
  
  const state = {
    id: uuidv4(),
    awareness: Math.max(1, Math.min(10, awareness)),
    focus: Math.max(1, Math.min(10, focus)),
    presence: Math.max(1, Math.min(10, presence)),
    notes: notes || '',
    timestamp: new Date().toISOString()
  };
  
  const data = loadData();
  data.states.push(state);
  saveData(data);
  
  res.status(201).json(state);
});

// Get insights
app.get('/api/insights', (req, res) => {
  const data = loadData();
  res.json(data.insights.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

// Create insight
app.post('/api/insights', (req, res) => {
  const { title, content, category } = req.body;
  
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }
  
  const insight = {
    id: uuidv4(),
    title,
    content,
    category: category || 'general',
    createdAt: new Date().toISOString()
  };
  
  const data = loadData();
  data.insights.push(insight);
  saveData(data);
  
  res.status(201).json(insight);
});

// Get analytics/stats
app.get('/api/analytics', (req, res) => {
  const data = loadData();
  
  const stats = {
    totalReflections: data.reflections.length,
    totalStates: data.states.length,
    totalInsights: data.insights.length,
    averageAwareness: data.states.length > 0 ? 
      (data.states.reduce((sum, s) => sum + s.awareness, 0) / data.states.length).toFixed(1) : 0,
    averageFocus: data.states.length > 0 ? 
      (data.states.reduce((sum, s) => sum + s.focus, 0) / data.states.length).toFixed(1) : 0,
    averagePresence: data.states.length > 0 ? 
      (data.states.reduce((sum, s) => sum + s.presence, 0) / data.states.length).toFixed(1) : 0,
    moodDistribution: data.reflections.reduce((acc, r) => {
      acc[r.mood] = (acc[r.mood] || 0) + 1;
      return acc;
    }, {})
  };
  
  res.json(stats);
});

app.listen(PORT, () => {
  console.log(`Consciousness API running on port ${PORT}`);
});