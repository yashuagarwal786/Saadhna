(() => {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const english = () => (localStorage.getItem('pp-lang') || 'hi') === 'en';
  const t = (hi, en) => english() ? en : hi;
  const text = (hi, en) => escape(t(hi, en));
  const sourceUrls = {
    'tele-manas': 'https://dghs.mohfw.gov.in/national-mental-health-programme.php',
    'emergency-112': 'https://112.gov.in/',
    'women-181': 'https://wcd.gov.in/women/help'
  };
  let activeConcern = null;
  let breathInterval = null;
  let breath = null;
  let chantCount = 0;
  let selectedBreathId = null;
  let selectedBreathCycles = null;
  let noHoldBreathing = false;

  function concernCard(data, concern) {
    const selected = activeConcern?.id === concern.id;
    return `<button type="button" class="shanti-concern${selected ? ' selected' : ''}" data-concern="${escape(concern.id)}" aria-pressed="${selected}">
      <span class="shanti-concern-mark" aria-hidden="true">${concern.id === 'exam' ? '✦' : concern.id === 'wellbeing' ? '♡' : '❋'}</span>
      <span><b>${text(concern.label_hi, concern.label_en)}</b><small>${text(concern.tagline_hi, concern.tagline_en)}</small></span><span class="shanti-arrow" aria-hidden="true">→</span>
    </button>`;
  }

  function breathingMarkup(data, concern) {
    const exercise = data.breathing.find(item => item.id === (selectedBreathId || concern.breathing_id)) || data.breathing[0];
    return `<article class="content-panel shanti-breath-card">
      <div class="shanti-section-title"><div><span class="eyebrow">${text('एक छोटा विराम', 'A small pause')}</span><h2>${text(exercise.label_hi, exercise.label_en)}</h2></div>
        <label class="shanti-select-label">${text('अभ्यास', 'Practice')}<select id="breath-choice">${data.breathing.map(item => `<option value="${escape(item.id)}" ${item.id === exercise.id ? 'selected' : ''}>${text(item.label_hi, item.label_en)}</option>`).join('')}</select></label>
      </div>
      <p class="shanti-soft">${text('साँस को सहज रखें। असुविधा हो तो रुकें या अपनी स्वाभाविक साँस पर लौटें।', 'Keep your breath comfortable. If this feels uncomfortable, stop or return to your natural breathing.')}</p>
      ${exercise.hold_sec ? `<label class="shanti-nohold"><input id="breath-nohold" type="checkbox" ${noHoldBreathing ? 'checked' : ''}> ${text('बिना रोक के करें', 'Practice without holds')}</label>` : ''}
      <div class="breath-practice"><div class="breath-orb" id="breath-orb"><span id="breath-phase" aria-live="polite">${text('तैयार?', 'Ready?')}</span><b id="breath-count">${exercise.inhale_sec}</b></div>
        <div class="breath-controls"><p id="breath-instruction">${text('जब तैयार हों, शुरू करें।', 'Start when you feel ready.')}</p><div class="shanti-actions"><button class="button" type="button" id="breath-start">${text('शुरू करें', 'Start')}</button><button class="small-btn" type="button" id="breath-stop" disabled>${text('फिर से', 'Reset')}</button></div>
        <small>${text('चक्र', 'Cycles')}: <select id="breath-cycles" aria-label="${text('चक्रों की संख्या', 'Number of cycles')}">${[3, 5, 6, 10].map(n => `<option value="${n}" ${n === (selectedBreathCycles || exercise.default_cycles) ? 'selected' : ''}>${n}</option>`).join('')}</select></small></div></div>
      <p class="shanti-note">${text(exercise.note, exercise.note)}</p>
    </article>`;
  }

  function mantraMarkup(data, concern) {
    const available = concern.mantra_ids.map(id => data.mantras.find(m => m.id === id)).filter(Boolean);
    const first = available[0];
    const count = first.counts[0];
    return `<article class="content-panel shanti-mantra-card"><div class="shanti-section-title"><div><span class="eyebrow">${text('यदि अच्छा लगे', 'If it feels right')}</span><h2>${text('मंत्र या प्रार्थना', 'Mantra or prayer')}</h2></div>
      <label class="shanti-select-label">${text('चुनें', 'Choose')}<select id="mantra-choice">${available.map(item => `<option value="${escape(item.id)}">${text(item.deity, item.deity)}</option>`).join('')}</select></label></div>
      <div id="mantra-content">${mantraContent(first, count)}</div></article>`;
  }

  function mantraContent(mantra, goal) {
    const count = mantra.counts.includes(Number(goal)) ? Number(goal) : mantra.counts[0];
    return `<div class="mantra-text" lang="${/[^\x00-\x7F]/.test(mantra.text_dev) ? 'hi' : 'en'}">${escape(mantra.text_dev)}</div><p class="mantra-roman">${escape(mantra.text_roman)}</p>
      <p class="shanti-soft">${text(mantra.meaning_hi, mantra.meaning_en)}</p><div class="shanti-mantra-controls"><label class="shanti-select-label">${text('दोहराव', 'Repeats')}<select id="mantra-goal">${mantra.counts.map(n => `<option value="${n}" ${n === count ? 'selected' : ''}>${n}</option>`).join('')}</select></label><div><span id="mantra-progress" role="status" aria-live="polite">${chantCount} / ${count}</span><div class="shanti-progress"><span id="mantra-progress-bar" style="width:${Math.min(100, chantCount / count * 100)}%"></span></div></div><button class="button button-light" id="mantra-next" type="button">${text('एक बार गिनें', 'Count one')}</button></div>`;
  }

  function selectedMarkup(data) {
    const concern = activeConcern;
    if (!concern) return `<div class="content-panel shanti-prompt"><p>${text('यहाँ से शुरू करना चाहें तो कोई विषय चुनें। आप चाहें तो बिना चुने भी नीचे साँस का अभ्यास कर सकते हैं।', 'Choose a topic if you would like a starting point. You can also try the breathing exercise below without choosing one.')}</p></div>`;
    const grounding = english() ? concern.grounding_en : concern.grounding_hi;
    const puja = concern.mini_puja;
    const reflection = data.mantras.find(item => item.id === concern.reflection_id);
    return `${concern.safety_banner_hi ? `<div class="shanti-safety" role="note"><b>${text('पहले सुरक्षा', 'Safety comes first')}</b><p>${text(concern.safety_banner_hi, concern.safety_banner_en)}</p><a class="button button-danger" href="tel:112">${text('112 पर कॉल करें', 'Call 112')}</a></div>` : ''}
      ${breathingMarkup(data, concern)}${mantraMarkup(data, concern)}
      <article class="content-panel"><span class="eyebrow">${text('एक छोटा अगला कदम', 'One small next step')}</span><h2>${text('अभी क्या मदद कर सकता है', 'What may help right now')}</h2><ul class="shanti-list">${grounding.map(item => `<li>${escape(item)}</li>`).join('')}</ul>
        ${puja ? `<details class="shanti-prayer"><summary>${text(puja.title_hi, puja.title_en)}</summary><p class="shanti-soft">${(english() ? puja.items_en : puja.items_hi).map(escape).join(' · ')}</p><ol>${(english() ? puja.steps_en : puja.steps_hi).map(item => `<li>${escape(item)}</li>`).join('')}</ol></details>` : ''}
        ${concern.practical_note_hi ? `<p class="shanti-note">${text(concern.practical_note_hi, concern.practical_note_en)}</p>` : ''}
        ${reflection ? `<details class="shanti-prayer"><summary>${text('एक विचार', 'A reflection')}</summary><p class="mantra-text">${escape(reflection.text_dev)}</p><p>${text(reflection.meaning_hi, reflection.meaning_en)}</p></details>` : ''}
      </article>`;
  }

  function bindBreathing(data) {
    const choice = document.querySelector('#breath-choice');
    choice?.addEventListener('change', () => {
      selectedBreathId = choice.value;
      noHoldBreathing = false;
      selectedBreathCycles = null;
      stopBreathing();
      const host = document.querySelector('#shanti-selected');
      if (host) { host.innerHTML = selectedMarkup(data); bindSelected(data); }
    });
    document.querySelector('#breath-nohold')?.addEventListener('change', event => {
      noHoldBreathing = event.currentTarget.checked;
      stopBreathing();
      const host = document.querySelector('#shanti-selected');
      if (host) { host.innerHTML = selectedMarkup(data); bindSelected(data); }
    });
    document.querySelector('#breath-start')?.addEventListener('click', startOrPauseBreathing);
    document.querySelector('#breath-stop')?.addEventListener('click', () => { stopBreathing(); resetBreathing(data); });
    document.querySelector('#breath-cycles')?.addEventListener('change', event => { selectedBreathCycles = Number(event.currentTarget.value); });
  }

  function stopBreathing() {
    if (breathInterval) clearInterval(breathInterval);
    breathInterval = null;
    breath = null;
  }

  function resetBreathing(data) {
    const exercise = data.breathing.find(item => item.id === document.querySelector('#breath-choice')?.value) || data.breathing[0];
    const phase = document.querySelector('#breath-phase');
    const counter = document.querySelector('#breath-count');
    const instruction = document.querySelector('#breath-instruction');
    const orb = document.querySelector('#breath-orb');
    if (phase) phase.textContent = t('तैयार?', 'Ready?');
    if (counter) counter.textContent = exercise.inhale_sec;
    if (instruction) instruction.textContent = t('जब तैयार हों, शुरू करें।', 'Start when you feel ready.');
    if (orb) orb.className = 'breath-orb';
    const start = document.querySelector('#breath-start');
    if (start) { start.disabled = false; start.textContent = t('शुरू करें', 'Start'); }
    const stop = document.querySelector('#breath-stop');
    if (stop) stop.disabled = true;
  }

  function startOrPauseBreathing() {
    if (breathInterval) {
      clearInterval(breathInterval); breathInterval = null;
      document.querySelector('#breath-start').textContent = t('जारी रखें', 'Resume');
      return;
    }
    if (breath) {
      document.querySelector('#breath-start').textContent = t('रोकें', 'Pause');
      breathInterval = setInterval(runBreathTick, 1000);
      return;
    }
    const data = window.__calmSupport;
    const exercise = data.breathing.find(item => item.id === document.querySelector('#breath-choice')?.value) || data.breathing[0];
    const noHold = Boolean(document.querySelector('#breath-nohold')?.checked);
    const cues = english() ? exercise.cue_en : exercise.cue_hi;
    const phases = [{ name: 'inhale', seconds: exercise.inhale_sec, cue: cues[0] }];
    if (exercise.hold_sec && !noHold) phases.push({ name: 'hold', seconds: exercise.hold_sec, cue: cues[1] });
    phases.push({ name: 'exhale', seconds: exercise.exhale_sec, cue: cues[exercise.hold_sec && !noHold ? 2 : 1] });
    if (exercise.hold_after_sec && !noHold) phases.push({ name: 'hold', seconds: exercise.hold_after_sec, cue: cues[3] });
    breath = { phases, phase: 0, left: phases[0].seconds, cycles: Number(document.querySelector('#breath-cycles').value), done: 0 };
    document.querySelector('#breath-start').textContent = t('रोकें', 'Pause');
    document.querySelector('#breath-stop').disabled = false;
    renderBreathPhase();
    breathInterval = setInterval(runBreathTick, 1000);
  }

  function renderBreathPhase() {
    if (!breath) return;
    const item = breath.phases[breath.phase];
    const phaseLabel = item.name === 'inhale' ? t('साँस अंदर', 'Breathe in') : item.name === 'exhale' ? t('साँस बाहर', 'Breathe out') : t('ठहरें', 'Pause');
    document.querySelector('#breath-phase').textContent = phaseLabel;
    document.querySelector('#breath-count').textContent = breath.left;
    document.querySelector('#breath-instruction').textContent = item.cue;
    const orb = document.querySelector('#breath-orb');
    orb.className = `breath-orb ${item.name}`;
    orb.style.setProperty('--phase-duration', `${item.seconds}s`);
  }

  function runBreathTick() {
    if (!breath) return;
    breath.left -= 1;
    if (breath.left <= 0) {
      breath.phase += 1;
      if (breath.phase >= breath.phases.length) {
        breath.phase = 0; breath.done += 1;
        if (breath.done >= breath.cycles) {
          stopBreathing();
          document.querySelector('#breath-phase').textContent = t('अभ्यास पूरा', 'Practice complete');
          document.querySelector('#breath-count').textContent = '✓';
          document.querySelector('#breath-instruction').textContent = t('अब अपनी सहज साँस पर लौटें।', 'Return to your natural breathing.');
          document.querySelector('#breath-orb').className = 'breath-orb complete';
          document.querySelector('#breath-start').disabled = true;
          document.querySelector('#breath-stop').disabled = false;
          return;
        }
      }
      breath.left = breath.phases[breath.phase].seconds;
      renderBreathPhase();
    } else document.querySelector('#breath-count').textContent = breath.left;
  }

  function bindMantra(data) {
    const choice = document.querySelector('#mantra-choice');
    const update = () => {
      const concern = activeConcern;
      const available = concern.mantra_ids.map(id => data.mantras.find(item => item.id === id)).filter(Boolean);
      const mantra = available.find(item => item.id === choice.value) || available[0];
      chantCount = 0;
      document.querySelector('#mantra-content').innerHTML = mantraContent(mantra, mantra.counts[0]);
      bindMantraContent();
    };
    choice?.addEventListener('change', update);
    bindMantraContent();
  }

  function bindMantraContent() {
    const goal = document.querySelector('#mantra-goal');
    goal?.addEventListener('change', () => {
      chantCount = 0;
      const content = document.querySelector('#mantra-content');
      const data = window.__calmSupport;
      const mantra = data.mantras.find(item => item.id === document.querySelector('#mantra-choice').value);
      content.innerHTML = mantraContent(mantra, Number(goal.value));
      bindMantraContent();
    });
    document.querySelector('#mantra-next')?.addEventListener('click', () => {
      const target = Number(document.querySelector('#mantra-goal').value);
      chantCount = Math.min(target, chantCount + 1);
      document.querySelector('#mantra-progress').textContent = `${chantCount} / ${target}`;
      document.querySelector('#mantra-progress-bar').style.width = `${chantCount / target * 100}%`;
      if (chantCount === target) document.querySelector('#mantra-next').textContent = t('पूरा हुआ', 'Complete');
    });
  }

  function bindSelected(data) {
    bindBreathing(data);
    if (activeConcern) bindMantra(data);
  }

  function renderSupport(data) {
    const host = document.querySelector('#shanti-selected');
    if (!host) return;
    stopBreathing();
    host.innerHTML = selectedMarkup(data);
    bindSelected(data);
    document.querySelectorAll('[data-concern]').forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = '1';
      button.addEventListener('click', () => {
      activeConcern = data.concerns.find(item => item.id === button.dataset.concern);
      chantCount = 0;
      selectedBreathId = null;
      selectedBreathCycles = null;
      noHoldBreathing = false;
      document.querySelectorAll('[data-concern]').forEach(card => {
        const chosen = card.dataset.concern === activeConcern.id;
        card.classList.toggle('selected', chosen);
        card.setAttribute('aria-pressed', String(chosen));
      });
      renderSupport(data);
      });
    });
  }

  window.shantiPage = data => {
    window.__calmSupport = data;
    if (!activeConcern) activeConcern = data.concerns[0];
    const helplines = data.helplines.map(item => `<article class="shanti-helpline"><div><b>${text(item.name_hi, item.name_en)}</b><p>${text(item.covers_hi, item.covers_en)}</p><a href="${sourceUrls[item.id]}" target="_blank" rel="noopener noreferrer">${text('स्रोत देखें', 'Official source')} ↗</a>${item.alt_number ? `<a class="shanti-alt-phone" href="tel:${escape(item.alt_number.replaceAll('-', ''))}">${text('वैकल्पिक नंबर', 'Alternate number')}: ${escape(item.alt_number)}</a>` : ''}</div><a class="button button-light" href="tel:${escape(item.number)}">${escape(item.number)}<small>${text('कॉल करें', 'Call')}</small></a></article>`).join('');
    return `<div class="container shanti-page"><header class="shanti-hero"><span class="eyebrow">${text('एक शांत पल', 'A calm moment')}</span><h1>${text(data.meta.working_title_hi, data.meta.working_title_en)}</h1><p>${text('जब मन भारी हो, यहाँ कुछ छोटे सहारे हैं। अपनी गति से चुनें।', 'When things feel heavy, find a few gentle supports here. Choose what feels right for you.')}</p></header>
      <div class="shanti-disclaimer" role="note">${text(data.meta.disclaimer_hi, data.meta.disclaimer_en)}</div>
      <section class="shanti-concerns" aria-labelledby="shanti-choose"><div class="shanti-section-title"><div><span class="eyebrow">${text('कहाँ से शुरू करें?', 'Where would you like to start?')}</span><h2 id="shanti-choose">${text('जो बात आपके करीब लगे, उसे चुनें।', 'Choose what feels closest to what you are going through.')}</h2></div></div><div class="shanti-concern-grid">${data.concerns.map(item => concernCard(data, item)).join('')}</div></section>
      <div id="shanti-selected"></div>
      <section class="content-panel shanti-checkin"><span class="eyebrow">${text('अंत में', 'Before you go')}</span><h2>${text('अभी कैसा लग रहा है?', 'How are you feeling now?')}</h2><div class="shanti-checkin-options">${data.closing.checkin_options_hi.map((label, index) => `<button type="button" data-checkin="${index}">${escape(english() ? data.closing.checkin_options_en[index] : label)}</button>`).join('')}</div><p id="checkin-message" aria-live="polite"></p></section>
      <section class="shanti-helplines"><div class="shanti-section-title"><div><span class="eyebrow">${text('किसी से बात करना भी ठीक है', 'Talking to someone can help too')}</span><h2>${text('सहायता के लिए कॉल करें', 'Call for support')}</h2><p class="shanti-soft">${text('अगर तुरंत खतरा हो, 112 पर कॉल करें।', 'If there is immediate danger, call 112.')}</p></div></div><div class="shanti-helpline-list">${helplines}</div></section>
      <p class="shanti-bottom-note">${text('आप चाहें तो इस पेज को बंद कर सकते हैं। यहाँ दी गई साँस और प्रार्थना के अभ्यास वैकल्पिक हैं।', 'You can leave this page at any time. The breathing and prayer practices here are optional.')}</p>
    </div>`;
  };

  window.bindShanti = data => {
    window.__calmSupport = data;
    renderSupport(data);
    document.querySelectorAll('[data-checkin]').forEach(button => button.addEventListener('click', () => {
      document.querySelectorAll('[data-checkin]').forEach(item => item.classList.toggle('selected', item === button));
      const message = document.querySelector('#checkin-message');
      const index = Number(button.dataset.checkin);
      message.textContent = index === 2 ? t(data.closing.if_still_heavy_hi, data.closing.if_still_heavy_en) : index === 0 ? t('अच्छा है कि आपने अपने लिए थोड़ा समय लिया।', 'It is good that you took a little time for yourself.') : t('धन्यवाद, आपने जैसा महसूस किया उसे पहचाना।', 'Thank you for noticing how you feel.') ;
    }));
  };
})();
