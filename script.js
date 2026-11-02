(() => {
  'use strict';

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const input = $('#typing-input');
  const typingArea = $('#typing-area');
  const typingText = $('#typing-text');
  const overlay = $('#finished-overlay');
  const progressRail = $('.progress-rail');
  const durations = [15, 30, 60, 120];
  const STORAGE_KEY = 'keyflow-settings-v3';

  const WORD_BANK = `about above across act action actually add after again against age ago agree air all allow almost alone along already also although always among amount an and animal another answer any appear apply area arm around art as ask at away back bad base be beautiful because become bed before begin best better between big bird black body book both box boy bring build business but buy call can car care carry case cause cell center century certain change check child choice city class clear close cold color come common company complete consider continue control cook copy course create cross cut dark data day decide develop did differ direct discover do does dog door down draw dream drive during each early earth ease east easy effect effort eight either end enjoy enough enter equal especially even event ever every example experience explain eye face fact fair fall family far fast father feel few field figure fill film final find fine first fish five floor flow focus follow food for force form found four free friend from front full game garden general get girl give glass go good great green ground group grow guess hand happen happy hard have he head health hear heart heavy help her here high him his history hold home hope horse hour house how however human idea if imagine important improve in include increase indeed inside instead interest into issue item its itself job join just keep kind know land language large last late learn least leave left less let level life light like line list little live long look lose lot love low machine made main make man many map mark matter may mean measure meet member memory mention middle mind minute miss moment money month more morning most mother move much music must name nation nature near necessary need never new next night no nor north note notice number object observe obvious occur ocean odd of off offer office often oil old on once one only open opinion opportunity order other our out over own page paper parent part particular pass past pattern pay peace people per perhaps person phone photo pick picture place plan play point possible practice prepare present press pretty price problem process produce product project prove provide public pull put quality question quick quickly quiet quite race radio rain raise range rate rather reach read ready real reason receive record red reduce relate remain remember report result return rich right rise river road room rule run same save saw say school science sea second see seem self sense serve set several shape share she short should show side simple since sing single sister sit six size sleep slow small so social soft solution some sort sound south space speak special spend spring stand start state stay step still stop story street strong study subject such summer support sure surface system table take talk teach team tell ten test than thank that the their them themselves then theory there these they thing think third this those though thought three through time to together too top toward town trade train travel tree true try turn two under understand unit until up upon use usual value very view voice wait walk wall want war warm was watch water way we wear week well west what when where whether which while white who whole why wide wife wild will win wind window winter wish with without woman wonder word work world worry would write wrong year yes yet you young your`.split(/\s+/);
  const QUOTES = [
    'Great things are done by a series of small things brought together.',
    'It always seems impossible until it is done.',
    'The secret of getting ahead is getting started.',
    'Well done is better than well said.',
    'What we do every day matters more than what we do once in a while.',
    'Simplicity boils down to two steps: identify the essential, eliminate the rest.',
    'Nothing will work unless you do.',
    'The beginning is the most important part of the work.',
    'Success is the sum of small efforts, repeated day in and day out.',
    'Make each day your masterpiece.',
    'First, solve the problem. Then, write the code.',
    'The secret of concentration is the secret of self-discovery.'
  ];
  const CODE_SNIPPETS = [
    'const average = (values) => {\n  if (!values.length) return 0;\n  return values.reduce((sum, value) => sum + value, 0) / values.length;\n};',
    'function greet(name) {\n  const message = `Hello, ${name}`;\n  return message.trim();\n}',
    'const settings = {\n  theme: "dark",\n  duration: 30,\n  sound: false,\n};',
    'for (const item of items) {\n  if (item.active) {\n    results.push(item.value);\n  }\n}',
    'const clamp = (value, min, max) =>\n  Math.min(Math.max(value, min), max);',
    'async function loadProfile(userId) {\n  const response = await fetch(`/api/users/${userId}`);\n  if (!response.ok) throw new Error("Request failed");\n  return response.json();\n}',
    'const unique = [...new Set(numbers)];\nconst sorted = unique.sort((a, b) => a - b);\nconsole.log(sorted);'
  ];

  let mode = 'words';
  let duration = 30;
  let targetText = '';
  let typedText = '';
  let startTime = null;
  let timerId = null;
  let running = false;
  let finished = false;
  let totalKeypresses = 0;
  let correctKeypresses = 0;
  let mistakes = 0;
  let toastTimeout = null;
  const PROMPT_STORAGE_KEY = 'keyflow-last-prompts-v1';

  function readLastPrompt(key) {
    try {
      const prompts = JSON.parse(localStorage.getItem(PROMPT_STORAGE_KEY) || '{}') || {};
      return typeof prompts[key] === 'string' ? prompts[key] : '';
    } catch (_) { return ''; }
  }
  function saveLastPrompt(key, value) {
    try {
      const prompts = JSON.parse(localStorage.getItem(PROMPT_STORAGE_KEY) || '{}') || {};
      prompts[key] = value;
      localStorage.setItem(PROMPT_STORAGE_KEY, JSON.stringify(prompts));
    } catch (_) { /* Prompt randomisation still works without storage. */ }
  }

  const settings = readSettings();
  if (settings.theme === 'dark') document.body.classList.add('dark-theme');
  if (durations.includes(Number(settings.duration))) duration = Number(settings.duration);
  if (['words', 'quotes', 'code'].includes(settings.mode)) mode = settings.mode;

  function readSettings() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch (_) { return {}; }
  }
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        mode,
        duration,
        theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light'
      }));
    } catch (_) { /* Local storage is optional. */ }
  }
  function chooseDifferent(list, previous) {
    if (list.length < 2) return list[0] || '';
    let picked = list[Math.floor(Math.random() * list.length)];
    for (let tries = 0; picked === previous && tries < 6; tries += 1) {
      picked = list[Math.floor(Math.random() * list.length)];
    }
    return picked === previous ? list[(list.indexOf(picked) + 1) % list.length] : picked;
  }
  function randomWords(count) {
    const words = [];
    let previous = '';
    for (let i = 0; i < count; i += 1) {
      let word = WORD_BANK[Math.floor(Math.random() * WORD_BANK.length)];
      if (word === previous) word = WORD_BANK[(WORD_BANK.indexOf(word) + 29) % WORD_BANK.length];
      words.push(word);
      previous = word;
    }
    return words.join(' ');
  }
  function makePrompt() {
    if (mode === 'quotes') {
      const quote = chooseDifferent(QUOTES, readLastPrompt(mode));
      saveLastPrompt(mode, quote);
      return (quote + ' ' + quote + ' ' + quote).replace(/\s+/g, ' ');
    }
    if (mode === 'code') {
      const ordered = [...CODE_SNIPPETS];
      for (let i = ordered.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [ordered[i], ordered[j]] = [ordered[j], ordered[i]];
      }
      let result = ordered.join('\n\n');
      if (result === readLastPrompt(mode)) result = ordered.slice(1).concat(ordered[0]).join('\n\n');
      saveLastPrompt(mode, result);
      return result;
    }
    let result = randomWords(240);
    if (result === readLastPrompt(mode)) result = randomWords(240);
    saveLastPrompt(mode, result);
    return result;
  }
  function formatTime(value) {
    const seconds = Math.max(0, Math.ceil(value));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function correctCharacterCount() {
    let count = 0;
    for (let i = 0; i < typedText.length && i < targetText.length; i += 1) {
      if (typedText[i] === targetText[i]) count += 1;
    }
    return count;
  }
  function currentElapsed() {
    if (startTime === null) return 0;
    return Math.min(duration, (performance.now() - startTime) / 1000);
  }
  function calculateStats() {
    const elapsed = currentElapsed();
    const correctChars = correctCharacterCount();
    const wpm = elapsed > 0 ? Math.round((correctChars / 5) / (Math.max(elapsed, 1) / 60)) : 0;
    const accuracy = totalKeypresses ? Math.round((correctKeypresses / totalKeypresses) * 100) : 100;
    return { elapsed, correctChars, wpm, accuracy: Math.max(0, Math.min(100, accuracy)) };
  }
  function renderPrompt() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < targetText.length; i += 1) {
      const span = document.createElement('span');
      span.className = 'char';
      span.dataset.index = String(i);
      span.textContent = targetText[i];
      fragment.appendChild(span);
    }
    typingText.replaceChildren(fragment);
    updateCharacterMarks();
  }
  function updateCharacterMarks() {
    const chars = typingText.children;
    for (let i = 0; i < chars.length; i += 1) {
      const node = chars[i];
      node.classList.remove('correct', 'incorrect', 'current');
      if (i < typedText.length) node.classList.add(typedText[i] === targetText[i] ? 'correct' : 'incorrect');
      else if (i === typedText.length && !finished) node.classList.add('current');
    }
    const current = chars[Math.min(typedText.length, chars.length - 1)];
    if (current && typedText.length > 0) {
      const wrapRect = typingArea.getBoundingClientRect();
      const charRect = current.getBoundingClientRect();
      if (charRect.top < wrapRect.top + 10 || charRect.bottom > wrapRect.bottom - 28) {
        current.scrollIntoView({ block: 'nearest', behavior: 'auto' });
      }
    }
  }
  function updateStats() {
    const stats = calculateStats();
    $('#wpm-value').textContent = String(stats.wpm);
    $('#accuracy-value').textContent = String(stats.accuracy);
    $('#characters-value').textContent = String(stats.correctChars);
    $('#mistakes-value').textContent = String(mistakes);
    $('#time-label').textContent = formatTime(duration - stats.elapsed);
    const progress = Math.min(100, (stats.elapsed / duration) * 100);
    $('#progress-fill').style.width = `${progress}%`;
    progressRail.setAttribute('aria-valuenow', String(Math.round(progress)));
    return stats;
  }
  function startTimer() {
    if (running || finished) return;
    running = true;
    startTime = performance.now();
    $('#test-state').textContent = 'SESSION IN PROGRESS';
    $('#state-indicator').classList.add('running');
    $('#state-indicator').classList.remove('finished');
    timerId = window.setInterval(() => {
      const stats = updateStats();
      if (stats.elapsed >= duration) finishTest({ timeExpired: true });
    }, 80);
  }
  function handleEdit(nextText) {
    if (finished) return;
    if (nextText.length > targetText.length) nextText = nextText.slice(0, targetText.length);
    if (nextText === typedText) return;
    if (nextText.length > 0) startTimer();

    // Count newly entered characters as key presses; deleting text does not count as a press.
    if (nextText.length > typedText.length) {
      const additions = nextText.slice(typedText.length);
      for (let i = 0; i < additions.length; i += 1) {
        totalKeypresses += 1;
        const at = typedText.length + i;
        if (additions[i] === targetText[at]) correctKeypresses += 1;
        else mistakes += 1;
      }
    }
    typedText = nextText;
    input.value = typedText;
    updateCharacterMarks();
    const stats = updateStats();
    if (typedText.length >= targetText.length || stats.elapsed >= duration) {
      finishTest({ timeExpired: stats.elapsed >= duration });
    }
  }
  function finishTest({ timeExpired = false } = {}) {
    if (finished) return;
    finished = true;
    running = false;
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    const stats = updateStats();
    $('#test-state').textContent = 'SESSION COMPLETE';
    $('#state-indicator').classList.remove('running');
    $('#state-indicator').classList.add('finished');
    if (timeExpired) {
      $('#progress-fill').style.width = '100%';
      progressRail.setAttribute('aria-valuenow', '100');
      $('#time-label').textContent = '00:00';
    }
    $('#final-wpm').innerHTML = `${stats.wpm} <small>WPM</small>`;
    $('#final-accuracy').innerHTML = `${stats.accuracy}<small>%</small>`;

    const bestKey = `keyflow-best-${mode}-${duration}`;
    let best = 0;
    try { best = Number(localStorage.getItem(bestKey) || 0); } catch (_) { best = 0; }
    const newRecord = stats.wpm > best;
    if (newRecord) {
      best = stats.wpm;
      try { localStorage.setItem(bestKey, String(best)); } catch (_) { /* Optional persistence. */ }
    }
    updateBest();
    $('#finish-title').textContent = newRecord && stats.wpm > 0 ? 'A new personal record.' : 'Well practised.';
    $('#finish-message').textContent = newRecord && stats.wpm > 0
      ? `Your best is now ${stats.wpm} WPM, with ${stats.accuracy}% accuracy.`
      : `You typed at ${stats.wpm} WPM with ${stats.accuracy}% accuracy.`;
    overlay.hidden = false;
    input.blur();
    overlay.focus({ preventScroll: true });
    saveSettings();
  }
  function updateBest() {
    const key = `keyflow-best-${mode}-${duration}`;
    let best = 0;
    try { best = Number(localStorage.getItem(key) || 0); } catch (_) { best = 0; }
    $('#best-value').textContent = best > 0 ? String(best) : '—';
    $('#best-duration-label').textContent = `/ ${duration} SEC`;
  }
  function resetTest({ focus = false, notify = false } = {}) {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    running = false;
    finished = false;
    startTime = null;
    typedText = '';
    totalKeypresses = 0;
    correctKeypresses = 0;
    mistakes = 0;
    targetText = makePrompt();
    input.maxLength = targetText.length;
    input.value = '';
    overlay.hidden = true;
    $('#test-state').textContent = 'READY WHEN YOU ARE';
    $('#state-indicator').classList.remove('running', 'finished');
    $('#progress-fill').style.width = '0%';
    progressRail.setAttribute('aria-valuenow', '0');
    $('#time-label').textContent = formatTime(duration);
    $('#mode-label').textContent = mode === 'words' ? 'COMMON WORDS' : mode === 'quotes' ? 'THOUGHTFUL PASSAGES' : 'CODE PRACTICE';
    renderPrompt();
    updateStats();
    updateBest();
    if (focus) input.focus({ preventScroll: true });
    if (notify) showToast('A fresh prompt is ready.');
  }
  function setMode(nextMode) {
    if (!['words', 'quotes', 'code'].includes(nextMode)) return;
    if (nextMode !== mode) mode = nextMode;
    $$('.mode-switch .segment').forEach((button) => {
      const selected = button.dataset.mode === mode;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    resetTest();
    saveSettings();
  }
  function setDuration(nextDuration) {
    const value = Number(nextDuration);
    if (!durations.includes(value)) return;
    duration = value;
    $$('.duration-switch .segment').forEach((button) => {
      const selected = Number(button.dataset.duration) === duration;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    resetTest();
    saveSettings();
  }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimeout) window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove('visible'), 2200);
  }

  $$('.mode-switch .segment').forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
  $$('.duration-switch .segment').forEach((button) => button.addEventListener('click', () => setDuration(button.dataset.duration)));
  $('#restart-button').addEventListener('click', () => resetTest({ focus: true, notify: true }));
  $('#again-button').addEventListener('click', () => resetTest({ focus: true }));
  typingArea.addEventListener('click', () => { if (!finished) input.focus({ preventScroll: true }); });
  typingArea.addEventListener('keydown', (event) => {
    if (event.target === typingArea && event.key === 'Escape') {
      event.preventDefault();
      resetTest({ focus: true, notify: true });
      return;
    }
    if (event.target === typingArea && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      input.focus({ preventScroll: true });
    }
  });
  input.addEventListener('paste', (event) => {
    event.preventDefault();
    showToast('Pasting is disabled during timed practice.');
  });
  typingArea.addEventListener('dragover', (event) => event.preventDefault());
  typingArea.addEventListener('drop', (event) => {
    event.preventDefault();
    showToast('Dropping text is disabled during timed practice.');
  });
  input.addEventListener('input', () => {
    handleEdit(input.value);
    try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) { /* Some virtual keyboards do not expose selection ranges. */ }
  });
  input.addEventListener('keydown', (event) => {
    if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      try { input.setSelectionRange(input.value.length, input.value.length); } catch (_) { /* Ignore unsupported selection APIs. */ }
    }
  });
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      resetTest({ focus: true, notify: true });
      return;
    }
    if (event.key === 'Enter' && mode !== 'code') {
      event.preventDefault();
      const pos = input.selectionStart;
      const newText = typedText.slice(0, pos) + ' ' + typedText.slice(input.selectionEnd);
      handleEdit(newText);
      input.setSelectionRange(newText.length, newText.length);
    }
  });
  input.addEventListener('beforeinput', (event) => {
    if (event.inputType === 'insertFromPaste' || event.inputType === 'insertFromDrop') {
      event.preventDefault();
    }
    if (event.inputType === 'insertLineBreak' && mode !== 'code') event.preventDefault();
  });
  $('#theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const dark = document.body.classList.contains('dark-theme');
    $('#theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    saveSettings();
    showToast(dark ? 'Dark theme enabled.' : 'Light theme enabled.');
  });

  resetTest();
  $$('.mode-switch .segment').forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $$('.duration-switch .segment').forEach((button) => {
    const selected = Number(button.dataset.duration) === duration;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $('#theme-toggle').setAttribute('aria-label', document.body.classList.contains('dark-theme') ? 'Switch to light theme' : 'Switch to dark theme');
})();
