<template>
    <div class="app-container">
        <PageTransition ref="cinematicRef" />
        <PortalTransition ref="portalRef" />

        <PreHome 
            v-if="showPreHome" 
            ref="preHomeRef"
            @enter="handlePreHomeEnter" 
        />

        <router-view v-else v-slot="{ Component }">
            <Transition name="fade" mode="out-in">
                <component :is="Component" />
            </Transition>
        </router-view>
    </div>
</template>

<script setup>
import { ref, computed, provide } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import PreHome from '@/components/PreHome.vue'
import PageTransition from '@/components/PageTransition.vue'
import PortalTransition from '@/components/PortalTransition.vue'

const route = useRoute()
const router = useRouter()

const hasEntered = ref(false)
const preHomeRef = ref(null)
const cinematicRef = ref(null)
const portalRef = ref(null)

const showPreHome = computed(() => {
    return route.path === '/' && !hasEntered.value
})

const handlePreHomeEnter = async () => {
    if (preHomeRef.value?.animateExit) {
        preHomeRef.value.animateExit()
    }

    if (portalRef.value?.animateEntrance) {
        await portalRef.value.animateEntrance(() => {
            hasEntered.value = true
        })
    } else {
        hasEntered.value = true
    }
}

const triggerCinematicNavigate = async (nextTitle, targetPath) => {
    if (cinematicRef.value) {
        await cinematicRef.value.playTransition(nextTitle, async () => {
            await router.push(targetPath)
            window.scrollTo(0, 0)
        })
    } else {
        router.push(targetPath)
    }
}

provide('triggerCinematicNavigate', triggerCinematicNavigate)
</script>

<style>
.app-container {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background-color: var(--bg-color);
}
</style>