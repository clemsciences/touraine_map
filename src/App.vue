<script setup>
import {onMounted, ref} from "vue";
import TouraineMap from "@/components/TouraineMap.vue";
import {DATA_URL, loadData} from "@/data.js";

const data = ref(null);
const error = ref(null);

onMounted(() => {
  loadData()
    .then((loaded) => {
      if (loaded.title) {
        document.title = loaded.title;
      }
      data.value = loaded;
    })
    .catch((e) => {
      error.value = e.message;
    });
});
</script>

<template>
  <main>
    <TouraineMap v-if="data" :locations="data.locations" :outline="data.outline" />
    <div v-else-if="error" class="message">
      <b-alert :model-value="true" variant="danger">
        <p><b>Les données de la carte n'ont pas pu être chargées ({{ DATA_URL }}).</b></p>
        <p class="mb-0">{{ error }}</p>
      </b-alert>
    </div>
    <p v-else class="message">Chargement…</p>
  </main>
</template>

<style scoped>
.message {
  max-width: 800px;
  margin: 2rem auto;
  padding: 0 16px;
}
</style>
