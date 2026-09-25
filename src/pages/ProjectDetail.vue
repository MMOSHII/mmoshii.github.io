<template>
    <div class="project-detail-wrapper" ref="pageRef">
        <CustomCursor :is-holding="isAnimating" :progress="0" />

        <div class="bg-blur" v-if="project">
            <img :src="project.image" class="bg-image" />
            <div class="bg-overlay"></div>
        </div>

        <header class="detail-header">
            <button class="back-btn" @click="handleBack">
                <span class="arrow">←</span>
                <span class="label">BACK TO GALLERY</span>
            </button>
            <div class="header-index">// PROJECT / {{ project ? String(project.id).padStart(2, '0') : '00' }}</div>
        </header>

        <div class="project-detail" v-if="project" :key="route.params.slug">
            <section class="hero-section">
                <div class="meta-tags">
                    <span class="tag">{{ project.metaTopLeft || 'PROJECT' }}</span>
                    <span class="tag">{{ project.metaBottomRight || '2026' }}</span>
                </div>
                
                <h1 class="main-title" ref="titleRef">{{ project.title }}</h1>
                <p class="subtitle" ref="subtitleRef">{{ project.subtitle }}</p>
            </section>

            <!-- Hero Featured Image Frame -->
            <section class="media-section" ref="mediaRef">
                <div class="image-frame">
                    <img :src="project.image" :alt="project.title" />
                    <div class="glass-border"></div>
                </div>
            </section>

            <!-- Project Details Grid -->
            <section class="info-section">
                <div class="info-grid">
                    <div class="info-block">
                        <span class="info-label">ROLE</span>
                        <p class="info-value">{{ project.role || 'Contributor' }}</p>
                    </div>
                    <div class="info-block">
                        <span class="info-label">YEAR</span>
                        <p class="info-value">{{ project.year || '2026' }}</p>
                    </div>
                    <div class="info-block">
                        <span class="info-label">TECH STACK</span>
                        <p class="info-value">{{ project.techStack || 'undefined' }}</p>
                    </div>
                    <div class="info-block">
                        <span class="info-label">STATS</span>
                        <p class="info-value">{{ project.metaBottomLeft || 'Done' }}</p>
                    </div>
                </div>

                <div class="description-block">
                    <h3>// OVERVIEW</h3>
                    <p>{{ project.description || 'No description available for this project.' }}</p>
                </div>

                <div class="project-links" v-if="project.github || project.website">
                    <a 
                        v-if="project.github" 
                        :href="project.github" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="action-btn"
                    >
                        <span class="icon">GH</span>
                        <span>GITHUB REPO</span>
                        <span class="arrow">↗</span>
                    </a>

                    <a 
                        v-if="project.website" 
                        :href="project.website" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        class="action-btn"
                    >
                        <span class="icon">WEB</span>
                        <span>LIVE DEMO</span>
                        <span class="arrow">↗</span>
                    </a>
                </div>
            </section>

            <section class="gallery-section" v-if="project.gallery && project.gallery.length" ref="gallerySectionRef">
                <h3 class="gallery-title">// GALLERY SHOWCASE</h3>
                <div class="gallery-wrapper" ref="galleryWrapperRef">
                    <div 
                        v-for="(imgUrl, index) in project.gallery" 
                        :key="index" 
                        class="gallery-item"
                    >
                        <div class="gallery-image-frame">
                            <img :src="imgUrl" :alt="`${project.title} supporting preview ${index + 1}`" />
                            <div class="glass-border"></div>
                        </div>
                    </div>
                </div>
            </section>

            <footer class="next-project-footer" ref="footerRef" v-if="nextProject">
                <div class="footer-content">
                    <span class="next-label">// SCROLL TO NEXT PROJECT</span>
                    <h2 class="next-title">{{ nextProject.title }}</h2>
                    <div class="progress-track">
                        <div class="progress-bar" ref="progressBarRef"></div>
                    </div>
                </div>
            </footer>
        </div>

        <div class="not-found" v-else>
            <h2>404</h2>
            <p>Project not found.</p>
            <button class="back-btn" @click="handleBack">← Back to Gallery</button>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onUnmounted, inject } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import projectData from '@/data/projects.json'
import CustomCursor from '@/components/CustomCursor.vue'

gsap.registerPlugin(ScrollTrigger)

defineProps({
    slug: {
        type: String,
        required: true
    }
})

const route = useRoute()
const router = useRouter()

