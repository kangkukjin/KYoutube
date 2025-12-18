// 전역 변수
let categoryData = { categories: [] };  // 카테고리별 채널 데이터
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
        await loadChannels();
        renderCategoryList();
        setupEventListeners();
        populateCategorySelect();
    } catch (error) {
        console.error('Initialization error:', error);
        alert('초기화 중 오류가 발생했습니다.');
    }
}

// 채널 불러오기
async function loadChannels() {
    // 1. localStorage에서 사용자 데이터 불러오기
    const savedData = localStorage.getItem('kyoutube_category_data');
    
    if (savedData) {
        categoryData = JSON.parse(savedData);
        console.log('✅ localStorage에서 데이터 로드됨');
        return;
    }
    
    // 2. localStorage에 없으면 channels.json에서 기본 데이터 불러오기
    try {
        const response = await fetch('/channels.json');
        if (response.ok) {
            categoryData = await response.json();
            saveToStorage();
            console.log(`✅ channels.json에서 ${categoryData.categories.length}개 카테고리 로드됨`);
        }
    } catch (error) {
        console.warn('channels.json 로드 실패:', error);
        categoryData = { categories: [{ name: '기타', channels: [] }] };
    }
}

// localStorage에 저장
function saveToStorage() {
    localStorage.setItem('kyoutube_category_data', JSON.stringify(categoryData));
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
        if (e.key === 'Enter') searchChannels();
    });

    // 카테고리 추가 버튼
    document.getElementById('addCategoryButton').addEventListener('click', addCategory);

    // 동영상 목록으로 돌아가기
    document.getElementById('backToVideos').addEventListener('click', () => {
        document.getElementById('playerSection').style.display = 'none';
        document.getElementById('videoSection').style.display = 'block';
        if (player && player.pauseVideo) player.pauseVideo();
        document.getElementById('videoSection').scrollIntoView({ behavior: 'smooth' });
    });
}

// 카테고리 셀렉트 채우기
function populateCategorySelect() {
    const select = document.getElementById('categorySelect');
    select.innerHTML = '';
    categoryData.categories.forEach((cat, index) => {
        const option = document.createElement('option');
        option.value = index;
        option.textContent = cat.name;
        select.appendChild(option);
    });
}

// 카테고리 추가
function addCategory() {
    const input = document.getElementById('newCategoryInput');
    const name = input.value.trim();
    
    if (!name) {
        alert('카테고리 이름을 입력하세요.');
        return;
    }
    
    // 중복 체크
    if (categoryData.categories.find(c => c.name === name)) {
        alert('이미 존재하는 카테고리입니다.');
        return;
    }
    
    categoryData.categories.push({ name, channels: [] });
    saveToStorage();
    renderCategoryList();
    populateCategorySelect();
    input.value = '';
    alert(`"${name}" 카테고리가 추가되었습니다.`);
}

// 카테고리 삭제
function deleteCategory(categoryIndex, event) {
    event.stopPropagation();
    const cat = categoryData.categories[categoryIndex];
    
    if (!confirm(`"${cat.name}" 카테고리를 삭제하시겠습니까?\n(${cat.channels.length}개 채널이 함께 삭제됩니다)`)) {
        return;
    }
    
    categoryData.categories.splice(categoryIndex, 1);
    saveToStorage();
    renderCategoryList();
    populateCategorySelect();
}

// 카테고리 목록 렌더링
function renderCategoryList() {
    const container = document.getElementById('categoryList');
    container.innerHTML = '';

    categoryData.categories.forEach((category, catIndex) => {
        const catDiv = document.createElement('div');
        catDiv.className = 'category-item';
        
        // 카테고리 헤더
        const header = document.createElement('div');
        header.className = 'category-header';
        header.onclick = () => toggleCategory(catIndex);
        
        header.innerHTML = `
            <span class="category-toggle">▶</span>
            <span class="category-name">${category.name}</span>
            <span class="category-count">(${category.channels.length})</span>
            <button class="delete-category" onclick="deleteCategory(${catIndex}, event)">✕</button>
        `;
        
        // 채널 목록 (기본 숨김)
        const channelList = document.createElement('div');
        channelList.className = 'category-channels';
        channelList.id = `category-${catIndex}`;
        channelList.style.display = 'none';
        
        category.channels.forEach((channel, chIndex) => {
            const chDiv = document.createElement('div');
            chDiv.className = 'channel-item';
            chDiv.innerHTML = `
                <span class="channel-name" onclick="selectChannel(${catIndex}, ${chIndex})">${channel.name}</span>
                <button class="delete-channel" onclick="deleteChannel(${catIndex}, ${chIndex}, event)">✕</button>
            `;
            channelList.appendChild(chDiv);
        });
        
        catDiv.appendChild(header);
        catDiv.appendChild(channelList);
        container.appendChild(catDiv);
    });
}

// 카테고리 토글 (펼침/접힘)
function toggleCategory(catIndex) {
    const channelList = document.getElementById(`category-${catIndex}`);
    const header = channelList.previousElementSibling;
    const toggle = header.querySelector('.category-toggle');
    
    if (channelList.style.display === 'none') {
        channelList.style.display = 'block';
        toggle.textContent = '▼';
        header.classList.add('open');
    } else {
        channelList.style.display = 'none';
        toggle.textContent = '▶';
        header.classList.remove('open');
    }
}

// 채널 검색
async function searchChannels() {
    const query = document.getElementById('searchInput').value.trim();
    
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
            const alreadyAdded = isChannelAdded(channel.channelId);
            
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

// 채널이 이미 추가되었는지 확인
function isChannelAdded(channelId) {
    return categoryData.categories.some(cat => 
        cat.channels.some(ch => ch.id === channelId)
    );
}

// 채널 추가
function addChannel(name, channelId) {
    if (isChannelAdded(channelId)) {
        alert('이미 추가된 채널입니다.');
        return;
    }

    const categoryIndex = parseInt(document.getElementById('categorySelect').value);
    
    categoryData.categories[categoryIndex].channels.push({
        id: channelId,
        name: name
    });
    
    saveToStorage();
    renderCategoryList();
    
    document.getElementById('searchResults').innerHTML = '';
    document.getElementById('searchInput').value = '';
    
    alert(`${name} 채널이 "${categoryData.categories[categoryIndex].name}"에 추가되었습니다!`);
}

// 채널 삭제
function deleteChannel(catIndex, chIndex, event) {
    event.stopPropagation();
    
    const channel = categoryData.categories[catIndex].channels[chIndex];
    if (!confirm(`${channel.name} 채널을 삭제하시겠습니까?`)) {
        return;
    }

    categoryData.categories[catIndex].channels.splice(chIndex, 1);
    saveToStorage();
    renderCategoryList();
}

// 채널 선택
async function selectChannel(catIndex, chIndex) {
    const channel = categoryData.categories[catIndex].channels[chIndex];
    currentChannel = channel;
    
    document.getElementById('currentChannel').style.display = 'block';
    document.getElementById('videoSection').style.display = 'block';
    document.getElementById('playerSection').style.display = 'none';
    
    document.getElementById('channelName').textContent = channel.name;
    document.getElementById('channelDescription').textContent = '동영상을 불러오는 중...';
    
    try {
        const channelInfo = await fetchChannelInfo(channel.id);
        document.getElementById('channelDescription').textContent = channelInfo.description || '설명 없음';
        
        await loadVideos(channel.id);
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
