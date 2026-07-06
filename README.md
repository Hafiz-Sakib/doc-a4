# Proof Sheet — Figure to PDF

React + Tailwind v4 webapp. Drop two images into the slots, preview the
exact page layout in a scaled proof sheet, then export a real PDF.

Page geometry is matched directly off a rendered LaTeX `article`-class
figure (no `geometry` package): **US Letter, 612 × 792 pt**, images at
full text width (343.72pt), left/right margin 134.14pt, top offset
124.8pt, 0.5cm (~15.17pt) vertical gap between images.

Everything runs client-side with `pdf-lib` — no server, no LaTeX/WASM
download.

## Run

```
npm install
npm run dev
```

## Build

```
npm run build
```
