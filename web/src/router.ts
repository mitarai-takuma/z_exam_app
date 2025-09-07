import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import App from './App.vue'

const routes: RouteRecordRaw[] = [
  {
    path: '/:round/:section/:id',
    component: App,
  },
  {
    path: '/:pathMatch(.*)*',
    component: App,
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router
