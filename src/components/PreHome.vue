<template>
    <div 
        ref="pageContainer"
        class="page-container"
        @mousedown="startHold"
        @mouseup="cancelHold"
        @mouseleave="cancelHold"
        @touchstart.passive="startHold"
        @touchend="cancelHold"
    >
        <CustomCursor :is-holding="isHolding" :progress="holdProgress" />

        <div ref="bgOverlay" class="bg-overlay">
            <!-- Row 1 Top -->
            <div class="row row-left">
                <div class="row-inner">
                    <div v-for="(n, idx) in 5" :key="`top-1-${n}`" class="card" :ref="el => setCardRef(el, idx)">
                        <img :src="getCardImage(idx)" :alt="`Project Image ${n}`" loading="eager" />
                    </div>
                </div>
                <div class="row-inner">
                    <div v-for="(n, idx) in 5" :key="`top-2-${n}`" class="card" :ref="el => setCardRef(el, idx + 5)">
                        <img :src="getCardImage(idx + 5)" :alt="`Project Image ${n}`" loading="eager" />
                    </div>
                </div>
            </div>

            <!-- Row 2 Center -->
            <div class="row row-right">
                <div class="row-inner">
                    <div v-for="(n, idx) in 5" :key="`center-1-${n}`" class="card" :ref="el => setCardRef(el, idx + 10)">
                        <img :src="getCardImage(idx + 2)" :alt="`Project Image ${n + 5}`" loading="eager" />
                    </div>
                </div>
                <div class="row-inner">
                    <div v-for="(n, idx) in 5" :key="`center-2-${n}`" class="card" :ref="el => setCardRef(el, idx + 15)">
                        <img :src="getCardImage(idx + 7)" :alt="`Project Image ${n + 5}`" loading="eager" />
                    </div>
                </div>
            </div>

            <!-- Row 3 Bottom -->
            <div class="row row-left">
                <div class="row-inner">
                    <div v-for="(n, idx) in 5" :key="`bottom-1-${n}`" class="card" :ref="el => setCardRef(el, idx + 20)">
                        <img :src="getCardImage(idx + 4)" :alt="`Project Image ${n + 10}`" loading="eager" />
                    </div>
                </div>
                <div class="row-inner">
                    <div v-for="(n, idx) in 5" :key="`bottom-2-${n}`" class="card" :ref="el => setCardRef(el, idx + 25)">
                        <img :src="getCardImage(idx + 9)" :alt="`Project Image ${n + 10}`" loading="eager" />
                    </div>
                </div>
            </div>
        </div>

        <div class="corner-vignette"></div>

        <div class="font-preload-container" aria-hidden="true">
            <span style="font-family: 'Great Vibes', cursive;">M P</span>
            <span style="font-family: 'Cinzel', serif;">y roject</span>
        </div>

        <main class="content-wrapper">
            <div class="hero-container">
                <div ref="eyebrowRef" class="brand-eyebrow">MMOSHII. Github</div>
                
                <div class="title-canvas-wrapper" ref="canvasContainer"></div>

                <div ref="dividerRef" class="title-divider"></div>
                <p ref="subtitleRef" class="brand-subtitle">Press and hold anywhere to enter</p>
            </div>
        </main>

        <footer ref="footerRef" class="site-footer">
            <div class="footer-location">
                <span class="status-dot"></span>
                <span>Medan, Indonesia</span>
            </div>
            <div class="footer-time">{{ currentTime }} GMT+7</div>
        </footer>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import gsap from 'gsap'
import * as THREE from 'three'
import CustomCursor from '@/components/CustomCursor.vue'
import projectData from '@/data/projects.json'

const emit = defineEmits(['enter'])

const pageContainer = ref(null)
const bgOverlay = ref(null)
const eyebrowRef = ref(null)
const dividerRef = ref(null)
const subtitleRef = ref(null)
const footerRef = ref(null)
const isMobile = ref(false)
const canvasContainer = ref(null)

const cardRefs = []
const setCardRef = (el, idx) => {
    if (el) cardRefs[idx] = el
}

const currentTime = ref('00:00:00')
let timer = null

let leftTween = null
let rightTween = null

