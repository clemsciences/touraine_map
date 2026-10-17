<template>
  <div class="widget">
    <b-button class="print-button" @click="printPage">Imprimer</b-button>
    <div class="map-list-container">
      <div class="map-container">
        <div class="the-map">
          <l-map ref="map"
                 @ready="onReady"
                 style="height: 1000px; width: 100%"
                 v-model:zoom="zoom"
                 :center="center"
                 :bounds="bounds"
                 :max-bounds="bounds"
                 :options="mapOptions"
                 :use-global-leaflet="false"
          >
            <l-tile-layer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"
            />
            <l-control-layers />
            <l-feature-group>
            <div v-for="event in locations" :key="event.id">
              <l-marker :ref="`marker-${event.id}`" :lat-lng="[event.coordinates.lat, event.coordinates.lng]">
                <l-tooltip :options="{ permanent: true, direction: 'top', offset: [-15, 0] , opacity: 0.7 }">
                  <b style="font-size: 1.2em">{{event.name}}</b>
                </l-tooltip>
              </l-marker>
            </div>
            </l-feature-group>
            <l-geo-json v-if="department" :geojson="department"/>
          </l-map>
        </div>
      </div>
      <div class="list-container">
        <ul>
          <li v-for="event in locations" :key="event.coordinates">
            <b>{{event.name}}</b><br/>
            <span>{{event.description}}</span>
            <!--<span><a :href="event.wikidataUrl">{{event.wikidataUrl}}</a></span>-->
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script>
import "leaflet/dist/leaflet.css";
import {
  LControlLayers,
  LFeatureGroup,
  LGeoJson,
  LMap,
  LMarker,
  LPopup,
  LTileLayer,
  LTooltip,
} from "@vue-leaflet/vue-leaflet";
import {coordsToLatLng} from "leaflet/src/layer/GeoJSON.js";
import {latLngBounds, featureGroup} from "leaflet/dist/leaflet-src.esm.js";
import {touraineLocations} from "@/data.js";

export default {
  name: "TouraineMap",
  methods: {
    coordsToLatLng,
    // showAllTooltips() {
    //   this.locations.forEach((event) => {
    //     const marker = this.$refs['marker-' + event.id][0];
    //     console.log(marker);
    //     if (marker) {
    //       marker.openPopup();
    //     }
    //   });
    // },
    printPage() {
      window.print();
    },
    onReady() {
      if(this.markers) {
        this.$nextTick(() => {
          this.$refs.map.leafletObject.fitBounds(this.markers);
        });
      }
    }
  },
  components: {
    LFeatureGroup,
    LGeoJson,
    LPopup,
    LTooltip,
    LMarker,
    LControlLayers,
    LMap,
    LTileLayer,
  },
  data() {
    /*const bounds = latLngBounds([
      [47.7, 0.050],
      [46.800, 1.400]
    ]);*/

    return {
      zoom: 9,
      center: [47.397332, 0.695097],
      locations: touraineLocations,
      //bounds: bounds,
      //maxBounds: bounds,
      department: null,
      departmentOptions: null,
      mapOptions: {
        zoomSnap: 0.5,
        zoomDelta: 0.5,
        zoomControl: false,
        attributionControl: false
      },
    };
  },
  mounted() {

    fetch('departement-37-indre-et-loire.geojson')
      .then(response => response.json())
      .then(data => {
        console.log(data);
        this.department = data;
        // this.showAllTooltips();
      });
  },
  computed: {
    markers() {
      return this.locations.map((value) => value.coordinates);
    }
  }
};
</script>

<style scoped>
/* Styles pour l'affichage à l'écran */
.widget {
  height: 100vh; /* Occupe toute la hauteur de la fenêtre */
  display: flex;
  flex-direction: column;
}

.map-list-container {
  display: flex;
  flex: 1;
  height: 1200px;
}

.map-container {
  flex: 1 1 900px; /* Largeur minimale de 900px, mais peut grandir */
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 900px;
}

.list-container {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
  min-width: 300px; /* Largeur minimale pour la liste */
}

.the-map {
  height: 100%;
  width: 100%;
}

ul {
  list-style-type: none;
  padding: 0;
}

li {
  margin-bottom: 10px;
}

@media (max-width: 1400px) {
  .map-container {
    flex: 1 1 800px; /* Réduit la largeur minimale pour les écrans plus petits */
    min-width: 800px;
  }

  .list-container {
    min-width: 250px; /* Réduit la largeur minimale pour la liste */
  }
}

@media (max-width: 1200px) {
  .map-container {
    flex: 1 1 700px; /* Réduit la largeur minimale pour les écrans encore plus petits */
    min-width: 700px;
  }

  .list-container {
    min-width: 200px; /* Réduit la largeur minimale pour la liste */
  }
}

/* Styles pour l'impression */
@media print {
  .widget {
    height: auto; /* Ajuste la hauteur pour l'impression */
    flex-direction: column; /* Affiche la carte et la liste en colonne */
  }

  .map-list-container {
    flex-direction: column; /* Affiche la carte et la liste en colonne */
  }

  .map-container, .list-container {
    flex: none; /* Désactive la flexibilité */
    width: 100%; /* Occupe toute la largeur */
    min-width: auto; /* Annule la largeur minimale */
  }

  .the-map {
    height: 800px; /* Hauteur fixe pour la carte */
  }

  ul {
    padding: 20px; /* Ajoute un padding pour la liste */
  }

  .print-button {
    display: none; /* Cache le bouton d'impression */
  }
}
</style>
