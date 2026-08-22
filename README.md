# BasiQ UI

A traQ-inspired Vue component library.

## インストール

```sh
npm install basiq-ui
```

```sh
pnpm add basiq-ui
```

## 利用方法

```vue
<script setup lang="ts">
import { BasiqButton } from "basiq-ui";
import "basiq-ui/styles.css";
</script>

<template>
  <BasiqButton>ボタン</BasiqButton>
</template>
```

## 開発

Node.jsとpnpmのバージョンはmiseで管理しています。

```sh
mise install
pnpm install
pnpm playwright:install
pnpm check
pnpm build
```

Storybookは次のコマンドで起動できます。

```sh
pnpm storybook
```

## ライセンス

[MIT](./LICENSE)
