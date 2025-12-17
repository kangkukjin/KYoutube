# KYoutube - 나만의 유튜브 뷰어

케이블 TV처럼 번호를 선택해서 유튜브 채널을 보는 웹 애플리케이션

## 기능

- 📺 케이블 TV 스타일의 채널 선택
- 🎬 각 채널의 최신 동영상 목록 보기
- ▶️ 동영상 재생
- 📱 반응형 디자인 (데스크톱/모바일 지원)

## 설치 방법

1. 의존성 설치:
```bash
npm install
```

2. YouTube Data API 키 발급:
   - https://console.cloud.google.com/apis/credentials 접속
   - 새 프로젝트 생성
   - YouTube Data API v3 활성화
   - API 키 생성

3. `.env` 파일 수정:
```
YOUTUBE_API_KEY=여기에_발급받은_API_키_입력
PORT=3000
```

4. `server.js`에서 채널 목록 수정:
```javascript
const channels = [
  { id: 1, name: '채널이름', channelId: '유튜브_채널_ID' },
  { id: 2, name: '다른채널', channelId: '다른_채널_ID' },
  // 원하는 만큼 추가
];
```

## 채널 ID 찾는 방법

1. 유튜브에서 채널 페이지 접속
2. URL에서 채널 ID 확인:
   - `youtube.com/channel/UC...` 형식이면 `UC...` 부분이 채널 ID
   - `youtube.com/@username` 형식이면 페이지 소스에서 channelId 검색

## 실행 방법

```bash
npm start
```

브라우저에서 `http://localhost:3000` 접속

## 개발 모드 (자동 재시작)

```bash
npm run dev
```

## 프로젝트 구조

```
KYoutube/
├── server.js          # Express 백엔드 서버
├── package.json       # 프로젝트 설정
├── .env              # API 키 설정
├── README.md         # 이 파일
└── public/
    ├── index.html    # 메인 HTML
    ├── style.css     # 스타일시트
    └── app.js        # 프론트엔드 로직
```

## 사용법

1. 서버 실행 후 브라우저에서 접속
2. 번호가 표시된 채널 버튼 클릭
3. 해당 채널의 최신 동영상 목록 확인
4. 보고 싶은 동영상 클릭하여 재생
5. "← 동영상 목록으로" 버튼으로 되돌아가기

## 향후 추가 기능

- [ ] 채널 즐겨찾기
- [ ] 시청 기록 저장
- [ ] 자동 재생 모드
- [ ] 검색 기능
- [ ] 재생목록 관리
- [ ] PWA 지원 (모바일 앱처럼 설치)

## 라이선스

MIT
# Vercel Deploy
