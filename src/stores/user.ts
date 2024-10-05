import { ref } from 'vue';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', () => {
  const userId = ref<string>('');
  const latitude = ref<number | null>(0);  // Измените на null
  const longitude = ref<number | null>(0); // Измените на null

  return { userId, latitude, longitude };
});
