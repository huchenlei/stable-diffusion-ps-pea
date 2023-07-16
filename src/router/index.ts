import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GenerationView from '../views/GenerationView.vue';
import { useA1111ContextStore } from '@/stores/a1111ContextStore';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/generation',
      name: 'generation',
      component: GenerationView
    },
  ]
});

router.beforeEach((to, from, next) => {
  const context = useA1111ContextStore().a1111Context;
  if (to.name !== 'home' && !context.initialized) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router
