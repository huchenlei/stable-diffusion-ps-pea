import { createRouter, createWebHistory, type RouteRecordName } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import GenerationView from '../views/GenerationView.vue';
import HistoryView from '../views/HistoryView.vue';
import ConfigView from '../views/ConfigView.vue';
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
    {
      path: '/history',
      name: 'history',
      component: HistoryView
    },
    {
      path: '/config',
      name: 'config',
      component: ConfigView
    },
  ]
});

router.beforeEach((to, from, next) => {
  const contextFreeRoutes = new Set<RouteRecordName>(['home', 'config']);
  const context = useA1111ContextStore().a1111Context;
  if (!contextFreeRoutes.has(to.name!) && !context.initialized) {
    next({ name: 'home' });
  } else {
    next();
  }
});

export default router
