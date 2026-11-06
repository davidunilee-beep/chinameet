# Chinameet

첨부한 `중국어학습앱.html`의 동영상 플레이어를 기준으로 만든 설치형 웹 앱입니다. 원본 영상 주소를 유지하며, 추가 중국어 학습 콘텐츠나 회원가입 기능은 포함하지 않습니다.

PC와 모바일 반응형 화면, PWA manifest와 아이콘, 홈 화면 설치, Windows 인터넷 바로가기 다운로드를 제공합니다. 외부 CDN 없이 앱 화면을 표시합니다.

## 이용

- PC Chrome·Edge: **PC 앱 다운로드**에서 설치합니다. 설치 창이 제공되지 않으면 주소창 설치 아이콘 또는 메뉴를 사용하세요.
- Windows: **PC 바로가기 저장**으로 `Chinameet.url`을 받아 바탕화면에 둘 수 있습니다. 이 파일은 운영 주소를 기본 브라우저에서 여는 바로가기이며 앱 설치 파일과는 별도입니다.
- Android Chrome: **앱 설치하기**에서 브라우저 설치 창을 엽니다. 설치 가능 여부는 브라우저가 결정합니다.
- iPhone·iPad: Safari의 공유 → 홈 화면에 추가를 선택합니다.
- 첫 접속은 인터넷이 필요합니다. 이후 앱 화면은 오프라인에서도 열 수 있지만 영상은 인터넷과 원본 제공자의 접근 권한이 필요합니다. 외부 영상은 다운로드하거나 캐시하지 않습니다.

## Vercel 배포

GitHub `davidunilee-beep/chinameet`을 Import합니다. Framework Preset은 **Other**, Root Directory는 저장소 루트, Build Command는 없음, Output Directory는 `.`입니다. `vercel.json`에 포함했습니다. GitHub 운영 브랜치의 후속 커밋은 연결된 Vercel에서 자동 배포됩니다.

`index.html`이 배포용 앱이며 `중국어학습앱.html`은 보관용 원본입니다. 영상 링크가 만료되거나 인증이 필요하면 `index.html`의 source 주소를 공개 재생 가능한 URL로 교체해야 합니다.

로컬 미리보기: `node scripts/serve.cjs`, 이후 `http://127.0.0.1:4175`에 접속합니다.
