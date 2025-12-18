const { google } = require('googleapis');

const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// 간단한 메모리 캐시 (5분 유지)
const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

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
    const maxResults = req.query.maxResults || 10;
    const cacheKey = `videos_${channelId}_${maxResults}`;

    // 캐시 확인
    const cached = getCache(cacheKey);
    if (cached) {
      console.log(`Cache hit: ${cacheKey}`);
      return res.status(200).json(cached);
    }

    // 1단계: 채널의 업로드 재생목록 ID 가져오기
    const channelResponse = await youtube.channels.list({
      part: 'contentDetails',
      id: channelId
    });

    if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
      return res.status(404).json({ error: 'Channel not found' });
    }

    const uploadsPlaylistId = channelResponse.data.items[0].contentDetails.relatedPlaylists.uploads;

    // 2단계: 재생목록에서 동영상 가져오기 (쿼터 1만 소모!)
    const playlistResponse = await youtube.playlistItems.list({
      part: 'snippet',
      playlistId: uploadsPlaylistId,
      maxResults: parseInt(maxResults)
    });

    const videos = playlistResponse.data.items.map(item => ({
      id: item.snippet.resourceId.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default?.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle
    }));

    // 캐시 저장
    setCache(cacheKey, videos);
    console.log(`Cache set: ${cacheKey}`);

    res.status(200).json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos', message: error.message });
  }
};
