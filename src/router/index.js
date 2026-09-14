// router/index.js
import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/pages/home.vue'
import ProjectDetail from '@/pages/ProjectDetail.vue'

const router = createRouter({
    history: createWebHashHistory(),
    routes: [
        {
            path: '/',
            name: 'home',
            component: HomeView
        },
        {
            path: '/:slug',
            name: 'project-detail',
            component: ProjectDetail,
            props: true
        }
    ]
})

export default router