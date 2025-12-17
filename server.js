require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { google } = require('googleapis');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// YouTube API 설정
const youtube = google.youtube({
  version: 'v3',
  auth: process.env.YOUTUBE_API_KEY
});

// API 라우트

// 특정 채널의 최신 동영상 가져오기
app.get('/api/channels/:channelId/videos', async (req, res) => {
  try {
    const { channelId } = req.params;
    const maxResults = req.query.maxResults || 10;

    const response = await youtube.search.list({
      part: 'snippet',
      channelId: channelId,
      maxResults: parseInt(maxResults),
      order: 'date',
      type: 'video'
    });

    const videos = response.data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails.medium.url,
      publishedAt: item.snippet.publishedAt,
      channelTitle: item.snippet.channelTitle
    }));

    res.json(videos);
  } catch (error) {
    console.error('Error fetching videos:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// 채널 검색하기
app.get('/api/search/channels', async (req, res) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
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

    res.json(searchResults);
  } catch (error) {
    console.error('Error searching channels:', error);
    res.status(500).json({ error: 'Failed to search channels' });
  }
});

// 채널 정보 가져오기
app.get('/api/channels/:channelId/info', async (req, res) => {
  try {
    const { channelId } = req.params;

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

    res.json(channelInfo);
  } catch (error) {
    console.error('Error fetching channel info:', error);
    res.status(500).json({ error: 'Failed to fetch channel info' });
  }
});

// 메인 페이지
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vercel 서버리스 함수 export
module.exports = app;

// 로컬 개발용
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 KYoutube server running on http://localhost:${PORT}`);
    console.log(`📺 Open your browser and visit http://localhost:${PORT}`);
  });
}
