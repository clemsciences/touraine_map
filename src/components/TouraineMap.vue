<template>
  <div class="widget">
    <BRow>
      <b-col>
        <div class="the-map">
          <l-map ref="map"
                 v-model:zoom="zoom"
                 :center="center"
                 :bounds="bounds"
                 :max-bounds="bounds"
                 :use-global-leaflet="false">
            <l-tile-layer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              layer-type="base"
              name="OpenStreetMap"

            />

            <l-control-layers />
            <div v-for="event in locations" :key="event.coordinates">
              <l-marker :lat-lng="[event.coordinates.lat, event.coordinates.lng]">
                <l-popup>
                  <b>{{event.name}}</b> :
                  <span>{{event.description}}</span>
                  <a :href="event.wikidataUrl">{{event.wikidataUrl}}</a>
                </l-popup>
              </l-marker>
            </div>
            <l-geo-json :geojson="department"
                        :options="departmentOptions"/>
          </l-map>
        </div>
      </b-col>
      <b-col>
          <ul v-for="event in locations" :key="event.coordinates">
            <li><b>{{event.name}}</b><br/><span>{{event.description}}</span><span><a :href="event.wikidataUrl">{{event.wikidataUrl}}</a></span></li>
          </ul>
        </b-col>
      </BRow>
  </div>

</template>

<script>
import "leaflet/dist/leaflet.css";
import {LControlLayers, LGeoJson, LMap, LMarker, LPopup, LTileLayer, LTooltip} from "@vue-leaflet/vue-leaflet";
import {coordsToLatLng} from "leaflet/src/layer/GeoJSON.js";
import {latLngBounds} from "leaflet/dist/leaflet-src.esm.js";
import {touraineLocations} from "@/data.js";
export default {
  name: "TouraineMap",
  methods: {coordsToLatLng},
  components: {
    LGeoJson,
    LPopup,
    LTooltip,
    LMarker,
    LControlLayers,
    LMap,
    LTileLayer,
  },
  data() {
    const bounds = latLngBounds([
        [48, 0.080],
        [46.500, 1.370]
      ]);

    // var geojsonFeature = {
    // "type": "Feature",
    // "properties": {
    //     "name": "nom du département",
    //     // autres propriétés...
    // },
    // "geometry": {
    //     "type": "Polygon",
    //     "coordinates": [
    //         // Coordonnées de la limite du département ici...
    //     ]
    // };

    return {
      zoom: 9,
      center: [47.397332, 0.695097],
      locations: touraineLocations,
      bounds: bounds,
      maxBounds: bounds,
      department: null,
      departmentOptions: null

    };
  },
  mounted() {

    fetch('/departement-37-indre-et-loire.geojson')
        .then(response => response.json())
        .then(data => {
          this.department = data
        })


  }
};
</script>

<style scoped>

.the-map {
  height: 700px;
  width: 800px;
}

</style>