const isAnimating = ref(false)
const titleRef = ref(null)
const subtitleRef = ref(null)
const mediaRef = ref(null)
const footerRef = ref(null)
const progressBarRef = ref(null)
const gallerySectionRef = ref(null)
const galleryWrapperRef = ref(null)
const isTransitioning = ref(false)

let scrollTriggerInstance = null
let galleryScrollTrigger = null
let entranceTimeline = null

const triggerCinematicNavigate = inject('triggerCinematicNavigate')

const project = computed(() => {
    return projectData.find(p => p.slug === route.params.slug)
})

const nextProject = computed(() => {
    if (!project.value) return null
    const currentIndex = projectData.findIndex(p => p.slug === route.params.slug)
    const nextIndex = (currentIndex + 1) % projectData.length
    return projectData[nextIndex]
})

const handleBack = () => {
    if (triggerCinematicNavigate) {
        triggerCinematicNavigate('INDEX / GALLERY', '/')
    } else {
        router.push('/')
    }
}

const clearAllTriggers = () => {
    if (entranceTimeline) {
        entranceTimeline.kill()
        entranceTimeline = null
    }
    if (galleryScrollTrigger) {
        galleryScrollTrigger.kill()
        galleryScrollTrigger = null
    }
    if (scrollTriggerInstance) {
        scrollTriggerInstance.kill()
        scrollTriggerInstance = null
    }

    ScrollTrigger.getAll().forEach(trigger => trigger.kill())
}

const waitForGalleryImages = () => {
    if (!galleryWrapperRef.value) return Promise.resolve()
    const imgs = galleryWrapperRef.value.querySelectorAll('img')
    const promises = Array.from(imgs).map(img => {
        if (img.complete) return Promise.resolve()
        return new Promise(resolve => {
            img.onload = resolve
            img.onerror = resolve
        })
    })
    return Promise.all(promises)
}

const setupAnimationsAndScroll = async () => {
    clearAllTriggers()

    if (!project.value) return

    await nextTick()

    if (progressBarRef.value) {
        gsap.set(progressBarRef.value, { scaleX: 0 })
    }

    entranceTimeline = gsap.timeline({ defaults: { ease: 'power3.out' } })
    entranceTimeline
      .fromTo('.detail-header', { y: -30, opacity: 0 }, { y: 0, opacity: 1, duration: 1 })
      .fromTo(titleRef.value, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1.2 }, '-=0.6')
      .fromTo(subtitleRef.value, { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, '-=0.8')
      .fromTo(mediaRef.value, { scale: 0.92, opacity: 0, y: 50 }, { scale: 1, opacity: 1, y: 0, duration: 1.4, ease: 'expo.out' }, '-=0.8')
      .fromTo('.info-section', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, '-=0.8')
      .fromTo('.gallery-section', { y: 30, opacity: 0 }, { y: 0, opacity: 1, duration: 1 }, '-=0.6')

    await waitForGalleryImages()

    if (gallerySectionRef.value && galleryWrapperRef.value && window.innerWidth > 768) {
        gsap.set(galleryWrapperRef.value, { clearProps: 'transform' })

        const totalScroll = galleryWrapperRef.value.scrollWidth - window.innerWidth

        if (totalScroll > 0) {
            galleryScrollTrigger = gsap.to(galleryWrapperRef.value, {
                x: () => -totalScroll,
                ease: 'none',
                scrollTrigger: {
                    trigger: gallerySectionRef.value,
                    start: 'top top',
                    end: () => `+=${totalScroll}`,
                    pin: true,
                    pinSpacing: true,
                    scrub: 1,
                    anticipatePin: 1,
                    invalidateOnRefresh: true
                }
            })
        }
    }

    if (footerRef.value && nextProject.value) {
        scrollTriggerInstance = ScrollTrigger.create({
            trigger: footerRef.value,
            start: 'top top',
            end: '+=100%',
            pin: true,
            pinSpacing: true,
            onUpdate: (self) => {
                if (isTransitioning.value) return

                if (self.progress < 0.7) {
                    if (progressBarRef.value) {
                        gsap.set(progressBarRef.value, { scaleX: self.progress })
                    }
                } else {
                    isTransitioning.value = true

                    if (progressBarRef.value) {
                        gsap.to(progressBarRef.value, {
                            scaleX: 1,
                            duration: 0.4,
                            ease: 'power2.out'
                        })
                    }

                    const targetScroll = self.start + (self.end - self.start)
                    gsap.to(window, {
                        scrollTo: targetScroll,
                        duration: 0.4,
                        ease: 'power2.out',
                        onComplete: () => {
                            if (triggerCinematicNavigate) {
                                triggerCinematicNavigate(
                                    nextProject.value.title, 
                                    `/${nextProject.value.slug}`
                                )
                            } else {
                                router.push(`/${nextProject.value.slug}`)
                            }
                        }
                    })
                }
            }
        })
    }

    ScrollTrigger.refresh()
}

