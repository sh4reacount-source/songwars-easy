const statusText = document.getElementById('statusText');
const startButton = document.getElementById('startButton');
const beatPrompt = document.getElementById('beatPrompt');
const videoStatus = document.getElementById('videoStatus');
const videoWrapper = document.getElementById('videoWrapper');
const videoEmbed = document.getElementById('videoEmbed');
const downloadButton = document.getElementById('downloadButton');
const downloadLinks = document.getElementById('downloadLinks');

let prompts = [];
let currentPrompt = '';
let currentVideoId = '';

const DEFAULT_PROMPTS = [
    'Drake type beat free for profit',
    'Kendrick Lamar type beat free for profit',
    'Travis Scott type beat free for profit',
    'J. Cole type beat free for profit',
    'Future type beat free for profit',
    'Lil Baby type beat free for profit',
    'Playboi Carti type beat free for profit',
    'Ken Carson type beat free for profit',
    'Yeat type beat free for profit',
    'Lil Uzi Vert type beat free for profit'
];

async function loadPrompts() {
    try {
        const response = await fetch('artists.txt');
        if (!response.ok) {
            throw new Error('artists.txt not loaded');
        }

        const text = await response.text();
        prompts = parseArtistsText(text);

        if (!prompts.length) {
            throw new Error('No prompts found in artists.txt');
        }

        statusText.textContent = `Loaded ${prompts.length} prompts from artists.txt.`;
    } catch (error) {
        prompts = DEFAULT_PROMPTS.slice();
        statusText.textContent = 'Could not load artists.txt directly. Using fallback prompt list. Serve this page over HTTP for full functionality.';
        console.warn(error);
    }
}

function parseArtistsText(raw) {
    return raw
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0);
}

function getRandomPrompt() {
    if (!prompts.length) return '';
    const raw = prompts[Math.floor(Math.random() * prompts.length)];
    const suffixes = ['', ' instrumental', ' beat instrumental', ' free instrumental', ' type beat', ' vibe'];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return raw + suffix;
}

function escapeHtml(text) {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function updatePromptDisplay(prompt) {
    currentPrompt = prompt || '';
    beatPrompt.textContent = currentPrompt || 'No beat selected yet.';
    statusText.textContent = currentPrompt ? `Selected beat: ${currentPrompt}` : 'Waiting for a beat.';
}

function setCurrentVideo(video) {
    if (!video?.id) {
        currentVideoId = '';
        videoWrapper.classList.add('hidden');
        videoStatus.textContent = 'No video available.';
        setDownloadLinks('');
        return;
    }

    currentVideoId = video.id;
    videoEmbed.src = `https://www.youtube.com/embed/${video.id}?autoplay=1&rel=0`;
    videoWrapper.classList.remove('hidden');
    videoStatus.textContent = video.title ? `Now playing: ${video.title}` : 'Now playing selected beat.';
    statusText.textContent = `Found video for beat: ${video.title || video.id}`;
    setDownloadLinks(video.id);
}

function clearVideo() {
    currentVideoId = '';
    videoEmbed.src = '';
    videoWrapper.classList.add('hidden');
    videoStatus.textContent = 'No video loaded yet.';
    setDownloadLinks('');
}

function generateRandomBeat() {
    const prompt = getRandomPrompt();
    updatePromptDisplay(prompt);
    clearVideo();
    statusText.textContent = `Finding a video for: ${prompt}`;
    return prompt;
}

async function startRandomBeat() {
    const prompt = generateRandomBeat();
    updatePromptDisplay(prompt);
    statusText.textContent = `Searching for a beat: ${prompt}`;
    videoStatus.textContent = 'Searching for a video...';

    const video = await searchLocalServer(prompt);
    if (video) {
        setCurrentVideo(video);
    } else {
        statusText.textContent = 'Could not find a video automatically. Make sure server.js is running and reload the page.';
        videoStatus.textContent = 'No video loaded.';
    }
}

const LOCAL_SERVER_FALLBACK = 'http://localhost:3000';

async function searchLocalServer(query) {
    const endpoints = [
        `/search?q=${encodeURIComponent(query)}`,
        `${LOCAL_SERVER_FALLBACK}/search?q=${encodeURIComponent(query)}`
    ];

    for (const endpoint of endpoints) {
        try {
            const response = await fetch(endpoint);
            if (!response.ok) {
                console.warn('Search server response not OK', endpoint, response.status);
                continue;
            }

            const data = await response.json();
            if (data.error) {
                console.warn('Search server returned error', endpoint, data.error);
                continue;
            }

            return {
                id: data.id,
                title: data.title || 'Random beat video',
                thumbnail: data.thumbnail || ''
            };
        } catch (error) {
            console.warn('Search server failed', endpoint, error);
        }
    }

    return null;
}

function setDownloadLinks(videoId) {
    downloadLinks.innerHTML = '';
    downloadLinks.classList.add('hidden');
}

function getDownloadUrl(videoId) {
    // Always use relative path so it works on any origin (localhost, Render, etc.)
    return `/download?id=${encodeURIComponent(videoId)}`;
}

function downloadVideo() {
    if (!currentVideoId) {
        statusText.textContent = 'No video loaded yet. Press Start first.';
        return;
    }

    statusText.textContent = 'Starting download…';
    downloadButton.disabled = true;
    
    const downloadUrl = getDownloadUrl(currentVideoId);
    
    // Create a hidden link and trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${currentVideoId}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    downloadButton.disabled = false;
    statusText.textContent = 'Download started!';
    
    setTimeout(() => {
        statusText.textContent = `Found video for beat: ${currentPrompt}`;
    }, 3000);
}

startButton.addEventListener('click', startRandomBeat);
downloadButton.addEventListener('click', downloadVideo);

updatePromptDisplay('');
loadPrompts();
