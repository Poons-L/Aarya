// Loaded as a file (not inline) so the Content-Security-Policy can forbid inline scripts.

// Show error log on Ctrl+Shift+E
document.addEventListener('keydown', function (e) {
  if (e.ctrlKey && e.shiftKey && e.key === 'E') {
    var errorLog = document.getElementById('error-log');
    if (errorLog) {
      errorLog.style.display = errorLog.style.display === 'none' ? 'block' : 'none';
    }
  }
});

// Early error detection
window.addEventListener('error', function (e) {
  console.error('Early error detected:', e.message, e.filename, e.lineno);
});
