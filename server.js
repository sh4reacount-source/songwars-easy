const express = require('express');
const path = require('path');
const yts = require('yt-search');
const https = require('https');
const http = require('http');

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

// Proxy download to y2mate service
app.get('/download', async (req, res) => {
  const videoId = (req.query.id || '').trim();
  if (!videoId || !/^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
    return res.status(400).send('Invalid video ID');
  }

  try {
    // Use y2mate API for reliable downloading
    const y2mateUrl = `https://www.y2mate.com/mates/en/youtube-downloader/download/${videoId}`;
    
    const options = {
      hostname: 'www.y2mate.com',
      path: `/mates/en/youtube-downloader/download/${videoId}`,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    };

    https.get(options, (proxyRes) => {
      // Pipe the response from y2mate directly to client
      res.setHeader('Content-Type', proxyRes.headers['content-type'] || 'video/mp4');
      res.setHeader('Content-Disposition', `attachment; filename="${videoId}.mp4"`);
      proxyRes.pipe(res);
    }).on('error', (error) => {
      console.error('Download proxy error:', error);
      res.status(500).json({ 
        error: 'Download service error', 
        fallback: `https://www.y2mate.com/en/download-youtube-video/${videoId}`
      });
    });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Download preparation failed' });
  }
});

app.listen(PORT, () => {
  console.log(`SongWars local server running at http://localhost:${PORT}`);
});
