<template>
    <div ref="portalOverlay" class="portal-overlay">
        <div ref="shutterTop" class="shutter shutter-top"></div>
        <div ref="shutterBottom" class="shutter shutter-bottom"></div>
        <div ref="apertureRing" class="aperture-ring"></div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import gsap from 'gsap'

const portalOverlay = ref(null)
const shutterTop = ref(null)
const shutterBottom = ref(null)
const apertureRing = ref(null)

const animateEntrance = (onMidpoint) => {
    return new Promise((resolve) => {
        gsap.set(portalOverlay.value, { display: 'block', opacity: 1 })
        gsap.set(shutterTop.value, { yPercent: -100 })
        gsap.set(shutterBottom.value, { yPercent: 100 })
        gsap.set(apertureRing.value, { scale: 0.2, opacity: 0 })

        const tl = gsap.timeline({
            onComplete: () => {
                gsap.set(portalOverlay.value, { display: 'none' })
                resolve()
            }
        })

        // 1. Close cinematic shutters + pulse ring at peak zoom
        tl.to([shutterTop.value, shutterBottom.value], {
            yPercent: 0,
            duration: 0.55,
            ease: 'expo.inOut'
        }, 0)
        .to(apertureRing.value, {
            scale: 1.4,
            opacity: 0.85,
            duration: 0.45,
            ease: 'power2.out'
        }, 0.1)
        // 2. Swap route/view while covered
        .add(() => {
            if (onMidpoint) onMidpoint()
        }, 0.55)
        // 3. Part shutters smoothly to reveal Home gallery
        .to(apertureRing.value, {
            scale: 2.5,
            opacity: 0,
            duration: 0.45,
            ease: 'power2.in'
        }, 0.55)
        .to(shutterTop.value, {
            yPercent: -100,
            duration: 0.75,
            ease: 'expo.inOut'
        }, 0.6)
        .to(shutterBottom.value, {
            yPercent: 100,
            duration: 0.75,
            ease: 'expo.inOut'
        }, 0.6)
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
}

.shutter {
    position: absolute;
    left: 0;
    width: 100%;
    height: 50.5%;
    background: #050505;
    will-change: transform;
}

.shutter-top {
    top: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

.shutter-bottom {
    bottom: 0;
    border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.aperture-ring {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 240px;
    height: 240px;
    margin: -120px 0 0 -120px;
    border-radius: 50%;
    border: 1px solid rgba(255, 255, 255, 0.4);
    box-shadow: 0 0 60px rgba(255, 255, 255, 0.15), inset 0 0 40px rgba(255, 255, 255, 0.08);
    will-change: transform, opacity;
}
</style>