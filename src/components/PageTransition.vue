<template>
    <div class="cinematic-transition-container" ref="containerRef" v-show="isActive">
        <div class="shutter shutter-top" ref="shutterTopRef"></div>
        <div class="shutter shutter-bottom" ref="shutterBottomRef"></div>

        <div class="transition-border border-top" ref="borderTopRef"></div>
        <div class="transition-border border-bottom" ref="borderBottomRef"></div>

        <div class="overlay-content">
            <span class="scene-label" ref="labelRef">// SCENE LOADING</span>
            <h1 class="scene-title" ref="titleRef">{{ currentTitle }}</h1>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import gsap from 'gsap'

const isActive = ref(false)
const currentTitle = ref('NEXT PROJECT')

const containerRef = ref(null)
const shutterTopRef = ref(null)
const shutterBottomRef = ref(null)
const borderTopRef = ref(null)
const borderBottomRef = ref(null)
const labelRef = ref(null)
const titleRef = ref(null)

/**
 * Triggers the cinematic shutter wipe transition.
 * @param {string} title - The title to display during transition.
 * @param {Function} onMidpoint - Callback executed when curtains fully close (ideal for route changes).
 * @returns {Promise<void>}
 */
const playTransition = (title = 'NEXT SCENE', onMidpoint = null) => {
    return new Promise((resolve) => {
        currentTitle.value = title
        isActive.value = true

        const tl = gsap.timeline({
            onComplete: () => {
                isActive.value = false
                resolve()
            }
        })

        // 1. Reset states
        gsap.set([shutterTopRef.value, shutterBottomRef.value], { yPercent: (i) => (i === 0 ? -100 : 100) })
        gsap.set([borderTopRef.value, borderBottomRef.value], { scaleX: 0 })
        gsap.set([labelRef.value, titleRef.value], { opacity: 0, y: 30 })

        // 2. Shutters Closing Phase
        tl.to([shutterTopRef.value, shutterBottomRef.value], {
            yPercent: 0,
            duration: 0.8,
            ease: 'power4.inOut'
        })
        .to([borderTopRef.value, borderBottomRef.value], {
            scaleX: 1,
            duration: 0.6,
            ease: 'expo.out'
        }, '-=0.3')
        .to([labelRef.value, titleRef.value], {
            opacity: 1,
            y: 0,
            duration: 0.5,
            stagger: 0.1,
            ease: 'power3.out'
        }, '-=0.4')

        // 3. Midpoint execution (e.g., changing router route)
        .add(async () => {
            if (onMidpoint) {
                await onMidpoint()
            }
        })

        // 4. Hold Phase
        .to({}, { duration: 0.4 })

        // 5. Shutters Opening Phase
        .to([labelRef.value, titleRef.value], {
            opacity: 0,
            y: -20,
            duration: 0.4,
            ease: 'power2.in'
        })
        .to([borderTopRef.value, borderBottomRef.value], {
            scaleX: 0,
            duration: 0.4,
            ease: 'power2.in'
        }, '-=0.2')
        .to(shutterTopRef.value, {
            yPercent: -100,
            duration: 0.8,
            ease: 'power4.inOut'
        }, '-=0.1')
        .to(shutterBottomRef.value, {
            yPercent: 100,
            duration: 0.8,
            ease: 'power4.inOut'
        }, '<')
    })
}

defineExpose({
    playTransition
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@1,900&family=Inter:wght@400;600&display=swap');

.cinematic-transition-container {
    position: fixed;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
}

/* Dual Shutters */
.shutter {
    position: absolute;
    left: 0;
    width: 100%;
    height: 50vh;
    background-color: #050505;
    z-index: 1;
}
.shutter-top {
    top: 0;
}
.shutter-bottom {
    bottom: 0;
}

/* Framing Border Accent Lines */
.transition-border {
    position: absolute;
    left: 10%;
    right: 10%;
    height: 1px;
    background: rgba(255, 255, 255, 0.2);
    z-index: 2;
    transform-origin: center;
}
.border-top {
    top: 20%;
}
.border-bottom {
    bottom: 20%;
}

/* Center Content */
.overlay-content {
    position: relative;
    z-index: 3;
    text-align: center;
    color: #ffffff;
    padding: 0 20px;
}
.scene-label {
    display: block;
    font-family: 'Inter', sans-serif;
    font-size: clamp(10px, 1.2vw, 12px);
    letter-spacing: 4px;
    color: #888888;
    margin-bottom: 15px;
    text-transform: uppercase;
}
.scene-title {
    font-family: 'Playfair Display', serif;
    font-size: clamp(2rem, 6vw, 5.5rem);
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1;
}
</style>