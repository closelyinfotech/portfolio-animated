/**
 * Christian Ulrych — Creative Portfolio Core Application
 * High-performance motion, smooth scrolling, magnetic grids, and WebGL image shaders.
 */

document.addEventListener('DOMContentLoaded', () => {
    gsap.registerPlugin(ScrollTrigger, CustomEase);
    CustomEase.create('customEase', '0.25, 1, 0.5, 1');

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

    const app = {
        initialized: false,
        lenis: null,
        lenisRafId: null,
        cursor: { dot: null, ring: null, glow: null, label: null },
        mouse: { x: 0, y: 0, targetX: 0, targetY: 0, ringTargetX: 0, ringTargetY: 0, isMagneticHover: false, hoveredElement: null, prevX: 0, prevY: 0, speed: 0 },
        magneticElements: [],
        bg: {
            initialized: false,
            renderer: null,
            scene: null,
            camera: null,
            material: null,
            renderId: null,
            orbs: []
        },
        webgl: {
            initialized: false,
            renderer: null,
            scene: null,
            camera: null,
            meshes: [],
            clock: null,
            renderId: null
        },
        resizeTimeout: null
    };

    function canUseWebGL() {
        if (motionQuery.matches) return false;
        if (window.location.protocol === 'file:') return false;
        return true;
    }

    function init() {
        initTime();

        if (motionQuery.matches) {
            initReducedMotionState();
            initAccordions();
            return;
        }

        document.body.classList.add('motion-active');

        initCursor();
        initScroll();
        initBackground();
        initScrollProgress();
        initMagnetic();
        initTextReveal();
        initFlowAnimations();
        initWebGL();
        initAccordions();
        initAnchorLinks();

        app.initialized = true;

        motionQuery.addEventListener('change', handleMotionChange);
        window.addEventListener('resize', handleResize);

        ScrollTrigger.refresh();
    }

    function initTime() {
        const timeEl = document.getElementById('js-utc-time');
        if (!timeEl) return;

        function updateClock() {
            const now = new Date();
            const utc = now.getTime() + now.getTimezoneOffset() * 60000;
            const chennaiTime = new Date(utc + 3600000 * 5.5);
            const hours = String(chennaiTime.getHours()).padStart(2, '0');
            const minutes = String(chennaiTime.getMinutes()).padStart(2, '0');
            timeEl.textContent = `UTC+05:30 ${hours}:${minutes}`;
        }

        updateClock();
        setInterval(updateClock, 1000);
    }

    function initCursor() {
        app.cursor.dot = document.getElementById('js-cursor-dot');
        app.cursor.ring = document.getElementById('js-cursor-ring');
        app.cursor.glow = document.getElementById('js-cursor-glow');
        app.cursor.label = document.getElementById('js-cursor-label');

        if (!app.cursor.dot || !app.cursor.ring) return;

        let ringX = window.innerWidth / 2;
        let ringY = window.innerHeight / 2;
        let dotX = ringX;
        let dotY = ringY;
        let glowX = ringX;
        let glowY = ringY;
        let labelX = ringX;
        let labelY = ringY;

        let ringVx = 0, ringVy = 0;
        let dotVx = 0, dotVy = 0;
        let glowVx = 0, glowVy = 0;

        let scale = 1.0;
        let targetScale = 1.0;
        let scaleVx = 0;
        let lastAngle = 0;

        window.addEventListener('mousemove', (e) => {
            app.mouse.prevX = app.mouse.targetX || e.clientX;
            app.mouse.prevY = app.mouse.targetY || e.clientY;
            app.mouse.targetX = e.clientX;
            app.mouse.targetY = e.clientY;
            app.mouse.x = e.clientX;
            app.mouse.y = e.clientY;

            const dx = e.clientX - app.mouse.prevX;
            const dy = e.clientY - app.mouse.prevY;
            app.mouse.speed = Math.min(Math.sqrt(dx * dx + dy * dy), 40);

            if (!app.mouse.isMagneticHover) {
                app.mouse.ringTargetX = e.clientX;
                app.mouse.ringTargetY = e.clientY;
            }
        });

        function setCursorMode(mode, labelText) {
            document.body.classList.remove(
                'cursor-hover-text',
                'cursor-hover-link',
                'cursor-hover-project',
                'cursor-hover-magnetic',
                'cursor-hover-cta'
            );
            if (mode) document.body.classList.add(mode);
            if (app.cursor.label) {
                app.cursor.label.textContent = labelText || '';
            }
        }

        // Bind dynamic cursor hovers
        document.querySelectorAll('h1, h2, h3, .reveal-chars, .reveal-text, .section-title').forEach((target) => {
            target.addEventListener('mouseenter', () => {
                setCursorMode('cursor-hover-text');
                targetScale = 2.2;
            });
            target.addEventListener('mouseleave', () => {
                setCursorMode('');
                targetScale = 1.0;
            });
        });

        document.querySelectorAll('.project-card').forEach((target) => {
            target.addEventListener('mouseenter', () => {
                setCursorMode('cursor-hover-project', 'VIEW');
                targetScale = 2.2;
            });
            target.addEventListener('mouseleave', () => {
                setCursorMode('');
                targetScale = 1.0;
            });
        });

        document.querySelectorAll('.footer-mail-btn, .btn-cta').forEach((target) => {
            target.addEventListener('mouseenter', () => {
                setCursorMode('cursor-hover-cta');
                targetScale = 2.4;
            });
            target.addEventListener('mouseleave', () => {
                setCursorMode('');
                targetScale = 1.0;
            });
        });

        document.querySelectorAll('.nav-link, .nav-brand, .footer-col.links a').forEach((target) => {
            target.addEventListener('mouseenter', () => {
                setCursorMode('cursor-hover-link');
                targetScale = 1.3;
            });
            target.addEventListener('mouseleave', () => {
                setCursorMode('');
                targetScale = 1.0;
            });
        });

        document.querySelectorAll('[data-magnetic]').forEach((target) => {
            target.addEventListener('mouseenter', () => {
                setCursorMode('cursor-hover-magnetic');
                targetScale = 1.6;
                app.mouse.isMagneticHover = true;
                app.mouse.hoveredElement = target;
            });
            target.addEventListener('mouseleave', () => {
                setCursorMode('');
                targetScale = 1.0;
                app.mouse.isMagneticHover = false;
                app.mouse.hoveredElement = null;
            });
        });

        document.querySelectorAll('.service-row').forEach((target) => {
            target.addEventListener('mouseenter', () => {
                const labelText = target.classList.contains('active') ? 'CLOSE' : 'OPEN';
                setCursorMode('cursor-hover-service', labelText);
                targetScale = 2.2;
            });
            target.addEventListener('mouseleave', () => {
                setCursorMode('');
                targetScale = 1.0;
            });
            
            const trigger = target.querySelector('.service-header-trigger');
            if (trigger) {
                trigger.addEventListener('click', () => {
                    setTimeout(() => {
                        const labelText = target.classList.contains('active') ? 'CLOSE' : 'OPEN';
                        if (document.body.classList.contains('cursor-hover-service')) {
                            setCursorMode('cursor-hover-service', labelText);
                        }
                    }, 50);
                });
            }
        });

        function updateCursor() {
            if (motionQuery.matches) return;

            const prevRingX = ringX;
            const prevRingY = ringY;

            let dotTargetX = app.mouse.targetX;
            let dotTargetY = app.mouse.targetY;

            // Real-time magnetic target calculations
            if (app.mouse.isMagneticHover && app.mouse.hoveredElement) {
                const rect = app.mouse.hoveredElement.getBoundingClientRect();
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;
                const deltaX = app.mouse.targetX - centerX;
                const deltaY = app.mouse.targetY - centerY;
                
                // Ring pulls strongly but keeps minor cursor drag
                app.mouse.ringTargetX = centerX + deltaX * 0.15;
                app.mouse.ringTargetY = centerY + deltaY * 0.15;
                
                // Snaps dot directly to center of magnetic target
                dotTargetX = centerX;
                dotTargetY = centerY;
            } else {
                app.mouse.ringTargetX = app.mouse.targetX;
                app.mouse.ringTargetY = app.mouse.targetY;
            }

            // Spring math for follower ring
            const ringSpring = 0.08;
            const ringDamping = 0.65;
            let targetX = app.mouse.ringTargetX;
            let targetY = app.mouse.ringTargetY;

            let ax = (targetX - ringX) * ringSpring;
            let ay = (targetY - ringY) * ringSpring;
            ringVx = (ringVx + ax) * ringDamping;
            ringVy = (ringVy + ay) * ringDamping;
            ringX += ringVx;
            ringY += ringVy;

            // Spring math for dot (snaps to dotTargetX/Y)
            const dotSpring = 0.35;
            const dotDamping = 0.55;
            let dotAx = (dotTargetX - dotX) * dotSpring;
            let dotAy = (dotTargetY - dotY) * dotSpring;
            dotVx = (dotVx + dotAx) * dotDamping;
            dotVy = (dotVy + dotAy) * dotDamping;
            dotX += dotVx;
            dotY += dotVy;

            // Spring math for glow
            const glowSpring = 0.03;
            const glowDamping = 0.75;
            let glowAx = (app.mouse.targetX - glowX) * glowSpring;
            let glowAy = (app.mouse.targetY - glowY) * glowSpring;
            glowVx = (glowVx + glowAx) * glowDamping;
            glowVy = (glowVy + glowAy) * glowDamping;
            glowX += glowVx;
            glowY += glowVy;

            // Spring math for scale
            const scaleSpring = 0.12;
            const scaleDamping = 0.65;
            let scaleA = (targetScale - scale) * scaleSpring;
            scaleVx = (scaleVx + scaleA) * scaleDamping;
            scale += scaleVx;

            // Velocity stretching & angle
            const vx = ringX - prevRingX;
            const vy = ringY - prevRingY;
            const velocitySpeed = Math.sqrt(vx * vx + vy * vy);
            const velocityAngle = Math.atan2(vy, vx);

            let stretch = 1.0 + Math.min(velocitySpeed * 0.012, 0.35);
            let angle = lastAngle;
            if (velocitySpeed > 0.5) {
                angle = velocityAngle;
            }
            lastAngle = angle;

            // Apply styles
            app.cursor.dot.style.transform = `translate3d(${dotX}px, ${dotY}px, 0) translate(-50%, -50%)`;
            app.cursor.ring.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%) rotate(${angle}rad) scaleX(${stretch * scale}) scaleY(${(2.0 - stretch) * scale})`;

            if (app.cursor.glow) {
                app.cursor.glow.style.transform = `translate3d(${glowX}px, ${glowY}px, 0) translate(-50%, -50%)`;
            }

            if (app.cursor.label) {
                labelX += (ringX - labelX) * 0.25;
                labelY += (ringY - labelY) * 0.25;
                app.cursor.label.style.transform = `translate3d(${labelX}px, ${labelY}px, 0) translate(-50%, -50%) scale(${scale})`;
            }

            requestAnimationFrame(updateCursor);
        }

        requestAnimationFrame(updateCursor);
    }

    function initBackground() {
        if (!canUseWebGL()) return;

        const canvas = document.getElementById('bg-canvas');
        if (!canvas || typeof THREE === 'undefined') return;

        const width = window.innerWidth;
        const height = window.innerHeight;

        app.bg.scene = new THREE.Scene();

        // Use PerspectiveCamera for physical 3D depth parallax
        app.bg.camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 100);
        app.bg.camera.position.z = 8;

        app.bg.renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
        app.bg.renderer.setSize(width, height);
        app.bg.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.0));

        const fragmentShader = `
            uniform float uTime;
            uniform vec2 uMouse;
            uniform float uScroll;
            uniform vec2 uResolution;

            float hash(vec2 p) {
                return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
            }

            float noise(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
                vec2 u = f * f * (3.0 - 2.0 * f);
                return mix(
                    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
                    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
                    u.y
                );
            }

            float fbm(vec2 p) {
                float v = 0.0;
                float a = 0.5;
                vec2 shift = vec2(100.0);
                mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
                for (int i = 0; i < 3; ++i) {
                    v += a * noise(p);
                    p = rot * p * 2.0 + shift;
                    a *= 0.5;
                }
                return v;
            }

            void main() {
                vec2 uv = gl_FragCoord.xy / uResolution;
                vec2 centered = uv - 0.5;
                centered.x *= uResolution.x / uResolution.y;

                float t = uTime * 0.03;

                // Procedural drifting light orbs in WebGL shader
                vec2 orb1 = vec2(sin(t * 0.5) * 0.5 - 0.3, cos(t * 0.4) * 0.3 + 0.2);
                vec2 orb2 = vec2(cos(t * 0.3) * 0.4 + 0.3, sin(t * 0.45) * -0.3 - 0.2);
                vec2 orb3 = vec2(sin(t * 0.2) * 0.4 - 0.2, cos(t * 0.35) * -0.4);

                float dist1 = length(centered - orb1);
                float dist2 = length(centered - orb2);
                float dist3 = length(centered - orb3);

                float glow1 = smoothstep(0.9, 0.0, dist1);
                float glow2 = smoothstep(1.0, 0.0, dist2);
                float glow3 = smoothstep(0.8, 0.0, dist3);
                
                vec2 q = vec2(0.0);
                q.x = fbm(centered * 1.2 + vec2(t, t * 0.4));
                q.y = fbm(centered * 1.2 + vec2(t * 0.2, t * 0.6));

                vec2 r = vec2(0.0);
                r.x = fbm(centered * 1.6 + q * 1.0 + vec2(t * 0.3, t * 0.1));
                r.y = fbm(centered * 1.6 + q * 1.0 + vec2(t * 0.1, t * 0.5));

                float f = fbm(centered * 1.5 + r * 1.2);

                // Cosmic Palette
                vec3 bgColor = vec3(0.0196, 0.0196, 0.0196); // matches #050505
                vec3 deepBlue = vec3(0.02, 0.04, 0.10);
                vec3 deepPurple = vec3(0.07, 0.03, 0.09);
                vec3 goldNebula = vec3(0.09, 0.07, 0.04);

                vec3 color = mix(bgColor, deepBlue, f * 0.3);
                color = mix(color, deepPurple, length(q) * 0.2);
                color = mix(color, goldNebula, r.x * 0.12);

                // Add drifting ambient lighting layers
                color += deepBlue * glow1 * 0.28;
                color += deepPurple * glow2 * 0.25;
                color += goldNebula * glow3 * 0.22;

                // Mouse influence
                vec2 mouse = uMouse - 0.5;
                mouse.x *= uResolution.x / uResolution.y;
                float mouseGlow = smoothstep(0.7, 0.0, length(centered - mouse));
                color += deepBlue * mouseGlow * 0.08;

                // Vignette
                float vignette = 1.0 - length(centered) * 0.8;
                color *= vignette;

                // Procedural film grain noise
                float grain = hash(gl_FragCoord.xy + vec2(t * 10.0));
                color += (grain - 0.5) * 0.018;

                gl_FragColor = vec4(max(color, bgColor), 1.0);
            }
        `;

        app.bg.material = new THREE.ShaderMaterial({
            vertexShader: 'varying vec2 vUv; void main(){vUv = uv; gl_Position=vec4(position,1.0);}',
            fragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                uScroll: { value: 0 },
                uResolution: { value: new THREE.Vector2(width, height) }
            },
            transparent: false,
            depthWrite: false
        });

        const backgroundPlane = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), app.bg.material);
        app.bg.scene.add(backgroundPlane);

        // Double-Layered Particle System
        const particleCount = 150;
        const positions = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        const speeds = new Float32Array(particleCount);
        const opacities = new Float32Array(particleCount);

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 40;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 30;
            positions[i * 3 + 2] = Math.random() * 16 - 12; // Z range [-12, 4]

            const z = positions[i * 3 + 2];
            speeds[i] = 0.1 + Math.random() * 0.2; // much slower drift

            if (z < -4) {
                // Layer 1: Distant Stars (very small, faint)
                sizes[i] = 0.4 + Math.random() * 0.5;
                opacities[i] = 0.15 + Math.random() * 0.2;
            } else {
                // Layer 2: Cosmic Dust (subtle, soft)
                sizes[i] = 0.8 + Math.random() * 1.0;
                opacities[i] = 0.1 + Math.random() * 0.15;
            }
        }

        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
        particleGeometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1));
        particleGeometry.setAttribute('aOpacity', new THREE.BufferAttribute(opacities, 1));

        const particleVertexShader = `
            uniform float uTime;
            uniform float uScroll;
            uniform vec2 uMouse;
            attribute float aSize;
            attribute float aSpeed;
            attribute float aOpacity;
            varying float vOpacity;
            void main() {
                vOpacity = aOpacity;
                vec3 pos = position;
                
                // Mouse parallax shift based on depth
                float depthFactor = (pos.z + 12.0) * 0.08;
                pos.x += (uMouse.x - 0.5) * 2.0 * depthFactor;
                pos.y += (uMouse.y - 0.5) * 2.0 * depthFactor;
                
                // Organic floating drift
                pos.x += sin(uTime * 0.06 + pos.y * 0.1) * 0.15 * aSpeed;
                pos.y += cos(uTime * 0.05 + pos.x * 0.1) * 0.15 * aSpeed;
                
                // Infinite vertical wrapping on scroll
                pos.y = mod(pos.y - uScroll * 0.0006 * aSpeed + 15.0, 30.0) - 15.0;
                
                vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                gl_Position = projectionMatrix * mvPosition;
                
                gl_PointSize = aSize * (350.0 / -mvPosition.z);
            }
        `;

        const particleFragmentShader = `
            varying float vOpacity;
            void main() {
                float r = length(gl_PointCoord - vec2(0.5));
                if (r > 0.5) discard;
                float intensity = smoothstep(0.5, 0.0, r);
                gl_FragColor = vec4(1.0, 0.98, 0.95, intensity * vOpacity * 0.35);
            }
        `;

        const particleMaterial = new THREE.ShaderMaterial({
            vertexShader: particleVertexShader,
            fragmentShader: particleFragmentShader,
            uniforms: {
                uTime: { value: 0 },
                uScroll: { value: 0 },
                uMouse: { value: new THREE.Vector2(0.5, 0.5) }
            },
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(particleGeometry, particleMaterial);
        app.bg.scene.add(particles);

        app.bg.initialized = true;

        let cameraTargetX = 0;
        let cameraTargetY = 0;

        function renderBg(time) {
            if (!app.bg.initialized || motionQuery.matches) return;

            const t = time * 0.001;
            const scroll = app.lenis ? app.lenis.scroll : 0;

            app.bg.material.uniforms.uTime.value = t;
            app.bg.material.uniforms.uMouse.value.set(
                app.mouse.x / window.innerWidth,
                1 - app.mouse.y / window.innerHeight
            );
            app.bg.material.uniforms.uScroll.value = scroll;

            particleMaterial.uniforms.uTime.value = t;
            particleMaterial.uniforms.uScroll.value = scroll;
            particleMaterial.uniforms.uMouse.value.set(
                app.mouse.x / window.innerWidth,
                1 - app.mouse.y / window.innerHeight
            );

            // Camera mouse parallax shift
            const mx = (app.mouse.x / window.innerWidth - 0.5) * 1.5;
            const my = (app.mouse.y / window.innerHeight - 0.5) * -1.2;

            cameraTargetX += (mx - cameraTargetX) * 0.06;
            cameraTargetY += (my - cameraTargetY) * 0.06;

            app.bg.camera.position.x = cameraTargetX;
            app.bg.camera.position.y = cameraTargetY;
            app.bg.camera.lookAt(0, 0, -4);

            app.bg.renderer.render(app.bg.scene, app.bg.camera);
            requestAnimationFrame(renderBg);
        }

        requestAnimationFrame(renderBg);
    }

    function initScrollProgress() {
        const bar = document.getElementById('js-scroll-progress-bar');
        const text = document.getElementById('js-scroll-progress-text');
        if (!bar || !app.lenis) return;

        app.lenis.on('scroll', (lenis) => {
            const progress = Math.round(lenis.progress * 100);
            bar.style.width = `${progress}%`;
            if (text) text.textContent = `${progress}%`;
        });
    }

    function initFlowAnimations() {
        gsap.to('.flow-reveal', {
            opacity: 1,
            y: 0,
            duration: 0.8,
            stagger: 0.05,
            ease: 'customEase',
            delay: 0.35
        });

        gsap.utils.toArray('.section-header, .project-card, .service-row').forEach((el) => {
            gsap.fromTo(el,
                { opacity: 0, y: 48 },
                {
                    opacity: 1,
                    y: 0,
                    duration: 1.2,
                    ease: 'customEase',
                    scrollTrigger: {
                        trigger: el,
                        scroller: document.documentElement,
                        start: 'top 88%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });

        if (app.lenis) {
            app.lenis.on('scroll', (lenis) => {
                const scroll = lenis.scroll;
                gsap.set('.hero-title-wrapper', { y: scroll * 0.08 });
                gsap.set('.hero-meta-grid', { y: scroll * 0.04 });
            });
        }
    }

    function initScroll() {
        app.lenis = new Lenis({
            duration: 1.5,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1.1,
            touchMultiplier: 1.5
        });

        ScrollTrigger.scrollerProxy(document.documentElement, {
            scrollTop(value) {
                if (arguments.length) {
                    app.lenis.scrollTo(value, { immediate: true });
                }
                return app.lenis.scroll;
            },
            getBoundingClientRect() {
                return {
                    top: 0,
                    left: 0,
                    width: window.innerWidth,
                    height: window.innerHeight
                };
            },
            pinType: document.documentElement.style.transform ? 'transform' : 'fixed'
        });

        app.lenis.on('scroll', ScrollTrigger.update);

        function lenisRaf(time) {
            app.lenis.raf(time);
            app.lenisRafId = requestAnimationFrame(lenisRaf);
        }
        app.lenisRafId = requestAnimationFrame(lenisRaf);

        gsap.ticker.lagSmoothing(0);

        const header = document.getElementById('js-header');
        if (header) {
            app.lenis.on('scroll', (lenis) => {
                const scrollY = lenis.scroll;
                const velocity = lenis.velocity;
                const isScrolled = scrollY > 50;

                header.classList.toggle('scrolled', isScrolled);

                if (!isScrolled) {
                    gsap.to(header, {
                        y: 0,
                        duration: 0.3,
                        overwrite: 'auto'
                    });
                    return;
                }

                if (velocity > 150) {
                    gsap.to(header, { y: -80, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
                } else if (velocity < -150) {
                    gsap.to(header, { y: 0, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
                }
            });
        }
    }

    function initAnchorLinks() {
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const id = anchor.getAttribute('href');
                if (!id || id === '#') return;

                const target = document.querySelector(id);
                if (!target || !app.lenis) return;

                e.preventDefault();
                app.lenis.scrollTo(target, { offset: -80 });
            });
        });
    }

    function initMagnetic() {
        app.magneticElements = document.querySelectorAll('[data-magnetic]');

        app.magneticElements.forEach((element) => {
            element.addEventListener('mousemove', (e) => {
                const rect = element.getBoundingClientRect();
                // Subtract current translation to get the original un-translated center of the button
                const centerX = rect.left - (element._gsap ? element._gsap.x : 0) + rect.width / 2;
                const centerY = rect.top - (element._gsap ? element._gsap.y : 0) + rect.height / 2;
                const deltaX = e.clientX - centerX;
                const deltaY = e.clientY - centerY;

                gsap.to(element, {
                    x: deltaX * 0.35,
                    y: deltaY * 0.35,
                    duration: 0.4,
                    ease: 'power2.out'
                });
            });

            element.addEventListener('mouseleave', () => {
                gsap.to(element, {
                    x: 0,
                    y: 0,
                    duration: 0.6,
                    ease: 'elastic.out(1, 0.5)'
                });
            });
        });
    }

    function splitNodeIntoChars(node, container) {
        if (node.nodeType === Node.TEXT_NODE) {
            node.textContent.split('').forEach((char) => {
                const charSpan = document.createElement('span');
                charSpan.className = 'reveal-text-char';
                charSpan.innerHTML = char === ' ' ? '&nbsp;' : char;
                container.appendChild(charSpan);
            });
            return;
        }

        if (node.nodeType !== Node.ELEMENT_NODE) return;

        if (node.tagName === 'BR') {
            container.appendChild(document.createElement('br'));
            return;
        }

        const clone = node.cloneNode(false);
        container.appendChild(clone);
        Array.from(node.childNodes).forEach((child) => splitNodeIntoChars(child, clone));
    }

    function initTextReveal() {
        document.querySelectorAll('.reveal-chars').forEach((el) => {
            const fragment = document.createDocumentFragment();
            Array.from(el.childNodes).forEach((child) => splitNodeIntoChars(child, fragment));
            el.innerHTML = '';
            el.appendChild(fragment);

            gsap.fromTo(
                el.querySelectorAll('.reveal-text-char'),
                { y: '105%', rotate: 3 },
                {
                    y: '0%',
                    rotate: 0,
                    duration: 0.8,
                    stagger: 0.008,
                    ease: 'customEase',
                    delay: 0.05
                }
            );
        });

        document.querySelectorAll('.reveal-text').forEach((el) => {
            const text = el.textContent.trim();
            const words = text.split(/\s+/);
            el.innerHTML = '';

            const lineSpan = document.createElement('span');
            lineSpan.className = 'reveal-text-line';

            words.forEach((word) => {
                const wordSpan = document.createElement('span');
                wordSpan.className = 'reveal-text-word';
                wordSpan.textContent = word;
                lineSpan.appendChild(wordSpan);
                lineSpan.appendChild(document.createTextNode(' '));
            });

            el.appendChild(lineSpan);

            gsap.fromTo(
                el.querySelectorAll('.reveal-text-word'),
                { y: '105%', rotate: 3 },
                {
                    y: '0%',
                    rotate: 0,
                    duration: 1.2,
                    stagger: 0.03,
                    ease: 'customEase',
                    scrollTrigger: {
                        trigger: el,
                        scroller: document.documentElement,
                        start: 'top 85%',
                        toggleActions: 'play none none none'
                    }
                }
            );
        });
    }

    function createTextureFromImage(img) {
        const texture = new THREE.Texture(img);
        texture.minFilter = THREE.LinearFilter;
        texture.magFilter = THREE.LinearFilter;
        texture.generateMipmaps = false;

        const markReady = () => {
            if (img.naturalWidth > 0) {
                texture.needsUpdate = true;
            }
        };

        if (img.complete) markReady();
        else img.addEventListener('load', markReady, { once: true });

        return texture;
    }

    function initWebGL() {
        const canvas = document.getElementById('webgl-canvas');
        const domImages = document.querySelectorAll('[data-webgl-image]');

        if (!canvas || domImages.length === 0 || !canUseWebGL()) {
            document.body.classList.remove('webgl-active');
            initScrollVelocityCards();
            return;
        }

        const width = window.innerWidth;
        const height = window.innerHeight;

        app.webgl.scene = new THREE.Scene();
        app.webgl.clock = new THREE.Clock();

        app.webgl.camera = new THREE.OrthographicCamera(
            -width / 2, width / 2,
            height / 2, -height / 2,
            1, 1000
        );
        app.webgl.camera.position.z = 100;

        app.webgl.renderer = new THREE.WebGLRenderer({
            canvas,
            alpha: true,
            antialias: true
        });
        app.webgl.renderer.setSize(width, height);
        app.webgl.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        const vertexShader = `
            varying vec2 vUv;
            uniform float uVelocity;

            void main() {
                vUv = uv;
                vec3 pos = position;
                float distToCenter = distance(uv.y, 0.5);
                pos.y += sin(uv.x * 3.14159) * uVelocity * 0.08 * (0.5 - distToCenter);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
            }
        `;

        const fragmentShader = `
            varying vec2 vUv;
            uniform sampler2D uTexture;
            uniform float uTime;
            uniform float uHover;
            uniform vec2 uMouse;
            uniform float uVelocity;
            uniform float uScrollParallax;

            vec2 sineWaveDisplacement(vec2 uv, float time, float hover) {
                vec2 displacedUv = uv;
                float waveX = sin(uv.y * 12.0 + time * 1.5) * 0.012 * hover;
                float waveY = cos(uv.x * 12.0 + time * 1.5) * 0.012 * hover;
                float distToMouse = distance(uv, uMouse);
                float mouseRipple = sin(distToMouse * 22.0 - time * 4.0) * 0.02 * hover * smoothstep(0.4, 0.0, distToMouse);
                displacedUv.x += waveX + mouseRipple;
                displacedUv.y += waveY + mouseRipple;
                return displacedUv;
            }

            void main() {
                vec2 distortedUv = sineWaveDisplacement(vUv, uTime, uHover);
                
                // Scroll parallax offset shifts texture dynamically within mesh container
                distortedUv.y = distortedUv.y + uScrollParallax * 0.12;
                
                // Crop and zoom texture slightly to avoid border clamping artifacts
                distortedUv = (distortedUv - 0.5) / (1.0 + 0.1 * uHover + 0.1) + 0.5;

                distortedUv.y = (distortedUv.y - 0.5) * (1.0 + abs(uVelocity) * 0.02) + 0.5;
                distortedUv = clamp(distortedUv, vec2(0.0), vec2(1.0));

                vec4 texColor = texture2D(uTexture, distortedUv);

                if (abs(uVelocity) > 0.005 || uHover > 0.005) {
                    float shift = (uVelocity * 0.008) + (uHover * 0.006);
                    vec4 redChannel = texture2D(uTexture, clamp(distortedUv - vec2(shift, 0.0), vec2(0.0), vec2(1.0)));
                    vec4 blueChannel = texture2D(uTexture, clamp(distortedUv + vec2(shift, 0.0), vec2(0.0), vec2(1.0)));
                    texColor = vec4(redChannel.r, texColor.g, blueChannel.b, texColor.a);
                }

                gl_FragColor = texColor;
            }
        `;

        domImages.forEach((img) => {
            const rect = img.getBoundingClientRect();
            const texture = createTextureFromImage(img);

            const material = new THREE.ShaderMaterial({
                vertexShader,
                fragmentShader,
                uniforms: {
                    uTexture: { value: texture },
                    uTime: { value: 0 },
                    uHover: { value: 0 },
                    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
                    uVelocity: { value: 0 },
                    uScrollParallax: { value: 0 }
                },
                transparent: true
            });

            const mesh = new THREE.Mesh(
                new THREE.PlaneGeometry(rect.width, rect.height, 16, 16),
                material
            );

            const scroll = app.lenis ? app.lenis.scroll : window.scrollY;
            mesh.userData = {
                domElement: img,
                container: img.closest('[data-webgl-image-container]'),
                material,
                hoverValue: 0,
                absoluteTop: rect.top + scroll,
                absoluteLeft: rect.left,
                width: rect.width,
                height: rect.height
            };

            app.webgl.scene.add(mesh);
            app.webgl.meshes.push(mesh);

            const container = mesh.userData.container;
            if (!container) return;

            container.addEventListener('mouseenter', () => {
                gsap.to(mesh.userData, {
                    hoverValue: 1,
                    duration: 0.8,
                    ease: 'power2.out',
                    onUpdate: () => {
                        material.uniforms.uHover.value = mesh.userData.hoverValue;
                    }
                });
            });

            container.addEventListener('mousemove', (e) => {
                const ud = mesh.userData;
                const cardScroll = app.lenis ? app.lenis.scroll : window.scrollY;
                const viewportTop = ud.absoluteTop - cardScroll;
                const mouseX = (e.clientX - ud.absoluteLeft) / ud.width;
                const mouseY = 1 - (e.clientY - viewportTop) / ud.height;
                material.uniforms.uMouse.value.set(mouseX, mouseY);
            });

            container.addEventListener('mouseleave', () => {
                gsap.to(mesh.userData, {
                    hoverValue: 0,
                    duration: 0.8,
                    ease: 'power2.out',
                    onUpdate: () => {
                        material.uniforms.uHover.value = mesh.userData.hoverValue;
                    }
                });
            });
        });

        document.body.classList.add('webgl-active');
        app.webgl.initialized = true;

        function renderTick() {
            if (!app.webgl.initialized || motionQuery.matches) return;

            const time = app.webgl.clock.getElapsedTime();
            const velocity = app.lenis ? app.lenis.velocity : 0;
            const wWidth = window.innerWidth;
            const wHeight = window.innerHeight;

            const scroll = app.lenis ? app.lenis.scroll : window.scrollY;

            app.webgl.meshes.forEach((mesh) => {
                const ud = mesh.userData;
                const viewportTop = ud.absoluteTop - scroll;
                const viewportLeft = ud.absoluteLeft;

                mesh.position.x = viewportLeft - wWidth / 2 + ud.width / 2;
                mesh.position.y = -viewportTop + wHeight / 2 - ud.height / 2;

                // Calculate scroll parallax position relative to viewport center
                const imgCenter = viewportTop + ud.height / 2;
                const relativeY = (imgCenter - wHeight / 2) / wHeight;
                mesh.material.uniforms.uScrollParallax.value = relativeY;

                mesh.material.uniforms.uTime.value = time;
                mesh.material.uniforms.uVelocity.value = velocity * 0.012;
            });

            app.webgl.renderer.render(app.webgl.scene, app.webgl.camera);
            app.webgl.renderId = requestAnimationFrame(renderTick);
        }

        app.webgl.renderId = requestAnimationFrame(renderTick);
    }

    function initScrollVelocityCards() {
        if (!app.lenis) return;

        const cards = document.querySelectorAll('.project-image-wrapper');
        app.lenis.on('scroll', (lenis) => {
            const velocity = lenis.velocity * 0.0015;
            cards.forEach((card) => {
                card.style.transform = `scaleY(${1 + Math.abs(velocity) * 0.08})`;
            });
        });
    }

    function initAccordions() {
        const accordionRows = document.querySelectorAll('.service-row');

        accordionRows.forEach((row) => {
            const trigger = row.querySelector('.service-header-trigger');
            const content = row.querySelector('.service-content');
            if (!trigger || !content) return;

            trigger.addEventListener('click', () => {
                const isActive = row.classList.contains('active');
                const duration = motionQuery.matches ? 0 : 0.6;
                const closeDuration = motionQuery.matches ? 0 : 0.5;

                accordionRows.forEach((otherRow) => {
                    if (otherRow !== row && otherRow.classList.contains('active')) {
                        otherRow.classList.remove('active');
                        const otherContent = otherRow.querySelector('.service-content');
                        if (motionQuery.matches) {
                            otherContent.style.height = '0';
                        } else {
                            gsap.to(otherContent, { height: 0, duration: closeDuration, ease: 'power3.inOut' });
                        }
                    }
                });

                row.classList.toggle('active');

                if (motionQuery.matches) {
                    content.style.height = isActive ? '0' : `${content.scrollHeight}px`;
                    return;
                }

                gsap.to(content, {
                    height: isActive ? 0 : content.scrollHeight,
                    duration,
                    ease: 'power3.inOut',
                    onComplete: () => ScrollTrigger.refresh()
                });
            });
        });
    }

    function handleResize() {
        if (app.resizeTimeout) clearTimeout(app.resizeTimeout);

        app.resizeTimeout = setTimeout(() => {
            const width = window.innerWidth;
            const height = window.innerHeight;

            if (app.webgl.initialized && app.webgl.renderer) {
                app.webgl.camera.left = -width / 2;
                app.webgl.camera.right = width / 2;
                app.webgl.camera.top = height / 2;
                app.webgl.camera.bottom = -height / 2;
                app.webgl.camera.updateProjectionMatrix();

                app.webgl.renderer.setSize(width, height);
                app.webgl.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

                const scroll = app.lenis ? app.lenis.scroll : window.scrollY;
                app.webgl.meshes.forEach((mesh) => {
                    const img = mesh.userData.domElement;
                    const rect = img.getBoundingClientRect();
                    mesh.geometry.dispose();
                    mesh.geometry = new THREE.PlaneGeometry(rect.width, rect.height, 16, 16);

                    // Update cached bounds
                    mesh.userData.absoluteTop = rect.top + scroll;
                    mesh.userData.absoluteLeft = rect.left;
                    mesh.userData.width = rect.width;
                    mesh.userData.height = rect.height;
                });
            }

            if (app.bg.initialized && app.bg.renderer) {
                app.bg.camera.aspect = width / height;
                app.bg.camera.updateProjectionMatrix();
                app.bg.renderer.setSize(width, height);
                app.bg.material.uniforms.uResolution.value.set(width, height);
            }

            ScrollTrigger.refresh();
        }, 150);
    }

    function initReducedMotionState() {
        document.body.classList.remove('motion-active', 'webgl-active');

        const canvas = document.getElementById('webgl-canvas');
        const bgCanvas = document.getElementById('bg-canvas');
        if (canvas) canvas.style.display = 'none';
        if (bgCanvas) bgCanvas.style.display = 'none';

        const ambient = document.getElementById('js-ambient-bg');
        if (ambient) ambient.style.display = 'none';

        if (app.cursor.dot) app.cursor.dot.style.display = 'none';
        if (app.cursor.ring) app.cursor.ring.style.display = 'none';
        if (app.cursor.glow) app.cursor.glow.style.display = 'none';
        if (app.cursor.label) app.cursor.label.style.display = 'none';

        if (app.bg.renderId) cancelAnimationFrame(app.bg.renderId);
        app.bg.initialized = false;

        if (app.lenisRafId) cancelAnimationFrame(app.lenisRafId);
        if (app.lenis) {
            app.lenis.destroy();
            app.lenis = null;
        }

        if (app.webgl.renderId) cancelAnimationFrame(app.webgl.renderId);
        app.webgl.initialized = false;

        document.querySelectorAll('.reveal-text-word, .reveal-text-char').forEach((el) => {
            el.style.transform = 'none';
        });

        app.magneticElements = document.querySelectorAll('[data-magnetic]');
        app.magneticElements.forEach((el) => {
            gsap.killTweensOf(el);
            el.style.transform = 'none';
        });
    }

    function handleMotionChange() {
        if (motionQuery.matches) {
            app.webgl.initialized = false;
            initReducedMotionState();
            initAccordions();
        } else {
            window.location.reload();
        }
    }

    init();
});
