<template>
    <div 
        class="gallery-app" 
        @wheel.prevent="handleWheel"
        @touchstart="handleTouchStart"
        @touchmove="handleTouchMove"
        @touchend="handleTouchEnd"
    >
        <CustomCursor :is-holding="isAnimating" :progress="0" />

        <div class="bg-blur">
            <div 
                v-for="(item, index) in items" 
                :key="'bg-' + item.id"
                class="bg-image-wrapper"
                :class="{ active: activeIndex === index }"
            >
                <img :src="item.image" class="bg-image" alt="" />
            </div>
            <div class="bg-overlay"></div>
        </div>

        <div class="border-top desktop-only"></div>
        <div class="border-bottom desktop-only"></div>
        <div class="border-left desktop-only"></div>
        <div class="border-right desktop-only"></div>

        <aside class="sidebar-left desktop-only">
            <div class="sidebar-text">// SOCIAL //</div>
            <div class="social-links">
                <a href="https://github.com/MMOSHII" target="_blank" rel="noopener noreferrer" class="social-item">
                    <span class="label">GH</span>
                    <span class="tooltip desktop-only">GITHUB</span>
                </a>
                <a href="https://www.linkedin.com/in/achmad-hadi-rasyid" target="_blank" rel="noopener noreferrer" class="social-item">
                    <span class="label">LI</span>
                    <span class="tooltip desktop-only">LINKEDIN</span>
                </a>
                <a href="https://www.instagram.com/shiao_11421/" target="_blank" rel="noopener noreferrer" class="social-item">
                    <span class="label">IG</span>
                    <span class="tooltip desktop-only">INSTAGRAM</span>
                </a>
            </div>
            <div class="sidebar-text bottom">// LINKS //</div>
        </aside>

        <header class="mobile-header mobile-only">
            <span class="mobile-brand">// GALLERY //</span>
            <div class="mobile-socials">
                <a href="https://github.com/MMOSHII" target="_blank" rel="noopener noreferrer">GH</a>
                <a href="https://www.linkedin.com/in/achmad-hadi-rasyid" target="_blank" rel="noopener noreferrer">LI</a>
                <a href="https://www.instagram.com/shiao_11421/" target="_blank" rel="noopener noreferrer">IG</a>
            </div>
        </header>

        <aside class="sidebar-right">
            <div class="sidebar-text desktop-only">// INDEX //</div>
            <div class="vertical-tracker">
                <div 
                    v-for="(item, index) in items" 
                    :key="'track-' + item.id"
                    class="tracker-dash"
                    :class="{ active: activeIndex === index }"
                    @click="goToSlide(index)"
                    :aria-label="`Go to slide ${index + 1}`"
                >
                    <span class="tooltip desktop-only">{{ item.title }}</span>
                </div>
            </div>
            <div class="sidebar-text bottom desktop-only">2026</div>
        </aside>

        <main class="gallery-container">
            <transition-group 
                :css="false"
                @before-enter="onBeforeEnter"
                @enter="onEnter"
                @leave="onLeave"
                tag="div" 
                class="gallery-track"
            >
                <section 
                    v-for="(item, index) in items" 
                    :key="item.id" 
                    v-show="activeIndex === index"
                    class="gallery-section"
                >
                    <div class="image-wrapper" @click="navigateToProject(item.slug)">
                        <div class="img-inner">
                            <img :src="item.image" :alt="item.title" />

                            <div class="title-wrapper">
                                <div class="title-mask">
                                    <h1 class="main-title">{{ item.title }}</h1>
                                </div>
                                <div class="subtitle-mask">
                                    <p class="subtitle">{{ item.subtitle }}</p>
                                </div>
                            </div>
                        </div>

                        <div class="glass-border"></div>

                        <div class="meta-row top">
                            <span class="meta-block">{{ item.metaTopLeft }}</span>
                            <span class="meta-block right desktop-only">{{ item.metaTopRight }}</span>
                        </div>
                        <div class="meta-row bottom">
                            <span class="meta-block">{{ item.year }}</span>
                            <span class="meta-block right">{{ item.metaBottomRight }}</span>
                        </div>
                    </div>
                </section>
            </transition-group>
        </main>

        <div class="mobile-swipe-hint mobile-only">
            <span>SWIPE TO NAVIGATE</span>
        </div>
    </div>
