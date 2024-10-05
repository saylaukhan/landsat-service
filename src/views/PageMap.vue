<template>
  <div>
    <div class="input-container">
      <div class="inputs">
        <InputNumber v-model.number="latitude" inputId="minmax-buttons" mode="decimal" showButtons :min="-90" :max="90" fluid placeholder="Latitude" />
        <InputNumber v-model.number="longitude" inputId="minmax-buttons" mode="decimal" showButtons :min="-180" :max="180" fluid placeholder="Longitude"/>
      </div>
      <div class="buttons">
        <Button @click="setLocation"  label="Primary" outlined >Set location</Button>
        <Button @click="drawGrid">Show Landsat grid</Button>
      </div>
    </div>
    <div v-if="latitude !== null && longitude !== null" ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import InputNumber from 'primevue/inputnumber';
import Button from 'primevue/button'
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const userStore = useUserStore();

const latitude = ref<number | null>(userStore.latitude);
const longitude = ref<number | null>(userStore.longitude);

const mapContainer = ref<HTMLElement | null>(null);
let map: L.Map | null = null;
let marker: L.Marker | null = null;
const rectangles: L.Rectangle[] = [];

const gridSize = 0.05; // Размер сетки

// Очистка прямоугольников
const clearRectangles = () => {
  rectangles.forEach((rect) => map!.removeLayer(rect));
  rectangles.length = 0;
};

// Отрисовка сетки
const drawGrid = () => {
  if (latitude.value !== null && longitude.value !== null) {
    clearRectangles();
    const offsets = [-gridSize, 0, gridSize];
    
    offsets.forEach(dLat => {
      offsets.forEach(dLon => {
        const lat = latitude.value! + dLat;
        const lon = longitude.value! + dLon;
        const bounds: L.LatLngBoundsExpression = [
          [lat - gridSize / 2, lon - gridSize / 2],
          [lat + gridSize / 2, lon + gridSize / 2]
        ];
        const rectangle = L.rectangle(bounds, { color: "#ff7800", weight: 1 });
        rectangle.addTo(map!);
        rectangles.push(rectangle);
      });
    });
  }
};

// Функция для установки маркера
const updateMarker = (location: L.LatLngExpression) => {
  if (marker) {
    marker.setLatLng(location);
  } else {
    marker = L.marker(location).addTo(map!);
  }
};

// Установка местоположения
const setLocation = () => {
  if (map && latitude.value !== null && longitude.value !== null) {
    const location: L.LatLngExpression = [latitude.value!, longitude.value!];
    map.setView(location, 13);
    updateMarker(location);

    if (userStore.latitude !== latitude.value || userStore.longitude !== longitude.value) {
      userStore.latitude = latitude.value;
      userStore.longitude = longitude.value;
    }
  }
};

// Обработка клика на карте
const handleMapClick = (event: L.LeafletMouseEvent) => {
  const location = event.latlng;
  latitude.value = location.lat;
  longitude.value = location.lng;

  updateMarker([latitude.value, longitude.value]);
  map!.setView([latitude.value, longitude.value], 13);

  if (userStore.latitude !== latitude.value || userStore.longitude !== longitude.value) {
    userStore.latitude = latitude.value;
    userStore.longitude = longitude.value;
  }
};

onMounted(() => {
  if (!mapContainer.value) {
    console.error('mapContainer is null. Ensure the element is rendered.');
    return; // Завершение выполнения, если контейнер не найден
  }

  map = L.map(mapContainer.value).setView([0, 0], 5);

  // Добавляем OSM плитки
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(map);

  // Добавляем обработчик клика на карту
  map.on('click', handleMapClick);

  // Получаем текущее местоположение пользователя
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const userLocation = [position.coords.latitude, position.coords.longitude] as L.LatLngExpression;
      map!.setView(userLocation, 13);
      latitude.value = position.coords.latitude;
      longitude.value = position.coords.longitude;

      marker = L.marker(userLocation).addTo(map!);

      // Обновляем широту и долготу в сторе
      userStore.latitude = latitude.value;
      userStore.longitude = longitude.value;
    },
    (error) => {
      console.error('Ошибка геолокации:', error);
      map!.setView([userStore.latitude, userStore.longitude], 5); // Центрируем карту по последним сохранённым координатам
    }
  );
});
</script>

<style scoped>
.input-container {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  align-items: center;
}
.inputs {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.buttons {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.map-container {
  width: 100%; 
  height: 80vh;
  border: 2px ridge #0D89EC;
}
</style>
