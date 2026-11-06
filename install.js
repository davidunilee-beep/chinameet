(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const android = /Android/i.test(navigator.userAgent);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const desktop = !android && !ios;
  const windows = desktop && /Win/i.test(navigator.platform || navigator.userAgent);
  const embedded = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|\bwv\b/i.test(navigator.userAgent);
  const chrome = /Chrome\//.test(navigator.userAgent) && !/SamsungBrowser|EdgA|OPR|Firefox/.test(navigator.userAgent) && !embedded;
  const display = matchMedia('(display-mode: standalone)');
  let installed = display.matches || navigator.standalone === true;
  let deferredPrompt = null;
  let busy = false;
  const status = $('installStatus');
  const button = $('installButton');
  const dialog = $('installDialog');
  function render() {
    installed = installed || display.matches || navigator.standalone === true;
    button.textContent = installed ? '설치 안내' : desktop ? 'PC 앱 다운로드 ↗' : '앱 설치하기 ↗';
    $('pcShortcut').hidden = !windows;
    status.textContent = installed ? '설치된 앱을 사용하고 있어요.' : desktop ? 'PC 앱으로 설치하거나 바로가기를 저장하세요.' : '홈 화면에 추가하고 Chinameet를 간편하게 여세요.';
  }
  render();
  display.addEventListener?.('change', render);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferredPrompt = event; installed = false;
    button.textContent = desktop ? 'PC 앱 다운로드 ↗' : '앱 다운로드 ↗';
    status.textContent = '버튼을 누르면 설치 창이 열려요.';
  });
  window.addEventListener('appinstalled', () => {
    installed = true; deferredPrompt = null; render(); dialog.close();
  });
  function showGuide() {
    $('installGuide').textContent = ios ? 'Safari에서 홈 화면에 추가해 주세요.' : '브라우저가 설치 창을 제공하지 않으면 아래 방법을 이용하세요.';
    const steps = ios
      ? ['Safari에서 이 주소를 여세요.', '공유 버튼 → 홈 화면에 추가 → 추가를 선택하세요.']
      : ['Chrome·Edge의 주소창 설치 아이콘 또는 메뉴의 앱 설치를 선택하세요.', 'Mac Safari에서는 파일 → Dock에 추가를 선택하세요.'];
    $('installSteps').replaceChildren(...steps.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    $('pcDownload').hidden = !windows;
    if (!dialog.open) dialog.showModal();
  }
  button.addEventListener('click', async () => {
    if (busy) return;
    if (installed) { showGuide(); return; }
    if (!deferredPrompt) {
      if (android) {
        if (!chrome) {
          const url = new URL(location.href);
          const page = url.origin + url.pathname;
          location.assign(`intent://${url.host}${url.pathname}#Intent;scheme=${url.protocol.slice(0,-1)};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(page)};end`);
        } else { status.textContent = '설치 창을 준비 중이에요. 잠시 후 다시 눌러 주세요. Chrome 메뉴의 앱 설치도 이용할 수 있어요.'; }
      } else { showGuide(); }
      return;
    }
    const prompt = deferredPrompt; deferredPrompt = null; busy = true; button.disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      status.textContent = choice.outcome === 'accepted' ? '설치를 요청했어요. 홈 화면 또는 시작 메뉴를 확인하세요.' : '설치를 취소했어요. 나중에 다시 설치할 수 있어요.';
    } catch { status.textContent = '설치 창을 열지 못했어요. 다시 눌러 주세요.'; }
    finally { busy = false; button.disabled = false; }
  });
  $('closeGuide').addEventListener('click', () => dialog.close());
  // Generate the shortcut for the actual deployed origin, without query strings or tokens.
  const shortcut = URL.createObjectURL(new Blob([`[InternetShortcut]\r\nURL=${new URL('./', location.href).href}\r\n`], { type: 'application/octet-stream' }));
  $('pcShortcut').href = shortcut; $('pcDownload').href = shortcut;
  window.addEventListener('pagehide', event => { if (!event.persisted) URL.revokeObjectURL(shortcut); });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => { status.textContent = '앱 설치 준비에 실패했어요. 인터넷 연결 후 새로고침해 주세요.'; });
})();
