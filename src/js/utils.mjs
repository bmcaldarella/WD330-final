export const $ = (s, p = document) => p.querySelector(s);

export async function inject(selector, url) {
  const host = $(selector);
  if (!host) return;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    host.innerHTML = await res.text();
  } catch (err) {
    console.error(`Inject failed for ${url}:`, err);
    host.innerHTML = `<p role="alert" style="padding:1rem;background:#fee;border:1px solid #f99;">
      Failed to load ${url}
    </p>`;
  }
}

export function setYear() {
  const y = document.querySelector('#year');
  if (y) y.textContent = new Date().getFullYear();
}

export function enableFocusVisible() {
  function onFirstTab(e) {
    if (e.key === 'Tab') {
      document.body.classList.add('using-keyboard');
      window.removeEventListener('keydown', onFirstTab);
    }
  }
  window.addEventListener('keydown', onFirstTab);
}
