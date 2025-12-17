// 전역 변수
let channels = [];
let currentChannel = null;
let player = null;
let currentVideos = [];

// YouTube IFrame API 준비
function onYouTubeIframeAPIReady() {
    console.log('YouTube IFrame API ready');
}

// 초기화
async function init() {
    try {
        loadChannelsFromStorage();
        renderChannelList();
        setupEventListeners();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('초기화 중 오류가 발생했습니다.');
    }
}

// localStorage에서 채널 불러오기
function loadChannelsFromStorage() {
    const saved = localStorage.getItem('kyoutube_channels');
    if (saved) {
        channels = JSON.parse(saved);
    } else {
        // 기본 채널
        channels = [
            { id: 1, name: '김줄스', channelId: 'UCPTM-NMXolwmnUE_rjFIoYQ' }
        ];
        saveChannelsToStorage();
    }
}

// localStorage에 채널 저장
function saveChannelsToStorage() {
    localStorage.setItem('kyoutube_channels', JSON.stringify(channels));
}

// 이벤트 리스너 설정
function setupEventListeners() {
    // 채널 추가 토글
    document.getElementById('toggleAddChannel').addEventListener('click', () => {
        const form = document.getElementById('addChannelForm');
        form.style.display = form.style.display === 'none' ? 'block' : 'none';
    });

    // 검색 버튼
    document.getElementById('searchButton').addEventListener('click', searchChannels);
    
    // 엔터키로 검색
    document.getElementById('searchInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            searchChannels();
        }
    });

    // 동영상 목록으로 돌아가기
    document.getElementById('backToVideos').addEventListener('click', () => {
        document.getElementById('playerSection').style.display = 'none';
        document.getElementById('videoSection').style.display = 'block';
        
        if (player && player.pauseVideo) {
            player.pauseVideo();
        }
        
        document.getElementById('videoSection').scrollIntoView({ behavior: 'smooth' });
    });
}

// 채널 검색
async function searchChannels() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();
    
    if (!query) {
        alert('검색어를 입력하세요.');
        return;
    }

    const searchResults = document.getElementById('searchResults');
    searchResults.innerHTML = '<div class="loading">검색 중...</div>';

    try {
        const response = await fetch(`/api/search/channels?q=${encodeURIComponent(query)}`);
        const results = await response.json();

        if (results.length === 0) {
            searchResults.innerHTML = '<p>검색 결과가 없습니다.</p>';
            return;
        }

        searchResults.innerHTML = '';
        results.forEach(channel => {
            const item = document.createElement('div');
            item.className = 'search-result-item';
            
            // 이미 추가된 채널인지 확인
            const alreadyAdded = channels.find(ch => ch.channelId === channel.channelId);
            
            item.innerHTML = `
                <img src="${channel.thumbnail}" alt="${channel.title}" class="search-result-thumbnail">
                <div class="search-result-info">
                    <div class="search-result-title">${channel.title}</div>
                    <div class="search-result-description">${channel.description || '설명 없음'}</div>
                </div>
                <button class="add-button" ${alreadyAdded ? 'disabled' : ''} 
                        onclick="addChannel('${channel.title.replace(/'/g, "\\'")}', '${channel.channelId}')">
                    ${alreadyAdded ? '추가됨' : '추가'}
                </button>
            `;
            
            searchResults.appendChild(item);
        });
    } catch (error) {
        console.error('Error searching channels:', error);
        searchResults.innerHTML = '<p>검색 중 오류가 발생했습니다.</p>';
    }
}

// 채널 추가
function addChannel(name, channelId) {
    // 중복 체크
    const exists = channels.find(ch => ch.channelId === channelId);
    if (exists) {
        alert('이미 추가된 채널입니다.');
        return;
    }

    // 새 ID 생성
    const newId = channels.length > 0 ? Math.max(...channels.map(ch => ch.id)) + 1 : 1;
    
    const newChannel = {
        id: newId,
        name: name,
        channelId: channelId
    };

    channels.push(newChannel);
    saveChannelsToStorage();
    renderChannelList();
    
    // 검색 결과 초기화
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchInput').value = '';
    
    alert(`${name} 채널이 추가되었습니다!`);
}

