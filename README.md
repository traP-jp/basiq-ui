# BasiQ UI

traQのデザインから影響を受けたVue向けのコンポーネントライブラリです。
現在は開発の初期段階のため、コンポーネントは実装されていません。

## 開発環境

- mise 2026.8.3以降
- Node.js 24.19.0
- pnpm 11.20.0

Node.jsとpnpmのバージョンはmiseで管理しています。miseを使用しない場合も、上記と同じバージョンを用意してください。

## セットアップ

```sh
mise install
pnpm install
pnpm build
```

miseをshellで有効化していない場合は、`pnpm`の代わりに`mise exec -- pnpm`を使用できます。

## 主なコマンド

```sh
# typecheck
pnpm typecheck

# typecheckとライブラリのビルド
pnpm build
```

## 利用方法

公開後は、次のようにCSSをインポートして使用する予定です。

```ts
import "basiq-ui/styles.css";
```

## ライセンス

[MIT](./LICENSE)
