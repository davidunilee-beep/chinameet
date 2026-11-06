// Capture the browser event before the full lesson document has finished loading.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  window.chinameetInstallPrompt = event;
});
