# App icon

`dex-icon.svg` is the source. `dex-icon.png` is its 1024×1024 render, which Tauri's generator consumes. Also copied to `public/favicon.svg` for the browser tab.

To regenerate after editing the SVG (no project dependency needed; `pnpm dlx` runs the converter once):

```bash
pnpm dlx sharp-cli -i docs/icon/dex-icon.svg -o docs/icon/dex-icon.png resize 1024 1024
pnpm tauri icon docs/icon/dex-icon.png
rm -rf src-tauri/icons/android src-tauri/icons/ios   # desktop only
cp docs/icon/dex-icon.svg public/favicon.svg
```
