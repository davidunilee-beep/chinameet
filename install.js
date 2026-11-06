(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const android = /Android/i.test(navigator.userAgent);
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const desktop = !android && !ios;
  const windows = desktop && /Win/i.test(navigator.platform || navigator.userAgent);
  const embedded = /KAKAOTALK|Instagram|FBAN|FBAV|Line\/|\bwv\b/i.test(navigator.userAgent);
  const samsung = /SamsungBrowser/i.test(navigator.userAgent);
  const display = matchMedia('(display-mode: standalone)');
  let installed = display.matches || navigator.standalone === true;
  let deferredPrompt = window.chinameetInstallPrompt || null;
  let busy = false;
  const status = $('installStatus');
  const button = $('installButton');
  const dialog = $('installDialog');
  const retry = $('installRetry');
  const chromeLink = $('androidChrome');
  const pageUrl = new URL('./', location.href);
  chromeLink.href = `intent://${pageUrl.host}${pageUrl.pathname}#Intent;scheme=${pageUrl.protocol.slice(0,-1)};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(pageUrl.href)};end`;
  chromeLink.hidden = !android || !embedded;
  function ready() {
    button.textContent = desktop ? 'PC 앱 다운로드 ↗' : '앱 설치하기 ↗';
    retry.hidden = false;
    status.textContent = '설치 준비가 됐어요. 설치 버튼을 눌러 주세요.';
    if (dialog.open) $('installGuide').textContent = '이제 설치 창을 열 수 있어요. 아래 앱 설치하기를 눌러 주세요.';
  }
  function render() {
    installed = installed || display.matches || navigator.standalone === true;
    button.textContent = installed ? '설치 안내' : desktop ? 'PC 앱 다운로드 ↗' : '앱 설치하기 ↗';
    $('pcShortcut').hidden = !windows;
    status.textContent = installed ? '설치된 앱을 사용하고 있어요.' : desktop ? 'PC 앱으로 설치하거나 바로가기를 저장하세요.' : '홈 화면에 추가하고 Chinameet를 간편하게 여세요.';
  }
  render();
  if (deferredPrompt) ready();
  display.addEventListener?.('change', render);
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); deferredPrompt = event; installed = false;
    ready();
  });
  window.addEventListener('appinstalled', () => {
    installed = true; deferredPrompt = null; window.chinameetInstallPrompt = null; render(); dialog.close();
    status.textContent = '설치가 완료됐어요. 홈 화면 또는 앱 목록에서 Chinameet를 여세요.';
  });
  function showGuide() {
    $('installGuide').textContent = installed ? 'Chinameet가 이미 설치되어 있어요. 홈 화면 또는 앱 목록에서 실행하세요.' : ios ? 'Safari에서 홈 화면에 추가해 주세요.' : android ? (embedded ? '앱 안의 브라우저에서는 설치가 제한될 수 있어요. 아래 Chrome에서 열기를 눌러 주세요.' : '브라우저에서 설치 창이 제공되지 않았어요. 아래 방법으로 바로 설치할 수 있어요.') : '브라우저가 설치 창을 제공하지 않으면 아래 방법을 이용하세요.';
    const steps = ios
      ? ['Safari에서 이 주소를 여세요.', '공유 버튼 → 홈 화면에 추가 → 추가를 선택하세요.']
      : android ? (samsung ? ['삼성 인터넷의 메뉴(☰)를 여세요.', '현재 페이지 추가 → 홈 화면 또는 앱 설치를 선택하세요.', '추가 또는 설치를 누르고 홈 화면에서 Chinameet를 여세요.'] : ['Chrome의 오른쪽 위 메뉴(⋮)를 여세요.', '홈 화면에 추가 → 설치를 선택하세요. 브라우저에 따라 앱 설치로 표시될 수 있어요.', '설치 후 홈 화면 또는 앱 목록에서 Chinameet를 여세요. 이미 설치했다면 기존 아이콘을 이용하세요.']) : ['Chrome·Edge의 주소창 설치 아이콘 또는 메뉴의 앱 설치를 선택하세요.', 'Mac Safari에서는 파일 → Dock에 추가를 선택하세요.'];
    $('installSteps').replaceChildren(...steps.map(text => { const li = document.createElement('li'); li.textContent = text; return li; }));
    $('pcDownload').hidden = !windows;
    retry.hidden = !deferredPrompt || installed;
    if (!dialog.open) dialog.showModal();
  }
  async function install() {
    if (busy) return;
    if (installed) { showGuide(); return; }
    if (!deferredPrompt) {
      showGuide();
      return;
    }
    const prompt = deferredPrompt; deferredPrompt = null; window.chinameetInstallPrompt = null; busy = true; button.disabled = true; retry.disabled = true;
    try {
      await prompt.prompt();
      const choice = await prompt.userChoice;
      status.textContent = choice.outcome === 'accepted' ? '설치를 요청했어요. 홈 화면 또는 시작 메뉴를 확인하세요.' : '설치를 취소했어요. 나중에 다시 설치할 수 있어요.';
      if (choice.outcome === 'accepted') dialog.close();
      else showGuide();
    } catch { status.textContent = '설치 창을 열지 못했어요. 설치 안내를 확인해 주세요.'; showGuide(); }
    finally { busy = false; button.disabled = false; retry.disabled = false; retry.hidden = !deferredPrompt; }
  }
  button.addEventListener('click', install);
  retry.addEventListener('click', install);
  $('closeGuide').addEventListener('click', () => dialog.close());
  // Generate the shortcut for the actual deployed origin, without query strings or tokens.
  const shortcut = URL.createObjectURL(new Blob([`[InternetShortcut]\r\nURL=${new URL('./', location.href).href}\r\n`], { type: 'application/octet-stream' }));
  $('pcShortcut').href = shortcut; $('pcDownload').href = shortcut;
  window.addEventListener('pagehide', event => { if (!event.persisted) URL.revokeObjectURL(shortcut); });
  if ('serviceWorker' in navigator && window.isSecureContext) navigator.serviceWorker.register('./sw.js').catch(() => { status.textContent = '앱 설치 준비에 실패했어요. 인터넷 연결 후 새로고침해 주세요.'; });
})();
