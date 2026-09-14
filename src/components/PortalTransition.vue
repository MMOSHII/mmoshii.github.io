<template>
    <div ref="portalOverlay" class="portal-overlay">
        <div ref="irisMask" class="iris-mask"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import gsap from 'gsap';

const portalOverlay = ref(null);
const irisMask = ref(null);

const animateEntrance = (onMidpoint) => {
    return new Promise((resolve) => {
        const tl = gsap.timeline({
            onComplete: resolve
        });

        // Force hardware acceleration layer promotion
        gsap.set([portalOverlay.value, irisMask.value], { force3D: true });

        tl.set(portalOverlay.value, { display: 'flex', opacity: 1 })
          .set(irisMask.value, { scale: 0, opacity: 0 });

        // 1. Fade in & scale iris mask outward to block screen
        tl.to(irisMask.value, {
            scale: 35,
            opacity: 1,
            duration: 1.0,
            ease: 'expo.in',
            onComplete: () => {
                if (onMidpoint) onMidpoint();
            }
        })
        // 2. Dissolve mask to reveal Home gallery
        .to(portalOverlay.value, {
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out'
        })
        .set(portalOverlay.value, { display: 'none' });
    });
};

defineExpose({ animateEntrance });
</script>

<style scoped>
.portal-overlay {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: none;
    align-items: center;
    justify-content: center;
    background: transparent;
    pointer-events: none;
    overflow: hidden;
    will-change: opacity;
}

.iris-mask {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: #000000;
    box-shadow: 0 0 120px 60px rgba(0, 0, 0, 0.9);
    transform-origin: center center;
    will-change: transform, opacity;
}
</style>