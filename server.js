const express = require('express');
const path = require('path');
const yts = require('yt-search');

const app = express();
const PORT = process.env.PORT || 3000;

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

app.use(express.static(path.join(__dirname)));

app.get('/search', async (req, res) => {
  const query = (req.query.q || '').trim();
  if (!query) {
    return res.status(400).json({ error: 'Missing search query' });
  }

  try {
    const searchResults = await yts(query);
    const video = (searchResults?.videos || []).find(item => item.videoId);

    if (!video) {
      return res.status(404).json({ error: 'No video found' });
    }

    return res.json({
      id: video.videoId,
      title: video.title,
      url: video.url,
      thumbnail: video.thumbnail || ''
    });
  } catch (error) {
    console.error('Search error:', error);
    return res.status(500).json({ error: 'Search failed' });
  }
});

app.listen(PORT, () => {
  console.log(`SongWars local server running at http://localhost:${PORT}`);
});
