# Vercel 배포 가이드

## 1단계: Vercel 계정 만들기

1. https://vercel.com 접속
2. "Sign Up" 클릭
3. GitHub 계정으로 로그인 (추천)
   - 또는 이메일로 가입

## 2단계: GitHub에 코드 올리기

### GitHub 계정이 있는 경우:

터미널에서 다음 명령어 실행:

```bash
cd /Users/kangkukjin/Desktop/AI/KYoutube

# Git 초기화 (이미 되어있으면 건너뛰기)
git init

# 모든 파일 추가
git add .

# 커밋
git commit -m "Initial commit"

# GitHub에서 새 저장소 만들기
# https://github.com/new 접속해서 저장소 생성 (예: KYoutube)

# 원격 저장소 연결 (YOUR_USERNAME을 본인 GitHub 아이디로 변경)
git remote add origin https://github.com/YOUR_USERNAME/KYoutube.git

# 푸시
git branch -M main
git push -u origin main
```

### GitHub 계정이 없는 경우:

Vercel CLI로 직접 배포 가능 (아래 3단계 참고)

## 3단계: Vercel에 배포하기

### 방법 A: Vercel 웹사이트에서 (추천)

1. https://vercel.com/dashboard 접속
2. "Add New..." → "Project" 클릭
3. GitHub 저장소 선택 (KYoutube)
4. "Import" 클릭
5. **Environment Variables 설정**
   - "Environment Variables" 섹션에서:
   - Name: `YOUTUBE_API_KEY`
   - Value: (Google Cloud에서 발급받은 API 키 입력)
6. "Deploy" 클릭
7. 완료! (약 1-2분 소요)

### 방법 B: Vercel CLI로 (선택사항)

```bash
# Vercel CLI 설치
npm install -g vercel

# 프로젝트 폴더에서 배포
cd /Users/kangkukjin/Desktop/AI/KYoutube
vercel

# 질문에 답하기:
# - Set up and deploy? Y
# - Which scope? (본인 계정 선택)
# - Link to existing project? N
# - Project name? kyoutube
# - Directory? ./
# - Override settings? N

# 환경 변수 추가
vercel env add YOUTUBE_API_KEY
# (API 키 입력)

# 프로덕션 배포
vercel --prod
```

## 4단계: 배포 완료!

배포가 완료되면 다음과 같은 URL을 받게 됩니다:
```
https://kyoutube-xyz123.vercel.app
```

이 URL을:
- 컴퓨터 브라우저에서 접속
- 스마트폰 브라우저에서 접속
- 가족들과 공유

모두 가능합니다!

## 5단계: 스마트폰에서 앱처럼 사용하기

### 안드로이드:
1. Chrome 브라우저에서 URL 접속
2. 우측 상단 메뉴(⋮) → "홈 화면에 추가"
3. 이름 입력 → "추가"
4. 홈 화면에 아이콘 생김!

### 아이폰:
1. Safari에서 URL 접속
2. 하단 공유 버튼 → "홈 화면에 추가"
3. "추가" 클릭

## 업데이트하기

코드를 수정한 후:

```bash
git add .
git commit -m "Update"
git push
```

Vercel이 자동으로 새 버전을 배포합니다! (약 1분 소요)

## 문제 해결

### channels.json 파일 문제
- Vercel은 파일 저장이 안 됩니다 (서버리스)
- 채널 추가/삭제가 재시작하면 초기화됨
- 해결: 나중에 데이터베이스 연결 (MongoDB 무료 사용 가능)

### API 키 오류
- Vercel 대시보드 → 프로젝트 → Settings → Environment Variables
- `YOUTUBE_API_KEY` 확인 및 수정

## 다음 단계 (선택사항)

- 커스텀 도메인 연결 (예: kyoutube.com)
- 데이터베이스 추가 (채널 목록 영구 저장)
- PWA 기능 강화 (오프라인 지원)
