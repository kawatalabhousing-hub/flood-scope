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
   Unity 版でコードに直接書かれている文言（「水の深さ ◯cm」、設定パネルのボタン名）も `APP_TEXT` の下のほうにまとめる。HTML や JS に日本語を直書きしない。
3. **水の色・濁り・水位の段階などの数値は `settings.js` の `WATER_SETTINGS` から取る。** 値は Unity の `WaterSettings.asset` と同じ（色は 0〜1 の RGB のまま持つ）。
   描画コードに数値をハードコードしない。Unity 側を変えたらここも合わせる。
4. **体験画面の下段ボタンは「設定」「終わる」の2つだけ。** 機能を足すときは設定パネルに入れる。
   設定パネルの中身は Unity と同じ順：ゴーグルで見る（戻すには画面を長押し）／水位を 0cm に戻す／音：ON・OFF／床 +1cm／床 −1cm／置き直す／閉じる。
5. **右端の縦スケール**（量水標ふう）：見出し「水位」、目盛りは `WATER_SETTINGS.levels`、水色の塗り、オレンジの丸いつまみ（数字入り）、
   目盛りの ±3cm は吸いつき、間は 1cm 刻み。**常に最前面**（水・水中オーバーレイ・パネルより上）。ゴーグルモードでも残す。
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
- index.html の通路・障害物の位置合わせ（向き・目の高さ・画角・前後・幅・障害物）は係員用。画面のボタンには出さず、リモコンの `K` キーで開閉する。

## 書くときの約束

- 外部読み込みは Google Fonts と three.js（cdnjs / jsdelivr）だけ。PeerJS は使わない。
- 状態を変えるのは `Water` のメソッド経由（`setLevel` / `cycleMurk` / `setOpaque` / `nudgeFloor`）。UI の同期は `Water.onChange` で。
- コメントは日本語で、何をしているかを一行で。
- 変更ごとに git commit、区切りで git push（GitHub Pages に反映される）。
