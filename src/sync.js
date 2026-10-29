const { getStarred } = require('./github');
const { addStars, setStars } = require('./store');

async function sync(options = {}) {
  try {
    console.log('Fetching stars from GitHub...');
    const stars = await getStarred();
    console.log(`Found ${stars.length} stars`);
    if (options.force) {
      await setStars(stars);
      console.log('Stars force-synced (local file overwritten)');
    } else {
      await addStars(stars);
      console.log('Stars synced successfully');
    }
  } catch (error) {
    console.error('Sync failed:', error.message);
    throw error;
  }
}

module.exports = { sync };