</template>

<script setup>
import { ref, inject, onMounted } from 'vue';
import gsap from 'gsap';
import projectData from '@/data/projects.json';
import CustomCursor from '@/components/CustomCursor.vue';

const activeIndex = ref(0);
const isAnimating = ref(false);
const direction = ref(1);

let touchStartY = 0;
let touchEndY = 0;

// Throttle configuration for mouse wheel / trackpad
let lastScrollTime = 0;
const SCROLL_COOLDOWN_MS = 800; // Time in ms before a new scroll can be triggered

const items = ref(projectData);
const triggerCinematicNavigate = inject('triggerCinematicNavigate');

const navigateToProject = (slug) => {
    if (isAnimating.value) return; // Prevent navigation clicks while transitioning
    const currentProject = items.value.find(p => p.slug === slug);
    const title = currentProject ? currentProject.title : 'PROJECT';
    
    if (triggerCinematicNavigate) {
        triggerCinematicNavigate(title, `/${slug}`);
    }
};

const goToSlide = (index) => {
    // Guard against clicks/scrolls during active transition
    if (isAnimating.value || activeIndex.value === index) return;
    direction.value = index > activeIndex.value ? 1 : -1;
    activeIndex.value = index;
};

const changeSlide = (dir) => {
    // Strict Guard: block transition request if already animating
    if (isAnimating.value) return;
    
    direction.value = dir;
    if (dir === 1) {
        activeIndex.value = (activeIndex.value + 1) % items.value.length;
    } else {
        activeIndex.value = (activeIndex.value - 1 + items.value.length) % items.value.length;
    }
};

const onBeforeEnter = (el) => {
    isAnimating.value = true; // Lock animations
    const imgWrapper = el.querySelector('.image-wrapper');
    const img = el.querySelector('.img-inner img');
    const title = el.querySelector('.main-title');
    const subtitle = el.querySelector('.subtitle');
    const metas = el.querySelectorAll('.meta-block');
    const dir = direction.value;

    const isMobile = window.innerWidth <= 768;

    if (title.textContent.length > 12) {
        title.style.fontSize = isMobile ? 'clamp(1.5rem, 6.5vw, 2.5rem)' : 'clamp(1.8rem, 5.5vw, 6.5vw)';
    } else {
        title.style.fontSize = isMobile ? 'clamp(1.8rem, 8.5vw, 3.2rem)' : '';
    }

    gsap.set(el, { opacity: 1, zIndex: 10 });
    
    gsap.set(imgWrapper, { 
        yPercent: dir * 80, 
        scale: 0.88,
        clipPath: dir > 0 ? 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)' : 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)'
    });
    
    gsap.set(img, { scale: 1.35, yPercent: dir * -25 });
    gsap.set(title, { yPercent: dir * 130, opacity: 0 });
    gsap.set(subtitle, { yPercent: dir * 120, opacity: 0 });
    gsap.set(metas, { y: dir * 15, opacity: 0 });
};

const onEnter = (el, done) => {
    const imgWrapper = el.querySelector('.image-wrapper');
    const img = el.querySelector('.img-inner img');
    const title = el.querySelector('.main-title');
    const subtitle = el.querySelector('.subtitle');
    const metas = el.querySelectorAll('.meta-block');
    
    // Slightly faster duration prevents "laggy/sluggish" input feel
    const tl = gsap.timeline({ 
        defaults: { ease: 'power4.out' },
        onComplete: () => {
            isAnimating.value = false; // Unlock guard only when timeline is completely done
            done();
        } 
    });
    
    tl.to(imgWrapper, { 
        yPercent: 0, 
        scale: 1, 
        clipPath: 'polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)',
        duration: 1.1
    }, 0)
    .to(img, { 
        scale: 1, 
        yPercent: 0, 
        duration: 1.1
    }, 0)
    .to(title, { 
        yPercent: 0, 
        opacity: 1, 
        duration: 0.9
    }, 0.15)
    .to(subtitle, { 
        yPercent: 0, 
        opacity: 1, 
        duration: 0.8
    }, 0.25)
    .to(metas, { 
        y: 0, 
        opacity: 1, 
        duration: 0.6, 
        stagger: 0.03
    }, 0.3);
};