const HOLD_DURATION = 1800
const DECAY_SPEED = 2.5
const isHolding = ref(false)
const holdProgress = ref(0)
let rawHoldProgress = 0 // Non-reactive tracker for RAF loop
let animationFrame = null

const checkMobile = () => {
    isMobile.value = window.innerWidth <= 768
}

const getCardImage = (indexOffset) => {
    if (!projectData || projectData.length === 0) return ''
    const index = Math.abs(indexOffset) % projectData.length
    const rawPath = projectData[index].image
    if (rawPath.startsWith('/')) return rawPath
    return new URL(`../${rawPath.replace('./', '')}`, import.meta.url).href
}

// Directly updates DOM styles to prevent Vue reactivity overhead during hold animation loop
const updateHoldStyles = (progressValue) => {
    const ratio = progressValue / 100
    
    if (pageContainer.value) {
        const grayscaleVal = 100 - (ratio * 100)
        const opacityVal = 0.28 + (ratio * 0.52)
        const scaleVal = 1 + (ratio * 0.35)
        const perspectiveVal = 1200 - (ratio * 400)

        const style = pageContainer.value.style
        style.setProperty('--bg-grayscale', `${grayscaleVal}%`)
        style.setProperty('--bg-opacity', opacityVal)
        style.setProperty('--bg-scale', scaleVal)
        style.setProperty('--bg-perspective', `${perspectiveVal}px`)
    }

    const maxRotation = 25 * ratio
    const maxDepth = -180 * ratio
    const cardScaleVal = 1 + (ratio * 0.15)

    cardRefs.forEach((card) => {
        if (!card) return
        const idx = cardRefs.indexOf(card) % 5
        const centerOffset = idx - 2
        const rotateY = centerOffset * (maxRotation / 2)
        const translateZ = -Math.abs(centerOffset) * (Math.abs(maxDepth) / 2)

        card.style.transform = `rotateY(${rotateY}deg) translateZ(${translateZ}px) scale(${cardScaleVal})`
    })
}

const updateMarqueeSpeed = (progressRatio) => {
    const currentSpeed = 1 + (progressRatio * 25)
    if (leftTween) leftTween.timeScale(currentSpeed)
    if (rightTween) rightTween.timeScale(currentSpeed)
}

const startHold = () => {
    if (animationFrame) cancelAnimationFrame(animationFrame)
    isHolding.value = true

    const currentProgressRatio = rawHoldProgress / 100
    const startTime = Date.now() - (currentProgressRatio * HOLD_DURATION)

    const updateProgress = () => {
        if (!isHolding.value) return

        const elapsedTime = Date.now() - startTime
        rawHoldProgress = Math.min((elapsedTime / HOLD_DURATION) * 100, 100)
        holdProgress.value = rawHoldProgress

        updateHoldStyles(rawHoldProgress)
        updateMarqueeSpeed(rawHoldProgress / 100)

        if (rawHoldProgress >= 100) {
            completeHold()
        } else {
            animationFrame = requestAnimationFrame(updateProgress)
        }
    }

    animationFrame = requestAnimationFrame(updateProgress)
}

const cancelHold = () => {
    if (!isHolding.value && rawHoldProgress === 0) return

    isHolding.value = false
    if (animationFrame) cancelAnimationFrame(animationFrame)

    let lastTime = Date.now()

    const decayProgress = () => {
        if (isHolding.value) return

        const now = Date.now()
        const deltaTime = now - lastTime
        lastTime = now

        rawHoldProgress = Math.max(0, rawHoldProgress - (deltaTime / HOLD_DURATION) * 100 * DECAY_SPEED)
        holdProgress.value = rawHoldProgress

        updateHoldStyles(rawHoldProgress)
        updateMarqueeSpeed(rawHoldProgress / 100)

        if (rawHoldProgress > 0) {
            animationFrame = requestAnimationFrame(decayProgress)
        }
    }

    animationFrame = requestAnimationFrame(decayProgress)
}

const completeHold = () => {
    isHolding.value = false
    rawHoldProgress = 0
    holdProgress.value = 0
    updateHoldStyles(0)
    if (animationFrame) cancelAnimationFrame(animationFrame)
    emit('enter')
}

