<template>
  <h1>Координаты</h1>
  <p>Широта: {{ userStore.latitude }}</p>
  <p>Долгота: {{ userStore.longitude }}</p>
  <p>Следующая дата получения снимка: {{ nextImageDate }}</p>

  <h1>Получение снимков Landsat 3x3</h1>
  <div v-if="images.length > 0" class="images-grid">
    <div v-for="(image, index) in images" :key="index" class="image-container">
      <p v-if="image"><strong>{{ new Date(image.date).toLocaleDateString() }}</strong></p>
      <p v-else><strong>Изображение не найдено</strong></p>
      <img v-if="image" :src="image.url" alt="Landsat Image" />
    </div>
  </div>
  <p v-else>Загрузка изображений...</p>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useUserStore } from '@/stores/user';

const userStore = useUserStore();
const images = ref<{ date: string, url: string }[]>([]);
const nextImageDate = ref('');

const apiKey = 'nIpdeHFQvn3iTENBpC3ddtaHhLDOlIYGkMmWqPF8';

// Функция для замены запятой на точку и проверки на целое число
const normalizeCoordinate = (coord: string | number): string => {
  let normalized = String(coord).replace(',', '.'); // Замена запятой на точку
  if (!normalized.includes('.')) {
    normalized += '.0'; // Если это целое число, добавляем ".0"
  }
  return normalized;
};

// Функция для получения изображения для конкретных координат
const fetchImage = async (lat: string, lon: string) => {
  try {
    const response = await axios.get(
      `https://api.nasa.gov/planetary/earth/assets?lat=${lat}&lon=${lon}&api_key=${apiKey}`
    );
    return response.data.url ? { date: response.data.date, url: response.data.url } : null;
  } catch (error) {
    console.error('Ошибка при получении снимка:', error);
    return null;
  }
};

// Функция для получения сетки снимков Landsat (3x3)
const fetchSatelliteImages = async () => {
  const lat = parseFloat(normalizeCoordinate(userStore.latitude));
  const lon = parseFloat(normalizeCoordinate(userStore.longitude));

  const gridSize = 0.05; // Размер сетки
  const offsets = [-gridSize, 0, gridSize]; // Оффсеты для сетки

  const imagePromises = offsets.flatMap(dLat => 
    offsets.map(dLon => {
      const centerLat = lat + dLat;
      const centerLon = lon + dLon;
      return fetchImage(String(centerLat), String(centerLon));
    })
  );

  const fetchedImages = await Promise.all(imagePromises);
  images.value = fetchedImages; // Даже если изображение null, оно будет в массиве

  // Вычисляем следующую дату получения снимка
  calculateNextImageDate();
};

// Функция для вычисления следующей даты получения снимка
const calculateNextImageDate = () => {
  const today = new Date();
  const daysUntilNextImage = 16; // Предположим, что следующая дата - через 16 дней
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNextImage);
  nextImageDate.value = nextDate.toLocaleDateString();
};

onMounted(() => {
  fetchSatelliteImages();
});
</script>

<style scoped>
.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.image-container {
  border: 1px solid #ccc;
  padding: 5px;
  text-align: center;
}

.image-container img {
  max-width: 100%;
  height: auto;
}
</style>
