export async function copyText(text) {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* HTTP LAN and denied permissions use the selection fallback. */ }
  const field = document.createElement('textarea');
  field.value = text; field.style.position = 'fixed'; field.style.opacity = '0';
  document.body.appendChild(field); field.focus(); field.select();
  let copied = false;
  try { copied = document.execCommand('copy'); } catch { /* Keep a manual fallback in the room panel. */ }
  field.remove();
  return copied;
}
