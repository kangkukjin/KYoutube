const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// 간단한 메모리 캐시 (10분 유지 - 채널 정보는 자주 안 바뀜)
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10분

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
    const { channelId } = req.query;
    const cacheKey = `info_${channelId}`;

    // 캐시 확인
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    const response = await youtube.channels.list({
      part: 'snippet,statistics',
      id: channelId
    });

    if (response.data.items.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const channel = response.data.items[0];
    const channelInfo = {
      id: channel.id,
      title: channel.snippet.title,
      description: channel.snippet.description,
      thumbnail: channel.snippet.thumbnails.default.url,
      subscriberCount: channel.statistics.subscriberCount,
      videoCount: channel.statistics.videoCount,
      viewCount: channel.statistics.viewCount
    };

    // 캐시 저장
    setCache(cacheKey, channelInfo);
    console.log(`Cache set: ${cacheKey}`);

    res.status(200).json(channelInfo);
  } catch (error) {
    console.error('Error fetching channel info:', error);
    res.status(500).json({ error: 'Failed to fetch channel info', message: error.message });
  }
};