watch(
    () => route.params.slug,
    async () => {
        window.scrollTo(0, 0)
        isTransitioning.value = false
        await setupAnimationsAndScroll()
    }
)

onMounted(() => {
    setupAnimationsAndScroll()
})

onUnmounted(() => {
    clearAllTriggers()
    ScrollTrigger.refresh()
})
</script>

<style scoped>
.project-detail-wrapper {
    background-color: var(--bg-color);
    color: var(--text-primary);
    min-height: 100vh;
    font-family: var(--font-sans);
    position: relative;
    overflow-x: hidden;
    padding: clamp(30px, 5vw, 90px) clamp(16px, 4vw, 40px);
    box-sizing: border-box;
}

@media (min-width: 1025px) {
    .project-detail-wrapper {
        cursor: none;
    }
}

@media (max-width: 1024px) {
    .desktop-only { display: none !important; }
}

/* Background Ambient */
.bg-blur {
    position: fixed;
    inset: 0;
    z-index: 0;
    overflow: hidden;
    pointer-events: none;
}
.bg-image {
    width: 120%;
    height: 120%;
    object-fit: cover;
    filter: blur(80px) grayscale(60%) brightness(0.25);
    transform: translate(-10%, -10%);
}
.bg-overlay {
    position: absolute;
    inset: 0;
    background: radial-gradient(circle at center, transparent 0%, #000000 85%);
}

/* Navigation Header */
.detail-header {
    position: relative;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1400px;
    margin: 0 auto clamp(30px, 5vw, 60px) auto;
    gap: 15px;
}
.back-btn {
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: clamp(8px, 1.5vw, 10px) clamp(12px, 2vw, 20px);
    font-size: clamp(9px, 1vw, 11px);
    letter-spacing: 2px;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.3s ease;
    cursor: pointer;
    white-space: nowrap;
}
.back-btn:hover {
    background: var(--text-primary);
    color: var(--bg-color);
}
.header-index {
    font-size: clamp(9px, 1vw, 11px);
    letter-spacing: 2px;
    color: var(--text-muted);
    white-space: nowrap;
}

/* Hero Section */
.project-detail {
    position: relative;
    z-index: 10;
    max-width: 1400px;
    margin: 0 auto;
}
.hero-section {
    text-align: center;
    margin-bottom: clamp(30px, 5vw, 60px);
}
.meta-tags {
    display: flex;
    justify-content: center;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
}
.tag {
    font-size: clamp(8px, 1vw, 10px);
    letter-spacing: 2px;
    color: var(--text-muted);
    border: 1px solid var(--border-color);
    padding: 4px 10px;
    text-transform: uppercase;
}
.main-title {
    font-family: var(--font-serif);
    font-size: clamp(2.2rem, 8vw, 7rem);
    font-weight: 900;
    font-style: italic;
    margin: 0;
    text-transform: uppercase;
    letter-spacing: -0.02em;
    line-height: 0.95;
    word-break: break-word;
}
.subtitle {
    font-size: clamp(9px, 1.5vw, 13px);
    letter-spacing: clamp(3px, 1vw, 6px);
    color: var(--text-muted);
    margin-top: 15px;
    text-transform: uppercase;
}

.media-section {
    margin-bottom: clamp(40px, 6vw, 80px);
}

.image-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 9;
    box-shadow: 0 40px 100px rgba(0, 0, 0, 0.9);
    overflow: hidden;
}
@media (max-width: 600px) {
    .image-frame {
        aspect-ratio: 4 / 3;
    }
}
.image-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
}
.glass-border {
    position: absolute;
    inset: 0;
    border: 1px solid rgba(255, 255, 255, 0.12);
    pointer-events: none;
}

/* Project Info & Metadata */
.info-section {
    display: grid;
    grid-template-columns: 1fr;
    gap: clamp(30px, 5vw, 60px);
    border-top: 1px solid var(--border-color);
    padding-top: clamp(30px, 5vw, 60px);
    margin-bottom: clamp(40px, 6vw, 80px);
}
@media (min-width: 900px) {
    .info-section {
        grid-template-columns: 1fr 1fr;
    }
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: clamp(20px, 3vw, 30px);
}
@media (max-width: 480px) {
    .info-grid {
        grid-template-columns: 1fr;
    }
}

