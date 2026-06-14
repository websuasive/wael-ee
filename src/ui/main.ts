import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import { router } from './router';
import { useActiveReadingStore } from './stores/activeReading';
import './styles/main.css';
import './styles/components.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);

// Last-resort handler per RENDER.md section 8.5.
app.config.errorHandler = (err, _instance, info) => {
  // eslint-disable-next-line no-console
  console.error('[main.ts] errorHandler:', err, info);
};

// Restore any persisted fixture (dev mode) before mounting so the first
// route render sees the correct store state.
const store = useActiveReadingStore(pinia);
void store.restoreFromStorage().finally(() => {
  app.mount('#app');
});
