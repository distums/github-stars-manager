const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(process.cwd(), 'stars.json');

function loadStars() {
  if (!fs.existsSync(STORE_FILE)) return [];
  const data = fs.readFileSync(STORE_FILE, 'utf-8');
  return JSON.parse(data);
}

function saveStars(stars) {
  fs.writeFileSync(STORE_FILE, JSON.stringify(stars, null, 2));
}

function searchStars(keyword) {
  const stars = loadStars();
  if (!keyword) return stars;
  const lower = keyword.toLowerCase();
  return stars.filter(
    s => s.name.toLowerCase().includes(lower) || s.description.toLowerCase().includes(lower)
  );
}

function removeStar(name) {
  const stars = loadStars();
  const index = stars.findIndex(s => s.name === name);
  if (index === -1) return false;
  stars.splice(index, 1);
  saveStars(stars);
  return true;
}

function addStars(newStars) {
  const stars = loadStars();
  const nameSet = new Set(stars.map(s => s.name));
  for (const star of newStars) {
    if (!nameSet.has(star.name)) {
      stars.push(star);
    }
  }
  saveStars(stars);
}

module.exports = { loadStars, saveStars, searchStars, removeStar, addStars };