const onLeave = (el, done) => {
    const imgWrapper = el.querySelector('.image-wrapper');
    const img = el.querySelector('.img-inner img');
    const title = el.querySelector('.main-title');
    const subtitle = el.querySelector('.subtitle');
    const metas = el.querySelectorAll('.meta-block');
    const dir = direction.value;

    gsap.set(el, { zIndex: 1 });
    
    const tl = gsap.timeline({ 
        defaults: { ease: 'power3.inOut' },
        onComplete: done 
    });

    tl.to(imgWrapper, { 
        yPercent: dir * -45, 
        scale: 0.92, 
        clipPath: dir > 0 ? 'polygon(0% 0%, 100% 0%, 100% 0%, 0% 0%)' : 'polygon(0% 100%, 100% 100%, 100% 100%, 0% 100%)',
        duration: 0.9
    }, 0)
    .to(img, { 
        scale: 1.25, 
        yPercent: dir * 18, 
        duration: 0.9
    }, 0)
    .to(title, { 
        yPercent: dir * -110, 
        opacity: 0, 
        duration: 0.6
    }, 0)
    .to(subtitle, { 
        yPercent: dir * -90, 
        opacity: 0, 
        duration: 0.6
    }, 0)
    .to(metas, { 
        y: dir * -15, 
        opacity: 0, 
        duration: 0.5
    }, 0);
};

// WHEEL HANDLER WITH THROTTLE & ANIMATION LOCK
const handleWheel = (e) => {
    const now = Date.now();
    
    // 1. Ignore wheel events if an animation is actively playing
    if (isAnimating.value) return;

    // 2. Ignore wheel events if within the cooldown threshold (prevents trackpad inertia spam)
    if (now - lastScrollTime < SCROLL_COOLDOWN_MS) return;

    if (Math.abs(e.deltaY) > 20) {
        lastScrollTime = now;
        changeSlide(e.deltaY > 0 ? 1 : -1);
    }
};

// TOUCH HANDLERS WITH ANIMATION LOCK
const handleTouchStart = (e) => {
    if (isAnimating.value) return;
    touchStartY = e.touches[0].clientY;
    touchEndY = e.touches[0].clientY;
};

const handleTouchMove = (e) => {
    if (isAnimating.value) return;
    touchEndY = e.touches[0].clientY;
};

const handleTouchEnd = () => {
    if (isAnimating.value) return;
    
    const deltaY = touchStartY - touchEndY;
    const minSwipeDistance = 40;
    
    if (Math.abs(deltaY) > minSwipeDistance) {
        changeSlide(deltaY > 0 ? 1 : -1);
    }
};

