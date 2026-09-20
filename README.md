# まちの水位スコープ（内水氾濫 体験教材）ソース一式

大分地方気象台 お天気フェア（2026-10-10）用。ブラウザだけで動くARアプリです。

## 公開URL（GitHub Pages）
- 共通版：https://kawatalabhousing-hub.github.io/flood-scope/
- Android版：https://kawatalabhousing-hub.github.io/flood-scope/android.html
- リポジトリ：https://github.com/kawatalabhousing-hub/flood-scope

## ファイル
- index.html   … 共通版（iPhone / Android どちらでも動く）。スコープ、2眼ARゴーグル、1眼ゴーグル、VR、キキクル、操作卓、案内役メモ
- android.html … Android版（WebXR / ARCore）。歩いても位置が合い、奥行き対応機種では本物が正しく沈む。1眼ゴーグル向け

## 置き方（公開のしかた）
1. GitHub の kawatalabhousing-hub で flood-scope リポジトリを作り、3つのファイルを Upload files で入れる
   - Settings → Pages → Source: Deploy from a branch / main / (root) → Save。数分で上のURLで開ける
   - 学生は Settings → Collaborators で招待。ブラウザ上で鉛筆マークから編集 → Commit で自動反映。壊れたら History で前の版に戻す
2. スマホの Chrome / Safari でその URL を開く。カメラとセンサーの許可を求められたら「許可」
3. index.html は Google Sites などの「埋め込み」では動かない（カメラが止められる）。必ず直接開く

## 編集のしかた
- テキストエディタ（VS Code など）で開く。`<script>` の先頭にある「設定（ここを編集）」の中だけを変える
  - LEVELS: 水位の段階。 5 は「側溝からあふれる」段階
  - MSG: 段階ごとの言葉（t=見出し、s=説明）。半角スペースの位置で改行される
  - COR: 通路の幅・長さ、コーンの高さ、側溝と車道の位置、障害物（赤ミニコーン）の x, z, h（高さ）
  - DEBRIS_KINDS / KINDS: 流れてくるものの種類
- 文字コードは UTF-8 のまま保存する
- 変えたら、スマホで開いて 0 → あふれ → 10 → 20 → 30（車）→ 50 → 70 を一度通して確認する

## 触らない方がよいところ
- 「設定」より下の描画・センサー・WebXR の部分
- 外部読み込み（Google Fonts, three.js の URL）

## 当日の操作
- 体験端末：画面下のボタン、または画面タップで次の水位（長押しで 0 に戻る）
- Bluetooth プレゼンリモコン：PageDown=次、PageUp=前、Home=0、1〜7=水位、C=車、B=見える化、T=ゴール（共通版）
- 操作卓（PCから連動）は Claude のアーティファクト内でのみ動く。外部サーバーに置いた場合はリモコンを使う

## 連絡先・履歴
- 2026-09-20 初版（Claude と作成）
