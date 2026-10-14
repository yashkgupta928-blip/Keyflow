(() => {
  'use strict';

  const WORD_BANK = `the of and a to in is you that it he was for on are as with his they I at be this have from or one had by word but not what all were we when your can said there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look two more write go see number no way could people my than first water been call who oil its now find long down day did get come made may part over new sound take only little work know place years live me back give most very after thing our just name good sentence man think say great where help through much before line right too means old any same tell boy follow came want show also around form three small set put end does another well large must big even such because turn here why ask went men read need land different home move try kind hand picture again change off play spell air away animal house point page letter mother answer found study still learn should world high every near add food between own below country plant last school father keep tree never start city earth eye light thought head under story saw left few while along might close something seem next hard open example begin life always those both paper together got group often run important until children side feet car mile night walk white sea began grow took river four carry state once book hear stop without second late miss idea enough eat face watch far Indian real almost let above girl sometimes mountain cut young talk soon list song being leave family it's body music color stand sun questions fish area mark dog horse birds problem complete room knew since ever piece told usually friends easy heard order red door sure become top ship across today during short better best however low hour black products happen whole measure remember early waves reached listen wind rock space covered fast several hold himself toward five step morning passed vowel true hundred against pattern numerals table north slow money map farm pulled draw voice seen cold cried plan notice south sing war ground fall king town I'll unit figure certain field travel wood fire upon done English road half ten fly gave box finally wait correct oh quickly person became shown minutes strong verb stars front feel fact inches street decided contain course surface produce building ocean class note nothing rest carefully scientists inside wheels stay green known island week less machine base ago stood plane system behind ran round boat game force brought understand warm common bring explain dry though language shape deep thousands yes clear equation yet government filled heat full hot check object am rule among noun power cannot able six size dark ball material special heavy fine pair circle include built can't matter square syllables perhaps bill felt suddenly test direction center farmers ready anything divided general energy subject Europe moon region return believe dance members picked simple cells paint mind love cause rain exercise eggs train blue wish drop developed window difference distance heart sit sum summer wall forest probably legs sat main winter wide written length reason kept interest arms brother race present beautiful store job edge past sign record finished discovered wild happy beside gone sky glass million west lay weather root instruments meet third months paragraph raised represent soft whether clothes flowers shall teacher held describe drive cross speak solve appear metal son either ice sleep village factors results jumped snow ride care floor hill pushed baby buy century outside everything tall already instead phrase soil bed copy free hope spring case laughed nation quite type themselves temperature bright lead everyone method section lake iron within dictionary hair age amount scale pounds although per broken moment tiny possible gold milk quiet natural lot stone act build middle speed count rule company mind cotton oxygen farmer sense stick serve appear properties exact region decimals lake headers student order modern element bottom jumped me`.trim().split(/\s+/);

  const QUOTES = [
    'Progress is rarely loud. It is the quiet decision to return, pay attention, and make one small thing a little better than it was yesterday. Stay curious, be patient with the process, and let consistency do the work.',
    'A good rhythm is not about moving as fast as possible. It is about finding a pace you can trust, keeping your attention on the next step, and making fewer mistakes as the work becomes familiar.',
    'Give yourself room to learn. The first attempt is for understanding, the next is for practice, and every attempt after that is a chance to notice what has changed and keep moving forward.',
    'Focus grows when distractions get smaller. Set a clear goal, begin before you feel completely ready, and give the task your full attention for a little while. Small sessions can create lasting habits.',
    'The best tools are the ones that help you spend less energy getting started and more energy doing the work. Keep your setup simple, your goals realistic, and your practice regular.'
  ];

  const CODE_SNIPPETS = [
    `function calculateAverage(numbers) {\n  if (numbers.length === 0) return 0;\n  const total = numbers.reduce((sum, value) => sum + value, 0);\n  return total / numbers.length;\n}\n\nconsole.log(calculateAverage([4, 8, 12]));`,
    `const createUser = (name, role = 'reader') => ({\n  id: crypto.randomUUID(),\n  name: name.trim(),\n  role,\n  active: true,\n});\n\nconst user = createUser('Alex', 'editor');`,
    `for (let index = 0; index < items.length; index += 1) {\n  const item = items[index];\n  if (item.isReady) {\n    renderItem(item);\n  } else {\n    queueItem(item);\n  }\n}`, 
    `class Timer {\n  constructor(duration) {\n    this.duration = duration;\n    this.remaining = duration;\n  }\n\n  reset() {\n    this.remaining = this.duration;\n  }\n}`
  ];

  const el = (id) => document.getElementById(id);
  const input = el('typing-input');
  const typingArea = el('typing-area');
  const typingText = el('typing-text');
  const overlay = el('finished-overlay');
  const durationOptions = [15, 30, 60, 120];

  let mode = 'words';
  let duration = 30;
  let targetText = '';
  let typedText = '';
  let lastQuoteIndex = -1;
  let lastCodeOrderKey = '';
  let totalKeypresses = 0;
  let correctKeypresses = 0;
  let mistakes = 0;
  let startTime = null;
  let timerId = null;
  let isRunning = false;
  let isFinished = false;
  let lastWpm = 0;
  let toastTimeout = null;

  const STORAGE_KEY = 'keyflow-settings-v1';
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; } catch (_) { saved = {}; }

  if (saved.theme === 'dark') document.body.classList.add('dark-theme');
  if (durationOptions.includes(Number(saved.duration))) duration = Number(saved.duration);
  if (['words', 'quotes', 'code'].includes(saved.mode)) mode = saved.mode;

  function saveSettings() {
    try {
      const current = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {};
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...current, mode, duration, theme: document.body.classList.contains('dark-theme') ? 'dark' : 'light' }));
    } catch (_) { /* The site still works when browser storage is unavailable. */ }
  }

  function getText() {
    if (mode === 'quotes') {
      // Avoid showing the same quote twice in a row, including after a restart
      // or when the user chooses a different test duration.
      let quoteIndex = Math.floor(Math.random() * QUOTES.length);
      if (QUOTES.length > 1 && quoteIndex === lastQuoteIndex) {
        quoteIndex = (quoteIndex + 1 + Math.floor(Math.random() * (QUOTES.length - 1))) % QUOTES.length;
      }
      lastQuoteIndex = quoteIndex;
      const quote = QUOTES[quoteIndex];
      return (quote + ' ' + quote + ' ' + quote).replace(/\s+/g, ' ');
    }
    if (mode === 'code') {
      // Fisher-Yates gives each code-prompt ordering a fair shuffle. If the
      // same ordering comes up twice, rotate it to guarantee a new prompt.
      const snippets = [...CODE_SNIPPETS];
      for (let i = snippets.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [snippets[i], snippets[j]] = [snippets[j], snippets[i]];
      }
      let orderKey = snippets.join('\u0000');
      if (snippets.length > 1 && orderKey === lastCodeOrderKey) {
        snippets.push(snippets.shift());
        orderKey = snippets.join('\u0000');
      }
      lastCodeOrderKey = orderKey;
      return snippets.join('\n\n');
    }
    const words = [];
    let previous = -1;
    const targetLength = 220;
    for (let i = 0; i < targetLength; i += 1) {
      let index = Math.floor(Math.random() * WORD_BANK.length);
      if (WORD_BANK.length > 1 && index === previous) index = (index + 1) % WORD_BANK.length;
      previous = index;
      words.push(WORD_BANK[index]);
    }
    return words.join(' ');
  }

  function renderTarget() {
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < targetText.length; i += 1) {
      const char = document.createElement('span');
      char.className = 'char';
      char.dataset.index = String(i);
      char.textContent = targetText[i];
      fragment.appendChild(char);
    }
    typingText.replaceChildren(fragment);
    updateTextMarks();
  }

  function updateTextMarks() {
    const chars = typingText.children;
    const length = Math.min(typedText.length, chars.length);
    for (let i = 0; i < length; i += 1) {
      const char = chars[i];
      char.classList.toggle('correct', typedText[i] === targetText[i]);
      char.classList.toggle('incorrect', typedText[i] !== targetText[i]);
      char.classList.remove('current');
    }
    for (let i = length; i < chars.length; i += 1) {
      chars[i].classList.remove('correct', 'incorrect', 'current');
    }
    if (length < chars.length) chars[length].classList.add('current');
    // Keep the new target passage visible immediately, even before typing starts.
    typingText.style.display = 'block';
  }

  function getCorrectCurrentChars() {
    let total = 0;
    for (let i = 0; i < typedText.length && i < targetText.length; i += 1) {
      if (typedText[i] === targetText[i]) total += 1;
    }
    return total;
  }

  function elapsedSeconds() {
    if (!startTime) return 0;
    return Math.min(duration, (performance.now() - startTime) / 1000);
  }

  function updateStats() {
    const elapsed = elapsedSeconds();
    const correctChars = getCorrectCurrentChars();
    const minutes = elapsed / 60;
    const wpm = Math.round((correctChars / 5) / Math.max(minutes, 1 / 60));
    const accuracy = totalKeypresses > 0 ? Math.round((correctKeypresses / totalKeypresses) * 100) : 100;
    el('wpm-value').textContent = String(wpm);
    el('accuracy-value').textContent = String(Math.max(0, Math.min(100, accuracy)));
    el('characters-value').textContent = String(correctChars);
    el('mistakes-value').textContent = String(mistakes);
    el('time-label').textContent = formatTime(Math.max(0, duration - elapsed));
    el('progress-fill').style.width = `${Math.min(100, (elapsed / duration) * 100)}%`;
    lastWpm = wpm;
    return { wpm, accuracy, correctChars, elapsed };
  }

  function formatTime(value) {
    const seconds = Math.max(0, Math.ceil(value));
    const minutesPart = Math.floor(seconds / 60);
    const secondsPart = seconds % 60;
    return `${String(minutesPart).padStart(2, '0')}:${String(secondsPart).padStart(2, '0')}`;
  }

  function startTimer() {
    if (isRunning || isFinished) return;
    isRunning = true;
    startTime = performance.now();
    el('test-state').textContent = 'SESSION IN PROGRESS';
    el('live-dot').classList.add('running');
    el('live-dot').classList.remove('finished');
    typingText.style.display = 'block';
    timerId = window.setInterval(() => {
      const stats = updateStats();
      if (stats.elapsed >= duration) finishTest();
    }, 100);
  }

  function addCharacter(character) {
    if (isFinished) return;
    startTimer();
    if (typedText.length >= targetText.length) {
      finishTest();
      return;
    }
    const expected = targetText[typedText.length];
    typedText += character;
    totalKeypresses += 1;
    if (character === expected) correctKeypresses += 1;
    else mistakes += 1;
    updateTextMarks();
    updateStats();
    if (typedText.length >= targetText.length) finishTest();
  }

  function eraseCharacter() {
    if (isFinished || typedText.length === 0) return;
    startTimer();
    typedText = typedText.slice(0, -1);
    updateTextMarks();
    updateStats();
  }

  function finishTest() {
    if (isFinished) return;
    isFinished = true;
    isRunning = false;
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    const stats = updateStats();
    const finalWpm = Math.max(0, stats.wpm);
    el('test-state').textContent = 'SESSION COMPLETE';
    el('live-dot').classList.remove('running');
    el('live-dot').classList.add('finished');
    el('progress-fill').style.width = '100%';
    el('time-label').textContent = '00:00';
    overlay.hidden = false;
    input.blur();
    const bestKey = `keyflow-best-${mode}-${duration}`;
    let best = 0;
    try { best = Number(localStorage.getItem(bestKey) || 0); } catch (_) { best = 0; }
    const isNewBest = finalWpm > best;
    if (isNewBest) {
      best = finalWpm;
      try { localStorage.setItem(bestKey, String(best)); } catch (_) { /* Ignore disabled storage. */ }
    }
    updateBest();
    el('finish-message').textContent = isNewBest && finalWpm > 0
      ? `New personal best: ${finalWpm} WPM at ${stats.accuracy}% accuracy.`
      : `You typed at ${finalWpm} WPM with ${stats.accuracy}% accuracy. ${stats.correctChars} correct characters.`;
    el('again-button').focus({ preventScroll: true });
    saveSettings();
  }

  function updateBest() {
    const bestKey = `keyflow-best-${mode}-${duration}`;
    let best = 0;
    try { best = Number(localStorage.getItem(bestKey) || 0); } catch (_) { best = 0; }
    el('best-value').textContent = best > 0 ? String(best) : '—';
    el('best-duration-label').textContent = `· ${duration} SECONDS`;
  }

  function resetTest({ focus = false } = {}) {
    if (timerId) window.clearInterval(timerId);
    timerId = null;
    isRunning = false;
    isFinished = false;
    startTime = null;
    typedText = '';
    totalKeypresses = 0;
    correctKeypresses = 0;
    mistakes = 0;
    lastWpm = 0;
    let previousPrompt = targetText;
    // Remember the previous prompt per practice mode, so a revisit to the site
    // does not repeat the same saved quote or code ordering immediately.
    try {
      previousPrompt = localStorage.getItem(`keyflow-last-prompt-${mode}`) || previousPrompt;
    } catch (_) { /* The session still works when browser storage is unavailable. */ }
    let nextPrompt = getText();
    // Guard against the extremely unlikely chance that a random word prompt
    // repeats verbatim. Every reset should put a fresh prompt on screen.
    let retries = 0;
    while (nextPrompt === previousPrompt && retries < 12) {
      nextPrompt = getText();
      retries += 1;
    }
    if (nextPrompt === previousPrompt && mode === 'words') {
      const words = nextPrompt.split(' ');
      const firstIndex = WORD_BANK.indexOf(words[0]);
      words[0] = WORD_BANK[(Math.max(0, firstIndex) + 1) % WORD_BANK.length];
      nextPrompt = words.join(' ');
    }
    targetText = nextPrompt;
    try { localStorage.setItem(`keyflow-last-prompt-${mode}`, targetText); } catch (_) { /* Ignore disabled storage. */ }
    input.value = '';
    overlay.hidden = true;
    el('test-state').textContent = 'READY WHEN YOU ARE';
    el('live-dot').classList.remove('running', 'finished');
    el('progress-fill').style.width = '0%';
    el('time-label').textContent = formatTime(duration);
    el('mode-label').textContent = mode === 'words' ? 'COMMON WORDS' : mode === 'quotes' ? 'ORIGINAL QUOTES' : 'CODE SNIPPETS';
    renderTarget();
    updateStats();
    updateBest();
    if (focus) input.focus({ preventScroll: true });
  }

  function setMode(nextMode) {
    if (!['words', 'quotes', 'code'].includes(nextMode) || nextMode === mode) return;
    mode = nextMode;
    document.querySelectorAll('.mode-button').forEach((button) => {
      const selected = button.dataset.mode === mode;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    resetTest();
    saveSettings();
  }

  function setDuration(nextDuration) {
    const value = Number(nextDuration);
    if (!durationOptions.includes(value)) return;
    // Clicking the already-selected duration also starts a fresh test.
    if (value === duration) {
      resetTest();
      return;
    }
    duration = value;
    document.querySelectorAll('.duration-button').forEach((button) => {
      const selected = Number(button.dataset.duration) === duration;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    resetTest();
    saveSettings();
  }

  function showToast(message) {
    const toast = el('toast');
    toast.textContent = message;
    toast.classList.add('visible');
    if (toastTimeout) window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove('visible'), 2200);
  }

  document.querySelectorAll('.mode-button').forEach((button) => {
    button.addEventListener('click', () => setMode(button.dataset.mode));
  });
  document.querySelectorAll('.duration-button').forEach((button) => {
    button.addEventListener('click', () => setDuration(button.dataset.duration));
  });

  el('restart-button').addEventListener('click', () => {
    resetTest({ focus: true });
    showToast('Fresh test ready. Your timer starts when you type.');
  });
  el('again-button').addEventListener('click', () => resetTest({ focus: true }));
  typingArea.addEventListener('click', () => {
    if (isFinished) return;
    input.focus({ preventScroll: true });
  });
  typingArea.addEventListener('keydown', (event) => {
    if (event.target === typingArea && (event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      input.focus({ preventScroll: true });
    }
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      resetTest({ focus: true });
      showToast('Test restarted.');
      return;
    }
    if (event.key === 'Backspace') {
      event.preventDefault();
      eraseCharacter();
      return;
    }
    if (event.key === 'Enter' && mode !== 'code') {
      event.preventDefault();
      addCharacter(' ');
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      addCharacter(event.key);
    }
  });

  // beforeinput also supports mobile and virtual keyboards that do not emit ordinary keydown events.
  input.addEventListener('beforeinput', (event) => {
    if (event.inputType === 'insertText' && event.data) {
      event.preventDefault();
      for (const character of event.data) addCharacter(character);
    } else if (event.inputType === 'deleteContentBackward') {
      event.preventDefault();
      eraseCharacter();
    } else if (event.inputType === 'insertLineBreak' || event.inputType === 'insertParagraph') {
      event.preventDefault();
      addCharacter(mode === 'code' ? '\n' : ' ');
    }
  });

  el('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    saveSettings();
    const dark = document.body.classList.contains('dark-theme');
    el('theme-toggle').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    showToast(dark ? 'Dark theme enabled.' : 'Light theme enabled.');
  });

  // Restore saved selectors visually after event handlers are registered.
  document.querySelectorAll('.mode-button').forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  document.querySelectorAll('.duration-button').forEach((button) => {
    const selected = Number(button.dataset.duration) === duration;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  el('theme-toggle').setAttribute('aria-label', document.body.classList.contains('dark-theme') ? 'Switch to light theme' : 'Switch to dark theme');
  resetTest();
})();
