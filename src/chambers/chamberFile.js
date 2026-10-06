import JSZip from 'jszip';
import { validateChamberDocument } from '../multiplayer/chamberConfig';

export function parseChamberJSON(text) {
  let data;
  try { data = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch (_) { throw new Error('O arquivo não contém um JSON válido.'); }
  if (!validateChamberDocument(data)) throw new Error('O arquivo não contém uma câmara válida.');
  return data;
}

export async function readChamberFile(file) {
  if (/\.zip$/i.test(file.name)) {
    let zip;
    try { zip = await JSZip.loadAsync(file); }
    catch (_) { throw new Error('Não foi possível abrir o arquivo ZIP.'); }
    const entry = zip.file('data.json') || zip.file(/\.json$/i).filter(entry => !entry.dir)[0];
    if (!entry) throw new Error('O ZIP não contém um arquivo de câmara JSON.');
    return parseChamberJSON(await entry.async('string'));
  }
  return parseChamberJSON(await file.text());
}

export function chamberFileName(name = '', author = '') {
  const clean = text => String(text).trim().replace(/[<>:"/\\|?*\x00-\x1f]/g, '_');
  const title = clean(name).replace(/\.json$/i, '') || 'chamber';
  return title + (clean(author) ? '_by_' + clean(author) : '') + '.json';
}

export function downloadChamberFile(data, name, author) {
  if (!validateChamberDocument(data)) throw new Error('Não há uma câmara pronta para baixar.');
  const url = URL.createObjectURL(new Blob([JSON.stringify(data)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url; link.download = chamberFileName(name, author);
  document.body.appendChild(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
