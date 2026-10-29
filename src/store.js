const fs = require('fs');
const fsPromises = require('fs').promises;
const path = require('path');
const { STORE_FILE } = require('./config');

async function loadStars() {
  try {
    if (!fs.existsSync(STORE_FILE)) return [];
    const data = await fsPromises.readFile(STORE_FILE, 'utf-8');
    if (!data || data.trim() === '') return [];
    return JSON.parse(data);
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    console.error('Failed to load stars:', err.message);
    return [];
  }
}

async function saveStars(stars) {
  try {
    await fsPromises.writeFile(STORE_FILE, JSON.stringify(stars, null, 2));
  } catch (err) {
    console.error('Failed to save stars:', err.message);
    throw err;
  }
}

async function searchStars(keyword) {
  const stars = await loadStars();
  if (!keyword) return stars;
  const lower = keyword.toLowerCase();
  return stars.filter(
    s => s.full_name.toLowerCase().includes(lower) || (s.description && s.description.toLowerCase().includes(lower)) || (s.language && s.language.toLowerCase().includes(lower))
  );
}

async function removeStar(fullName) {
  const stars = await loadStars();
  const index = stars.findIndex(s => s.full_name === fullName);
  if (index === -1) return false;
  stars.splice(index, 1);
  await saveStars(stars);
  return true;
}

function validateStarItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.full_name !== 'string' || !item.full_name.trim()) return false;
  return true;
}

function validateNewStars(newStars) {
  if (!Array.isArray(newStars)) {
    throw new Error('newStars must be an array');
  }
  for (const star of newStars) {
    if (!validateStarItem(star)) {
      throw new Error('Each star must have a valid full_name field');
    }
  }
  return true;
}

async function addStars(newStars) {
  validateNewStars(newStars);
  const stars = await loadStars();
  const nameSet = new Set(stars.map(s => s.full_name));
  for (const star of newStars) {
    if (!nameSet.has(star.full_name)) {
      stars.push(star);
    }
  }
  await saveStars(stars);
}

module.exports = { loadStars, saveStars, searchStars, removeStar, addStars };
