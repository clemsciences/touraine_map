# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

A single-page Vue 3 + Vite app that shows a printable Leaflet map of Indre-et-Loire (Touraine) with markers for places of religious/folk interest, made for an exhibition. UI text and data are in French.

## Commands

```sh
npm install
npm run dev       # Vite dev server
npm run build     # production build into dist/
npm run preview   # serve the built dist/
```

There are no tests, linter or formatter configured.

Docker: `docker build -t touraine_map . && docker run --rm -p 8080:80 touraine_map`, then open http://localhost:8080/ (redirects to `/touraine_map/`). The `Dockerfile` builds with Node and serves `dist/` with nginx (`docker/nginx.conf`) under the `/touraine_map/` base path; `data.yaml` is served with `Cache-Control: no-cache` so a replaced file is picked up.

## Architecture

- The content is not in the code: `public/data.yaml` (format documented in the README) is fetched at runtime by `loadData()` in `src/data.js`, so it can be replaced after the build or mounted in Docker without rebuilding. `src/models/parser.js` validates it strictly (unknown keys are rejected, ids must be unique) and turns it into `LocatedEvent` instances (`src/models/types.js`); errors are `DataError`s with French messages naming the place and key, which `App.vue` shows instead of the map. When adding a field, update the parser's allowed keys, `LocatedEvent` and the README table together.
- `App.vue` loads the data and renders `src/components/TouraineMap.vue` with the `locations` and `outline` props once loaded. `TouraineMap.vue` is the whole map UI (`<script setup>`). It renders an `l-map` from `@vue-leaflet/vue-leaflet` with OSM tiles, a tooltip per location and the optional outline, plus a clickable list of the same locations. Clicking an item flies the map to the marker; clicking a marker highlights its list item.
- Responsive layout: map and list side by side from 768px, stacked below that. Tooltips are permanent on wide screens and when printing (`beforeprint`/`afterprint`), and appear on tap on small screens. The tooltip `:key` includes that state so it is recreated when it changes.
- Do not put anything but `l-tooltip`/`l-popup` inside `l-marker`, HTML comments included: vue-leaflet then renders the marker as an empty `DivIcon` instead of the pin image.
- The outline (`outline` key, resolved relative to `data.yaml`; the Touraine one is `public/departement-37-indre-et-loire.geojson`, from data.gouv.fr) is fetched at runtime. Both files rely on the app being served under the configured base path.
- Printing: Leaflet keeps the view computed for the on-screen map size, so `printPage()` (the "Imprimer" button, and Ctrl+P which is intercepted) first switches the map to paper size with the `print-layout` class (180mm × 210mm, same as in `@media print`), refits without animation, waits for the tiles to load, then calls `window.print()`. `afterprint` restores the previous view. Printing from the browser menu only gets a best-effort refit in `beforeprint`, with no time for the tiles to load.
- `fitAll()` fits the outline plus all markers (zoom capped at 14 for close places), so the whole area is shown, not only the area around the markers.
- Check layout changes in print (export an A4 PDF after loading the page at screen size, not with print media emulated from the start) and at phone width as well as on a desktop screen.
- Bootstrap-Vue-Next components (such as `b-button`) are auto-imported by `unplugin-vue-components` with `BootstrapVueNextResolver` (see `vite.config.js`), so they are not imported explicitly.

## Config notes

- `vite.config.js` sets `base: "/touraine_map/"` for deployment under that sub-path. Asset URLs and the geojson fetch depend on it.
- `@` is aliased to `src/`.
- `.geojson` files are listed in `assetsInclude`.
