<template>
  <div class="widget" :class="{ 'print-layout': isPrinting }">
    <div class="map-list-container">
      <div class="map-container" ref="mapContainer">
        <l-map ref="map"
               class="the-map"
               @ready="onReady"
               v-model:zoom="zoom"
               :center="center"
               :options="mapOptions"
               :use-global-leaflet="false"
        >
          <l-tile-layer
            ref="tileLayer"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            layer-type="base"
            name="OpenStreetMap"
            attribution="&copy; contributeurs <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a>"
          />
          <!-- Changer la clé de l'infobulle la recrée quand on bascule entre permanente et au toucher.
               Pas de commentaire dans l-marker : vue-leaflet le prendrait pour une icône HTML. -->
          <l-feature-group>
            <l-marker v-for="event in locations"
                      :key="event.id"
                      :ref="(el) => markerRefs[event.id] = el"
                      :lat-lng="[event.coordinates.lat, event.coordinates.lng]"
                      @click="select(event, false)"
            >
              <l-tooltip :key="`${event.id}-${permanentTooltips}`"
                         :options="{ permanent: permanentTooltips, direction: 'top', offset: [-15, 0], opacity: 0.8 }">
                <b class="tooltip-name">{{event.name}}</b>
              </l-tooltip>
            </l-marker>
          </l-feature-group>
          <l-geo-json v-if="department" ref="departmentLayer" :geojson="department" @ready="onDepartmentReady"/>
        </l-map>
      </div>
      <div class="list-container">
        <div class="list-header">
          <h2>{{locations.length}} {{locations.length > 1 ? "lieux" : "lieu"}}</h2>
          <div class="list-actions">
            <b-button size="sm" variant="outline-secondary" @click="showAll">Tout afficher</b-button>
            <b-button class="print-button" size="sm" variant="outline-secondary" @click="printPage">Imprimer</b-button>
          </div>
        </div>
        <ul>
          <li v-for="event in locations" :key="event.id" :ref="(el) => itemRefs[event.id] = el">
            <button type="button"
                    class="location"
                    :class="{ selected: event.id === selectedId }"
                    @click="select(event, true)"
            >
              <b>{{event.name}}</b>
              <span>{{event.description}}</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import "leaflet/dist/leaflet.css";
import {computed, nextTick, onBeforeUnmount, onMounted, ref} from "vue";
import {
  LFeatureGroup,
  LGeoJson,
  LMap,
  LMarker,
  LTileLayer,
  LTooltip,
} from "@vue-leaflet/vue-leaflet";

const props = defineProps({
  // Lieux à afficher (LocatedEvent[]), lus dans le fichier de données
  locations: {type: Array, required: true},
  // URL du contour GeoJSON de la zone, ou chaîne vide pour ne pas en afficher
  outline: {type: String, default: ""},
});

const map = ref(null);
const tileLayer = ref(null);
const departmentLayer = ref(null);
const mapContainer = ref(null);
const markerRefs = {};
const itemRefs = {};
const zoom = ref(9);
const center = [47.397332, 0.695097];
const locations = computed(() => props.locations);
const department = ref(null);
const selectedId = ref(null);
const mapOptions = {
  zoomSnap: 0.1, // Permet à fitBounds de cadrer au plus juste
  zoomDelta: 0.5,
};

// Sur petit écran, les noms permanents se chevauchent : on ne les affiche qu'au toucher,
// sauf à l'impression où la carte doit rester lisible sans interaction.
const wideScreen = window.matchMedia("(min-width: 768px)");
const isWide = ref(wideScreen.matches);
const isPrinting = ref(false);
const permanentTooltips = computed(() => isWide.value || isPrinting.value);

const markers = computed(() => locations.value.map((value) => value.coordinates));

// Cadre tout le département (une fois son contour chargé) et tous les lieux
function fitAll(animate = true) {
  let bounds = markers.value;
  const outline = departmentLayer.value?.leafletObject;
  if (outline) {
    bounds = outline.getBounds();
    markers.value.forEach((coordinates) => bounds.extend(coordinates));
  }
  // Marge haute plus grande pour laisser la place aux infobulles au-dessus des épingles,
  // et zoom plafonné quand les lieux sont très proches les uns des autres
  map.value?.leafletObject?.fitBounds(bounds, {paddingTopLeft: [10, 50], paddingBottomRight: [10, 10], maxZoom: 14, animate});
}

function select(event, fromList) {
  selectedId.value = event.id;
  if (fromList) {
    map.value.leafletObject.flyTo(event.coordinates, 13);
    markerRefs[event.id]?.leafletObject?.openTooltip();
    if (!isWide.value) {
      mapContainer.value.scrollIntoView({behavior: "smooth"});
    }
  } else {
    itemRefs[event.id]?.scrollIntoView({behavior: "smooth", block: "nearest"});
  }
}

function showAll() {
  selectedId.value = null;
  fitAll();
}

// Vue affichée avant l'impression, restaurée ensuite
let viewBeforePrint = null;

// La carte imprimée n'a pas la taille de la carte à l'écran : on la redimensionne au format
// papier (classe print-layout), on la recadre sur tous les lieux, puis on attend les tuiles.
function prepareForPrint() {
  const leafletMap = map.value.leafletObject;
  viewBeforePrint = {center: leafletMap.getCenter(), zoom: leafletMap.getZoom()};
  isPrinting.value = true;
  return nextTick().then(() => {
    leafletMap.invalidateSize({animate: false});
    fitAll(false);
  });
}

