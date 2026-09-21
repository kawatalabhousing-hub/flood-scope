# しん水スコープ（ブラウザ版）

内水氾濫で足もとに水がたまっていくようすを見せる体験教材のブラウザ版。GitHub Pages（https://kawatalabhousing-hub.github.io/flood-scope/）で公開。
隣の `../FloodScope` が同じ教材の **Unity 版で、こちらが最新の設計**。ブラウザ版は Unity 版と同じ流れ・文言・見た目に揃える。

| ファイル | 役割 |
| --- | --- |
| `index.html` | 共通版（iPhone / Android）。カメラ映像＋ジャイロで、仮想の通路に水を 2D キャンバスで描く |
| `android.html` | Android 版（WebXR / ARCore / three.js）。床の検出・奥行きで本物が沈む |
| `settings.js` | **文言（`APP_TEXT`）と水の数値（`WATER_SETTINGS`）**。Unity の `AppText.asset` / `WaterSettings.asset` の写し |
| `ui.js` / `ui.css` | 両ページ共通の画面：ロゴ → 説明 → 見かたをえらぶ → 床の設定 → 体験（縦スケール・下段ボタン・設定パネル・リモコン） |
| `logo.png` | `../FloodScope/Assets/FloodScope/logo.png` のコピー |

## 守ること

1. **流れは Unity 版と同じ。**
   ロゴ（0.8 秒フェードイン → 7 秒表示 → 0.8 秒フェードアウト）→ 説明（0.5 秒フェードイン。見出し3行＋本文＋「はじめる」「アプリをとじる」）
   → 見かたをえらぶ（タブレット／ゴーグル）→ 床の設定（「足もとの床を タップして 通路の入口を決める」）→ 体験。
   体験画面の「終わる」で水位 0・にごり自動・足もとを隠す解除・ゴーグル解除・床を解除・雨音停止 → 説明画面へ戻る（次の人に交代）。
2. **文言は `settings.js` の `APP_TEXT` から取る。** 値は Unity の `Assets/FloodScope/AppText.asset` と同じにする（キー名も `AppText.cs` と同じ）。
   Unity 版でコードに直接書かれている文言（「水の深さ ◯cm」、設定パネルのボタン名）も `APP_TEXT` の下のほうにまとめる。来場者が見る文言を HTML や JS に直書きしない（係員用の位置合わせパネルは除く）。
3. **水の色・濁り・水位の段階などの数値は `settings.js` の `WATER_SETTINGS` から取る。** 値は Unity の `WaterSettings.asset` と同じ（色は 0〜1 の RGB のまま持つ）。
   描画コードに数値をハードコードしない。Unity 側を変えたらここも合わせる。
4. **体験画面の下段ボタンは「設定」「終わる」の2つだけ。** 機能を足すときは設定パネルに入れる。
   設定パネルの中身は Unity と同じ順：ゴーグルで見る／水位を 0cm に戻す／音：ON・OFF／床 +1cm／床 −1cm／置き直す／閉じる（共通版だけ「閉じる」の前に「位置合わせ（係員用）」）。
   項目名は短く保つ。「戻すには画面を長押し」はゴーグルボタンの下に小さい文字で1行（`goggleNote`）。
5. **右端の縦スケール**（量水標ふう）：見出し「水位」、目盛りは `WATER_SETTINGS.levels`、水色の塗り、オレンジの丸いつまみ（数字入り）、
   目盛りの ±3cm は吸いつき、間は 1cm 刻み。水・水中オーバーレイ・下段ボタンより前面。ゴーグルモードでも残す。
   **設定パネルを開いている間はスケールを隠し**、閉じたら戻す（パネルは画面中央でスケールより前面）。
6. **操作卓（desk.html・PeerJS・claude room 連動）は使わない。** 水位はスケールとリモコンだけで変える。
   リモコン（Bluetooth キーボード／プレゼンリモコン）は Unity の `RemoteInput.cs` と同じ割り当て：
   →/PageDown/Space/Enter=上げる、←/PageUp=下げる、0/Home=0cm、1〜6=段階、M=にごり切替（自動→真水→泥水）、O=足もとを隠す、G=ゴーグル。
7. **見た目**：フォントは Zen Maru Gothic（Google Fonts、ふつう 500・太字 900）のみ。ボタン・箱はすべて角丸。
   色は Unity の `FloodScopeSetup.cs` と同じ値を `ui.css` の `:root` にまとめる。大きさは Unity の基準解像度 1080×1920（match 0.5）に合わせ、
   `--u`（= √(幅/1080 × 高さ/1920) px）を単位にする。文字は Unity の値 × 1.2（`FontScale`）。

