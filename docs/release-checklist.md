# Release checklist

確認日と確認者を記録し、実施していない項目は「未確認」のまま残す。

## 多言語ユーザー名詞（v2）

- [ ] 日本語だけ／英語だけ／日英両方でユーザー名詞を登録する
- [ ] 英語の片側だけを入力するとエラーになる
- [ ] 日本語のみの項を英語表示、英語のみの項を日本語表示する
- [ ] fallback通知が表示され、翻訳追加後に消え、翻訳削除後に戻る
- [ ] 翻訳不足の保存問題を両言語で開く
- [ ] version 1 localStorage移行とversion 1 backup importを確認する
- [ ] version 2 backup exportを確認する
- [ ] IMEで「田中」を入力する
- [ ] 320px、200%拡大、キーボード、`file://` を確認する
- [ ] 日本語画面の全空欄時は日本語名詞句だけを要求する
- [ ] 英語画面の全空欄時は英語二欄だけを要求する
- [ ] validationメッセージが一回だけ表示される
- [ ] 利用者向け文面に曖昧な「ラベル」を使わない
- [ ] 英語片側入力時に組合せエラーを表示する
- [ ] validation後に最初に修正すべき入力へfocusする

## 自動検証

- [ ] `npm run typecheck`
- [ ] `npm test`
- [ ] `npm run build`
- [ ] `npm run verify-dist`
- [ ] `npm run check`
- [ ] `dist/index.html` を `file://` で起動

## 手動アクセシビリティ

- [ ] Tabだけで主要機能へ到達・操作できる
- [ ] skip linkがメインコンテンツへ移動する
- [ ] buttonをEnter／Spaceで操作できる
- [ ] 再描画後のfocus位置とtext inputのcaretが適切
- [ ] 200%拡大で横スクロールなしに主要操作が可能
- [ ] 320 CSS px幅で主要操作が可能
- [ ] ライト／ダークモードで判読可能
- [ ] OS高コントラストで現在状態・focus・警告を判別可能
- [ ] スクリーンリーダーで見出し、landmark、live regionを簡易確認

## ブラウザ

- [x] Chrome headless: `file://`起動、320px相当・device scale 2、landmark/skip link DOM
- [ ] Chrome手動: 四段階、各クイズ、手動駒、保存、JSON、keyboard/focus（未確認）
- [ ] Firefox: headless起動を試行したが検証成果物を取得できず、未確認
- [ ] Safari: 未確認

## チュートリアル

- [ ] `index.html` から `tutorial.html` を新しいタブで開ける
- [ ] `tutorial.html` から `index.html` へ戻れる
- [ ] 日本語／英語を切り替え、本文・表・図の説明が切り替わる
- [ ] 空図、境界I、確定例、Barbara三図、二文字図が表示される
- [ ] Barbaraの第一前提・統合前提・結論配置がゲーム本体と一致する
- [ ] S′が補集合で反対語ではないことを説明している
- [ ] 境界Iが片側Oの場合だけ確定することを説明している
- [ ] Tabで言語・目次・ゲームリンクを操作できる
- [ ] 320 CSS px幅・200%拡大で本文、表、図を閲覧できる
- [ ] `dist/tutorial.html` を `file://` で起動
- [ ] Chrome: 未確認
- [ ] Firefox: 未確認
- [ ] Safari: 未確認

## 保存とファイル

- [ ] localStorage利用可能時の再読込み
- [ ] localStorage利用不可時もゲームを継続
- [ ] 壊れた保存値から安全に起動
- [ ] JSON export
- [ ] JSON import、プレビュー、明示的な置換
- [ ] 1 MiB超過ファイルを本文読込み前に拒否
- [ ] ファイル読込み失敗を表示
- [ ] localStorage保存失敗後もセッション状態を維持

## 重要事項

- [ ] 論理結果、正解判定、駒位置が既存リリースと一致
- [ ] ルイス・キャロル方式／現代述語論理方式の切替を含めていない
- [ ] 未確認環境を確認済みとして記録していない
