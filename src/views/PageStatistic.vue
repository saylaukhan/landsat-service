<template>
  <div class="container">
    <div class="container_h">
      <span>Metadata Extraction</span>
      <span class="pi pi-server"></span>
    </div>
    <p class="container_p">
      <span class="pi pi-video"></span>
      <b>Satellite:</b> 
      <span>{{ satellite }}</span> 
    </p>
    <p  class="container_p">
      <span class="pi pi-caret-right"></span>
      <b>Layer:</b> 
      <span>{{ layer }}</span> 
    </p>
    <p class="container_p">
      <span class="pi pi-caret-right"></span>
      <b>Type:</b> 
      <span>{{ type }}</span> 
    </p>
    <p  class="container_p">
      <span class="pi pi-arrows-h"></span>
      <b>Row Number:</b> 
      <span>{{ row }}</span> 
    </p>
    <p class="container_p" >
      <span class="pi pi-arrows-v"></span>
      <b>Path Number:</b> 
      <span>{{ col }}</span> 
    </p>
    <p class="container_p" > 
      <span class="pi pi-calendar"></span>
      <b>Date:</b> 
      <span>{{ formattedDate }}</span> 
    </p>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, watch } from 'vue';
import { useUserStore } from '@/stores/user';
import axios from 'axios';

const userStore = useUserStore();
const apiKey = 'nIpdeHFQvn3iTENBpC3ddtaHhLDOlIYGkMmWqPF8';

const coordinates = ref(userStore.latitude + ',' + userStore.longitude);
const id = ref("");

// Реактивные свойства для метаданных
const satellite = ref('');
const layer = ref('');
const type = ref('');
const row = ref('');
const col = ref('');
const formattedDate = ref('');

// Функция для извлечения метаданных
const updateMetadata = () => {
  const parts = id.value.split('/');
  if (parts.length > 4) {
    satellite.value = parts[1]; // LC08
    layer.value = parts[2];      // C02
    type.value = parts[3];       // T1_L2
    const frameCode = parts[4];  // LC08_184031_20240926

    const frameParts = frameCode.split('_'); // ['LC08', '184031', '20240926']
    const rowCol = frameParts[1];            // 184031
    const date = frameParts[2];               // 20240926

    row.value = rowCol.slice(0, 3); // 184
    col.value = rowCol.slice(3);     // 031
    formattedDate.value = formatDate(date);
  }
};

// Форматируем дату
const formatDate = (dateString: string) => {
  const year = dateString.slice(0, 4);
  const month = dateString.slice(4, 6);
  const day = dateString.slice(6, 8);
  return `${day}.${month}.${year}`; // Формат: DD.MM.YYYY
};

// Функция для получения изображения по координатам
const fetchImageByCoordinates = async () => {
  const [lat, lon] = coordinates.value.split(',').map(coord => coord.trim());
  id.value = `LANDSAT/LC08/C02/T1_L2/LC08_${lat.replace('.', '')}_${lon.replace('.', '')}`; // Формируем идентификатор
  await fetchImage(lat, lon);
  updateMetadata(); // Обновляем метаданные
};

// Функция для получения изображения
const fetchImage = async (lat: string, lon: string) => {
  try {
    const response = await axios.get(
      `https://api.nasa.gov/planetary/earth/assets?lat=${lat}&lon=${lon}&api_key=${apiKey}`
    );
    if (response.data.url && response.data.date) {
      id.value = response.data.id; // Предполагаем, что ID есть в ответе
      updateMetadata(); // Обновляем метаданные
    }
  } catch (error) {
    console.error('Ошибка при получении снимка:', error);
  }
};

// Слушаем изменения в координатах
watch(coordinates, (newCoordinates) => {
  fetchImageByCoordinates(); // Обновляем изображение при изменении координат
});

// Инициализируем метаданные при монтировании
onMounted(() => {
  fetchImageByCoordinates(); // Получаем изображение на основе начальных координат
});
</script>

<style scoped>
.container_p {
  display: flex;
  gap: 8px;
  align-items: center;
}
.container_h {
  display: flex;
  gap: 8px;
  align-items: center;
}
.container_h span {
  font-size: 32px;
  color: #0D89EC;
  font-weight: bold;
}
</style>
