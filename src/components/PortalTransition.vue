<template>
    <div ref="portalOverlay" class="portal-overlay">
        <div ref="portalCard" class="portal-card"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import gsap from 'gsap'

const portalOverlay = ref(null)
const portalCard = ref(null)

const animateEntrance = (onMidpoint) => {
    return new Promise((resolve) => {
        gsap.set(portalOverlay.value, { display: 'block', opacity: 1 })

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(portalOverlay.value, { display: 'none' })
                resolve()
            }
        })

        tl.to(portalCard.value, {
            duration: 0.9,
            ease: 'expo.inOut',
            onComplete: () => {
                if (onMidpoint) onMidpoint()
            }
        })
        .to(portalOverlay.value, {
            opacity: 0,
            duration: 0.5,
            ease: 'power2.out'
        })
    })
}

defineExpose({ animateEntrance })
</script>

<style scoped>
.portal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: none;
    pointer-events: none;
    overflow: hidden;
    will-change: opacity;
}

.portal-card {
    position: fixed;
    background-size: cover;
    background-position: center;
    will-change: transform;
}
</style>