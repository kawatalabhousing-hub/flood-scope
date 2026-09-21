/* =====================================================================
   しん水スコープ ブラウザ版の共通の画面（index.html と android.html の両方が読む）
   ---------------------------------------------------------------------
   Unity 版と同じ流れ：ロゴ → 説明 → 見かたをえらぶ → 床の設定 → 体験 →「終わる」で説明へ戻る
     Water  … WaterController（水位・にごり・不透明・床補正。表示上の水位はなめらかに追う）
     Intro  … IntroUI（ロゴ・説明・見かたをえらぶ）
     Hud    … HudUI（水の深さ・案内・赤い帯・下段ボタン・設定パネル・ゴーグル・水中）
     Gauge  … GaugeUI（右端の縦スケール）
     Sound  … SoundController（雨音。体験中だけ鳴らす）
     キー入力 … RemoteInput
   各ページは FloodUI.start({ ... }) で描画側のフックを渡す。文言と数値は settings.js から取る
   ===================================================================== */
(() => {
  const T = window.APP_TEXT, WS = window.WATER_SETTINGS;
  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  let hooks = {};

  // ================= Water（WaterController） =================
  const listeners = [];
  const Water = {
    levelCm: 0,
    murkMode: 'auto',        // auto（水位に連動）→ clear（真水）→ mud（泥水）
    opaque: false,           // 足もとを完全に隠す
    floorOffsetCm: 0,        // ±1cm の手動補正（±10cm まで）
    shownLevel: 0,           // なめらかに動かす表示上の水位（cm）
    murk: 0,                 // 0=真水 1=泥水（濁りの立ち上がり補正ずみ）
    color: WS.clearColor.slice(),
    get maxLevel() { return WS.maxLevel; },
    get levels() { return WS.levels; },
    onChange(fn) { listeners.push(fn); },
    changed() { listeners.forEach(fn => fn()); },
    setLevel(cm) { this.levelCm = clamp(Math.round(cm), 0, this.maxLevel); this.changed(); },
    nextLevel() { const n = this.levels.find(l => l > this.levelCm); if (n !== undefined) this.setLevel(n); },
    prevLevel() { let p = 0; this.levels.forEach(l => { if (l < this.levelCm) p = l; }); this.setLevel(p); },
    setLevelIndex(i) { if (i >= 0 && i < this.levels.length) this.setLevel(this.levels[i]); },
    setMurkMode(m) { this.murkMode = m; this.changed(); },
    cycleMurk() { this.setMurkMode({ auto: 'clear', clear: 'mud', mud: 'auto' }[this.murkMode]); },
    setOpaque(on) { this.opaque = on; this.changed(); },
    nudgeFloor(cm) { this.floorOffsetCm = clamp(this.floorOffsetCm + cm, -10, 10); this.changed(); },
    // 毎フレーム：表示水位を目標へ近づけ、にごりと色を決める（WaterController.Update と同じ式）
    update(dt) {
      const k = WS.levelLerpSeconds <= 0 ? 1 : dt / WS.levelLerpSeconds;
      const step = Math.max(0.5, WS.maxLevel * k), d = this.levelCm - this.shownLevel;
      this.shownLevel = Math.abs(d) <= step ? this.levelCm : this.shownLevel + Math.sign(d) * step;
      let m = clamp((this.shownLevel - WS.murkFromCm) / (WS.murkToCm - WS.murkFromCm), 0, 1);
      if (this.murkMode === 'clear') m = 0;
      if (this.murkMode === 'mud') m = 1;
      this.murk = Math.pow(m, 0.6);                       // 濁りは早めに立ち上がる（20cm で約7割）
      this.color = [0, 1, 2].map(i => lerp(WS.clearColor[i], WS.mudColor[i], this.murk));
    },
    get reflect() { return lerp(WS.reflectClear, WS.reflectMud, this.murk); },
  };

  // ================= Sound（SoundController） =================
  // ブラウンノイズ＋ときどき雨粒のパチッという音。設定の「音」で ON/OFF、水位で少し大きく
  const Sound = {
    on: true, running: false, ac: null, src: null, gain: null,
    ensure() {
      if (this.ac) return;
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      const ac = this.ac = new AC(), rate = ac.sampleRate, n = Math.floor(rate * 6);
      const buf = ac.createBuffer(1, n, rate), data = buf.getChannelData(0);
      let b = 0, lp = 0;
      for (let i = 0; i < n; i++) {
        const w = Math.random() * 2 - 1;
        b = (b + 0.02 * w) / 1.02;                         // ブラウンノイズ
        lp += (w - lp) * 0.15;                             // ざらつき
        let v = b * 3.5 + lp * 0.12;
        if (Math.random() < 0.0008 * 22050 / rate) v += Math.random() * 0.6;   // 雨粒
        data[i] = clamp(v, -1, 1);
      }
      const fade = Math.floor(rate / 10);                  // ループのつなぎ目をなめらかに
      for (let i = 0; i < fade; i++) { const k = i / fade; data[i] *= k; data[n - 1 - i] *= k; }
      this.src = ac.createBufferSource(); this.src.buffer = buf; this.src.loop = true;
      this.gain = ac.createGain(); this.gain.gain.value = 0;
      this.src.connect(this.gain).connect(ac.destination); this.src.start();
    },
    toggle() { this.on = !this.on; this.apply(); },
    setRunning(r) { this.running = r; this.apply(); },
    apply() {
      const play = this.on && this.running;
      if (play) { this.ensure(); if (this.ac && this.ac.state === 'suspended') this.ac.resume(); }
      else if (this.ac && this.ac.state === 'running') this.ac.suspend();
      if (hooks.onSound) hooks.onSound(play);
    },
    update() {
      if (!this.gain) return;
      this.gain.gain.value = WS.rainVolume * (0.6 + 0.4 * clamp(Water.levelCm / 70, 0, 1));
    },
  };

  // ================= 画面の部品を作る =================
  const ICON_TABLET = '<svg viewBox="0 0 128 128" fill="none" stroke="#fff" aria-hidden="true"><rect x="26" y="12" width="76" height="104" rx="9" stroke-width="6"/><rect x="37" y="23" width="54" height="76" rx="4" stroke-width="4"/></svg>';
  const ICON_GOGGLE = '<svg viewBox="0 0 128 128" fill="none" stroke="#fff" aria-hidden="true"><rect x="8" y="34" width="112" height="60" rx="16" stroke-width="6"/><circle cx="44" cy="64" r="14" stroke-width="5"/><circle cx="84" cy="64" r="14" stroke-width="5"/></svg>';
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

  function build(hudParent) {
    const intro = document.createElement('div');
    intro.id = 'fsIntro'; intro.className = 'fs';
    intro.innerHTML =
      '<div class="page" id="fsLogo"><img id="fsLogoImg" src="logo.png" alt="' + esc(T.logoFallbackText) + '"><b id="fsLogoText" hidden>' + esc(T.logoFallbackText) + '</b></div>' +
      '<div class="page" id="fsInfo" hidden>' +
        '<div class="chip">' + esc(T.titleTop) + '</div>' +
        '<h1 class="main">' + esc(T.titleMain) + '</h1>' +
        '<div class="subt">' + esc(T.titleSub) + '</div>' +
        '<div class="body"><p>' + esc(T.body) + '</p></div>' +
        '<div class="row"><button id="fsStart">' + esc(T.startButton) + '</button><button id="fsQuit">' + esc(T.quitButton) + '</button></div>' +
      '</div>' +
      '<div class="page" id="fsView" hidden>' +
        '<h2>' + esc(T.viewTitle) + '</h2>' +
        '<div class="choices">' +
          '<button id="fsTablet">' + ICON_TABLET + '<b>' + esc(T.viewTablet) + '</b></button>' +
          '<button id="fsGoggle">' + ICON_GOGGLE + '<b>' + esc(T.viewGoggle) + '</b></button>' +
        '</div>' +
        '<p class="err" id="fsErr" hidden></p>' +
      '</div>';
    document.body.appendChild(intro);

    const hud = document.createElement('div');
    hud.id = 'fsHud'; hud.className = 'fs'; hud.hidden = true;
    hud.innerHTML =
      '<div id="fsUnder" hidden></div>' +
      '<canvas id="fsRain"></canvas>' +
      '<div id="fsDepth" hidden></div>' +
      '<div id="fsHint">' + esc(T.tapHint) + '</div>' +
      '<div id="fsBand" hidden>' + esc(T.band) + '</div>' +
      '<div id="fsButtons" hidden><button class="btn" id="fsSettings">' + esc(T.settingsButton) + '</button><button class="btn" id="fsFinish">' + esc(T.finishButton) + '</button></div>' +
      '<div id="fsPanel" hidden>' +
        '<button class="btn" id="fsGoggleBtn"><span id="fsGoggleLabel">' + esc(T.goggleOn) + '</span><small>' + esc(T.goggleNote) + '</small></button>' +
        '<button class="btn" id="fsReset">' + esc(T.resetLevel) + '</button>' +
        '<button class="btn" id="fsSound">' + esc(T.soundOn) + '</button>' +
        '<button class="btn" id="fsFloorUp">' + esc(T.floorUp) + '</button>' +
        '<button class="btn" id="fsFloorDown">' + esc(T.floorDown) + '</button>' +
        '<button class="btn" id="fsReplace">' + esc(T.replace) + '</button>' +
        '<button class="btn" id="fsClose">' + esc(T.close) + '</button>' +
      '</div>' +
      '<div id="fsGauge" hidden aria-label="' + esc(T.gaugeCaption) + '">' +
        '<div class="cap">' + esc(T.gaugeCaption) + '</div>' +
        '<div class="track" id="fsTrack"></div>' +
        '<div class="hit" id="fsHit"></div>' +
      '</div>';
    (hudParent || document.body).appendChild(hud);

    // 目盛り → 塗り → つまみ の順に重ねる（つまみが常に一番手前）
    const track = $('fsTrack');
    WS.levels.forEach(l => {
      const t = document.createElement('div'); t.className = 'tick';
      t.style.bottom = (l / WS.maxLevel * 100) + '%';
      t.innerHTML = '<span>' + l + '</span>';
      track.appendChild(t);
    });
    track.insertAdjacentHTML('beforeend', '<div class="fill" id="fsFill"></div><div class="knob" id="fsKnob">0</div>');

    // logo.png が読めないときは文字で出す
    const img = $('fsLogoImg');
    img.addEventListener('error', () => { img.hidden = true; $('fsLogoText').hidden = false; });
  }

  // 画面の大きさから単位を決める（Unity の CanvasScaler：1080×1920、match 0.5）
  function layout() {
    const w = window.innerWidth, h = window.innerHeight, root = document.documentElement.style;
    root.setProperty('--u', Math.sqrt(w / 1080 * h / 1920) + 'px');
    // 縦スケール：画面の高さ 55% を 800 単位に。右寄り、ただし右端からはみ出さないところまで
    const g = h * 0.55 / 800;
    root.setProperty('--g', g + 'px');
    const gauge = $('fsGauge');
    if (gauge) { gauge.style.left = Math.min(w * 0.88, w - 12 - 120 * g) + 'px'; gauge.style.top = (h * 0.5) + 'px'; }
  }

  // ================= Intro（IntroUI） =================
  let introTimer = 0;
  const Intro = {
    // ページを切り替えて、フェードインさせる
    show(id, fade) {
      ['fsLogo', 'fsInfo', 'fsView'].forEach(p => { const el = $(p); el.hidden = p !== id; el.classList.remove('on', 'fade'); });
      const el = $(id);
      el.style.setProperty('--fade', fade + 's');
      void el.offsetWidth;                              // いったん透明にしてからフェード
      el.classList.add('fade'); el.classList.add('on');
    },
    // 起動時：ロゴをフェードイン → しばらく表示 → フェードアウト → 説明がフェードイン
    run() {
      clearTimeout(introTimer);
      $('fsIntro').hidden = false;
      this.show('fsLogo', T.logoFadeSeconds);
      introTimer = setTimeout(() => {
        $('fsLogo').classList.remove('on');
        introTimer = setTimeout(() => this.showInfoAgain(), T.logoFadeSeconds * 1000);
      }, (T.logoFadeSeconds + T.logoSeconds) * 1000);
    },
    // 説明画面だけをもう一度フェードインさせる（「終わる」から。選んだ見かたはここで捨てる）
    showInfoAgain() {
      clearTimeout(introTimer);
      $('fsIntro').hidden = false;
      $('fsHud').hidden = true;
      this.show('fsInfo', T.infoFadeSeconds);
      $('fsInfo').querySelector('.body').scrollTop = 0;
    },
    // 「はじめる」：見かたをえらぶ画面へ
    onStart() {
      $('fsErr').hidden = true;
      this.show('fsView', T.infoFadeSeconds);
      requestFullscreen();
    },
    // タブレットかゴーグルを選ぶと体験（床の設定）がはじまる
    async startAR(goggle) {
      $('fsErr').hidden = true;
      Sound.setRunning(true);                           // 雨音はここから鳴らす（ボタンを押した瞬間なので音が出せる）
      Hud.reset(); Hud.pendingGoggle = goggle;
      try {
        if (hooks.onEnter) await hooks.onEnter(goggle);
      } catch (e) {
        Sound.setRunning(false);
        const err = $('fsErr'); err.hidden = false;
        err.innerHTML = e && e.html ? e.html : esc(T.arFailed + (e && e.message ? '：' + e.message : ''));
        return;
      }
      $('fsIntro').hidden = true; $('fsHud').hidden = false;
      keepAwake(true);
      Hud.refresh();
    },
    // 説明画面の「アプリをとじる」：ブラウザではタブを閉じてみて、閉じられなければロゴから出し直す
    onQuit() {
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      try { window.close(); } catch (e) {}
      setTimeout(() => { if (!window.closed) this.run(); }, 300);
    },
  };

  function requestFullscreen() {
    if (!hooks.fullscreen) return;
    const el = document.documentElement;
    if (!document.fullscreenElement && el.requestFullscreen) el.requestFullscreen().catch(() => {});
  }
  // 体験中は画面を消さない（Screen.sleepTimeout = NeverSleep）
  let wakeLock = null;
  async function keepAwake(on) {
    try {
      if (on && !wakeLock && navigator.wakeLock) { wakeLock = await navigator.wakeLock.request('screen'); wakeLock.addEventListener('release', () => { wakeLock = null; }); }
      if (!on && wakeLock) { wakeLock.release(); wakeLock = null; }
    } catch (e) { wakeLock = null; }
  }

  // ================= Hud（HudUI） =================
  let pressTimer = 0;
  const Hud = {
    placed: false, goggle: false, pendingGoggle: false, underwater: false,
    reset() { this.placed = false; this.goggle = false; this.pendingGoggle = false; this.underwater = false; $('fsPanel').hidden = true; this.refresh(); },
    // 床タップまでは案内だけ。タップ後にボタン・帯・目盛り・見出しを出す
    refresh() {
      const placed = this.placed;
      // 「ゴーグルで見る」を選んでいたら、床が決まった時点で一度だけゴーグルモードに入る
      if (this.pendingGoggle && placed && !this.goggle) { this.pendingGoggle = false; this.toggleGoggle(); return; }
      $('fsHint').hidden = placed;
      $('fsButtons').hidden = !(placed && !this.goggle);
      $('fsBand').hidden = !placed;
      $('fsGauge').hidden = !placed || !$('fsPanel').hidden;   // 設定パネルを開いている間はスケールを隠す
      $('fsDepth').hidden = !placed;
      if (this.goggle) $('fsPanel').hidden = true;
      this.sync();
    },
    sync() {
      $('fsDepth').textContent = T.depthPrefix + Water.levelCm + T.depthSuffix;
      $('fsSound').textContent = Sound.on ? T.soundOn : T.soundOff;
      $('fsGoggleLabel').textContent = this.goggle ? T.goggleOff : T.goggleOn;
    },
    setPlaced(p) { this.placed = p; this.refresh(); },
    setUnderwater(u) {
      if (u) { const c = Water.color.map(v => Math.round(v * 0.85 * 255)); $('fsUnder').style.background = 'rgba(' + c.join(',') + ',0.96)'; }
      if (u !== this.underwater) { this.underwater = u; $('fsUnder').hidden = !u; }
    },
    // ボタンを全部隠して横向き固定。戻すには画面を 1.5 秒長押し
    toggleGoggle() {
      this.goggle = !this.goggle;
      if (this.goggle) {
        $('fsPanel').hidden = true;
        requestFullscreen();
        if (screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(() => {});
      } else if (screen.orientation && screen.orientation.unlock) { try { screen.orientation.unlock(); } catch (e) {} }
      if (hooks.onGoggle) hooks.onGoggle(this.goggle);
      this.refresh();
    },
    toggleSettings() { $('fsPanel').hidden = !$('fsPanel').hidden; this.refresh(); },
    toggleSound() { Sound.toggle(); this.sync(); },
    replace() { Water.setLevel(0); $('fsPanel').hidden = true; if (hooks.onReplace) hooks.onReplace(); this.setPlaced(false); },
    // 終了：水位0・床を解除・説明画面へ（次の人に交代）
    finish() {
      Water.setLevel(0); Water.setOpaque(false); Water.setMurkMode('auto');
      if (this.goggle) this.toggleGoggle();
      this.pendingGoggle = false;                       // 選んだ見かたはリセット（次の人は選び直す）
      $('fsPanel').hidden = true;
      this.setPlaced(false);
      Sound.setRunning(false);                          // 説明画面に戻るあいだは雨音を止める
      keepAwake(false);
      if (hooks.onFinish) hooks.onFinish();
      Intro.showInfoAgain();
    },
    // 画面の長押し（ゴーグルモード中だけ効く）
    press(down) {
      clearTimeout(pressTimer);
      if (down && this.goggle) pressTimer = setTimeout(() => { if (this.goggle) this.toggleGoggle(); }, 1500);
    },
  };

  // ================= Gauge（GaugeUI） =================
  const Gauge = {
    snapCm: 3,
    sync() {
      const f = clamp(Water.levelCm / Water.maxLevel, 0, 1) * 100;
      $('fsFill').style.height = f + '%';
      $('fsKnob').style.bottom = f + '%';
      $('fsKnob').textContent = Water.levelCm;
    },
    // なぞるとその高さに水位が動く。目盛りの近くは吸いつき、間は1cm刻み
    apply(clientY) {
      const r = $('fsTrack').getBoundingClientRect();
      const f = clamp((r.bottom - clientY) / r.height, 0, 1);
      let cm = Math.round(f * Water.maxLevel);
      const snap = Water.levels.find(l => Math.abs(l - cm) <= this.snapCm);
      if (snap !== undefined) cm = snap;
      Water.setLevel(cm);
    },
    bind() {
      const hit = $('fsHit'); let drag = false;
      hit.addEventListener('pointerdown', e => { drag = true; try { hit.setPointerCapture(e.pointerId); } catch (x) {} this.apply(e.clientY); e.preventDefault(); e.stopPropagation(); });
      hit.addEventListener('pointermove', e => { if (drag) this.apply(e.clientY); });
      const end = () => { drag = false; };
      hit.addEventListener('pointerup', end); hit.addEventListener('pointercancel', end);
    },
  };

  // ================= キー入力（RemoteInput） =================
  // →/PageDown/Space/Enter = 上げる、←/PageUp = 下げる、0/Home = 0cm、1〜6 = 段階、M = にごり切替、O = 足もとを隠す、G = ゴーグル
  function onKey(e) {
    if ($('fsHud').hidden) return;                      // 体験中だけ
    if (e.target && /INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) return;
    const k = e.key; let hit = true;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ' || k === 'Enter') Water.nextLevel();
    else if (k === 'ArrowLeft' || k === 'PageUp') Water.prevLevel();
    else if (k === '0' || k === 'Home') Water.setLevel(0);
    else if (k >= '1' && k <= '6') Water.setLevelIndex(+k - 1);
    else if (k === 'm' || k === 'M') Water.cycleMurk();
    else if (k === 'o' || k === 'O') Water.setOpaque(!Water.opaque);
    else if (k === 'g' || k === 'G') Hud.toggleGoggle();
    else hit = !!(hooks.onKey && hooks.onKey(k));
    if (hit) e.preventDefault();
  }

  // ================= 雨（画面に重ねる細い線） =================
  // 向きは rainAngleDeg（0=真下、+で右上から左下へ）、量は rainRate、濃さは rainAlpha
  function drawRain(c, x0, w, h, t) {
    if (Hud.underwater) return;                         // 水中に入ったら雨は見せない
    const a = WS.rainAngleDeg * Math.PI / 180, sx = -Math.sin(a), sy = Math.cos(a);
    const n = Math.round(WS.rainRate / 400 * 90), speed = h * WS.rainSpeed / 10 * 1.6;
    const len = Math.max(10, h * WS.rainLength * 1.2);
    c.save();
    c.lineWidth = Math.max(1, h * WS.rainThickness * 1.5);
    c.strokeStyle = 'rgba(255,255,255,' + WS.rainAlpha + ')';
    c.beginPath();
    for (let i = 0; i < n; i++) {
      const sp = 0.8 + (i % 5) * 0.1;
      const y = ((i * 53.7 + t * speed * sp) % (h + len * 2)) - len;
      const x = x0 + ((((i * 97.3 + y * sx / sy) % w) + w) % w);
      c.moveTo(x, y); c.lineTo(x + sx * len, y + sy * len);
    }
    c.stroke(); c.restore();
  }

  // ================= 毎フレーム（ページの描画ループから呼ぶ） =================
  function tick(dt) {
    Water.update(dt);
    Sound.update();
  }

  // ================= はじめる =================
  window.FloodUI = {
    Water, Hud, Sound, tick, drawRain,
    get placed() { return Hud.placed; },
    get goggle() { return Hud.goggle; },
    get hudRoot() { return $('fsHud'); },
    setPlaced(p) { Hud.setPlaced(p); },
    setUnderwater(u) { Hud.setUnderwater(u); },
    press(down) { Hud.press(down); },
    finish() { Hud.finish(); },
    // opts: hudParent, fullscreen, onEnter(goggle), onFinish(), onReplace(), onGoggle(on), onSound(on), onKey(key)
    start(opts) {
      hooks = opts || {};
      build(hooks.hudParent);
      layout();
      window.addEventListener('resize', layout);
      if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', () => setTimeout(layout, 300));
      $('fsStart').addEventListener('click', () => Intro.onStart());
      $('fsQuit').addEventListener('click', () => Intro.onQuit());
      $('fsTablet').addEventListener('click', () => Intro.startAR(false));
      $('fsGoggle').addEventListener('click', () => Intro.startAR(true));
      $('fsSettings').addEventListener('click', () => Hud.toggleSettings());
      $('fsFinish').addEventListener('click', () => Hud.finish());
      $('fsGoggleBtn').addEventListener('click', () => Hud.toggleGoggle());
      $('fsReset').addEventListener('click', () => Water.setLevel(0));
      $('fsSound').addEventListener('click', () => Hud.toggleSound());
      $('fsFloorUp').addEventListener('click', () => Water.nudgeFloor(1));
      $('fsFloorDown').addEventListener('click', () => Water.nudgeFloor(-1));
      $('fsReplace').addEventListener('click', () => Hud.replace());
      $('fsClose').addEventListener('click', () => Hud.toggleSettings());
      Gauge.bind();
      Water.onChange(() => { Hud.sync(); Gauge.sync(); });
      Gauge.sync(); Hud.sync();
      window.addEventListener('keydown', onKey);
      // ゴーグルモード中の長押し（ボタン類の上は除く）
      window.addEventListener('pointerdown', e => { if (!e.target.closest || !e.target.closest('button,#fsHit')) Hud.press(true); });
      window.addEventListener('pointerup', () => Hud.press(false));
      window.addEventListener('pointercancel', () => Hud.press(false));
      document.addEventListener('visibilitychange', () => { if (!document.hidden && !$('fsHud').hidden) keepAwake(true); });
      Intro.run();
    },
  };
})();