onMounted(() => {
    gsap.fromTo('.gallery-container', 
        { scale: 1.08, filter: 'blur(12px)', opacity: 0 },
        { scale: 1, filter: 'blur(0px)', opacity: 1, duration: 1.2, ease: 'power3.out', delay: 0.1 }
    );
    
    if (window.innerWidth > 768) {
        gsap.fromTo('.sidebar-left', { x: -50, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power2.out', delay: 0.4 });
    }
    gsap.fromTo('.sidebar-right', { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 1, ease: 'power2.out', delay: 0.4 });
});
</script>

<style scoped>
.gallery-app {
    background-color: var(--bg-color);
    color: var(--text-primary);
    height: 100vh;
    height: 100dvh;
    width: 100vw;
    overflow: hidden; 
    font-family: var(--font-sans);
    position: relative;
    touch-action: none;
    padding-top: env(safe-area-inset-top);
    padding-bottom: env(safe-area-inset-bottom);
    box-sizing: border-box;
}

.mobile-only {
    display: none !important;
}

@media (max-width: 768px) {
    .desktop-only {
        display: none !important;
    }
    
    .mobile-only {
        display: flex !important;
    }
}

@media (min-width: 1025px) {
    .gallery-app {
        cursor: none;
    }
    a {
        cursor: none;
    }
}

.bg-blur {
    position: absolute;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    background: var(--bg-color);
}

.bg-image-wrapper {
    position: absolute;
    inset: 0;
    opacity: 0;
    transition: opacity 1.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.bg-image-wrapper.active {
    opacity: 0.25;
}

.bg-image {
    position: absolute;
    top: -10%; left: -10%;
    width: 120%; height: 120%;
    object-fit: cover;
    filter: blur(60px) grayscale(50%) brightness(0.6);
}

.bg-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, #000000 90%);
}

/* Borders */
.border-top, .border-bottom, .border-left, .border-right {
    position: absolute;
    background: var(--border-color);
    z-index: 100;
    pointer-events: none;
}
.border-top { top: 70px; left: 70px; right: 70px; height: 1px; }
.border-bottom { bottom: 70px; left: 70px; right: 70px; height: 1px; }
.border-left { top: 70px; bottom: 70px; left: 70px; width: 1px; }
.border-right { top: 70px; bottom: 70px; right: 70px; width: 1px; }

/* Sidebars */
.sidebar-left, .sidebar-right {
    position: absolute;
    top: 0; bottom: 0;
    width: 70px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    padding: 100px 0;
    z-index: 101;
}
.sidebar-left { left: 0; }
.sidebar-right { right: 0; }

@media (max-width: 768px) {
    .sidebar-right {
        right: 12px;
        width: auto;
        padding: 0;
        justify-content: center;
    }
}

.sidebar-text {
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    font-size: 10px;
    letter-spacing: 4px;
    text-transform: uppercase;
    color: var(--text-muted);
    font-weight: 600;
}

.social-links {
    display: flex;
    flex-direction: column;
    gap: 25px;
    align-items: center;
}

.social-item {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-muted);
    text-decoration: none;
    font-size: 11px;
    letter-spacing: 2px;
    writing-mode: vertical-rl;
    transform: rotate(180deg);
    transition: color 0.3s ease, transform 0.3s ease;
    cursor: pointer;
}

.social-item:hover,
.social-item:focus-visible {
    color: var(--text-primary);
    outline: none;
}

.social-item .tooltip {
    position: absolute;
    left: 25px;
    top: 50%;
    transform: translateY(-50%) translateX(-10px) rotate(-180deg);
    color: var(--text-primary);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
    white-space: nowrap;
    writing-mode: horizontal-tb;
}

.social-item:hover .tooltip {
    opacity: 1;
    transform: translateY(-50%) translateX(0) rotate(-180deg);
}

/* Mobile Top Header */
.mobile-header {
    position: absolute;
    top: max(16px, env(safe-area-inset-top));
    left: 20px;
    right: 20px;
    z-index: 102;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.mobile-brand {
    font-size: 10px;
    letter-spacing: 3px;
    color: var(--text-muted);
    font-weight: 600;
}

.mobile-socials {
    display: flex;
    gap: 14px;
}

.mobile-socials a {
    color: var(--text-muted);
    font-size: 11px;
    letter-spacing: 1.5px;
    text-decoration: none;
    padding: 4px;
}

.mobile-socials a:active {
    color: var(--text-primary);
}

.vertical-tracker {
    display: flex;
    flex-direction: column;
    gap: 15px;
    align-items: center;
}

@media (max-width: 768px) {
    .vertical-tracker {
        gap: 10px;
    }
}

.tracker-dash {
    width: 3px;
    height: 12px;
    background: var(--text-muted);
    transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    position: relative;
    cursor: pointer;
}

@media (max-width: 768px) {
    .tracker-dash {
        width: 4px;
        height: 14px;
        padding: 4px 1px;
        background-clip: content-box;
    }
}

.tracker-dash:hover {
    background: var(--text-primary);
    height: 20px;
}

.tracker-dash.active {
    background: var(--text-primary);
    height: 35px;
    box-shadow: 0 0 15px rgba(255, 255, 255, 0.3);
}

@media (max-width: 768px) {
    .tracker-dash.active {
        height: 28px;
    }
}

.tooltip {
    position: absolute;
    right: 20px;
    top: 50%;
    transform: translateY(-50%) translateX(10px);
    color: var(--text-primary);
    font-size: 10px;
    letter-spacing: 3px;
    text-transform: uppercase;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.4s ease, transform 0.4s ease;
    white-space: nowrap;
}

.tracker-dash:hover .tooltip {
    opacity: 1;
    transform: translateY(-50%) translateX(0);
}

/* Gallery Section */
.gallery-container {
    position: relative;
    width: 100%;
    height: 100%;
    z-index: 10;
}

.gallery-track {
    width: 100%;
    height: 100%;
    position: relative;
}

.gallery-section {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 20px;
}

@media (max-width: 768px) {
    .gallery-section {
        padding: 0 35px 0 20px;
    }
}

.image-wrapper {
    position: relative;
    z-index: 2;
    width: 88%;
    max-width: 1800px;
    aspect-ratio: 3 / 4;
    box-shadow: 0 25px 50px rgba(0,0,0,0.8);
    overflow: hidden;
    will-change: transform, clip-path;
}

@media (min-width: 600px) {
    .image-wrapper {
        width: 85%;
        aspect-ratio: 16 / 10;
    }
}

@media (min-width: 1025px) {
    .image-wrapper {
        width: 80%;
        aspect-ratio: 22 / 9;
        box-shadow: 0 50px 100px rgba(0,0,0,0.8), 0 10px 30px rgba(0,0,0,0.6);
    }
}

.img-inner {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
    will-change: transform;
    isolation: isolate;
}

.img-inner img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
}

.title-wrapper {
    position: absolute;
    top: 50%; 
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    z-index: 10;
    width: 100%;
    max-width: 92%;
    pointer-events: none;
    padding: 0 0.5rem;
    box-sizing: border-box;
    mix-blend-mode: difference; 
}

.title-mask {
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 0.2em 0;
    width: 100%;
}

.subtitle-mask {
    overflow: hidden;
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
}

.main-title {
    font-family: var(--font-serif);
    font-size: clamp(1.8rem, 8.5vw, 3.2rem);
    font-weight: 900;
    font-style: italic;
    margin: 0;
    line-height: 0.95;
    letter-spacing: -0.02em;
    text-transform: uppercase;
    color: #ffffff;
    max-width: 100%;
    white-space: normal;
    word-break: break-word;
    text-align: center;
    will-change: transform, opacity;
}

@media (min-width: 769px) {
    .main-title {
        font-size: clamp(2rem, 8vw, 9vw);
        letter-spacing: -0.03em;
        line-height: 0.9;
    }
}

.subtitle {
    font-size: clamp(8px, 2.5vw, 11px);
    letter-spacing: clamp(2px, 1vw, 6px);
    color: #ffffff;
    margin-top: 1vh;
    text-transform: uppercase;
    font-weight: 300;
    max-width: 100%;
    will-change: transform, opacity;
}

.glass-border {
    position: absolute;
    inset: 0;
    border: 1px solid rgba(255, 255, 255, 0.1);
    pointer-events: none;
}

.meta-row {
    position: absolute;
    left: 10px; right: 10px;
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: var(--text-primary);
    letter-spacing: 1px;
    text-transform: uppercase;
    z-index: 11;
}

@media (min-width: 769px) {
    .meta-row {
        left: 20px;
        right: 20px;
        font-size: clamp(7px, 1.2vw, 9px);
        letter-spacing: 2px;
    }
}

.meta-row.top { top: 10px; }
.meta-row.bottom { bottom: 10px; }

@media (min-width: 769px) {
    .meta-row.top { top: 20px; }
    .meta-row.bottom { bottom: 20px; }
}

.meta-block {
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    padding: 3px 6px;
    border: 1px solid var(--border-color);
    will-change: transform, opacity;
}

@media (min-width: 769px) {
    .meta-block {
        padding: 6px 12px;
    }
}

.mobile-swipe-hint {
    position: absolute;
    bottom: max(16px, env(safe-area-inset-bottom));
    left: 0;
    right: 0;
    z-index: 102;
    justify-content: center;
    align-items: center;
    pointer-events: none;
}

.mobile-swipe-hint span {
    font-size: 8px;
    letter-spacing: 3px;
    color: var(--text-muted);
    opacity: 0.6;
    text-transform: uppercase;
}
</style>