.info-block {
    display: flex;
    flex-direction: column;
    gap: 6px;
}
.info-label {
    font-size: 10px;
    letter-spacing: 3px;
    color: var(--text-muted);
}
.info-value {
    font-size: clamp(12px, 1.2vw, 14px);
    letter-spacing: 1px;
    margin: 0;
}

.description-block h3 {
    font-size: 11px;
    letter-spacing: 3px;
    color: var(--text-muted);
    margin-bottom: 15px;
}
.description-block p {
    font-size: clamp(13px, 1.3vw, 15px);
    line-height: 1.7;
    color: #cccccc;
    margin: 0;
    font-weight: 300;
}

/* External Links */
.project-links {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
    align-items: center;
    margin-bottom: 25px;
}

.action-btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    background: transparent;
    border: 1px solid var(--border-color);
    color: var(--text-primary);
    padding: 10px 18px;
    font-size: clamp(9px, 1vw, 11px);
    letter-spacing: 2px;
    text-decoration: none;
    text-transform: uppercase;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

.action-btn:hover {
    background: var(--text-primary);
    color: var(--bg-color);
    border-color: var(--text-primary);
}

.action-btn .icon {
    color: var(--text-muted);
    font-size: 9px;
    font-weight: 600;
}

.action-btn:hover .icon {
    color: var(--bg-color);
}

.action-btn .arrow {
    font-size: 12px;
    transition: transform 0.3s ease;
}

.action-btn:hover .arrow {
    transform: translate(2px, -2px);
}

.gallery-section {
    position: relative;
    width: 100%;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    border-top: 1px solid var(--border-color);
    overflow: hidden;
    padding: clamp(20px, 4vw, 40px) 0;
    box-sizing: border-box;
}

.gallery-section::-webkit-scrollbar {
    height: 2px;
}

.gallery-section::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.05);
}

.gallery-section::-webkit-scrollbar-thumb {
    background: var(--text-primary, #ffffff);
}

.gallery-title {
    font-size: 11px;
    letter-spacing: 3px;
    color: var(--text-muted);
    margin-bottom: clamp(20px, 4vw, 40px);
    padding-left: clamp(16px, 4vw, 40px);
}

.gallery-wrapper {
    display: flex;
    gap: clamp(20px, 3vw, 40px);
    width: max-content;
    padding-left: clamp(16px, 4vw, 40px);
    padding-right: clamp(16px, 4vw, 40px);
    will-change: transform;
}

.gallery-item {
    flex: 0 0 clamp(320px, 50vw, 750px);
}

.gallery-image-frame {
    position: relative;
    width: 100%;
    aspect-ratio: 16 / 10;
    overflow: hidden;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.6);
}

.gallery-image-frame img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.gallery-image-frame:hover img {
    transform: scale(1.05);
}

/* Scroll-Driven Page Transition Footer */
.next-project-footer {
    height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    border-top: 1px solid var(--border-color);
    text-align: center;
}
.footer-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
}
.next-label {
    font-size: clamp(10px, 1.2vw, 12px);
    letter-spacing: 4px;
    color: var(--text-muted);
}
.next-title {
    font-family: var(--font-serif);
    font-size: clamp(2.5rem, 7vw, 6rem);
    font-weight: 900;
    font-style: italic;
    text-transform: uppercase;
    margin: 0;
}
.progress-track {
    width: clamp(200px, 30vw, 400px);
    height: 2px;
    background: rgba(255, 255, 255, 0.15);
    overflow: hidden;
    position: relative;
    margin-top: 10px;
}
.progress-bar {
    width: 100%;
    height: 100%;
    background: var(--text-primary);
    transform-origin: left center;
    transform: scaleX(0);
}

.not-found {
    text-align: center;
    padding-top: 100px;
}

@media (max-width: 768px) {
    .gallery-section {
        height: auto; 
        padding: 40px 0;
    }

    .gallery-title {
        padding-left: 0;
    }

    .gallery-wrapper {
        display: grid;
        grid-template-columns: 1fr; 
        gap: 20px;
        width: 100%;
        padding-left: 0;
        padding-right: 0;
        box-sizing: border-box;
    }

    .gallery-item {
        flex: none;
        width: 100%;
    }
}
</style>