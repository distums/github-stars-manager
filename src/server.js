const express = require('express');
const path = require('path');
const { searchStars, removeStar } = require('./store');
const { unstar } = require('./github');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

app.get('/api/stars', (req, res) => {
  const keyword = req.query.q || '';
  const stars = searchStars(keyword);
  res.json(stars);
});

app.delete('/api/stars/:name', async (req, res) => {
  const name = req.params.name;
  try {
    const [owner, repo] = name.split('/');
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
