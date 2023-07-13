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
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue')
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