## 画面ごとの対応（Unity → ブラウザ）

| Unity | ブラウザ |
| --- | --- |
| `IntroUI`（ロゴ・説明・見かた） | `ui.js` の `Intro` |
| `HudUI`（水の深さ・案内・赤い帯・下段・設定パネル・ゴーグル・水中） | `ui.js` の `Hud` |
| `GaugeUI`（縦スケール） | `ui.js` の `Gauge` |
| `RemoteInput` | `ui.js` のキー入力 |
| `WaterController`（水位・にごり・不透明・床補正、表示水位はなめらかに追う） | `ui.js` の `Water`（状態と通知）。描画は各ページ |
| `FloorPlacer`（床タップ） | index.html：タップした向きを「まっすぐ」にして床決定／android.html：WebXR ヒットテスト |
| `SoundController`（雨音、体験中だけ・設定で ON/OFF） | 各ページの `snd`（Web Audio のノイズ。音量は `rainVolume`） |

- 各ページは `FloodUI.start({ ... })` にフック（体験の開始・終了、床の置き直し、床補正、毎フレームの描画）を渡すだけにする。画面の出し入れは `ui.js` が持つ。
- 「アプリをとじる」はブラウザでは `window.close()` を試し、閉じられなければロゴ画面から出し直す。
- index.html の通路・障害物の位置合わせ（向き・目の高さ・画角・前後・幅・障害物）は係員用。**共通版だけ、設定パネルの「置き直す」と「閉じる」のあいだに「位置合わせ（係員用）」を置く**（`FloodUI.start` の `extraButtons`）。リモコンの `K` キーでも開閉できる。
  スマホで目の高さを合わせられないと、水面の縁が本物のコーンとずれる（前の版の「コーンに合わせる」と同じ役目）。
- index.html の方位は `heading()`（前方向＋画面の上方向）で求める。前方向だけだと、床に向けたとき少しの横傾きで数十度ずれ、床タップで通路の向きが狂う。
- index.html は「タブレットで見る／ゴーグルで見る」を押した時点で、**傾きセンサー → カメラの順に**許可を取る（iPhone の
  `DeviceOrientationEvent.requestPermission` はほかの await より先に呼ぶ。2つを同時に出すと iPhone でカメラが失敗しうる）。
  取れなければ理由（`APP_TEXT.err…`）を見かたをえらぶ画面に出して体験に入らない。
- index.html は傾きが一度も取れていない間は水面を描かず、床タップも受け付けず、「端末を少し動かしてください」を出す。
  右上の「センサーON」ボタン（元の版と同じ）は体験中いつも出て、状態（センサーON／確認中／動作中／なし／許可なし）を表示する。押すと許可を取り直す（下段2ボタンの約束の例外。ゴーグルモードでは隠す）。
- **index.html の AR 部分（`onOrient` / `viewAngles` / `drawCamReflection` / `drawWaterPlane`、にごりの変わり方）は作り直し前の共通版（`02fcf1c`）のまま保つ。** 色だけ `WATER_SETTINGS` から取る。
  Unity のシェーダー式に置き換えたら水面が透けすぎ、水位が読み取れなくなったので戻した。変えるときは `02fcf1c` と同じ傾き・水位で並べて撮って比べる。
  例外は床タップ・「まっすぐ」ボタンの方位（`rawYaw` → `heading()`）だけ。
- index.html の水平線・投影（`onOrient` / `viewAngles` / `makeCamera` / `drawCorridor`）は作り直し前の共通版と同じ。目の高さは身長150cm相当の 1.40m。
- index.html は Android で WebXR の AR が使えるとき、説明画面に Android版への案内を出す。
  同じく係員用の「ゴールで止まる」（ジャイロ版は位置を追えないので、ゴールから入口を見た向きに通路を切り替える）は `T` キー。

## 書くときの約束

- 外部読み込みは Google Fonts と three.js（cdnjs / jsdelivr）だけ。PeerJS は使わない。
- 状態を変えるのは `Water` のメソッド経由（`setLevel` / `cycleMurk` / `setOpaque` / `nudgeFloor`）。UI の同期は `Water.onChange` で。
- コメントは日本語で、何をしているかを一行で。
- 変更ごとに git commit、区切りで git push（GitHub Pages に反映される）。