// WebGL Variables
let renderer, scene, camera, animationFrameId
let trailCanvas, trailCtx, trailTexture
let material, textTexture

const mouse = { x: 0, y: 0, prevX: 0, prevY: 0, speed: 0 }
const trailPoints = []

const createTextTexture = () => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 2048
    canvas.height = 396

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    ctx.font = '400 230px "Great Vibes", cursive'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('M', canvas.width / 2 - 490, canvas.height / 2 - 10)

    ctx.font = '500 160px "Cinzel", serif'
    ctx.fillText('y', canvas.width / 2 - 290, canvas.height / 2)

    ctx.font = '400 230px "Great Vibes", cursive'
    ctx.fillText('P', canvas.width / 2 - 40, canvas.height / 2)

    ctx.font = '500 160px "Cinzel", serif'
    ctx.fillText('roject', canvas.width / 2 + 310, canvas.height / 2)

    return new THREE.CanvasTexture(canvas)
}

const initTrailCanvas = () => {
    trailCanvas = document.createElement('canvas')
    // Downsized displacement buffer for lightweight fill updates
    trailCanvas.width = 256
    trailCanvas.height = 256
    trailCtx = trailCanvas.getContext('2d', { willReadFrequently: true })
    trailCtx.fillStyle = 'black'
    trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height)
    trailTexture = new THREE.CanvasTexture(trailCanvas)
    trailTexture.minFilter = THREE.LinearFilter
    trailTexture.magFilter = THREE.LinearFilter
}

const vertexShader = `
    varying vec2 vUv;
    void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`

const fragmentShader = `
    uniform sampler2D uTexture;
    uniform sampler2D uDisplacement;
    varying vec2 vUv;

    void main() {
        vec4 disp = texture2D(uDisplacement, vUv);
        float intensity = disp.r;
        vec2 uv = vUv;
        uv.x += sin(uv.y * 35.0) * intensity * 0.02;
        uv.y += sin(uv.x * 35.0) * intensity * 0.02;
        float split = intensity * 0.03; 
        float red = texture2D(uTexture, uv + vec2(split, 0.0)).r;
        float green = texture2D(uTexture, uv).g;
        float blue = texture2D(uTexture, uv - vec2(split, 0.0)).b;
        float alpha = max(red, max(green, blue));
        gl_FragColor = vec4(red, green, blue, alpha);
    }
`

const handleMouseMove = (e) => {
    if (!canvasContainer.value) return
    const rect = canvasContainer.value.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    if (x >= 0 && x <= 1 && y >= 0 && y <= 1) {
        const dx = x - mouse.prevX
        const dy = y - mouse.prevY
        mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy) * 35.0, 1.0)

        trailPoints.push({
            x: x * trailCanvas.width,
            y: y * trailCanvas.height,
            age: 0,
            force: Math.max(0.4, mouse.speed) 
        })
    }

    mouse.prevX = x
    mouse.prevY = y
}

const handleResize = () => {
    if (!canvasContainer.value || !renderer) return
    const width = canvasContainer.value.clientWidth
    const height = canvasContainer.value.clientHeight
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
}

const initWebGL = () => {
    if (!canvasContainer.value) return
    const width = canvasContainer.value.clientWidth
    const height = canvasContainer.value.clientHeight

    scene = new THREE.Scene()
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" })
    renderer.setSize(width, height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5))
    
    canvasContainer.value.innerHTML = ''
    canvasContainer.value.appendChild(renderer.domElement)

    initTrailCanvas()
    textTexture = createTextTexture()

    material = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        transparent: true,
        uniforms: {
            uTexture: { value: textTexture },
            uDisplacement: { value: trailTexture }
        }
    })

    const geometry = new THREE.PlaneGeometry(2, 2)
    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('resize', handleResize)

    const animate = () => {
        if (trailPoints.length > 0) {
            trailCtx.fillStyle = 'rgba(0, 0, 0, 0.05)'
            trailCtx.fillRect(0, 0, trailCanvas.width, trailCanvas.height)

            const maxAge = 40
            for (let i = trailPoints.length - 1; i >= 0; i--) {
                const p = trailPoints[i]
                p.age += 1

                const radius = Math.max(0, 50 * p.force * (1 - p.age / maxAge))
                if (radius > 0) {
                    const gradient = trailCtx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius)
                    gradient.addColorStop(0, `rgba(255, 255, 255, ${0.8 * (1 - p.age / maxAge)})`)
                    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')

                    trailCtx.beginPath()
                    trailCtx.fillStyle = gradient
                    trailCtx.arc(p.x, p.y, radius, 0, Math.PI * 2)
                    trailCtx.fill()
                } else {
                    trailPoints.splice(i, 1)
                }
            }

            trailTexture.needsUpdate = true
        }

        renderer.render(scene, camera)
        animationFrameId = requestAnimationFrame(animate)
    }

    animate()
}

