import { createRouter, createWebHashHistory } from 'vue-router'
import ProjectDetail from '@/pages/ProjectDetail.vue'
import HomeView from '@/pages/Home.vue'

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