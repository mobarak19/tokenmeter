// Shared calculator runtime: live results, URL-shareable state, copy link.
type Values = Record<string, string>;

function fieldDefault(el: HTMLInputElement | HTMLSelectElement): string {
  if (el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio')) return el.defaultChecked ? el.value : '';
  if (el instanceof HTMLSelectElement) return [...el.options].find((o) => o.defaultSelected)?.value ?? el.options[0]?.value ?? '';
  return el.defaultValue;
}

export function readValues(form: HTMLFormElement): Values {
  const v: Values = {};
  for (const el of [...form.elements] as (HTMLInputElement | HTMLSelectElement)[]) {
    if (!el.name) continue;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') v[el.name] = el.checked ? el.value || 'on' : '';
    else if (el instanceof HTMLInputElement && el.type === 'radio') {
      if (el.checked) v[el.name] = el.value;
    } else v[el.name] = el.value;
  }
  return v;
}

export function num(v: string | undefined, fallback = 0): number {
  const n = parseFloat(String(v ?? '').replace(/,/g, ''));
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Mount a calculator. `compute` returns HTML for the [data-out] element.
 * Non-default values are mirrored to the URL so results can be shared.
 */
export function mountCalc(root: HTMLElement, compute: (v: Values, form: HTMLFormElement) => string, after?: (v: Values) => void) {
  const form = root.querySelector('form')!;
  const out = root.querySelector<HTMLElement>('[data-out]')!;
  const fields = [...form.elements].filter((e) => (e as HTMLInputElement).name) as (HTMLInputElement | HTMLSelectElement)[];

  // Restore from URL.
  const params = new URLSearchParams(location.search);
  for (const el of fields) {
    if (!params.has(el.name)) continue;
    const val = params.get(el.name)!;
    // Ignore stale or hand-edited values that match no option: a <select> or
    // radio group left with nothing selected would break every calculator.
    if (el instanceof HTMLSelectElement && ![...el.options].some((o) => o.value === val)) continue;
    if (el instanceof HTMLInputElement && el.type === 'radio' && !fields.some((f) => f.name === el.name && f.value === val)) continue;
    if (el instanceof HTMLInputElement && el.type === 'checkbox') el.checked = val === (el.value || 'on');
    else if (el instanceof HTMLInputElement && el.type === 'radio') el.checked = el.value === val;
    else el.value = val;
  }

  let t = 0;
  const syncUrl = () => {
    const p = new URLSearchParams();
    const seen = new Set<string>();
    for (const el of fields) {
      if (seen.has(el.name)) continue;
      const group = fields.filter((f) => f.name === el.name);
      const cur = group.length > 1 ? (group.find((g) => (g as HTMLInputElement).checked)?.value ?? '') : readValues(form)[el.name];
      const def = group.length > 1 ? (group.find((g) => (g as HTMLInputElement).defaultChecked)?.value ?? '') : fieldDefault(el);
      seen.add(el.name);
      if (cur !== def) p.set(el.name, cur);
    }
    const qs = p.toString();
    history.replaceState(null, '', qs ? `?${qs}` : location.pathname);
  };

  // Mobile: results sit below the form, so show a sticky live summary that
  // jumps to the details and hides while the results are on screen.
  const peek = document.createElement('button');
  peek.type = 'button';
  peek.className = 'calc-peek';
  peek.hidden = true;
  root.append(peek);
  peek.addEventListener('click', () => out.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  let outVisible = true;
  new IntersectionObserver(([e]) => {
    outVisible = e.isIntersecting;
    updatePeek();
  }, { threshold: 0.15 }).observe(out);
  function updatePeek() {
    const k = out.querySelector('.big .k')?.textContent?.trim();
    const v = out.querySelector('.big .v')?.textContent?.trim();
    peek.hidden = outVisible || !k || !v || window.innerWidth > 860;
    if (k && v) peek.innerHTML = `<span>${esc(k)}</span><strong>${esc(v)}</strong><span aria-hidden="true">↓</span>`;
  }

  const run = () => {
    const v = readValues(form);
    try {
      out.innerHTML = compute(v, form);
    } catch (e) {
      out.innerHTML = `<div class="alert alert-warn"><div><h3>Check your inputs</h3><p>${String((e as Error).message)}</p></div></div>`;
    }
    after?.(v);
    updatePeek();
    clearTimeout(t);
    t = window.setTimeout(syncUrl, 250);
  };

  form.addEventListener('input', run);
  form.addEventListener('change', run);
  form.addEventListener('submit', (e) => e.preventDefault());
  root.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!b) return;
    if (b.dataset.action === 'copy-link') {
      void navigator.clipboard?.writeText(location.href).then(() => flash(b, 'Link copied'));
    } else if (b.dataset.action === 'reset') {
      form.reset();
      history.replaceState(null, '', location.pathname);
      run();
    }
  });
  run();
  return { run, form };
}

export function flash(el: HTMLElement, text: string) {
  const old = el.innerHTML;
  el.textContent = text;
  setTimeout(() => (el.innerHTML = old), 1400);
}

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
