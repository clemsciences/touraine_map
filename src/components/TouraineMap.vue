<template>
  <div class="widget">
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
          <l-geo-json v-if="department" :geojson="department"/>
        </l-map>
      </div>
      <div class="list-container">
        <div class="list-header">
          <h2>{{locations.length}} lieux</h2>
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
import {touraineLocations} from "@/data.js";

const map = ref(null);
const mapContainer = ref(null);
const markerRefs = {};
const itemRefs = {};
const zoom = ref(9);
const center = [47.397332, 0.695097];
const locations = touraineLocations;
const department = ref(null);
const selectedId = ref(null);
const mapOptions = {
  zoomSnap: 0.5,
  zoomDelta: 0.5,
};

// Sur petit écran, les noms permanents se chevauchent : on ne les affiche qu'au toucher,
// sauf à l'impression où la carte doit rester lisible sans interaction.
const wideScreen = window.matchMedia("(min-width: 768px)");
const isWide = ref(wideScreen.matches);
const isPrinting = ref(false);
const permanentTooltips = computed(() => isWide.value || isPrinting.value);

const markers = computed(() => locations.map((value) => value.coordinates));

function fitAll() {
  // Marge haute plus grande pour laisser la place aux infobulles au-dessus des épingles
  map.value?.leafletObject?.fitBounds(markers.value, {paddingTopLeft: [30, 80], paddingBottomRight: [30, 30]});
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

function printPage() {
  window.print();
}

function onReady() {
  nextTick(fitAll);
}

function onScreenChange(e) {
  isWide.value = e.matches;
  nextTick(() => {
    map.value?.leafletObject?.invalidateSize();
    fitAll();
  });
}

function onBeforePrint() {
  isPrinting.value = true;
}

function onAfterPrint() {
  isPrinting.value = false;
}

onMounted(() => {
  wideScreen.addEventListener("change", onScreenChange);
  window.addEventListener("beforeprint", onBeforePrint);
  window.addEventListener("afterprint", onAfterPrint);

  fetch('departement-37-indre-et-loire.geojson')
    .then(response => response.json())
    .then(data => {
      department.value = data;
    });
});

onBeforeUnmount(() => {
  wideScreen.removeEventListener("change", onScreenChange);
  window.removeEventListener("beforeprint", onBeforePrint);
  window.removeEventListener("afterprint", onAfterPrint);
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

  .map-container, .list-container {
    flex: none; /* Désactive la flexibilité */
    width: 100%; /* Occupe toute la largeur */
    border: none;
  }

  .map-container {
    height: 800px; /* Hauteur fixe pour la carte */
  }

  .list-container {
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