// 채널 삭제
function deleteChannel(channelId, event) {
    event.stopPropagation();
    
    const channel = channels.find(ch => ch.id === channelId);
    if (!confirm(`${channel.name} 채널을 삭제하시겠습니까?`)) {
        return;
    }

    channels = channels.filter(ch => ch.id !== channelId);
    saveChannelsToStorage();
    renderChannelList();
    
    alert('채널이 삭제되었습니다.');
}

// 채널 목록 렌더링
function renderChannelList() {
    const channelList = document.getElementById('channelList');
    channelList.innerHTML = '';

    // 채널을 정렬하고 새 번호 부여
    const sortedChannels = [...channels].sort((a, b) => a.id - b.id);
    
    sortedChannels.forEach((channel, index) => {
        const displayNumber = index + 1; // 1부터 시작하는 연속된 번호
        
        const wrapper = document.createElement('div');
        wrapper.className = 'channel-button-wrapper';
        
        const button = document.createElement('button');
        button.className = 'channel-button';
        button.onclick = () => selectChannel(channel);
        
        button.innerHTML = `
            <span class="channel-number">${displayNumber}</span>
            <span class="channel-name">${channel.name}</span>
        `;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-channel';
        deleteBtn.innerHTML = '✕';
        deleteBtn.onclick = (e) => deleteChannel(channel.id, e);
        
        wrapper.appendChild(button);
        wrapper.appendChild(deleteBtn);
        channelList.appendChild(wrapper);
    });
}

// 채널 선택
async function selectChannel(channel) {
    currentChannel = channel;
    
    document.getElementById('currentChannel').style.display = 'block';
    document.getElementById('videoSection').style.display = 'block';
    document.getElementById('playerSection').style.display = 'none';
    
    document.getElementById('channelName').textContent = channel.name;
    document.getElementById('channelDescription').textContent = '동영상을 불러오는 중...';
    
    try {
        const channelInfo = await fetchChannelInfo(channel.channelId);
        document.getElementById('channelDescription').textContent = channelInfo.description || '설명 없음';
        
        await loadVideos(channel.channelId);
        document.getElementById('videoSection').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        console.error('Error selecting channel:', error);
        alert('채널 정보를 불러오는데 실패했습니다.');
    }
}

// 채널 정보 가져오기
async function fetchChannelInfo(channelId) {
    const response = await fetch(`/api/channels/${channelId}/info`);
    return await response.json();
}

// 동영상 목록 불러오기
async function loadVideos(channelId) {
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = '<div class="loading">동영상을 불러오는 중...</div>';
    
    try {
        const response = await fetch(`/api/channels/${channelId}/videos?maxResults=12`);
        currentVideos = await response.json();
        renderVideoList();
    } catch (error) {
        console.error('Error loading videos:', error);
        videoList.innerHTML = '<div class="loading">동영상을 불러오는데 실패했습니다.</div>';
    }
}

// 동영상 목록 렌더링
function renderVideoList() {
    const videoList = document.getElementById('videoList');
    videoList.innerHTML = '';
    
    currentVideos.forEach(video => {
        const card = document.createElement('div');
        card.className = 'video-card';
        card.onclick = () => playVideo(video);
        
        const publishDate = new Date(video.publishedAt).toLocaleDateString('ko-KR');
        
        card.innerHTML = `
            <img src="${video.thumbnail}" alt="${video.title}">
            <div class="video-card-content">
                <div class="video-card-title">${video.title}</div>
                <div class="video-card-meta">${publishDate}</div>
            </div>
        `;
        
        videoList.appendChild(card);
    });
}

// 동영상 재생
function playVideo(video) {
    document.getElementById('videoSection').style.display = 'none';
    document.getElementById('playerSection').style.display = 'block';
    document.getElementById('videoTitle').textContent = video.title;
    document.getElementById('videoDescription').textContent = video.description;
    
    if (player) {
        player.loadVideoById(video.id);
    } else {
        player = new YT.Player('player', {
            height: '500',
            width: '100%',
            videoId: video.id,
            playerVars: {
                'playsinline': 1,
                'rel': 0
            }
        });
    }
    
    document.getElementById('playerSection').scrollIntoView({ behavior: 'smooth' });
}

// 초기화 실행
document.addEventListener('DOMContentLoaded', init);
