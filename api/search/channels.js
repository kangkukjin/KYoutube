const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// 간단한 메모리 캐시 (3분 유지 - 검색은 짧게)
const cache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3분

function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    cache.delete(key);
    return null;
  }
  return item.data;
}

function setCache(key, data) {
  cache.set(key, {
    data: data,
    expires: Date.now() + CACHE_DURATION
  });
}

module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const cacheKey = `search_${q}`;

    // 캐시 확인
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    const response = await youtube.search.list({
      part: 'snippet',
      q: q,
      type: 'channel',
      maxResults: 10
    });

    const searchResults = response.data.items.map(item => ({
      channelId: item.snippet.channelId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.default.url
    }));

    // 캐시 저장
    setCache(cacheKey, searchResults);
    console.log(`Cache set: ${cacheKey}`);

    res.status(200).json(searchResults);
  } catch (error) {
    console.error('Error searching channels:', error);
    res.status(500).json({ error: 'Failed to search channels', message: error.message });
  }
};
