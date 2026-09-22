(() => {
  'use strict';

  const $ = (sel, root = document) => root.querySelector(sel);
  const LETTERS = APP.letters;
  const TENSE_COLOURS = ['loc', 'gen', 'ins', 'acc', 'dat', 'voc'];

  /* ---------- topics: cases, plus any tense files that are loaded ---------- */
  const TOPICS = [];
  if (typeof CASES !== 'undefined') TOPICS.push({
    id: 'cases', pl: 'Przypadki', en: 'Cases',
    refLabel: 'Endings', filterLabel: 'Cases to practise', unit: 'case',
    groups: CASES.map(c => ({ ...c, colour: c.id })),
    sentences: SENTENCES.concat(typeof EXTRA_SENTENCES !== 'undefined' ? EXTRA_SENTENCES : [], typeof PRONOUN_SENTENCES !== 'undefined' ? PRONOUN_SENTENCES : []),
    whyLabel: g => `Why ${g.pl.toLowerCase()}?`,
    refLink: g => `See all ${g.pl.toLowerCase()} endings`,
  });
  const tenseTopic = t => ({
    ...t,
    refLabel: 'Forms', filterLabel: 'Verb groups to practise', unit: 'verb group',
    groups: t.groups.map((g, i) => ({ ...g, colour: TENSE_COLOURS[i % TENSE_COLOURS.length] })),
    whyLabel: () => 'Why this form?',
    refLink: g => `See the tables for ${g.en.toLowerCase()}`,
  });
  if (typeof PAST_TENSE !== 'undefined') TOPICS.push(tenseTopic(PAST_TENSE));
  if (typeof FUTURE_TENSE !== 'undefined') TOPICS.push(tenseTopic(FUTURE_TENSE));
  TOPICS.forEach(t => { t.byId = Object.fromEntries(t.groups.map(g => [g.id, g])); t.allIds = t.groups.map(g => g.id); });

  const store = {
    get(key, fallback) { try { const v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); } catch { return fallback; } },
    set(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* private mode */ } },
  };

  const savedSel = store.get(`${APP.storagePrefix}.selected`, {});
  const state = {
    topic: TOPICS.find(t => t.id === store.get(`${APP.storagePrefix}.topic`, 'cases')) || TOPICS[0],
    selected: Object.fromEntries(TOPICS.map(t => {
      const ids = (savedSel[t.id] || []).filter(id => t.byId[id]);
      return [t.id, new Set(ids.length ? ids : t.allIds)];
    })),
    view: store.get(`${APP.storagePrefix}.view`, 'table') === 'quiz' ? 'quiz' : 'table',
    showGroup: store.get(`${APP.storagePrefix}.showCase`, true),
    kind: ['all', 'nouns', 'pronouns'].includes(store.get(`${APP.storagePrefix}.kind`, 'all')) ? store.get(`${APP.storagePrefix}.kind`, 'all') : 'all',
    mode: store.get(`${APP.storagePrefix}.mode`, 'type') === 'notebook' ? 'notebook' : 'type',
    length: [10, 20, 50, 0].includes(store.get(`${APP.storagePrefix}.length`, 20)) ? store.get(`${APP.storagePrefix}.length`, 20) : 20,   // 0 = all
    order: store.get(`${APP.storagePrefix}.order`, 'weak') === 'random' ? 'random' : 'weak',
    quiz: null,
  };

  /* ---------- helpers ---------- */
  const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
  const SUP = { '¹': 1, '²': 2, '³': 3, '⁴': 4 };
  const withNotes = s => esc(s).replace(/[¹²³⁴]/g, d => `<sup>${SUP[d]}</sup>`);
  const markEndings = s => esc(s).replace(/\[([^\]]*)\]/g, '<b>$1</b>');
  const colour = name => `--c: var(--${name})`;
  const sel = () => state.selected[state.topic.id];
  const hasKinds = () => state.topic.sentences.some(s => s.kind === 'pronoun');
  const kindOk = s => !hasKinds() || state.kind === 'all' || (state.kind === 'pronouns') === (s.kind === 'pronoun');
  const pool = () => state.topic.sentences.filter(s => sel().has(s.c) && kindOk(s));
  const selectedGroups = () => state.topic.groups.filter(g => sel().has(g.id));
  const allSelected = () => sel().size === state.topic.allIds.length;
  const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

  function shuffle(list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ---------- progress: one record per sentence, kept in this browser ---------- */
  const keyOf = (topic, s) => `${topic.id}|${s.c}|${s.s}|${s.base}`;
  const progress = store.get(`${APP.storagePrefix}.progress`, {});
  const recordOf = s => progress[keyOf(state.topic, s)];
  const saveProgress = () => store.set(`${APP.storagePrefix}.progress`, progress);

  function record(item, right) {
    const k = keyOf(state.topic, item);
    const r = progress[k] || { n: 0, ok: 0, streak: 0 };
    r.n += 1;
    if (right) { r.ok += 1; r.streak += 1; } else r.streak = 0;
    r.last = right ? 1 : 0;
    r.t = Date.now();
    progress[k] = r;
    saveProgress();
  }

  const mastered = r => !!r && r.streak >= 2;    // right twice in a row
  const weak = r => !!r && r.last === 0;

  function groupStats(items) {
    const out = { total: items.length, seen: 0, mastered: 0, weak: 0, n: 0, ok: 0 };
    items.forEach(s => {
      const r = recordOf(s);
      if (!r) return;
      out.seen++; out.n += r.n; out.ok += r.ok;
      if (mastered(r)) out.mastered++;
      if (weak(r)) out.weak++;
    });
    return out;
  }

  // Unseen and recently missed sentences first, mastered ones last, random within each band.
  function orderWeakFirst(items) {
    const band = s => { const r = recordOf(s); return !r ? 1 : weak(r) ? 0 : mastered(r) ? 3 : 2; };
    return shuffle(items).map((s, i) => [band(s), i, s]).sort((a, b) => a[0] - b[0] || a[1] - b[1]).map(x => x[2]);
  }

  /* an unfinished quiz survives a page reload */
  function saveQuiz() {
    const q = state.quiz;
    if (!q || q.idx >= q.queue.length) { store.set(`${APP.storagePrefix}.resume`, null); return; }
    store.set(`${APP.storagePrefix}.resume`, {
      topic: state.topic.id, idx: q.idx,
      queue: q.queue.map(s => keyOf(state.topic, s)),
      results: q.results.map(r => ({ key: keyOf(state.topic, r.item), right: r.right, mode: r.mode })),
    });
  }
  function savedQuiz() {
    const r = store.get(`${APP.storagePrefix}.resume`, null);
    if (!r || r.topic !== state.topic.id) return null;
    const byKey = Object.fromEntries(state.topic.sentences.map(s => [keyOf(state.topic, s), s]));
    const queue = r.queue.map(k => byKey[k]).filter(Boolean);
    if (queue.length !== r.queue.length || r.idx >= queue.length) return null;
    return { queue, idx: r.idx, results: r.results.map(x => ({ item: byKey[x.key], right: x.right, mode: x.mode })).filter(x => x.item) };
  }
  function resumeQuiz() {
    const saved = savedQuiz();
    if (!saved) return;
    state.quiz = { ...saved, revealed: false, checked: false, firstTryRight: false, feedback: null, typed: '' };
    setView('quiz');
    scrollToQuiz();
  }

  const normalise = s => s.toLocaleLowerCase(APP.lang).replace(/[.,!?;:]/g, ' ').replace(/\s+/g, ' ').trim();
  const stripMarks = APP.stripMarks;

  // "Nie{not} mam{I have} ___." -> [{word, gloss} | {gap} | {punct}]
  function parseSentence(src) {
    const out = [];
    const re = /(___)|([^\s{}]+)\{([^}]*)\}|([^\s{}]+)/g;
    let m;
    while ((m = re.exec(src))) {
      if (m[1]) out.push({ gap: true });
      else if (m[2]) { const [gloss, tag] = m[3].split('|'); out.push({ word: m[2].replace(/_/g, ' '), gloss, tag }); }
      else out.push({ punct: m[4] });
    }
    return out;
  }
  const OPENERS = /^[„(]+$/;
  function joinTokens(tokens, render) {
    let html = '';
    tokens.forEach((tok, i) => {
      const prev = tokens[i - 1];
      const glue = i === 0 || (tok.punct && !OPENERS.test(tok.punct)) || (prev && prev.punct && OPENERS.test(prev.punct));
      html += (glue ? '' : ' ') + render(tok);
    });
    return html;
  }

  /* ---------- topic switch ---------- */
  function renderTopics() {
    const el = $('#topics');
    el.hidden = TOPICS.length < 2;
    el.innerHTML = TOPICS.map(t => `
      <button type="button" class="topic-btn" data-topic="${t.id}" ${t === state.topic ? 'aria-current="true"' : ''}>
        <b>${esc(t.en)}</b><span lang="${APP.lang}">${esc(t.pl)}</span>
      </button>`).join('');
  }

  function setTopic(id) {
    state.topic = TOPICS.find(t => t.id === id) || TOPICS[0];
    store.set(`${APP.storagePrefix}.topic`, state.topic.id);
    state.quiz = null;
    renderTopics();
    renderFilter();
    renderView();
  }

  /* ---------- filter (the pasiak) ---------- */
  function renderFilter() {
    const t = state.topic;
    $('#filter-label').textContent = t.filterLabel;
    $('#pasiak').innerHTML = t.groups.map(g => `
      <button type="button" class="stripe" style="${colour(g.colour)}" data-group="${g.id}" aria-pressed="${sel().has(g.id)}">
        <span class="s-pl" lang="${APP.lang}">${esc(g.pl)}</span>
        <span class="s-q" lang="${APP.lang}">${esc(g.q)}</span>
        <span class="s-en">${esc(g.en)}</span>
      </button>`).join('');
    const count = plural(pool().length, 'sentence');
    $('#filter-status').textContent = allSelected()
      ? `All ${plural(t.allIds.length, t.unit)} selected, ${count}. Pick a stripe to practise only that one.`
      : `${selectedGroups().map(g => g.pl).join(', ')} selected, ${count}. Pick more stripes to add them.`;
    $('#all-groups').hidden = allSelected();
    $('#all-groups').textContent = `Select all ${t.allIds.length}`;
    $('.view-btn[data-view="table"]').textContent = t.refLabel;
  }

  function toggleGroup(id) {
    const t = state.topic, s = sel();
    if (allSelected()) state.selected[t.id] = new Set([id]);          // from "everything" a click means "only this"
    else if (s.has(id) && s.size === 1) state.selected[t.id] = new Set(t.allIds); // never leave nothing selected
    else if (s.has(id)) s.delete(id);
    else s.add(id);
    afterFilterChange();
  }

  function afterFilterChange() {
    store.set(`${APP.storagePrefix}.selected`, Object.fromEntries(Object.entries(state.selected).map(([k, v]) => [k, [...v]])));
    state.quiz = null;
    renderFilter();
    renderView();
  }

  /* ---------- reference view: shared pieces ---------- */
  const startRow = () => `
    <div class="start-row">
      <button type="button" class="btn primary" data-action="start">Start quiz</button>
      <p>${plural(pool().length, 'sentence')} for ${allSelected() ? `all ${plural(state.topic.allIds.length, state.topic.unit)}` : 'your selection'}. ${state.length && state.length < pool().length ? `A quiz draws ${state.length} of them at random.` : ''}</p>
    </div>`;

  const band = (g, extra) => `
    <div class="case-band">
      <h2 lang="${APP.lang}">${esc(g.pl)}</h2><span class="q" lang="${APP.lang}">${esc(g.q)}</span>
      <span class="en">${esc(extra)}</span>
    </div>
    <p class="case-summary">${esc(g.summary)}</p>`;

  const useList = items => `<ul class="uses">${items.map(u => `<li>${esc(u.t)}
    <span class="ex" lang="${APP.lang}">${esc(u.ex)}</span><span class="ex-en">${esc(u.en)}</span></li>`).join('')}</ul>`;

  const watchList = items => items && items.length
    ? `<h3>Watch out</h3><ul class="watch">${items.map(w => `<li>${esc(w)}</li>`).join('')}</ul>` : '';

  /* ---------- reference view: cases ---------- */
  function gridRow(row, hl, names) {
    let col = 0;
    return `<tr><th scope="row" class="g-label">${esc(row.label)}</th>${row.cells.map(c => {
      const from = col, to = col + (c.span || 1); col = to;
      const on = hl && hl.rows.has(row.label) && hl.col >= from && hl.col < to;
      const label = to - from === 4 ? 'all genders' : names.slice(from, to).join(', ');
      return `
      <td class="g-cell t-${c.tint} ${on ? 'hl' : ''}" ${c.span ? `colspan="${c.span}"` : ''} data-col="${esc(label)}">
        <span class="g-end">${withNotes(c.end)}</span>
        <span class="g-ex" lang="${APP.lang}">${esc(c.ex)}</span>
        ${c.eq ? `<span class="g-eq">${esc(c.eq)}</span>` : ''}
      </td>`; }).join('')}</tr>`;
  }

  function caseGrid(c, hl, only) {
    const sg = hl && hl.number === 'sg' ? hl : null, pl = hl && hl.number === 'pl' ? hl : null;
    const singular = `
        <caption>${esc(c.en)} singular</caption>
        <colgroup><col class="col-label"><col><col><col><col></colgroup>
        <thead>
          <tr><th rowspan="2" class="g-label">Gender</th><th colspan="2" class="g-head t-m">masculine</th>
            <th rowspan="2" class="g-head t-n">neuter</th><th rowspan="2" class="g-head t-f">feminine</th></tr>
          <tr><th class="g-sub t-m1">animate</th><th class="g-sub t-m2">inanimate</th></tr>
        </thead>
        <tbody>${c.grid.sg.map(r => gridRow(r, sg, COL_NAMES.sg)).join('')}</tbody>`;
    const plural = `
        <tbody>
          <tr><th colspan="5" class="g-title">${esc(c.en)} plural</th></tr>
          <tr><th rowspan="2" class="g-label">Gender</th><th colspan="2" class="g-head t-m">masculine</th>
            <th rowspan="2" class="g-head t-n">neuter</th><th rowspan="2" class="g-head t-f">feminine</th></tr>
          <tr><th class="g-sub t-m1">personal (men)</th><th class="g-sub t-m2">other</th></tr>
          ${c.grid.pl.map(r => gridRow(r, pl, COL_NAMES.pl)).join('')}
        </tbody>`;
    if (only) return `<div class="table-wrap grid-wrap mini"><table class="gtable">${only === 'sg' ? singular : `<caption>${esc(c.en)} plural</caption><colgroup><col class="col-label"><col><col><col><col></colgroup>` + plural}</table></div>`;
    return `<div class="table-wrap grid-wrap">
      <table class="gtable">${singular}${plural}
      </table>
    </div>
    <ul class="g-notes">${c.notes.map(n => `<li>${withNotes(n)}</li>`).join('')}</ul>`;
  }

  // Which cell of the case grid a quiz item lands on
  const COL = { m1: 0, m2: 1, n: 2, f: 3 };
  const COL_NAMES = { sg: ['masculine animate', 'masculine inanimate', 'neuter', 'feminine'], pl: ['masculine personal', 'other masculine', 'neuter', 'feminine'] };
  function itemHighlight(item) {
    if (state.topic.id !== 'cases' || item.kind === 'pronoun' || typeof GENDERS === 'undefined') return null;
    const words = item.base.trim().split(/\s+/);
    const noun = words.find(w => GENDERS[w]);
    if (!noun) return null;
    const number = item.hint === 'plural' || PLURAL_ONLY.includes(noun) ? 'pl' : 'sg';
    const rows = new Set(['Nouns']);
    if (words.length > 1) rows.add('Adjectives');
    return { number, col: COL[GENDERS[noun]], rows, label: `${COL_NAMES[number][COL[GENDERS[noun]]]} ${number === 'sg' ? 'singular' : 'plural'}${words.length > 1 ? ', noun and adjective' : ''}` };
  }

  // Six slots per word: masc. animate, masc. inanimate, neuter, feminine, plural with men, other plural
  function possessiveForms(p, caseId) {
    if (p.fixed) return Array(6).fill(p.fixed);
    const ego = p.stem + 'ego', emu = p.stem + 'emu', ej = p.stem + 'ej', a = p.stem + 'ą';
    const im = p.stemI + 'm', ich = p.stemI + 'ch', imi = p.stemI + 'mi';
    return {
      nom: [p.m, p.m, p.n, p.f, p.pm, p.po],
      gen: [ego, ego, ego, ej, ich, ich],
      dat: [emu, emu, emu, ej, im, im],
      acc: [ego, p.m, p.n, p.accF, ich, p.po],
      ins: [im, im, im, a, imi, imi],
      loc: [im, im, im, ej, ich, ich],
      voc: [p.m, p.m, p.n, p.f, p.pm, p.po],
    }[caseId];
  }

  // items: [{ word, en, forms: six strings }] in the order masc animate, masc inanimate, neuter, feminine, plural with men, other plural
  function sixSlotGrid(caption, items, notes) {
    const cell = (x, tint, label, span) => `<td class="g-cell t-${tint}" ${span ? `colspan="${span}"` : ''} data-col="${esc(label)}"><span class="g-form" lang="${APP.lang}">${esc(x)}</span></td>`;
    const pair = (x, y, tintBoth, tintX, tintY, lx, ly, lboth) => x === y ? cell(x, tintBoth, lboth, 2) : cell(x, tintX, lx) + cell(y, tintY, ly);
    const rows = items.map(({ word, en, forms: f }) => {
      const head = `<th scope="row" class="g-label"><span lang="${APP.lang}">${esc(word)}</span><small>${esc(en)}</small></th>`;
      if (f.every(x => x === f[0])) return `<tr>${head}<td class="g-cell t-all" colspan="6" data-col="every form"><span class="g-form" lang="${APP.lang}">${esc(f[0])}</span><span class="g-eq">never changes</span></td></tr>`;
      return `<tr>${head}
        ${pair(f[0], f[1], 'm', 'm1', 'm2', 'masculine animate', 'masculine inanimate', 'masculine')}
        ${cell(f[2], 'n', 'neuter')}
        ${cell(f[3], 'f', 'feminine')}
        ${pair(f[4], f[5], 'all', 'm1', 'all', 'plural with men', 'other plural', 'plural')}</tr>`;
    }).join('');
    return `<div class="table-wrap grid-wrap">
      <table class="gtable words">
        <caption>${esc(caption)}</caption>
        <colgroup><col class="col-label"><col><col><col><col><col><col></colgroup>
        <thead>
          <tr><th rowspan="2" class="g-label">Gender</th><th colspan="2" class="g-head t-m">masculine</th>
            <th rowspan="2" class="g-head t-n">neuter</th><th rowspan="2" class="g-head t-f">feminine</th>
            <th colspan="2" class="g-head t-all">plural</th></tr>
          <tr><th class="g-sub t-m1">animate</th><th class="g-sub t-m2">inanimate</th>
            <th class="g-sub t-m1">with men</th><th class="g-sub t-all">other</th></tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    ${notes.length ? `<ul class="g-notes">${notes.map(n => `<li>${esc(n)}</li>`).join('')}</ul>` : ''}`;
  }

  const possessiveGrid = c => sixSlotGrid(`${c.en}: my, your, his, her, our, their, this`,
    PRONOUNS.possessives.map(p => ({ word: p.word, en: p.en, forms: possessiveForms(p, c.id) })), PRONOUNS.possessiveNotes);

  const smallWords = () => typeof SMALL_WORDS !== 'undefined' ? SMALL_WORDS : [];
  const smallWordsPersonal = () => typeof SMALL_WORDS_PERSONAL !== 'undefined' ? SMALL_WORDS_PERSONAL : [];
  const smallWordsGrid = c => smallWords().length
    ? sixSlotGrid(`${c.en}: which, whose, every, all, other`, smallWords().map(w => ({ word: w.word, en: w.en, forms: w.forms[c.id] })),
        smallWords().filter(w => w.note).map(w => `${w.word}: ${w.note}`))
    : '';

  function personalTable(c) {
    const prep = PRONOUNS.prepositions[c.id];
    const rows = PRONOUNS.personal.concat(smallWordsPersonal()).map(p => {
      const [plain, after] = p[c.id];
      return `<tr><th scope="row" class="g-label"><span lang="${APP.lang}">${esc(p.word)}</span><small>${esc(p.en)}</small></th>
        <td class="g-cell t-all" data-col="${esc(c.en.toLowerCase())}"><span class="g-form" lang="${APP.lang}">${esc(plain)}</span></td>
        ${prep ? `<td class="g-cell t-all ${after ? 'changed' : ''}" data-col="after a preposition"><span class="g-form" lang="${APP.lang}">${esc(after || plain)}</span></td>` : ''}</tr>`;
    }).join('');
    return `<div class="table-wrap grid-wrap">
      <table class="gtable words narrow">
        <caption>${esc(c.en)}: who, what, me, you, him, her</caption>
        <thead><tr><th class="g-label">Nominative</th><th scope="col" class="g-head t-all">${esc(c.en.toLowerCase())}</th>
          ${prep ? `<th scope="col" class="g-head t-all">after a preposition<small lang="${APP.lang}">${esc(prep)}</small></th>` : ''}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <ul class="g-notes">${PRONOUNS.personalNotes[c.id].map(n => `<li>${esc(n)}</li>`).join('')}</ul>`;
  }

  function pronounBlock(c) {
    if (c.id === 'voc') return `<h3>Pronouns and small words</h3><p class="plain-note">${esc(PRONOUNS.vocNote)}</p>`;
    return `<h3>Pronouns and small words</h3>
      <p class="plain-note">${c.id === 'nom' ? esc(PRONOUNS.nomNote) : 'These words do not follow the noun endings above. Each has its own form in this case.'}</p>
      ${c.id === 'nom' ? '' : personalTable(c)}
      ${possessiveGrid(c)}
      ${smallWordsGrid(c)}`;
  }

  function overviewTable(block) {
    const tints = ['t-m', 't-n', 't-f', 't-all'];
    const rows = selectedGroups().map(c => `
      <tr style="${colour(c.colour)}">
        <th scope="row" class="case-name"><a href="#ref-${c.id}" lang="${APP.lang}">${esc(c.pl)}</a><span>${esc(c.en)}, <i lang="${APP.lang}">${esc(c.q)}</i></span></th>
        ${block.rows[c.id].map((cell, i) => `<td class="ov-cell ${tints[i]}" data-col="${esc(block.cols[i].toLowerCase())}">${esc(cell)}</td>`).join('')}
      </tr>`).join('');
    return `<h3>${esc(block.title)}</h3>
      <div class="table-wrap"><table class="ov-table">
        <thead><tr><th scope="col">Case</th>${block.cols.map((h, i) => `<th scope="col" class="g-head ${tints[i]}">${h.toLowerCase()}</th>`).join('')}</tr></thead>
        <tbody>${rows}</tbody>
      </table></div>`;
  }

  function soundsSection() {
    if (typeof SOFTENING === 'undefined') return '';
    return `<section class="case sounds" id="ref-sounds" style="--c: var(--ink)">
      <div class="case-band"><h2>Sound changes</h2><span class="q">okno → w oknie, stół → na stole</span><span class="en">What happens to the stem when an ending is added</span></div>
      <p class="case-summary">${esc(SOFTENING_INTRO)}</p>
      <h3>Softening before -e and -i</h3>
      <div class="table-wrap"><table class="sounds-table">
        <thead><tr><th scope="col">Hard, then soft</th><th scope="col">Examples</th></tr></thead>
        <tbody>${SOFTENING.map(r => `<tr><td class="snd" lang="pl">${esc(r.hard)} → ${esc(r.soft)}</td><td lang="pl">${esc(r.ex)}</td></tr>`).join('')}</tbody>
      </table></div>
      <h3>Where you meet it</h3>
      <ul class="watch">${SOFTENING_WHERE.map(w => `<li>${esc(w)}</li>`).join('')}</ul>
      <h3>Vowels that shift</h3>
      <div class="table-wrap"><table class="sounds-table">
        <thead><tr><th scope="col">Shift</th><th scope="col">Examples and when</th></tr></thead>
        <tbody>${VOWEL_CHANGES.map(r => `<tr><td class="snd" lang="pl">${esc(r.from)} → ${esc(r.to)}</td><td lang="pl">${esc(r.ex)}<span class="when">${esc(r.when)}</span></td></tr>`).join('')}</tbody>
      </table></div>
    </section>`;
  }

  const caseSection = c => `<article class="case" id="ref-${c.id}" style="${colour(c.colour)}">
      ${band(c, `${c.en}, “${c.qEn}”`)}
      <h3>When to use it</h3>
      ${useList(c.uses)}
      <h3>Which ending</h3>
      ${caseGrid(c)}
      ${pronounBlock(c)}
      ${watchList(c.watch)}
    </article>`;

  /* ---------- reference view: tenses ---------- */
  // hl = { rows: Set of row indexes, cols: Set of column indexes } or null
  const tenseTable = (t, hl, mini) => `<div class="table-wrap grid-wrap ${mini ? 'mini' : ''}">
      <table class="gtable tense">
        <caption>${esc(t.title)}</caption>
        <thead><tr><th class="g-label"></th>${t.cols.map(c => `<th scope="col" class="g-head t-${c.tint}">${esc(c.label.toLowerCase())}</th>`).join('')}</tr></thead>
        <tbody>${t.rows.map((r, ri) => `<tr><th scope="row" class="g-label" lang="${APP.lang}">${esc(r.who)}</th>
          ${r.cells.map((cell, i) => `<td class="g-cell t-${t.cols[i].tint} ${hl && hl.rows.has(ri) && hl.cols.has(i) ? 'hl' : ''}" data-col="${esc(t.cols[i].label)}"><span class="g-form" lang="${APP.lang}">${markEndings(cell)}</span></td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </div>${!mini && t.note ? `<ul class="g-notes"><li>${esc(t.note)}</li></ul>` : ''}`;

  /* ---------- which cells of a verb table a quiz item lands on ---------- */
  // Person tokens as they appear in row and column labels, keyed by the item's p field.
  const PERSON = {
    ja: ['ja'], ty: ['ty'], on: ['on'], ona: ['ona'], ono: ['ono'], my: ['my'], wy: ['wy'], oni: ['oni'], one: ['one'],
    yo: ['yo'], 'tú': ['tú'], 'él': ['él', 'ella', 'usted'], nosotros: ['nosotros', 'nosotras'], ellos: ['ellos', 'ellas', 'ustedes'],
  };
  const PLURAL_P = new Set(['my', 'wy', 'oni', 'one', 'nosotros', 'ellos']);
  const ORDINAL = { ja: 1, ty: 2, on: 3, ona: 3, ono: 3, my: 1, wy: 2, oni: 3, one: 3, yo: 1, 'tú': 2, 'él': 3, nosotros: 1, ellos: 3 };
  const words = s => s.toLowerCase().split(/[^\p{L}]+/u).filter(Boolean);
  const ALL_PERSON = new Set(Object.values(PERSON).flat());

  // gender the answer form shows: from p (on/ona/ono/oni/one) or from the hint ("a man", "women", "men and women")
  function itemGender(item) {
    const p = item.p, h = (item.hint || '').toLowerCase();
    if (p === 'ona') return 'f'; if (p === 'ono') return 'n'; if (p === 'on') return 'm';
    if (p === 'oni') return 'mp'; if (p === 'one') return 'np';
    if (/\bwomen\b|\ba woman\b/.test(h) && !/\bmen\b|\bman\b/.test(h)) return PLURAL_P.has(p) ? 'np' : 'f';
    if (/\bmen\b|\ba man\b/.test(h)) return PLURAL_P.has(p) ? 'mp' : 'm';
    return null;
  }

  function tableHighlight(t, item) {
    const p = item.p; if (!p || !PERSON[p]) return null;
    const toks = PERSON[p], plural = PLURAL_P.has(p), g = itemGender(item), ord = ORDINAL[p];
    const infs = item.base.toLowerCase().split(/\s*\/\s*/).map(s => s.replace(/\b(się|se)\b/g, '').trim()).filter(Boolean);   // "pisać / napisać", "uczyć się", "levantarse"
    const inf = infs[0] || '';
    const hasPerson = ws => ws.some(w => toks.includes(w));
    const hasInf = label => { const ws = words(label); return infs.some(i => words(i).every(w => ws.includes(w))); };
    const hasGender = ws => ws.some(w => /^(masculine|feminine|neuter|groups|everyone|singular|plural|men|others)$/.test(w));
    const genderOk = (label) => {
      const l = label.toLowerCase();
      if (/singular/.test(l)) return !plural; if (/plural/.test(l)) return plural;
      if (/groups with a man|\bmen\b/.test(l)) return g === 'mp'; if (/everyone|others|else/.test(l)) return g === 'np';
      if (/masculine/.test(l)) return g === 'm'; if (/feminine/.test(l)) return g === 'f'; if (/neuter/.test(l)) return g === 'n';
      return false;
    };
    const ordOk = label => { const m = label.match(/(\d)(st|nd|rd)\s+person/i); return m && Number(m[1]) === ord; };
    const endingOk = label => { const m = label.match(/^-([a-ząćęłńóśźżáéíóúñ]+)\b/i); return m && inf.endsWith(m[1]); };

    const verbRows = new Set(), personRows = new Set(), cols = new Set();
    t.rows.forEach((r, i) => { const ws = words(r.who); if (hasPerson(ws) || ordOk(r.who)) personRows.add(i); else if (hasInf(r.who)) verbRows.add(i); });
    const verbNamed = label => { const w = words(label)[0] || ''; return /(ć|ar|er|ir|se)$/.test(w) && !hasGender([w]); };
    const specific = t.cols.some(c => words(c.label).some(w => ALL_PERSON.has(w)) || hasGender(words(c.label)) || verbNamed(c.label) || /^-/.test(c.label));
    t.cols.forEach((c, i) => { if (hasPerson(words(c.label)) || genderOk(c.label) || hasInf(c.label) || endingOk(c.label)) cols.add(i); });
    const all = new Set(t.cols.map((c, i) => i));
    if (verbRows.size) return { rows: verbRows, cols: cols.size ? cols : all, own: true };      // the verb's own row: show it whole if no column fits the person
    // comparison tables (imperfective against perfective): pick the column by the shape of the answer
    if (!personRows.size && !verbRows.size && t.cols.length >= 2) {
      const why = (item.why || '').toLowerCase();
      const esc_ = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const keyOf = label => { const l = label.toLowerCase().split(/[:(]/)[0].trim(); return /^ir a\b/.test(l) ? 'ir a' : l.split(/\s+/)[0]; };
      const firstAt = i => { const m = why.match(new RegExp(`(^|[^\\p{L}])${esc_(keyOf(t.cols[i].label))}(?![\\p{L}])`, 'u')); return m ? m.index : Infinity; };
      let best = t.cols.map((c, i) => [firstAt(i), i]).sort((a, b) => a[0] - b[0])[0];
      if (!isFinite(best[0])) {                      // the explanation does not name a column: use the shape of the answer
        const compound = /\s/.test(item.a[0].trim());
        const compoundCol = t.cols.findIndex(c => /ir a|imperfective|będę/i.test(c.label));
        if (compoundCol >= 0 && t.cols.length === 2) best = [0, compound ? compoundCol : 1 - compoundCol];
      }
      if (isFinite(best[0])) return { rows: new Set(t.rows.map((r, i) => i)), cols: new Set([best[1]]), own: false, weak: true };
    }
    if (personRows.size) return { rows: personRows, cols: cols.size ? cols : all, own: t.cols.some(c => hasInf(c.label)), weak: specific && !cols.size };   // weak: the verb itself is not in this table, so the whole person row is shown
    return null;
  }

  /* ---------- what changed between the dictionary form and the answer (Polish case nouns) ---------- */
  const VOWELS = 'aąeęioóuy';
  const isVowel = ch => VOWELS.includes(ch);
  const NOM_ENDINGS = ['um', 'ie', 'a', 'o', 'e', 'ę', 'y', 'i'];    // nouns and adjectives

  // a word may keep or drop its final vowel: pani keeps the i, tani drops it, okno drops the o
  function stemsOf(word) {
    const out = [word];
    for (const e of NOM_ENDINGS) if (word.length > e.length + 1 && word.endsWith(e)) { out.push(word.slice(0, -e.length)); break; }
    return out;
  }

  // every plausible stem shape: vowel change or mobile e, then optional softening of the final consonant(s)
  function candidates(stem) {
    const out = [{ s: stem, steps: [] }];
    const lastIdx = (ch) => stem.lastIndexOf(ch);
    for (const [from, to, note] of [['ó', 'o', 'ó becomes o'], ['ą', 'ę', 'ą becomes ę'], ['a', 'e', 'a becomes e'], ['o', 'e', 'o becomes e'], ['ę', 'ą', 'ę becomes ą']]) {
      const i = lastIdx(from);
      if (i > 0 && !stem.slice(i + 1).split('').some(isVowel)) out.push({ s: stem.slice(0, i) + to + stem.slice(i + 1), steps: [note] });
    }
    // mobile e: pies → ps, cukier → cukr, Marek → Mark, dworzec → dworc
    const m = stem.match(/^(.*[^aąeęioóuy])(i?e)([^aąeęioóuy]+)$/);
    if (m && m[1].length) out.push({ s: m[1] + m[3], steps: ['the e drops out'] });
    // inserted e: książk → książek, okn → okien
    const last = stem.slice(-1), before = stem.slice(0, -1);
    if (before && !isVowel(last) && !isVowel(before.slice(-1))) {
      out.push({ s: before + 'e' + last, steps: ['an e slips in between the last two consonants'] });
      out.push({ s: before + 'ie' + last, steps: ['an e slips in between the last two consonants'] });
      if (/ó$/.test(before) === false && /o[^aąeęioóuy]$/.test(stem)) {}
    }
    const soft = [];
    out.forEach(c => SOFTENING.forEach(r => {
      if (c.s.endsWith(r.hard)) soft.push({ s: c.s.slice(0, -r.hard.length) + r.soft, pre: c.s, steps: c.steps.slice(), soft: r });
    }));
    return out.concat(soft);
  }

  function analyseWord(base, answer) {
    const b = base.toLowerCase(), a = answer.toLowerCase();
    if (b === a) return { base, answer, same: true };
    let best = null;
    const cost = c => c.steps.length + (c.soft ? 1 : 0);
    stemsOf(b).forEach(stem => candidates(stem).forEach(c => {
      if (!a.startsWith(c.s)) return;
      const ending = a.slice(c.s.length);
      if (!KNOWN_ENDINGS.includes(ending)) return;
      if (!best || cost(c) < cost(best) || (cost(c) === cost(best) && c.s.length > best.s.length)) best = { ...c, ending };
    }));
    if (!best) return { base, answer, unknown: true };
    return { base, answer, stem: best.s, pre: best.pre, ending: best.ending, steps: best.steps, soft: best.soft };
  }

  function changeNote(item) {
    if (state.topic.id !== 'cases' || item.kind === 'pronoun' || typeof SOFTENING === 'undefined') return '';
    const bases = item.base.trim().split(/\s+/), answers = item.a[0].trim().split(/\s+/);
    if (bases.length !== answers.length) return '';
    const lines = bases.map((bw, i) => {
      const r = analyseWord(bw, answers[i]);
      const w = `<b lang="${APP.lang}">${esc(r.base)} → ${esc(r.answer)}</b>`;
      if (r.same) return `${w}: no change.`;
      if (r.unknown) return `${w}: irregular. Learn this form as a word of its own.`;
      const steps = r.steps.slice();
      let built;
      if (r.soft) {
        const { hard, soft, spelling } = r.soft;
        const merged = !r.ending && soft.endsWith('i');
        const written = merged ? soft : soft + r.ending;
        if (spelling) steps.push(merged ? `${hard} is written ${soft} before the ending -i, which merges into it` : `${hard} is written ${soft} before the ending -${esc(r.ending)}, so ${hard} + ${esc(r.ending)} gives ${written}`);
        else steps.push(merged ? `${hard} softens to ${soft}, and the i of ${soft} is the plural ending -i itself` : `${hard} softens to ${soft} before the ending -${esc(r.ending)}, so ${hard} + ${esc(r.ending)} is written ${written}`);
        built = `${esc(r.pre)} + -${esc(merged ? 'i' : r.ending)} → ${esc(r.answer.toLowerCase())}`;
      } else {
        steps.push(r.ending ? `add the ending -${esc(r.ending)}` : 'no ending is added');
        built = r.ending ? `${esc(r.stem)} + -${esc(r.ending)} → ${esc(r.answer.toLowerCase())}` : `${esc(r.base.toLowerCase())} → ${esc(r.answer.toLowerCase())}`;
      }
      const text = steps.map((s, i) => i === 0 ? s.charAt(0).toUpperCase() + s.slice(1) : s).join(', then ');
      return `${w}: ${text}. <span lang="${APP.lang}">${built}</span>`;
    });
    return `<div class="changes"><p class="changes-title">What changed</p><ul>${lines.map(l => `<li>${l}</li>`).join('')}</ul>
      <button type="button" class="link-btn" data-action="see-sounds">See all sound changes</button></div>`;
  }

  function revealTables(item, g) {
    if (!g.tables) return '';
    const score = h => (h.own ? 2 : 0) + (h.weak ? 0 : 1);
    const hits = g.tables.map(t => ({ t, hl: tableHighlight(t, item) })).filter(x => x.hl).sort((a, b) => score(b.hl) - score(a.hl)).slice(0, 2);
    const shown = hits.length ? hits : [{ t: g.tables[0], hl: null }];
    const label = item.p ? `${item.p}${itemGender(item) && !PLURAL_P.has(item.p) && ['ja', 'ty'].includes(item.p) ? `, ${{ m: 'a man', f: 'a woman' }[itemGender(item)] || ''}` : ''}` : '';
    return `<details class="mini-grid" open>
      <summary>Where it sits in the table${label ? `<span class="hl-label">${esc(label)}</span>` : ''}</summary>
      ${shown.map(x => tenseTable(x.t, x.hl, true)).join('')}
    </details>`;
  }

  const tenseSection = g => `<article class="case" id="ref-${g.id}" style="${colour(g.colour)}">
      ${band(g, g.en)}
      <h3>How it works</h3>
      ${useList(g.rules)}
      <h3>The forms</h3>
      ${g.tables.map(t => tenseTable(t)).join('')}
      ${watchList(g.watch)}
    </article>`;

  function renderTable() {
    const t = state.topic;
    $('#view-table').innerHTML = t.id === 'cases'
      ? `${startRow()}
        <section class="overview">
          <h2>The endings side by side</h2>
          ${overviewTable(OVERVIEW.nouns)}
          ${overviewTable(OVERVIEW.adjs)}
        </section>
        ${soundsSection()}
        ${selectedGroups().map(caseSection).join('')}`
      : `${startRow()}
        <p class="case-summary topic-intro">${esc(t.intro)}</p>
        ${selectedGroups().map(tenseSection).join('')}`;
  }

  /* ---------- quiz ---------- */
  function startQuiz(items, all = false) {
    const queue = state.order === 'weak' ? orderWeakFirst(items) : shuffle(items);
    if (!all && state.length) queue.length = Math.min(queue.length, state.length);
    state.quiz = { queue, idx: 0, results: [], revealed: false, checked: false, firstTryRight: false, feedback: null, typed: '' };
    saveQuiz();
    setView('quiz');
    scrollToQuiz();
  }

  const scrollToQuiz = () => window.scrollTo({ top: $('nav').offsetTop - 8, behavior: 'instant' });
  const current = () => state.quiz.queue[state.quiz.idx];
  const isNotebook = () => state.mode === 'notebook';

  const shortHint = item => item.hint && item.hint.length <= 12 ? item.hint : '';
  const longHint = item => item.hint && item.hint.length > 12 ? item.hint : '';

  function gapTag(item) {
    if (typeof GENDERS === 'undefined' || state.topic.id !== 'cases' || item.kind === 'pronoun') return '';
    const noun = item.base.trim().split(/\s+/).find(w => GENDERS[w]);
    if (!noun) return '';
    return GENDERS[noun] + (item.hint === 'plural' || PLURAL_ONLY.includes(noun) ? '.pl' : '');
  }

  function sentenceHTML(item, revealed) {
    return joinTokens(parseSentence(item.s), tok => {
      if (tok.punct) return esc(tok.punct);
      if (tok.gap) {
        return revealed
          ? `<span class="slot filled" tabindex="0" data-gloss="${esc(item.gloss)}" ${gapTag(item) ? `data-tag="${gapTag(item)}"` : ''} data-say="${esc(item.a[0])}">${esc(item.a[0])}</span>`
          : `<span class="slot" tabindex="0" data-gloss="${esc(item.gloss)}" ${gapTag(item) ? `data-tag="${gapTag(item)}"` : ''} data-say="${esc(item.base.replace(/\s*\/\s*/g, ', '))}">${esc(item.base)}${shortHint(item) ? `<small>${esc(shortHint(item))}</small>` : ''}</span>`;
      }
      return `<span class="w" tabindex="0" data-gloss="${esc(tok.gloss)}" ${tok.tag ? `data-tag="${esc(tok.tag)}"` : ''} data-say="${esc(tok.word)}">${esc(tok.word)}</span>`;
    });
  }

  const modePicker = () => `
    <fieldset class="modes">
      <legend>How do you want to answer?</legend>
      <label class="mode"><input type="radio" name="mode" value="type" ${isNotebook() ? '' : 'checked'}>
        <span><b>Type it here</b>The page checks your spelling.</span></label>
      <label class="mode"><input type="radio" name="mode" value="notebook" ${isNotebook() ? 'checked' : ''}>
        <span><b>Write it in my notebook</b>You reveal the answer and mark yourself right or wrong.</span></label>
    </fieldset>`;

  function renderQuiz() {
    const root = $('#view-quiz');
    const q = state.quiz;
    const t = state.topic;

    if (!q) {
      const saved = savedQuiz();
      root.innerHTML = `<div class="quiz-intro">
        ${saved ? `<div class="resume">
          <p><b>You have an unfinished quiz.</b> ${saved.idx} of ${saved.queue.length} sentences done.</p>
          <button type="button" class="btn primary" data-action="resume">Continue where you left off</button>
        </div>` : ''}
        <h2>Ready when you are</h2>
        <p>You get one sentence at a time with a word in its dictionary form. Put it in the right form. Hover over any word to see what it means.</p>
        ${hasKinds() ? `<fieldset class="lengths kinds">
          <legend>Which words?</legend>
          ${[['all', 'Everything'], ['nouns', 'Nouns and adjectives'], ['pronouns', 'Pronouns and small words']].map(([v, label]) => `<label><input type="radio" name="kind" value="${v}" ${state.kind === v ? 'checked' : ''}><span>${label}</span></label>`).join('')}
        </fieldset>` : ''}
        ${modePicker()}
        <label class="toggle"><input type="checkbox" id="show-group" ${state.showGroup ? 'checked' : ''}> Tell me which ${t.unit} each sentence needs</label>
        <fieldset class="lengths">
          <legend>How many sentences?</legend>
          ${[10, 20, 50, 0].map(n => `<label><input type="radio" name="length" value="${n}" ${state.length === n ? 'checked' : ''}><span>${n || `All ${pool().length}`}</span></label>`).join('')}
        </fieldset>
        <fieldset class="lengths order">
          <legend>Which sentences first?</legend>
          <label><input type="radio" name="order" value="weak" ${state.order === 'weak' ? 'checked' : ''}><span>New and missed ones first</span></label>
          <label><input type="radio" name="order" value="random" ${state.order === 'random' ? 'checked' : ''}><span>Random</span></label>
        </fieldset>
        <button type="button" class="btn primary" data-action="start">Start quiz</button>
        ${progressPanel()}
      </div>`;
      return;
    }

    if (q.idx >= q.queue.length) { renderSummary(root); return; }

    const item = current();
    const g = t.byId[item.c];
    const showGroup = state.showGroup || q.revealed;
    const right = q.results.filter(r => r.right).length;
    const last = q.idx + 1 >= q.queue.length;
    const marked = q.results.length > q.idx;   // this sentence already has a result

    let answerUI = '';
    if (!q.revealed && isNotebook()) {
      answerUI = `<p class="hover-hint">Hover over a word to see its translation. Click it to hear it.</p>
        <p class="notebook-note">Write <i lang="${APP.lang}">${esc(item.base)}</i> in the right form in your notebook. Reveal the answer when you are ready.</p>
        <div class="answer-row"><button type="button" class="btn primary" data-action="reveal" id="reveal-btn">Reveal answer</button></div>`;
    } else if (!q.revealed) {
      answerUI = `<p class="hover-hint">Hover over a word to see its translation. Click it to hear it.</p>
        <form class="answer-row" id="answer-form" autocomplete="off">
          <input id="answer" type="text" lang="${APP.lang}" spellcheck="false" autocapitalize="off" autocomplete="off"
            aria-label="Your answer: ${esc(item.base)} in the right form" placeholder="${esc(item.base)} → ?" value="${esc(q.typed)}">
          <button type="submit" class="btn primary">Check</button>
          <button type="button" class="btn" data-action="reveal">Reveal answer</button>
        </form>
        <div class="letters" aria-label="Special letters">${LETTERS.map(l => `<button type="button" data-letter="${l}" aria-label="Insert ${l}">${l}</button>`).join('')}</div>`;
    } else if (q.typed.trim()) {
      answerUI = `<div class="answer-row"><input type="text" readonly aria-label="What you typed" value="${esc(q.typed)}"></div>`;
    }

    const nextLabel = last ? 'See my results' : 'Next sentence';
    const afterReveal = !q.revealed ? '' : `
      <div class="reveal">
        <p class="ans" lang="${APP.lang}"><span class="ans-label" lang="en">Answer</span><span class="say from" tabindex="0" role="button" aria-label="Hear ${esc(item.base)}" data-say="${esc(item.base.replace(/\s*\/\s*/g, ', '))}">${esc(item.base)}</span>${shortHint(item) ? `<small lang="en">${esc(shortHint(item))}</small>` : ''}<span class="arrow" aria-hidden="true">→</span><span class="say to" tabindex="0" role="button" aria-label="Hear ${esc(item.a[0])}" data-say="${esc(item.a[0])}">${esc(item.a[0])}</span></p>
        ${item.a.length > 1 ? `<p class="also">Also correct: <span lang="${APP.lang}">${item.a.slice(1).map(esc).join(', ')}</span></p>` : ''}
        <p class="en">${esc(item.en)}</p>
        <p class="why"><b>${esc(t.whyLabel(g))}</b> ${esc(item.why)}</p>
        ${changeNote(item)}
        ${(() => { if (t.id !== 'cases') return revealTables(item, g); const hl = itemHighlight(item); return hl ? `<details class="mini-grid" open>
          <summary>Where it sits in the table<span class="hl-label">${esc(hl.label)}</span></summary>
          ${caseGrid(g, hl, hl.number)}
        </details>` : ''; })()}
        <button type="button" class="link-btn" data-action="see-table" data-group="${g.id}">${esc(t.refLink(g))}</button>
      </div>
      ${isNotebook() && !marked ? `
      <div class="next-row self-mark">
        <span class="ask">Does your notebook match?</span>
        <button type="button" class="btn right" data-action="mark-right">I got it right</button>
        <button type="button" class="btn wrong" data-action="mark-wrong">I got it wrong</button>
        <span class="key-hint">or press Y or N</span>
      </div>` : `
      <div class="next-row">
        <button type="button" class="btn primary" data-action="next" id="next-btn">${nextLabel}</button>
        <span class="key-hint">or press Enter</span>
      </div>`}`;

    root.innerHTML = `<div style="${colour(g.colour)}">
      <div class="q-top">
        <span>Sentence ${q.idx + 1} of ${q.queue.length}</span>
        <span>${right} right so far
          ${q.revealed ? '' : `<button type="button" class="link-btn mode-switch" data-action="switch-mode">${isNotebook() ? 'Switch to typing' : 'Switch to notebook mode'}</button>`}</span>
      </div>
      <div class="q-progress" aria-hidden="true"><i style="width:${(q.idx / q.queue.length) * 100}%"></i></div>

      <div class="q-case ${showGroup ? '' : 'hidden-case'}">${showGroup
        ? `<b lang="${APP.lang}">${esc(g.pl)}</b><i lang="${APP.lang}">${esc(g.q)}</i><span>${esc(g.en)}</span>`
        : `<span>Which ${t.unit} is it? Work it out from the sentence.</span>`}</div>

      <p class="sentence" lang="${APP.lang}">${sentenceHTML(item, q.revealed)}</p>
      ${(() => { const r = recordOf(item); return r ? `<p class="history">${r.streak >= 2 ? `Right ${r.streak} times in a row.` : r.last ? 'Right last time.' : 'Missed last time.'} ${r.ok} of ${r.n} so far.</p>` : ''; })()}
      ${longHint(item) && !q.revealed ? `<p class="q-hint"><b>Hint</b> ${esc(longHint(item))}</p>` : ''}
      ${answerUI}
      <p class="speech-note" id="speech-note" hidden></p>
      <p class="feedback ${q.feedback ? q.feedback.kind : ''}" role="status">${q.feedback ? esc(q.feedback.text) : ''}</p>
      ${afterReveal}
    </div>`;

    const focusEl = $('#next-btn') || $('#answer') || $('#reveal-btn');
    if (focusEl) focusEl.focus({ preventScroll: true });
  }

  function checkAnswer() {
    const q = state.quiz;
    const item = current();
    const typed = $('#answer').value;
    q.typed = typed;
    const guess = normalise(typed);
    if (!guess) { q.feedback = { kind: 'bad', text: 'Type the word in its new form first, or reveal the answer.' }; renderQuiz(); return; }

    const answers = item.a.map(normalise);
    const sieFollows = /___\s+się\{/.test(item.s);
    const guessNoSie = sieFollows ? guess.replace(/ się$/, '') : guess;
    if (answers.includes(guess) || answers.includes(guessNoSie)) {
      if (!q.checked) q.firstTryRight = true;
      q.feedback = { kind: 'good', text: q.firstTryRight ? 'Correct.' : 'Correct this time.' };
      reveal();
      return;
    }
    q.checked = true;
    q.feedback = answers.map(stripMarks).includes(stripMarks(guessNoSie))
      ? { kind: 'bad', text: `Nearly. The letters are right, but check the ${APP.languageName} marks such as ${APP.marks}.` }
      : { kind: 'bad', text: 'Not quite. Try again, or reveal the answer.' };
    renderQuiz();
  }

  function reveal() {
    const q = state.quiz;
    const input = $('#answer');
    if (input) q.typed = input.value;
    if (!q.feedback || q.feedback.kind !== 'good') q.feedback = null;
    q.revealed = true;
    // typed answers are scored now; notebook answers wait for the learner's own verdict
    if (!isNotebook()) { q.results.push({ item: current(), right: q.firstTryRight, mode: 'type' }); record(current(), q.firstTryRight); saveQuiz(); }
    renderQuiz();
  }

  function selfMark(right) {
    const q = state.quiz;
    if (!q || !q.revealed || q.results.length > q.idx) return;
    q.results.push({ item: current(), right, mode: 'notebook' });
    record(current(), right);
    next();
  }

  function next() {
    const q = state.quiz;
    Object.assign(q, { idx: q.idx + 1, revealed: false, checked: false, firstTryRight: false, feedback: null, typed: '' });
    saveQuiz();
    renderQuiz();
    scrollToQuiz();
  }

  function progressPanel() {
    const t = state.topic;
    const all = groupStats(t.sentences);
    if (!all.seen) return `<section class="progress"><h3>Your progress</h3><p>Nothing yet. Results are saved in this browser as you go.</p></section>`;
    const rows = t.groups.map(g => {
      const s = groupStats(t.sentences.filter(x => x.c === g.id));
      const pct = s.n ? Math.round(100 * s.ok / s.n) : 0;
      return `<tr style="${colour(g.colour)}">
        <th scope="row"><span lang="${APP.lang}">${esc(g.pl)}</span><small>${esc(g.en)}</small></th>
        <td><div class="bar"><i class="done" style="width:${100 * s.mastered / s.total}%"></i><i class="seen" style="width:${100 * (s.seen - s.mastered) / s.total}%"></i></div></td>
        <td data-col="seen">${s.seen} of ${s.total}</td><td data-col="mastered">${s.mastered}</td><td data-col="to review">${s.weak}</td><td data-col="accuracy">${s.n ? pct + '%' : ''}</td></tr>`;
    }).join('');
    return `<section class="progress">
      <h3>Your progress</h3>
      <div class="table-wrap"><table class="progress-table">
        <thead><tr><th scope="col">${esc(t.unit[0].toUpperCase() + t.unit.slice(1))}</th><th scope="col"></th><th scope="col">Seen</th><th scope="col">Mastered</th><th scope="col">To review</th><th scope="col">Accuracy</th></tr></thead>
        <tbody>${rows}</tbody>
      </table></div>
      <p class="progress-note">Mastered means right twice in a row. To review means missed the last time. Everything is saved in this browser only.</p>
      <p class="progress-reset">${state.confirmReset
        ? `Delete all saved progress for every topic? <button type="button" class="btn wrong" data-action="reset-yes">Yes, delete it</button> <button type="button" class="btn" data-action="reset-no">Keep it</button>`
        : `<button type="button" class="link-btn" data-action="reset">Reset progress</button>`}</p>
    </section>`;
  }

  function renderSummary(root) {
    const q = state.quiz;
    store.set(`${APP.storagePrefix}.resume`, null);
    const right = q.results.filter(r => r.right).length;
    const missed = q.results.filter(r => !r.right);
    const modes = new Set(q.results.map(r => r.mode));
    const how = modes.size > 1 ? 'typed right on the first try or marked right in your notebook.'
      : modes.has('notebook') ? 'marked right in your notebook.'
      : 'right on the first try, without revealing the answer.';
    root.innerHTML = `<div class="summary">
      <h2>Quiz finished</h2>
      <p class="score">${right} of ${q.results.length}</p>
      <p>${how}</p>
      ${missed.length ? `<h3>Sentences to look at again</h3>
      <ul class="missed">${missed.map(({ item }) => { const g = state.topic.byId[item.c]; return `<li style="${colour(g.colour)}">
        <span class="ex" lang="${APP.lang}">${joinTokens(parseSentence(item.s), tk => tk.punct ? esc(tk.punct) : tk.gap ? `<b>${esc(item.a[0])}</b>` : esc(tk.word))}</span>
        <span>${esc(g.pl)}. ${esc(item.why)}</span></li>`; }).join('')}</ul>` : '<p>A clean sheet. Brawo!</p>'}
      <div class="actions">
        ${missed.length ? '<button type="button" class="btn primary" data-action="retry-missed">Practise these again</button>' : ''}
        <button type="button" class="btn ${missed.length ? '' : 'primary'}" data-action="start">Start a new quiz</button>
      </div>
    </div>`;
  }

  function setMode(mode) {
    state.mode = mode === 'notebook' ? 'notebook' : 'type';
    store.set(`${APP.storagePrefix}.mode`, state.mode);
  }

  /* ---------- view switching ---------- */
  function setView(view) {
    state.view = view;
    store.set(`${APP.storagePrefix}.view`, view);
    renderView();
  }

  function renderView() {
    document.querySelectorAll('.view-btn').forEach(b => {
      if (b.dataset.view === state.view) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current');
    });
    $('#view-table').hidden = state.view !== 'table';
    $('#view-quiz').hidden = state.view !== 'quiz';
    hideTip();
    if (state.view === 'table') renderTable(); else renderQuiz();
  }

  /* ---------- translation tooltip ---------- */
  const tip = $('#tip');
  const TAG_NAMES = { m1: 'masculine', m2: 'masculine', m: 'masculine', n: 'neuter', f: 'feminine' };
  const TAG_DETAIL = { m1: 'animate', m2: 'inanimate' };
  function showTip(el) {
    const tag = el.dataset.tag || '';
    const [g, num] = tag.split('.');
    tip.className = 'tip' + (g ? ` tip-${g[0]}` : '');
    tip.innerHTML = `<span class="tip-gloss">${esc(el.dataset.gloss)}</span>${g ? `<span class="tip-meta"><i class="tip-g">${TAG_NAMES[g]}${TAG_DETAIL[g] ? `, ${TAG_DETAIL[g]}` : ''}</i>${num === 'pl' ? '<i class="tip-pl">plural</i>' : ''}</span>` : ''}`;
    tip.hidden = false;
    const r = el.getBoundingClientRect();
    const t = tip.getBoundingClientRect();
    const centre = r.left + r.width / 2;
    const left = Math.max(8, Math.min(centre - t.width / 2, window.innerWidth - t.width - 8));
    tip.style.left = `${left}px`;
    tip.style.top = `${Math.max(4, r.top - t.height - 10)}px`;
    tip.style.setProperty('--arrow', `${Math.max(12, Math.min(centre - left, t.width - 12))}px`);
  }
  function hideTip() { tip.hidden = true; }

  document.addEventListener('mouseover', e => { const el = e.target.closest('[data-gloss]'); if (el) showTip(el); });
  document.addEventListener('mouseout', e => { if (e.target.closest('[data-gloss]')) hideTip(); });
  document.addEventListener('focusin', e => { const el = e.target.closest('[data-gloss]'); if (el) showTip(el); else hideTip(); });
  document.addEventListener('focusout', e => { if (e.target.closest('[data-gloss]')) hideTip(); });
  window.addEventListener('scroll', hideTip, { passive: true });

  /* ---------- speech: click a word to hear it ---------- */
  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let plVoice = null;
  function pickVoice() {
    const voices = synth.getVoices().filter(v => v.lang.toLowerCase().replace('_', '-').split('-')[0] === APP.lang);
    plVoice = voices.find(v => /google/i.test(v.name)) || voices.find(v => !v.localService) || voices[0] || null;
  }
  if (synth) {
    pickVoice();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', pickVoice);
  }

  function speechNote(text) {
    const el = $('#speech-note');
    if (!el) return;
    el.textContent = text;
    el.hidden = !text;
  }

  function say(text) {
    if (!synth) { speechNote('This browser cannot read text aloud. Try Google Chrome.'); return; }
    if (!plVoice) pickVoice();
    synth.cancel();                          // drop anything still queued so clicks never pile up
    const u = new SpeechSynthesisUtterance(text);
    u.lang = APP.speech;
    if (plVoice) u.voice = plVoice;
    u.rate = 0.85;
    u.onerror = e => { if (e.error !== 'interrupted' && e.error !== 'canceled') speechNote('The browser could not play the audio. Check your internet connection, or try Google Chrome.'); };
    synth.speak(u);
    speechNote(plVoice ? '' : `No ${APP.languageName} voice was found in this browser, so it may sound wrong or stay silent. Google Chrome includes one.`);
  }

  /* ---------- events ---------- */
  document.addEventListener('click', e => {
    const topicBtn = e.target.closest('.topic-btn');
    if (topicBtn) { setTopic(topicBtn.dataset.topic); return; }

    const stripe = e.target.closest('.stripe');
    if (stripe) { toggleGroup(stripe.dataset.group); $(`.stripe[data-group="${stripe.dataset.group}"]`).focus(); return; }

    const viewBtn = e.target.closest('.view-btn');
    if (viewBtn) { setView(viewBtn.dataset.view); return; }

    const spoken = e.target.closest('[data-say]');
    if (spoken) {
      if (spoken.dataset.gloss) showTip(spoken);   // tap support for the translation
      say(spoken.dataset.say);
      return;
    }

    const letter = e.target.closest('[data-letter]');
    if (letter) {
      const input = $('#answer');
      const { selectionStart: a, selectionEnd: b, value } = input;
      input.value = value.slice(0, a) + letter.dataset.letter + value.slice(b);
      input.focus();
      input.setSelectionRange(a + 1, a + 1);
      return;
    }

    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'start') startQuiz(pool());
    else if (action === 'reveal') reveal();
    else if (action === 'resume') resumeQuiz();
    else if (action === 'reset') { state.confirmReset = true; renderQuiz(); }
    else if (action === 'reset-no') { state.confirmReset = false; renderQuiz(); }
    else if (action === 'reset-yes') { Object.keys(progress).forEach(k => delete progress[k]); saveProgress(); store.set(`${APP.storagePrefix}.resume`, null); state.confirmReset = false; renderQuiz(); }
    else if (action === 'next') next();
    else if (action === 'mark-right') selfMark(true);
    else if (action === 'mark-wrong') selfMark(false);
    else if (action === 'switch-mode') {
      const input = $('#answer');
      if (input) state.quiz.typed = input.value;
      setMode(isNotebook() ? 'type' : 'notebook');
      renderQuiz();
    }
    else if (action === 'retry-missed') startQuiz(state.quiz.results.filter(r => !r.right).map(r => r.item), true);
    else if (action === 'see-sounds') { setView('table'); document.getElementById('ref-sounds')?.scrollIntoView(); }
    else if (action === 'see-table') {
      setView('table');
      document.getElementById(`ref-${e.target.closest('[data-group]').dataset.group}`)?.scrollIntoView();
    }
  });

  document.addEventListener('keydown', e => {
    const spoken = (e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('[data-say]');
    if (spoken) { e.preventDefault(); say(spoken.dataset.say); return; }
    const q = state.quiz;
    if (!q || state.view !== 'quiz' || !q.revealed || !isNotebook() || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest('input, textarea')) return;
    const k = e.key.toLowerCase();
    if (k === 'y') { e.preventDefault(); selfMark(true); }
    else if (k === 'n') { e.preventDefault(); selfMark(false); }
  });

  document.addEventListener('submit', e => { if (e.target.id === 'answer-form') { e.preventDefault(); if (!state.quiz.revealed) checkAnswer(); } });
  document.addEventListener('change', e => {
    if (e.target.id === 'show-group') { state.showGroup = e.target.checked; store.set(`${APP.storagePrefix}.showCase`, state.showGroup); }
    if (e.target.name === 'mode') setMode(e.target.value);
    if (e.target.name === 'kind') { state.kind = e.target.value; store.set(`${APP.storagePrefix}.kind`, state.kind); renderFilter(); renderQuiz(); $(`input[name="kind"][value="${state.kind}"]`)?.focus(); }
    if (e.target.name === 'order') { state.order = e.target.value; store.set(`${APP.storagePrefix}.order`, state.order); }
    if (e.target.name === 'length') { state.length = Number(e.target.value); store.set(`${APP.storagePrefix}.length`, state.length); }
  });
  $('#all-groups').addEventListener('click', () => { state.selected[state.topic.id] = new Set(state.topic.allIds); afterFilterChange(); });

  renderTopics();
  renderFilter();
  renderView();
})();
