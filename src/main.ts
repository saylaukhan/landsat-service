import './assets/main.css'
import 'primevue/resources/themes/saga-blue/theme.css'
import 'primeicons/primeicons.css'
import 'primeflex/primeflex.css'

import { initializeApp } from 'firebase/app'
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import Menubar from 'primevue/menubar'
import Button from 'primevue/button'
import InputText from 'primevue/inputtext'
import Toast from 'primevue/toast'
import ToastService from 'primevue/toastservice'
import ProgressSpinner from 'primevue/ProgressSpinner'
import InputNumber from 'primevue/inputnumber';


import App from './App.vue'
import router from './router'

const firebaseConfig = {
  apiKey: "AIzaSyDYGsHQPYLbk1X0k6KgYVKO0Xri8BYoy_8",
  authDomain: "nasa-space-app-69d48.firebaseapp.com",
  projectId: "nasa-space-app-69d48",
  storageBucket: "nasa-space-app-69d48.appspot.com",
  messagingSenderId: "372488169677",
  appId: "1:372488169677:web:3147b5b9c8d8ab565a2184",
  measurementId: "G-D0CK6Z2Y75"
};

initializeApp(firebaseConfig)

const app = createApp(App)

app.use(ToastService)
app.use(createPinia())
app.use(router)
app.use(PrimeVue)
app.component('app-input-number',InputNumber)
app.component('app-menubar', Menubar)
app.component('app-button', Button)
app.component('app-input-text', InputText)
app.component('app-toast', Toast)
app.component('app-progress', ProgressSpinner)

app.mount('#app')