const animateExit = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power4.in' } })

    tl.to(canvasContainer.value, {
        scale: 2.2,
        opacity: 0,
        filter: 'blur(20px)',
        duration: 0.9
    }, 0)
    .to([eyebrowRef.value, dividerRef.value, subtitleRef.value, footerRef.value], {
        opacity: 0,
        y: -30,
        duration: 0.6,
        stagger: 0.05
    }, 0)
    .to(bgOverlay.value, {
        scale: 4,
        opacity: 0.8,
        filter: 'grayscale(0%) contrast(150%)',
        duration: 1.1
    }, 0)
}

defineExpose({ animateExit })

const runEntranceAnimation = () => {
    const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

    gsap.set([eyebrowRef.value, subtitleRef.value, footerRef.value], { 
        opacity: 0, 
        y: 20 
    })
    gsap.set(canvasContainer.value, { 
        opacity: 0, 
        scale: 0.92, 
        filter: 'blur(10px)' 
    })
    gsap.set(dividerRef.value, { 
        scaleX: 0, 
        opacity: 0 
    })
    gsap.set(bgOverlay.value, { 
        opacity: 0 
    })

    tl.to(bgOverlay.value, {
        opacity: 0.28,
        duration: 1.8,
        ease: 'power2.inOut'
    })
    .to(eyebrowRef.value, {
        opacity: 1,
        y: 0,
        duration: 0.8
    }, '-=1.2')
    .to(canvasContainer.value, {
        opacity: 1,
        scale: 1,
        filter: 'blur(0px)',
        duration: 1.2,
        ease: 'power2.out'
    }, '-=0.6')
    .to(dividerRef.value, {
        scaleX: 1,
        opacity: 0.4,
        duration: 0.8,
        ease: 'expo.out'
    }, '-=0.5')
    .to(subtitleRef.value, {
        opacity: 1,
        y: 0,
        duration: 0.8
    }, '-=0.4')
    .to(footerRef.value, {
        opacity: 1,
        y: 0,
        duration: 0.8
    }, '-=0.6')
}

const updateClock = () => {
    const now = new Date()
    const options = {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    }
    currentTime.value = new Intl.DateTimeFormat('en-GB', options).format(now)
}

const loadFontsAndInit = async () => {
    try {
        await document.fonts.ready
        await Promise.all([
            document.fonts.load('400 100px "Great Vibes"'),
            document.fonts.load('500 100px "Cinzel"')
        ])
    } catch (err) {
    } finally {
        initWebGL()
        runEntranceAnimation()
    }
}

onMounted(() => {
    checkMobile()
    window.addEventListener('resize', checkMobile)

    leftTween = gsap.to('.row-left', {
        xPercent: -50,
        duration: 35,
        ease: 'none',
        repeat: -1,
        force3D: true
    })

    rightTween = gsap.fromTo('.row-right', {
        xPercent: -50
    }, {
        xPercent: 0,
        duration: 40,
        ease: 'none',
        repeat: -1,
        force3D: true
    })

    updateClock()
    timer = setInterval(updateClock, 1000)
    loadFontsAndInit()
})

onUnmounted(() => {
    window.removeEventListener('mousemove', handleMouseMove)
    window.removeEventListener('resize', handleResize)
    window.removeEventListener('resize', checkMobile)
    if (timer) clearInterval(timer)
    if (animationFrameId) cancelAnimationFrame(animationFrameId)
    if (renderer) renderer.dispose()
})
</script>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Great+Vibes&family=Inter:wght@300;400;600&display=swap");

