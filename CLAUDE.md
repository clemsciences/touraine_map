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

Docker: `docker build -t touraine_map . && docker run --rm -p 8080:80 touraine_map`, then open http://localhost:8080/ (redirects to `/touraine_map/`). The `Dockerfile` builds with Node and serves `dist/` with nginx (`docker/nginx.conf`) under the `/touraine_map/` base path.

## Architecture

- `src/data.js` holds the content: the `touraineLocations` array of `LocatedEvent` instances (class in `src/models/types.js`: name, id, `{lat, lng}` coordinates, description, year, Wikidata URL). Adding or editing a place means editing this array. Each `id` must be unique, since it is used as the marker `key`/ref. Commented-out entries are deliberately disabled places.
- `src/components/TouraineMap.vue` is the whole UI (`<script setup>`). It renders an `l-map` from `@vue-leaflet/vue-leaflet` with OSM tiles, a tooltip per location and the department outline, plus a clickable list of the same locations. Clicking an item flies the map to the marker; clicking a marker highlights its list item. On map `@ready` it fits bounds to all marker coordinates.
- Responsive layout: map and list side by side from 768px, stacked below that. Tooltips are permanent on wide screens and when printing (`beforeprint`/`afterprint`), and appear on tap on small screens. The tooltip `:key` includes that state so it is recreated when it changes.
- Do not put anything but `l-tooltip`/`l-popup` inside `l-marker`, HTML comments included: vue-leaflet then renders the marker as an empty `DivIcon` instead of the pin image.
- The department outline `public/departement-37-indre-et-loire.geojson` is loaded at runtime with `fetch` on a relative path (source: data.gouv.fr, see README), so it relies on the app being served under the configured base path.
- Printing: Leaflet keeps the view computed for the on-screen map size, so `printPage()` (the "Imprimer" button, and Ctrl+P which is intercepted) first switches the map to paper size with the `print-layout` class (180mm × 210mm, same as in `@media print`), refits without animation, waits for the tiles to load, then calls `window.print()`. `afterprint` restores the previous view. Printing from the browser menu only gets a best-effort refit in `beforeprint`, with no time for the tiles to load.
- `fitAll()` fits the department outline plus all markers, so the whole of Touraine is shown, not only the area around the markers.
- Check layout changes in print (export an A4 PDF after loading the page at screen size, not with print media emulated from the start) and at phone width as well as on a desktop screen.
- Bootstrap-Vue-Next components (such as `b-button`) are auto-imported by `unplugin-vue-components` with `BootstrapVueNextResolver` (see `vite.config.js`), so they are not imported explicitly.

## Config notes

- `vite.config.js` sets `base: "/touraine_map/"` for deployment under that sub-path. Asset URLs and the geojson fetch depend on it.
- `@` is aliased to `src/`.
- `.geojson` files are listed in `assetsInclude`.
