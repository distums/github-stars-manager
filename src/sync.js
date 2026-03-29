const { getStarred } = require('./github');
const { addStars } = require('./store');

async function sync() {
  console.log('Fetching stars from GitHub...');
  const stars = await getStarred();
  console.log(`Found ${stars.length} stars`);
  await addStars(stars);
  console.log('Stars synced successfully');
}

module.exports = { sync };
