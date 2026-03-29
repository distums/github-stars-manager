require('dotenv').config();
const express = require('express');
const path = require('path');
const { searchStars, removeStar } = require('./store');
const { unstar } = require('./github');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/stars', (req, res) => {
  try {
    const keyword = req.query.q || '';
    const stars = searchStars(keyword);
    res.json(stars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stars/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const parts = name.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return res.status(400).json({ error: 'Invalid owner/repo format' });
    }
    const [owner, repo] = parts;
    await unstar(owner, repo);
    removeStar(name);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
