<template>
    <div class="custom-cursor-dot" ref="cursorDot" :class="{ holding: isHolding }"></div>
    <div class="custom-cursor-circle" ref="cursorCircle" :class="{ holding: isHolding }">
        <!-- SVG Progress Ring surrounding the cursor -->
        <svg 
            class="progress-ring" 
            :class="{ active: isHolding }"
            width="88" 
            height="88"
            viewBox="0 0 88 88"
        >
            <defs>
                <!-- Glowing Gradient -->
                <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stop-color="#ffffff" />
                    <stop offset="100%" stop-color="#888888" />
                </linearGradient>

                <!-- Soft Outer Glow Filter -->
                <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="2" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
            </defs>

            <!-- Background Track Circle -->
            <circle
                class="progress-circle-bg"
                cx="44"
                cy="44"
                r="36"
            />

            <!-- Foreground Animated Progress Circle -->
            <circle
                class="progress-circle"
                cx="44"
                cy="44"
                r="36"
                filter="url(#glow)"
                :style="{ strokeDasharray: circleCircumference, strokeDashoffset: progressOffset }"
            />
        </svg>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
    isHolding: {
        type: Boolean,
        default: false
    },
    progress: {
        type: Number,
        default: 0
    }
})

const cursorDot = ref(null)
const cursorCircle = ref(null)
let cursorAnimationFrame = null

const cursor = {
    x: -100,
    y: -100,
    targetX: -100,
    targetY: -100
}

const RADIUS = 36
const circleCircumference = 2 * Math.PI * RADIUS

const progressOffset = computed(() => {
    const clampedProgress = Math.min(Math.max(props.progress, 0), 100)
    return circleCircumference - (clampedProgress / 100) * circleCircumference
})

const animateCursor = () => {
    cursor.x += (cursor.targetX - cursor.x) * 0.18
    cursor.y += (cursor.targetY - cursor.y) * 0.18

    if (cursorDot.value) {
        cursorDot.value.style.transform = `translate3d(${cursor.targetX}px, ${cursor.targetY}px, 0)`
    }
    if (cursorCircle.value) {
        cursorCircle.value.style.transform = `translate3d(${cursor.x}px, ${cursor.y}px, 0)`
    }

    cursorAnimationFrame = requestAnimationFrame(animateCursor)
}

const handleMouseMove = (e) => {
    cursor.targetX = e.clientX
    cursor.targetY = e.clientY
}

onMounted(() => {
    window.addEventListener('mousemove', handleMouseMove)
    animateCursor()
})

onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    if (cursorAnimationFrame) cancelAnimationFrame(cursorAnimationFrame)
})
</script>

<style scoped>
/* Center dot */
.custom-cursor-dot {
    position: fixed;
    top: 0;
    left: 0;
    width: 8px;
    height: 8px;
    margin-top: -4px;
    margin-left: -4px;
    background-color: #ffffff;
    border-radius: 50%;
    pointer-events: none;
    z-index: 99999; /* Kept on top layer */
    will-change: transform;
    
    /* Inverts background colors underneath the dot */
    mix-blend-mode: difference;
    
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.custom-cursor-dot.holding {
    transform: scale(1.6);
}

/* Outer Ring Wrapper with Color Inversion */
.custom-cursor-circle {
    position: fixed;
    top: 0;
    left: 0;
    width: 80px;
    height: 80px;
    margin-top: -40px;
    margin-left: -40px;
    /* Pure white border so difference blending inverts properly */
    border: 1px solid rgba(255, 255, 255, 0.6);
    border-radius: 50%;
    pointer-events: none;
    z-index: 9998;
    will-change: transform;
    display: flex;
    align-items: center;
    justify-content: center;
    
    /* Inverts colors beneath the outer ring */
    mix-blend-mode: difference;
    
    transition: border-color 0.3s ease, transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.custom-cursor-circle.holding {
    border-color: rgba(255, 255, 255, 0.2);
}

/* Progress SVG Ring */
.progress-ring {
    position: absolute;
    inset: -4px;
    width: 88px;
    height: 88px;
    transform: rotate(-90deg);
    opacity: 0;
    transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
}

.progress-ring.active {
    opacity: 1;
    transform: rotate(-90deg) scale(1.05);
}

.progress-circle-bg {
    fill: transparent;
    stroke: rgba(255, 255, 255, 0.2);
    stroke-width: 2.5;
}

.progress-circle {
    fill: transparent;
    /* Changed to solid white for clear difference blending */
    stroke: #ffffff;
    stroke-width: 2.5;
    stroke-linecap: round;
    transition: stroke-dashoffset 0.08s ease-out;
}

@media (hover: none) and (pointer: coarse) {
    .custom-cursor-dot,
    .custom-cursor-circle {
        display: none;
    }
}
</style>