# Release checklist

確認日と確認者を記録し、実施していない項目は「未確認」のまま残す。

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
