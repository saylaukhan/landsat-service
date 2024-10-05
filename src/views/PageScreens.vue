<template>
  <table>
    <thead>
      <tr>
        <th>Latitude</th>
        <th>Longitude</th>
        <th>Current Image Date</th>
        <th>Next Image</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>{{ userStore.latitude }}</td>
        <td>{{ userStore.longitude }}</td>
        <td>
          <p><strong>{{ currentImageDate }}</strong></p>
        </td>
        <td>
          <p><strong>{{ nextImageDate }}</strong></p>
        </td>
      </tr>
    </tbody>
  </table>

  <div v-if="images.length > 0" class="images-grid">
    <div v-for="index in 9" :key="index" class="image-container">
      <p v-if="images[index - 1]"><strong>Image found</strong></p>
      <p v-else><strong>Image not found</strong></p>
      <img v-if="images[index - 1]" :src="images[index - 1].url" alt="Landsat Image" />
    </div>
  </div>
  <p v-else>Loading images...</p>

  <Button @click="downloadAllImages">Download all images</Button> <!-- Button to download all images -->
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import axios from 'axios';
import { useUserStore } from '@/stores/user';
import Button from 'primevue/button';

const userStore = useUserStore();
const images = ref<{ date: string, url: string }[]>([]);
const nextImageDate = ref('');
const currentImageDate = ref('');

const apiKey = 'nIpdeHFQvn3iTENBpC3ddtaHhLDOlIYGkMmWqPF8';

const normalizeCoordinate = (coord: string | number): string => {
  let normalized = String(coord).replace(',', '.');
  if (!normalized.includes('.')) {
    normalized += '.0';
  }
  return normalized;
};

const fetchImage = async (lat: string, lon: string) => {
  try {
    const response = await axios.get(
      `https://api.nasa.gov/planetary/earth/assets?lat=${lat}&lon=${lon}&api_key=${apiKey}`
    );
    if (response.data.url && response.data.date) {
      return { date: response.data.date, url: response.data.url }; // Return date along with URL
    }
    return null;
  } catch (error) {
    console.error('Error fetching image:', error);
    return null;
  }
};

const fetchSatelliteImages = async () => {
  const lat = parseFloat(normalizeCoordinate(userStore.latitude));
  const lon = parseFloat(normalizeCoordinate(userStore.longitude));

  const gridSize = 0.05;
  const offsets = [-gridSize, 0, gridSize];

  const imagePromises = offsets.flatMap(dLat => 
    offsets.map(dLon => {
      const centerLat = lat + dLat;
      const centerLon = lon + dLon;
      return fetchImage(String(centerLat), String(centerLon));
    })
  );

  const fetchedImages = await Promise.all(imagePromises);
  images.value = fetchedImages.filter(image => image !== null) as { date: string, url: string }[];

  // Set the current image date based on the first retrieved date
  if (images.value.length > 0) {
    currentImageDate.value = images.value[0].date; // Use the date of the first image
  }

  calculateNextImageDate(); // Calculate the next date
};

const calculateNextImageDate = () => {
  if (!currentImageDate.value) return;

  const currentDate = new Date(currentImageDate.value);
  const daysUntilNextImage = 16; // Interval for the next image
  const nextDate = new Date(currentDate);
  nextDate.setDate(currentDate.getDate() + daysUntilNextImage);
  nextImageDate.value = nextDate.toLocaleDateString();
};

const downloadImage = (url: string) => {
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = url;

  img.onload = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = url.split('/').pop()?.replace(/\.[^/.]+$/, '.png') || 'image.png';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  img.onerror = () => {
    console.error('Error loading image:', url);
  };
};

const downloadAllImages = async () => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    console.error('Failed to get drawing context.');
    return;
  }

  const imagePromises = images.value.map(image => {
    return new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous'; // To support cross-domain images
      img.src = image.url;

      img.onload = () => resolve(img);
      img.onerror = () => resolve(null);
    });
  });

  const loadedImages = await Promise.all(imagePromises);
  const validImages = loadedImages.filter(img => img !== null) as HTMLImageElement[];

  // Set the canvas size
  const imgSize = 200; // Size of each image in square
  const imagesPerRow = Math.ceil(Math.sqrt(validImages.length)); // Number of images per row
  const totalSize = imgSize * imagesPerRow; // Total size of canvas

  canvas.width = totalSize;
  canvas.height = totalSize;

  // Draw each image on the canvas
  validImages.forEach((img, index) => {
    const x = (index % imagesPerRow) * imgSize; // X-coordinate
    const y = Math.floor(index / imagesPerRow) * imgSize; // Y-coordinate
    ctx.drawImage(img, x, y, imgSize, imgSize); // Draw the image
  });

  // Download the canvas as PNG
  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = 'all_images.png'; // File name
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

onMounted(() => {
  fetchSatelliteImages();
});
</script>

<style scoped>
.images-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0; /* Remove gaps between images */
}

.image-container {
  padding: 0; /* Remove inner padding */
  text-align: center;
  border: 1px solid #ccc; /* Add border for visibility */
}

.image-container img {
  max-width: 100%;
  height: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 2px;
}

table, th, td {
  border: 1px solid black;
}

th, td {
  padding: 10px;
  text-align: center;
}
</style>
