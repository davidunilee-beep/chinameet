const fs = require('node:fs');
const source = fs.readFileSync('중국어학습앱.html', 'utf8');
if (!source.includes('const categories = [') || !source.includes('function startListening()')) throw new Error('Expected Chinese learning source');
let html = source.replace('</head>', `
    <meta name="theme-color" content="#C0392B">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-title" content="Chinameet">
    <link rel="manifest" href="./manifest.webmanifest">
    <link rel="icon" type="image/png" href="./icons/app-192.png">
    <link rel="apple-touch-icon" href="./icons/apple-touch-icon.png">
    <link rel="stylesheet" href="./app.css?v=learning-2">
    <script defer src="./install.js?v=learning-2"></script>
</head>`).replace('<body>', `<body>
    <section class="cm-install" aria-label="Chinameet 앱 다운로드">
        <div><strong>Chinameet · 중국어 기초 학습</strong><p id="installStatus" role="status">홈 화면에 추가하고 간편하게 학습하세요.</p></div>
        <div class="cm-actions"><button id="installButton" type="button">앱 설치하기 ↗</button><a id="pcShortcut" href="#" download="Chinameet.url" hidden>PC 바로가기 저장 ↓</a></div>
    </section>
    <dialog id="installDialog" aria-labelledby="installTitle">
        <div class="cm-dialog-top"><h2 id="installTitle">Chinameet 설치 안내</h2><button id="closeGuide" type="button" aria-label="설치 안내 닫기">×</button></div>
        <p id="installGuide"></p><ol id="installSteps"></ol><p>발음·음성 인식 지원은 기기와 브라우저에 따라 다릅니다. 따라 말하기에는 마이크 권한과 인터넷 연결이 필요할 수 있어요.</p>
        <a id="pcDownload" class="cm-download" href="#" download="Chinameet.url" hidden>PC 바로가기 파일 저장 ↓</a>
    </dialog>`);
// Keep original lessons and layout; repair the microphone stop-handler scope.
html = html.replace('let isListening = false;', 'let isListening = false;\n        let recognition = null;');
html = html.replace('const recognition = new SpeechRecognition();', 'recognition = new SpeechRecognition();');
html = html.replace('window.speechSynthesis.cancel();', 'if (!("speechSynthesis" in window) || typeof SpeechSynthesisUtterance === "undefined") return;\n            window.speechSynthesis.cancel();');
html = html.replace('document.addEventListener("keydown", (e) => {', 'document.addEventListener("keydown", (e) => {\n            if (document.getElementById("installDialog").open || /INPUT|TEXTAREA|SELECT|BUTTON|A/.test(e.target.tagName) || e.target.isContentEditable) return;');
fs.writeFileSync('index.html', html);
const script = html.match(/<script>\s*([\s\S]*?)<\/script>/)[1];
new (require('node:vm').Script)(script);
const dataScript = script.slice(script.indexOf('const categories = ['), script.indexOf('let currentCategoryIndex'));
console.log(require('node:vm').runInNewContext(dataScript+'; JSON.stringify({categories:categories.map(c=>({name:c.name,words:c.words.length})), total:categories.reduce((n,c)=>n+c.words.length,0)})'));
