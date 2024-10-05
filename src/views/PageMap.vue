<template>
  <div>
    <div class="input-container">
      <label for="lat">Широта:</label>
      <input v-model="latitudeString" type="text" placeholder="Введите широту" @input="validateLatitude" />
      <label for="lng">Долгота:</label>
      <input v-model="longitudeString" type="text" placeholder="Введите долготу" @input="validateLongitude" />
      <button @click="setLocation">Установить местоположение</button>
      <button @click="drawGrid">Показать сетку Landsat</button>
    </div>
    <div v-if="latitude !== null && longitude !== null" ref="mapContainer" class="map-container"></div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { useUserStore } from '@/stores/user';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const userStore = useUserStore();

const latitude = ref<number | null>(userStore.latitude);
const longitude = ref<number | null>(userStore.longitude);
const latitudeString = ref<string>(userStore.latitude?.toString() || '');
const longitudeString = ref<string>(userStore.longitude?.toString() || '');

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
  latitudeString.value = location.lat.toString();
  longitudeString.value = location.lng.toString();

  updateMarker([latitude.value, longitude.value]);
  map!.setView([latitude.value, longitude.value], 13);

  if (userStore.latitude !== latitude.value || userStore.longitude !== longitude.value) {
    userStore.latitude = latitude.value;
    userStore.longitude = longitude.value;
  }
};

// Валидация и замена запятой на точку в широте
const validateLatitude = () => {
  latitudeString.value = latitudeString.value.replace(',', '.');
  latitude.value = parseFloat(latitudeString.value);
};

// Валидация и замена запятой на точку в долготе
const validateLongitude = () => {
  longitudeString.value = longitudeString.value.replace(',', '.');
  longitude.value = parseFloat(longitudeString.value);
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
      latitudeString.value = position.coords.latitude.toString();
      longitudeString.value = position.coords.longitude.toString();

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

<style>
.input-container {
  margin-bottom: 10px;
}

.input-container input {
  margin-right: 10px;
  padding: 5px;
  width: 100px;
}

.map-container {
  width: 100%; 
  height: 80vh;
}
</style>