function tilesLoaded(timeout = 5000) {
  const tiles = tileLayer.value.leafletObject;
  return new Promise((resolve) => {
    // On laisse une image à Leaflet pour lancer le chargement des nouvelles tuiles
    requestAnimationFrame(() => {
      if (!tiles.isLoading()) {
        resolve();
        return;
      }
      const timer = setTimeout(resolve, timeout);
      tiles.once("load", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  });
}

async function printPage() {
  await prepareForPrint();
  await tilesLoaded();
  window.print();
}

// Ctrl+P passe par la même préparation que le bouton, pour attendre le chargement des tuiles
function onKeydown(e) {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
    e.preventDefault();
    printPage();
  }
}

function onReady() {
  nextTick(fitAll);
}

function onDepartmentReady() {
  if (selectedId.value === null) {
    nextTick(fitAll);
  }
}

function onScreenChange(e) {
  isWide.value = e.matches;
  if (isPrinting.value) {
    return; // La largeur de la page imprimée déclenche aussi ce changement
  }
  nextTick(() => {
    map.value?.leafletObject?.invalidateSize();
    fitAll();
  });
}

// Impression lancée depuis le menu du navigateur : on recadre au mieux, sans pouvoir attendre les tuiles
function onBeforePrint() {
  if (!isPrinting.value) {
    prepareForPrint();
  }
}

function onAfterPrint() {
  isPrinting.value = false;
  nextTick(() => {
    const leafletMap = map.value.leafletObject;
    leafletMap.invalidateSize({animate: false});
    if (viewBeforePrint) {
      leafletMap.setView(viewBeforePrint.center, viewBeforePrint.zoom, {animate: false});
    }
  });
}

onMounted(() => {
  wideScreen.addEventListener("change", onScreenChange);
  window.addEventListener("beforeprint", onBeforePrint);
  window.addEventListener("afterprint", onAfterPrint);
  window.addEventListener("keydown", onKeydown);

  if (props.outline) {
    fetch(props.outline)
      .then(response => response.json())
      .then(data => {
        department.value = data;
      })
      .catch((error) => console.error(`Contour ${props.outline} illisible`, error));
  }
});

onBeforeUnmount(() => {
  wideScreen.removeEventListener("change", onScreenChange);
  window.removeEventListener("beforeprint", onBeforePrint);
  window.removeEventListener("afterprint", onAfterPrint);
  window.removeEventListener("keydown", onKeydown);
});
</script>

<style scoped>
/* Styles pour l'affichage à l'écran */
.widget {
  height: 100dvh; /* Occupe toute la hauteur de la fenêtre */
}

.map-list-container {
  display: flex;
  height: 100%;
}

.map-container {
  flex: 1;
  min-width: 0;
}

.the-map {
  height: 100%;
  width: 100%;
}

.list-container {
  flex: 0 0 360px;
  overflow-y: auto;
  padding: 16px;
  border-left: 1px solid var(--color-border);
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.list-actions {
  display: flex;
  gap: 8px;
}

.list-header h2 {
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
  color: var(--color-heading);
}

.tooltip-name {
  font-size: 1.2em;
}

ul {
  list-style-type: none;
  padding: 0;
  margin: 0;
}

li {
  margin-bottom: 6px;
}

.location {
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 8px 10px;
  text-align: left;
  color: inherit;
  font: inherit;
  background: none;
  border: 1px solid transparent;
  border-radius: 6px;
  cursor: pointer;
}

.location:hover,
.location:focus-visible {
  background: var(--color-background-mute);
}

.location.selected {
  border-color: var(--color-border-hover);
  background: var(--color-background-soft);
}

.location b {
  font-weight: 600;
  color: var(--color-heading);
}

/* Format papier, appliqué juste avant l'impression et pendant celle-ci,
   pour que Leaflet cadre la carte sur la taille réellement imprimée */
.print-layout .map-list-container {
  flex-direction: column;
  align-items: center;
}

.print-layout .map-container {
  flex: none;
  width: 180mm;
  height: 210mm;
}

/* Petits écrans : la carte en haut, la liste en dessous */
@media (max-width: 767.98px) {
  .widget {
    height: auto;
  }

  .map-list-container {
    flex-direction: column;
  }

  .map-container {
    flex: none;
    height: 65dvh;
  }

  .list-container {
    flex: none;
    overflow-y: visible;
    border-left: none;
    border-top: 1px solid var(--color-border);
  }

  .print-button {
    display: none; /* Imprimer depuis un téléphone n'a guère de sens */
  }
}

/* Styles pour l'impression */
@media print {
  .widget {
    height: auto; /* Ajuste la hauteur pour l'impression */
  }

  .map-list-container {
    flex-direction: column; /* Affiche la carte et la liste en colonne */
  }

  .map-container {
    flex: none;
    width: 180mm;
    height: 210mm;
    margin: 0 auto;
  }

  .list-container {
    flex: none; /* Désactive la flexibilité */
    width: 100%; /* Occupe toute la largeur */
    border: none;
    overflow: visible;
    padding: 20px;
  }

  .list-header {
    display: none; /* Cache le bouton d'impression */
  }

  .location.selected {
    border-color: transparent;
    background: none;
  }

  /* Pas de contrôles de zoom sur papier */
  :deep(.leaflet-control-zoom) {
    display: none;
  }
}
</style>
