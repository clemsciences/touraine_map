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

## Architecture

- `src/data.js` holds the content: the `touraineLocations` array of `LocatedEvent` instances (class in `src/models/types.js`: name, id, `{lat, lng}` coordinates, description, year, Wikidata URL). Adding or editing a place means editing this array. Each `id` must be unique, since it is used as the marker `key`/ref. Commented-out entries are deliberately disabled places.
- `src/components/TouraineMap.vue` is the whole UI (Options API). It renders an `l-map` from `@vue-leaflet/vue-leaflet` with OSM tiles, a permanent tooltip per location, and the department outline. Next to the map is a text list of the same locations. On map `@ready` it fits bounds to all marker coordinates.
- The department outline `public/departement-37-indre-et-loire.geojson` is loaded at runtime with `fetch` on a relative path (source: data.gouv.fr, see README), so it relies on the app being served under the configured base path.
- Printing: the "Imprimer" button calls `window.print()`. The `@media print` rules in `TouraineMap.vue` stack the map and list vertically and hide the button. Check layout changes in print preview as well as on screen.
- Bootstrap-Vue-Next components (`b-container`, `b-button`) are auto-imported by `unplugin-vue-components` with `BootstrapVueNextResolver` (see `vite.config.js`), so they are not imported explicitly.

## Config notes

- `vite.config.js` sets `base: "/touraine_map/"` for deployment under that sub-path. Asset URLs and the geojson fetch depend on it.
- `@` is aliased to `src/`.
- `.geojson` files are listed in `assetsInclude`.