.page-container {
    background-color: #000000;
    color: #ffffff;
    font-family: "Inter", system-ui, -apple-system, sans-serif;
    overflow: hidden;
    min-height: 100vh;
    position: relative;
    user-select: none;
    contain: layout style paint;
}

.bg-overlay {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 180vmax;
    height: 180vmax;
    z-index: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 2.5rem;
    overflow: hidden;
    pointer-events: none;
    
    perspective: var(--bg-perspective, 1200px);
    transform-style: preserve-3d;
    transform: translate(-50%, -50%) rotate(30deg) scale(var(--bg-scale, 1));
    
    opacity: var(--bg-opacity, 0.28);
    filter: grayscale(var(--bg-grayscale, 100%)) contrast(120%);
    will-change: transform, opacity, filter;
}

.card {
    width: 400px;
    height: 250px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;
    background-color: #1a1a1a;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transform-style: preserve-3d;
    will-change: transform;
    contain: strict;
}

.card img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    backface-visibility: hidden;
}

.corner-vignette {
    position: fixed;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: radial-gradient(
            circle at 100% 0%,
            rgba(0, 0, 0, 0.98) 0%,
            rgba(0, 0, 0, 0.6) 35%,
            transparent 70%
        ),
        radial-gradient(
            circle at 0% 100%,
            rgba(0, 0, 0, 0.98) 0%,
            rgba(0, 0, 0, 0.6) 35%,
            transparent 70%
        );
}

.row {
    display: flex;
    width: max-content;
    height: max-content;
    will-change: transform;
}

.row-inner {
    display: flex;
    gap: 2rem;
    padding-right: 2rem;
    height: 100%;
}

.content-wrapper {
    position: relative;
    z-index: 3;
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem 1rem;
}

.hero-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    width: 100%;
    max-width: 1200px;
}

.brand-eyebrow {
    font-family: "Inter", sans-serif;
    font-size: clamp(0.6rem, 1.2vw, 0.85rem);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.6em;
    color: rgba(255, 255, 255, 0.6);
    margin-bottom: 1rem;
    margin-left: 0.6em;
    will-change: transform, opacity;
}

.title-canvas-wrapper {
    width: 100%;
    max-width: 950px;
    height: clamp(100px, 20vw, 230px);
    will-change: transform, opacity, filter;
}

.title-canvas-wrapper canvas {
    width: 100% !important;
    height: 100% !important;
}

.title-divider {
    width: clamp(30px, 6vw, 60px);
    height: 1px;
    background-color: rgba(255, 255, 255, 0.4);
    margin-bottom: 2rem;
    will-change: transform, opacity;
}

.brand-subtitle {
    font-family: "Inter", sans-serif;
    font-size: clamp(0.65rem, 1.5vw, 0.95rem);
    font-weight: 300;
    color: #d1d5db;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    padding: 0 1rem;
    will-change: transform, opacity;
}

.font-preload-container {
    position: absolute;
    opacity: 0;
    pointer-events: none;
    top: -9999px;
    left: -9999px;
    visibility: hidden;
}

.site-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem 3rem;
    font-family: "Inter", sans-serif;
    font-size: clamp(0.65rem, 1.2vw, 0.75rem);
    font-weight: 400;
    letter-spacing: 0.25em;
    text-transform: uppercase;
    color: rgba(255, 255, 255, 0.5);
    pointer-events: none;
    will-change: transform, opacity;
}

.footer-location {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.status-dot {
    width: 6px;
    height: 6px;
    background-color: #ffffff;
    border-radius: 50%;
    display: inline-block;
    opacity: 0.8;
    box-shadow: 0 0 8px rgba(255, 255, 255, 0.8);
}

@media (max-width: 768px) {
    .bg-overlay {
        width: 130vmax !important;
        height: 130vmax !important;
        gap: 1rem !important;
        filter: none !important;
    }

    .card {
        transform-style: flat !important;
    }

    .title-canvas-wrapper {
        filter: none !important;
    }

    .row-inner {
        gap: 1rem;
        padding-right: 1rem;
    }
    
    .site-footer {
        padding: 1rem 1.5rem;
        flex-direction: column;
        gap: 0.4rem;
        text-align: center;
    }
}
</style>