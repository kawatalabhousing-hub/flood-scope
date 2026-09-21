/* =====================================================================
   しん水スコープ ブラウザ版の設定（index.html と android.html の両方が読む）
   ---------------------------------------------------------------------
   Unity 版（../FloodScope）の2つのファイルの写し。Unity 側を変えたら、ここも同じ値にする。
     APP_TEXT       … Assets/FloodScope/AppText.asset（画面の文言・ロゴの秒数）
     WATER_SETTINGS … Assets/FloodScope/WaterSettings.asset（水位の段階・にごり・色・雨・音）
   文字コードは UTF-8 のまま保存する。
   ===================================================================== */

// 画面の文言と時間（AppText）
window.APP_TEXT = {
  // 1. ロゴ画面
  logoFallbackText: '大分大学',      // logo.png が読めないときに出す文字
  logoSeconds: 7,                    // フェードインし終わってから表示しておく秒数
  logoFadeSeconds: 0.8,              // ロゴのフェードイン／フェードアウトの秒数
  infoFadeSeconds: 0.5,              // 説明画面のフェードインの秒数

  // 2. 説明画面：見出しは3行に分けて大きさを変える
  titleTop: 'AR体験',                               // 小さめ
  titleMain: 'しん水スコープ',                       // いちばん大きい
  titleSub: '～まちの「もしも」にそなえよう！～',     // 小さめ
  body:
    '強い雨がたくさんふると、道路のわきの側溝や地面の下の下水道、まちの中を流れる水路が水でいっぱいになり、流しきれなくなります。川から離れた場所でも起こります。\n\n' +
    'あふれた水は道路に流れ出し、あっという間に足もとまで広がります。これを「内水氾濫（ないすいはんらん）」といいます。\n\n' +
    'このアプリでは、足もとに水がたまっていくようすをARで体験します。水が深くなるほどにごって、足もとが見えなくなります。\n\n' +
    '・通路には、側溝や水路、落ちている物のかわりに、いくつか障害物を置いています\n' +
    '・水がにごると障害物は見えなくなります。かさやぼうで足もとをさぐりながら歩いてみよう\n' +
    '・むりをせず、あぶないと思ったらすぐ止まろう\n\n' +
    '※ 小さいお子さんは、大人が横について体験してください。ゴーグルをつけて、かさで探りながら歩く体験は、10歳くらいからがおすすめです。その場合も、大人が横について声をかけながら歩いてください。',
  startButton: 'はじめる',
  quitButton: 'アプリをとじる',      // 説明画面：アプリを閉じる（下段の「終わる」と区別する）

  // 3. 見かたをえらぶ画面
  viewTitle: '見かたをえらぶ',
  viewTablet: 'タブレットで見る',
  viewGoggle: 'ゴーグルで見る',

  // 4. カメラ画面の案内
  tapHint: '足もとの床を タップして 通路の入口を決める',
  band: 'かさや ぼうで 足もとを さぐりながら 歩こう',
  gaugeCaption: '水位',              // 右の縦スケールの見出し（スケールの上に出る）
  finishButton: '終わる',            // 下段：水位を戻して説明画面へ（次の人に交代）

  // ---- ここから下は Unity 版ではコード（HudUI.cs / FloodScopeSetup.cs）に書かれている文言 ----
  depthPrefix: '水の深さ ',          // 見出し「水の深さ ◯cm」
  depthSuffix: 'cm',
  settingsButton: '設定',
  goggleOn: 'ゴーグルで見る（戻すには画面を長押し）',
  goggleOff: 'ボタンを出す',
  resetLevel: '水位を 0cm に戻す',
  soundOn: '音：ON',
  soundOff: '音：OFF',
  floorUp: '床 +1cm（水を上げる）',
  floorDown: '床 −1cm（水を下げる）',
  replace: '置き直す（床をタップし直す）',
  close: '閉じる',

  // ---- ブラウザ版だけの文言（Unity 版には無い場面） ----
  noAR: 'この端末では Android版（WebXR）が使えません。共通版で体験してください。',
  noARLink: '共通版をひらく',
  arFailed: 'ARを開始できませんでした',
  cantClose: 'このタブを閉じてください',
};

// 会場で触る数値（WaterSettings）。色は 0〜1 の RGB
window.WATER_SETTINGS = {
  // 水位の段階（cm）
  levels: [0, 10, 20, 30, 50, 70],
  maxLevel: 70,

  // にごり：この水位から始まり、この水位で完全な泥水
  murkFromCm: 5,
  murkToCm: 30,

  // 真水（明るいベージュ）と泥水（あたたかい茶色）
  clearColor: [0.86, 0.80, 0.68],
  mudColor: [0.47, 0.36, 0.25],
  clearOpacity: 0.65,   // 真水の色の乗せ具合
  mudOpacity: 0.97,     // 泥水が足もとをどれだけ隠すか（1=完全に隠す、下げると透ける）

  // 映り込み・屈折・泡（真水と泥水それぞれ）
  reflectClear: 0.6,
  reflectMud: 0.25,
  refract: 0.02,
  foamMud: 0.5,
  flowSpeed: 0.4,

  // 波
  waveStrength: 0.4,
  waveSpeed: 0.5,

  // 雨：向き（度。0=真下、+で右上から左下へ）、速さ、量、濃さ
  rainAngleDeg: 0,
  rainSpeed: 10,
  rainRate: 400,
  rainLength: 0.025,
  rainThickness: 0.0008,
  rainAlpha: 0.3,

  // 雨音の大きさ
  rainVolume: 0.15,

  // 目の高さ（cm）と水位の変化にかける秒数
  eyeHeightCm: 150,
  levelLerpSeconds: 1.2,
};
