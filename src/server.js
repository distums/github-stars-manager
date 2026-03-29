require('dotenv').config();
const express = require('express');
const path = require('path');
const { searchStars, removeStar } = require('./store');
const { unstar } = require('./github');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/stars', async (req, res) => {
  try {
    const keyword = req.query.q || '';
    const stars = await searchStars(keyword);
    res.json(stars);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/stars/:fullName', async (req, res) => {
  const fullName = req.params.fullName;
  try {
    const parts = fullName.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return res.status(400).json({ error: 'Invalid owner/repo format' });
    }
    const [owner, repo] = parts;
    await unstar(owner, repo);
    await removeStar(fullName);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
