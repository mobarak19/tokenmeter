// Accessible multi-select model picker (combobox + chips) bound to a hidden input.
import data from '../data/generated/models-client.json';
import type { ClientModel } from '../lib/llm';
import { esc } from './calc';
import { icon } from '../lib/icons';
import { perMillion } from '../lib/llm';

export const MODELS = data.models as ClientModel[];
export interface Embedding { id: string; slug: string; name: string; provider: string; price: number; dims?: number; maxInput?: number }
export const EMBEDDINGS = ((data as { embeddings?: Embedding[] }).embeddings ?? []) as Embedding[];
export const byId = new Map(MODELS.map((m) => [m.id, m]));

export function mountPicker(root: HTMLElement, max = 4) {
  const hidden = root.querySelector<HTMLInputElement>('input[type=hidden]')!;
  const search = root.querySelector<HTMLInputElement>('input[type=search]')!;
  const list = root.querySelector<HTMLElement>('.combo-list')!;
  const chips = root.querySelector<HTMLElement>('.model-chips')!;
  let active = 0;
  let results: ClientModel[] = [];

  const selected = () => hidden.value.split(',').filter((id) => byId.has(id));
  const set = (ids: string[]) => {
    hidden.value = ids.join(',');
    hidden.dispatchEvent(new Event('input', { bubbles: true }));
    drawChips();
  };
  function drawChips() {
    const ids = selected();
    chips.innerHTML = ids
      .map((id) => `<span class="chip on">${esc(byId.get(id)!.name)}<button type="button" data-remove="${esc(id)}" aria-label="Remove ${esc(byId.get(id)!.name)}">${icon('x', 14)}</button></span>`)
      .join('');
    // Single-select pickers stay enabled: choosing another model replaces the current one.
    if (max === 1) {
      search.placeholder = ids.length ? 'Change model: search “claude”, “gpt”, “gemini”…' : 'Choose a model: search “claude”, “gpt”…';
      search.disabled = false;
    } else {
      search.placeholder = ids.length >= max ? `Maximum ${max} models (remove one to add another)` : 'Add a model: search “claude”, “gpt”, “gemini”…';
      search.disabled = ids.length >= max;
    }
  }
  function drawList() {
    const q = search.value.trim().toLowerCase();
    const sel = new Set(selected());
    results = MODELS.filter((m) => !sel.has(m.id) && (!q || `${m.name} ${m.id} ${m.p}`.toLowerCase().includes(q))).slice(0, 40);
    active = 0;
    list.hidden = !results.length || document.activeElement !== search;
    list.innerHTML = results
      .map((m, i) => `<button type="button" role="option" id="opt-${i}" aria-selected="${i === active}" data-add="${esc(m.id)}"><span>${esc(m.name)} <small>· ${esc(m.p)}</small></span><small>${perMillion(m.i)} / ${perMillion(m.o)}</small></button>`)
      .join('');
    search.setAttribute('aria-expanded', String(!list.hidden));
  }
  search.addEventListener('focus', drawList);
  search.addEventListener('input', (e) => { e.stopPropagation(); drawList(); });
  search.addEventListener('blur', () => setTimeout(() => (list.hidden = true), 150));
  search.addEventListener('keydown', (e) => {
    const opts = [...list.querySelectorAll<HTMLElement>('[role=option]')];
    if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && list.hidden) {
      e.preventDefault();
      drawList();
      return;
    }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + opts.length) % opts.length;
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
      opts[active]?.scrollIntoView({ block: 'nearest' });
      search.setAttribute('aria-activedescendant', `opt-${active}`);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[active]) add(results[active].id);
    } else if (e.key === 'Escape') list.hidden = true;
  });
  function add(id: string) {
    const ids = selected();
    if (max === 1) set([id]);
    else if (ids.length < max && !ids.includes(id)) set([...ids, id]);
    search.value = '';
    // Close after choosing; typing or ArrowDown reopens it.
    list.hidden = true;
    search.setAttribute('aria-expanded', 'false');
  }
  list.addEventListener('mousedown', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-add]');
    if (b) { e.preventDefault(); add(b.dataset.add!); }
  });
  chips.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLElement>('[data-remove]');
    if (b) set(selected().filter((id) => id !== b.dataset.remove));
  });
  drawChips();
  return { selected, set };
}
