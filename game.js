/**
 * Card Drop Shooter - HTML5 Canvas Mobile Game
 * Target: Shoot the hanging ropes to cut down all 4 cards!
 */

// --- Audio Synthesizer (Web Audio API - Zero external files required) ---
class SoundFX {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playShoot() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(580, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.16);
    }

    playRopeCut() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Snip / Twang sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(240, now + 0.18);

        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.19);
    }

    playCardDeflect() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        // Dull wood / metallic thud when hitting the card body instead of rope
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.12);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now);
        osc.stop(now + 0.13);
    }

    playWin() {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
        notes.forEach((freq, idx) => {
            const now = this.ctx.currentTime + idx * 0.1;
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();

            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now);

            gain.gain.setValueAtTime(0.28, now);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 0.28);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now);
            osc.stop(now + 0.3);
        });
    }
}

// --- Main Game Engine ---
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.sound = new SoundFX();

        // UI elements
        this.levelValEl = document.getElementById('level-val');
        this.scoreValEl = document.getElementById('score-val');
        this.highScoreValEl = document.getElementById('highscore-val');
        this.cardsLeftEl = document.getElementById('cards-left');
        this.soundBtn = document.getElementById('sound-btn');
        this.soundOnIcon = document.getElementById('sound-on-icon');
        this.soundOffIcon = document.getElementById('sound-off-icon');
        this.aimGuide = document.getElementById('aim-guide');
        this.victoryModal = document.getElementById('victory-modal');
        this.nextLevelBtn = document.getElementById('next-level-btn');
        this.replayBtn = document.getElementById('replay-btn');

        // Modal stats
        this.finalScoreEl = document.getElementById('final-score');
        this.finalShotsEl = document.getElementById('final-shots');
        this.finalAccuracyEl = document.getElementById('final-accuracy');
        this.finalTimeEl = document.getElementById('final-time');

        // Persistent Data from localStorage
        this.highScore = parseInt(localStorage.getItem('cardShooter_highScore') || '0', 10);
        this.maxUnlockedLevel = parseInt(localStorage.getItem('cardShooter_maxLevel') || '1', 10);

        // Game state
        this.width = 0;
        this.height = 0;
        this.dpr = 1;
        this.score = 0;
        this.shotsFired = 0;
        this.ropesCutCount = 0;
        this.level = 1;
        this.startTime = Date.now();
        this.isGameOver = false;

        // Player Cannon
        this.cannon = {
            x: 0,
            y: 0,
            angle: -Math.PI / 2, // pointing up
            length: 44,
            width: 14,
            recoil: 0
        };

        // Aiming state
        this.isAiming = false;
        this.aimX = 0;
        this.aimY = 0;

        // Entities
        this.bullets = [];
        this.particles = [];
        this.floatingTexts = [];

        // Fixed Rail Track & Sliding Trolley (Thanh cố định, móc & dây & thẻ trượt trên thanh)
        this.rail = {
            x: 0,
            y: 85,
            width: 360,
            height: 14
        };

        this.trolley = {
            x: 0,
            vx: 1.6,
            targetVx: 1.6,
            speedTimer: 0,
            baseSpeed: 1.8,
            cardSpacing: 80,
            cardWidth: 70
        };

        // Card Dimensions chuẩn xác (156 x 222 px)
        this.cardWidth = 156;
        this.cardHeight = 222;
        this.startCountdown = 5.0; // 5s đầu trận các thẻ đứng yên

        this.cards = [];
        this.cardDefinitions = [
            { id: 1, imgSrc: 'assets/card1.jpg', suit: '♠', val: 'A', name: 'Thẻ 1', color: '#38bdf8', bg: '#0f172a', border: '#38bdf8' },
            { id: 2, imgSrc: 'assets/card2.jpg', suit: '♥', val: 'K', name: 'Thẻ 2', color: '#f43f5e', bg: '#1e1124', border: '#f43f5e' },
            { id: 3, imgSrc: 'assets/card3.jpg', suit: '♦', val: 'Q', name: 'Thẻ 3', color: '#fbbf24', bg: '#23180c', border: '#fbbf24' },
            { id: 4, imgSrc: 'assets/card4.jpg', suit: '♣', val: 'J', name: 'Thẻ 4', color: '#34d399', bg: '#0c2017', border: '#34d399' }
        ];

        this.preloadCardImages();
        this.initResize();
        this.bindEvents();
        this.resetGame();
        this.lastTime = performance.now();
        requestAnimationFrame((time) => this.loop(time));
    }

    preloadCardImages() {
        this.cardDefinitions.forEach(def => {
            const tryLoad = (src, altSrc) => {
                const img = new Image();
                img.onload = () => {
                    def.imageLoaded = true;
                    def.image = img;
                };
                img.onerror = () => {
                    if (altSrc) {
                        tryLoad(altSrc, null);
                    } else {
                        def.imageLoaded = false;
                    }
                };
                img.src = src;
            };

            // Hỗ trợ tự động nhận diện cả file .jpg và .png
            const baseName = def.imgSrc.replace(/\.(jpg|png|jpeg|webp)$/i, '');
            const primary = def.imgSrc;
            const alternative = primary.endsWith('.jpg') ? `${baseName}.png` : `${baseName}.jpg`;
            tryLoad(primary, alternative);
        });
    }

    initResize() {
        const resize = () => {
            const rect = this.canvas.parentElement.getBoundingClientRect();
            this.width = rect.width;
            this.height = rect.height;
            this.dpr = Math.min(window.devicePixelRatio || 1, 2);

            this.canvas.width = this.width * this.dpr;
            this.canvas.height = this.height * this.dpr;
            this.ctx.scale(this.dpr, this.dpr);

            // Update cannon position to bottom center
            this.cannon.x = this.width / 2;
            this.cannon.y = this.height - 45;

            // Thanh ray cố định trên đỉnh màn hình (không di chuyển)
            this.rail.x = this.width / 2;
            this.rail.y = Math.max(65, this.height * 0.08);
            this.rail.width = Math.min(this.width - 20, 680);
            this.trolley.x = this.rail.x;
        };

        window.addEventListener('resize', resize);
        resize();
    }

    resetGame(isNextLevel = false) {
        if (!isNextLevel) {
            this.level = 1;
            this.score = 0;
            this.shotsFired = 0;
        } else {
            this.level++;
        }

        this.startTime = Date.now();
        this.isGameOver = false;
        this.ropesCutCount = 0;
        this.bullets = [];
        this.particles = [];
        this.floatingTexts = [];
        this.victoryModal.classList.add('hidden');
        this.startCountdown = 5.0; // Đứng yên 5 giây lúc mới vào

        // Kích thước thẻ chuẩn xác theo yêu cầu (156 x 222 px)
        const cardWidth = this.cardWidth;
        const cardHeight = this.cardHeight;

        // Tốc độ di chuyển cơ sở theo màn chơi
        const baseSpeed = 1.6 + (this.level - 1) * 0.6;

        // Giới hạn trượt trên thanh ray: móc trượt có thể lướt dọc chiều dài thanh ray
        const railHalf = this.rail.width / 2;
        const minTravelX = Math.max(this.rail.x - railHalf + 35, 45);
        const maxTravelX = Math.min(this.rail.x + railHalf - 35, this.width - 45);
        const span = Math.max(80, maxTravelX - minTravelX);

        this.cards = this.cardDefinitions.map((def, i) => {
            // Vị trí xuất phát rải đều trên thanh
            const startX = minTravelX + (i / 3) * span;

            // Hướng di chuyển so le đan xen: Thẻ 0, 2 đi sang phải | Thẻ 1, 3 đi sang trái
            // Vận tốc khác nhau để các thẻ liên tục đan chéo và XUYÊN QUA NHAU
            const initialDir = (i % 2 === 0) ? 1 : -1;
            const speedVar = 0.85 + (i * 0.22);
            const initialVx = initialDir * baseSpeed * speedVar;

            return {
                id: i,
                def: def,
                x: startX,
                vx: initialVx,
                targetVx: initialVx,
                baseSpeed: baseSpeed * speedVar,
                speedTimer: 1.8 + i * 0.7,
                ropeLength: 48 + (i % 2 === 0 ? 0 : 200), // So le độ dài dây nhẹ để các thẻ khi xuyên qua nhau trông cực kỳ thoáng mắt
                ropeCut: false,
                ropeCutRatio: 0,
                swayAngle: 0,
                swayVel: 0,
                y: 0,
                vy: 0,
                rotation: 0,
                rotSpeed: 0,
                width: cardWidth,
                height: cardHeight,
                isDropped: false
            };
        });

        this.updateHUD();
    }

    updateHUD() {
        if (this.levelValEl) this.levelValEl.textContent = this.level;
        if (this.scoreValEl) this.scoreValEl.textContent = this.score;
        if (this.highScoreValEl) this.highScoreValEl.textContent = this.highScore;
        const remaining = 4 - this.ropesCutCount;
        if (this.cardsLeftEl) this.cardsLeftEl.textContent = `${remaining} / 4`;
    }

    bindEvents() {
        // Toggle sound
        this.soundBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.sound.enabled = !this.sound.enabled;
            this.soundOnIcon.style.display = this.sound.enabled ? 'block' : 'none';
            this.soundOffIcon.style.display = this.sound.enabled ? 'none' : 'block';
        });

        // Next level & replay buttons
        this.nextLevelBtn.addEventListener('click', () => {
            this.resetGame(true);
        });
        this.replayBtn.addEventListener('click', () => {
            this.resetGame(false);
        });

        // Touch & Mouse Input Handlers
        const getCanvasPos = (evt) => {
            const rect = this.canvas.getBoundingClientRect();
            const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
            const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const handleStart = (pos) => {
            if (this.isGameOver) return;
            this.sound.init(); // unlock audio on first touch
            this.isAiming = true;
            this.updateAim(pos.x, pos.y);
            // Hide initial guide on first interaction
            if (this.aimGuide) {
                this.aimGuide.style.opacity = '0';
                setTimeout(() => {
                    if (this.aimGuide && this.aimGuide.parentNode) {
                        this.aimGuide.style.display = 'none';
                    }
                }, 500);
            }
        };

        const handleMove = (pos) => {
            if (!this.isAiming || this.isGameOver) return;
            this.updateAim(pos.x, pos.y);
        };

        const handleEnd = () => {
            if (!this.isAiming || this.isGameOver) return;
            this.isAiming = false;
            this.shoot();
        };

        // Pointer / Touch Events
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            handleStart(getCanvasPos(e));
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            handleMove(getCanvasPos(e));
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            handleEnd();
        });

        // Mouse Events (for testing on desktop/laptop)
        this.canvas.addEventListener('mousedown', (e) => {
            handleStart(getCanvasPos(e));
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isAiming) {
                const rect = this.canvas.getBoundingClientRect();
                handleMove({ x: e.clientX - rect.left, y: e.clientY - rect.top });
            }
        });

        window.addEventListener('mouseup', () => {
            handleEnd();
        });
    }

    updateAim(targetX, targetY) {
        this.aimX = targetX;
        this.aimY = targetY;

        // Angle from cannon mouth towards aim point (clamped to upper 160 degrees)
        const dx = targetX - this.cannon.x;
        const dy = targetY - this.cannon.y;
        let angle = Math.atan2(dy, dx);

        // Clamp angle so cannon only aims upwards (between -170 deg and -10 deg)
        const minAngle = -Math.PI + 0.15;
        const maxAngle = -0.15;
        if (angle > 0) {
            angle = dx < 0 ? minAngle : maxAngle;
        } else {
            angle = Math.max(minAngle, Math.min(maxAngle, angle));
        }

        this.cannon.angle = angle;
    }

    shoot() {
        this.shotsFired++;
        this.cannon.recoil = 8;
        this.sound.playShoot();

        // Spawn high-speed glowing bullet
        const speed = 19;
        const spawnDist = this.cannon.length;
        const bx = this.cannon.x + Math.cos(this.cannon.angle) * spawnDist;
        const by = this.cannon.y + Math.sin(this.cannon.angle) * spawnDist;

        this.bullets.push({
            x: bx,
            y: by,
            prevX: bx,
            prevY: by,
            vx: Math.cos(this.cannon.angle) * speed,
            vy: Math.sin(this.cannon.angle) * speed,
            radius: 4.5,
            trail: []
        });

        // Small muzzle flash particles
        for (let i = 0; i < 7; i++) {
            const spread = (Math.random() - 0.5) * 0.8;
            const pSpeed = Math.random() * 4 + 2;
            this.particles.push({
                x: bx,
                y: by,
                vx: Math.cos(this.cannon.angle + spread) * pSpeed,
                vy: Math.sin(this.cannon.angle + spread) * pSpeed,
                radius: Math.random() * 3 + 1.5,
                color: '#f59e0b',
                alpha: 1,
                decay: 0.08
            });
        }

        this.updateHUD();
    }

    // Line segment to point distance for precise collision check
    distToSegment(p, v, w) {
        const l2 = (v.x - w.x) * (v.x - w.x) + (v.y - w.y) * (v.y - w.y);
        if (l2 === 0) return Math.hypot(p.x - v.x, p.y - v.y);
        let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
        t = Math.max(0, Math.min(1, t));
        return {
            dist: Math.hypot(p.x - (v.x + t * (w.x - v.x)), p.y - (v.y + t * (w.y - v.y))),
            t: t
        };
    }

    update(dt) {
        // --- 1. Cập nhật vị trí từng thẻ độc lập (Trượt và XUYÊN QUA NHAU trên thanh) ---
        const hookY = this.rail.y + this.rail.height / 2;
        const railHalf = this.rail.width / 2;
        const minX = Math.max(this.rail.x - railHalf + 35, 45);
        const maxX = Math.min(this.rail.x + railHalf - 35, this.width - 45);

        // Đếm ngược 5 giây đầu trận thẻ đứng yên
        if (this.startCountdown > 0) {
            this.startCountdown = Math.max(0, this.startCountdown - dt);
        }

        this.cards.forEach((card) => {
            if (!card.ropeCut) {
                if (this.startCountdown > 0) {
                    // 5 giây đầu trận: Thẻ đứng yên hoàn toàn
                    card.vx = 0;
                } else {
                    // Sau 5 giây: Thẻ bắt đầu di chuyển, đổi hướng / tốc độ ngẫu nhiên độc lập
                    card.speedTimer -= dt;
                    if (card.speedTimer <= 0) {
                        const dir = Math.random() < 0.5 ? 1 : -1;
                        const speedMultiplier = 0.75 + Math.random() * 0.75;
                        card.targetVx = dir * card.baseSpeed * speedMultiplier;
                        card.speedTimer = 2.0 + Math.random() * 2.0;
                    }

                    // Cập nhật vị trí trượt mượt mà
                    card.vx += (card.targetVx - card.vx) * 0.05;
                    card.x += card.vx;

                    // Nảy lại khi móc trượt chạm 2 đầu giới hạn trên thanh ray cố định
                    if (card.x < minX) {
                        card.x = minX;
                        card.vx = Math.abs(card.vx);
                        card.targetVx = Math.abs(card.targetVx);
                    } else if (card.x > maxX) {
                        card.x = maxX;
                        card.vx = -Math.abs(card.vx);
                        card.targetVx = -Math.abs(card.targetVx);
                    }
                }

                // Thẻ và dây thẳng đứng 100%, di chuyển êm, KHÔNG LẮC
                card.swayAngle = 0;
                card.swayVel = 0;
                card.y = hookY + card.ropeLength;
                card.rotation = 0;
            } else {
                // Rơi tự do khi dây bị cắt
                card.vy += 0.45; // Trọng lực rơi
                card.x += card.vx;
                card.y += card.vy;
                card.rotation += card.rotSpeed;

                // Check if card has fallen off bottom
                if (card.y - card.height > this.height && !card.isDropped) {
                    card.isDropped = true;
                    this.checkVictoryCondition();
                }
            }
        });

        // Cannon recoil recovery
        if (this.cannon.recoil > 0) {
            this.cannon.recoil = Math.max(0, this.cannon.recoil - 0.5);
        }

        // --- 2. Update Bullets & Hit Detection ---
        for (let bIndex = this.bullets.length - 1; bIndex >= 0; bIndex--) {
            const b = this.bullets[bIndex];
            b.prevX = b.x;
            b.prevY = b.y;
            b.x += b.vx;
            b.y += b.vy;

            // Trail history
            b.trail.unshift({ x: b.x, y: b.y });
            if (b.trail.length > 6) b.trail.pop();

            let bulletRemoved = false;

            // Check collision with cards and ropes
            for (let cIndex = 0; cIndex < this.cards.length; cIndex++) {
                const card = this.cards[cIndex];

                // If rope is still intact, check bullet hit on the rope line!
                if (!card.ropeCut) {
                    const hookX = card.x;
                    const hookY = this.rail.y + this.rail.height / 2;
                    const cardTopX = card.x;
                    const cardTopY = card.y;

                    // Rope collision segment
                    const hitCheck = this.distToSegment(
                        { x: b.x, y: b.y },
                        { x: hookX, y: hookY },
                        { x: cardTopX, y: cardTopY }
                    );

                    // If bullet is within rope hit radius (generous 11px for smooth mobile aiming)
                    if (hitCheck.dist <= 11) {
                        // CUT THE ROPE!
                        card.ropeCut = true;
                        card.ropeCutRatio = hitCheck.t;
                        this.ropesCutCount++;
                        this.score += 250;
                        this.updateHUD();

                        this.sound.playRopeCut();

                        // Card keeps its horizontal momentum while falling down
                        card.vx = card.vx * 0.8 + (Math.random() - 0.5) * 1.5;
                        card.vy = 1;
                        card.rotSpeed = (Math.random() - 0.5) * 0.06 + (card.vx > 0 ? 0.02 : -0.02);

                        // Sparks at cut point
                        const cutX = hookX + hitCheck.t * (cardTopX - hookX);
                        const cutY = hookY + hitCheck.t * (cardTopY - hookY);
                        this.spawnSparks(cutX, cutY, '#f59e0b', 24);

                        // Floating score popup
                        this.floatingTexts.push({
                            text: '+250 CẮT DÂY!',
                            x: cutX,
                            y: cutY - 10,
                            alpha: 1,
                            vy: -1.4,
                            color: '#10b981'
                        });

                        // Remove bullet
                        this.bullets.splice(bIndex, 1);
                        bulletRemoved = true;
                        break;
                    }

                    // Bullet pierces through card body (đạn xuyên qua thẻ bài)
                    // Thẻ bài không còn chặn đạn, đạn tiếp tục bay thẳng lên để cắt dây!
                    const cardCenterY = card.y + card.height / 2;
                    const dx = Math.abs(b.x - card.x);
                    const dy = Math.abs(b.y - cardCenterY);

                    if (dx < card.width / 2 && dy < card.height / 2) {
                        // Hiệu ứng xuyên thấu nhẹ (chớp tia năng lượng) nếu chưa kích hoạt gần đây
                        if (!b.hitCards) b.hitCards = new Set();
                        if (!b.hitCards.has(card.id)) {
                            b.hitCards.add(card.id);
                            // Tia sáng năng lượng xuyên qua thẻ
                            this.spawnSparks(b.x, b.y, card.def.color, 4);
                        }
                    }
                }
            }

            // Remove bullets that fly off-screen
            if (!bulletRemoved) {
                if (b.x < -20 || b.x > this.width + 20 || b.y < -20 || b.y > this.height + 20) {
                    this.bullets.splice(bIndex, 1);
                }
            }
        }

        // --- 4. Update Particles ---
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.alpha -= p.decay;
            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
            }
        }

        // --- 5. Update Floating Texts ---
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const t = this.floatingTexts[i];
            t.y += t.vy;
            t.alpha -= 0.022;
            if (t.alpha <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    spawnSparks(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 1.5;
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                radius: Math.random() * 2.8 + 1,
                color: color,
                alpha: 1,
                decay: 0.03 + Math.random() * 0.03
            });
        }
    }

    checkVictoryCondition() {
        const allDropped = this.cards.every(c => c.ropeCut);
        if (allDropped && !this.isGameOver) {
            this.isGameOver = true;
            this.sound.playWin();

            // Confetti celebration particles
            for (let i = 0; i < 70; i++) {
                const colors = ['#f59e0b', '#06b6d4', '#10b981', '#f43f5e', '#a855f7'];
                this.particles.push({
                    x: this.width * Math.random(),
                    y: this.height * 0.3,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -Math.random() * 7 - 2,
                    radius: Math.random() * 4 + 2,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    alpha: 1,
                    decay: 0.012
                });
            }

            // Calculate stats
            const elapsedTime = Math.round((Date.now() - this.startTime) / 1000);
            const accuracy = this.shotsFired > 0 ? Math.min(100, Math.round((4 / this.shotsFired) * 100)) : 100;
            // Bonus points for accuracy & speed
            const accuracyBonus = Math.round(accuracy * 5);
            const timeBonus = Math.max(0, 300 - elapsedTime * 10);
            this.score += accuracyBonus + timeBonus;

            // Save High Score & Max Level to localStorage
            let isNewHighScore = false;
            if (this.score > this.highScore) {
                this.highScore = this.score;
                localStorage.setItem('cardShooter_highScore', this.highScore);
                isNewHighScore = true;
            }

            if (this.level >= this.maxUnlockedLevel) {
                this.maxUnlockedLevel = this.level + 1;
                localStorage.setItem('cardShooter_maxLevel', this.maxUnlockedLevel);
            }

            this.updateHUD();

            this.finalScoreEl.innerHTML = `${this.score} ${isNewHighScore ? '<span style="color:#f59e0b;font-size:12px;">(KỶ LỤC MỚI!)</span>' : ''}`;
            this.finalShotsEl.textContent = this.shotsFired;
            this.finalAccuracyEl.textContent = `${accuracy}%`;
            this.finalTimeEl.textContent = `${elapsedTime}s`;

            setTimeout(() => {
                this.victoryModal.classList.remove('hidden');
            }, 600);
        }
    }

    // --- Render Loop ---
    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Subtle background grid lines for shooting gallery feel
        this.drawBackgroundGrid();

        // 1. Draw Moving Rail Track
        this.drawRail();

        // 2. Draw 4 Cards & Ropes
        this.cards.forEach(card => this.drawCardAndRope(card));

        // 3. Draw Aiming Reticle & Trajectory
        if (this.isAiming && !this.isGameOver) {
            this.drawAimGuide();
        }

        // 4. Draw Cannon at bottom
        this.drawCannon();

        // 5. Draw Bullets & Trails
        this.drawBullets();

        // 6. Draw Particles & Confetti
        this.drawParticles();

        // 7. Draw Floating Texts
        this.drawFloatingTexts();
    }

    drawBackgroundGrid() {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
        this.ctx.lineWidth = 1;

        const gridSize = 40;
        for (let x = 0; x < this.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        this.ctx.restore();
    }

    drawRail() {
        this.ctx.save();
        const rx = this.rail.x - this.rail.width / 2;
        const ry = this.rail.y - this.rail.height / 2;

        // Glowing outer bar
        this.ctx.shadowColor = 'rgba(6, 182, 212, 0.5)';
        this.ctx.shadowBlur = 12;

        // Rail metallic body
        const grad = this.ctx.createLinearGradient(0, ry, 0, ry + this.rail.height);
        grad.addColorStop(0, '#475569');
        grad.addColorStop(0.5, '#cbd5e1');
        grad.addColorStop(1, '#1e293b');

        this.ctx.fillStyle = grad;
        this.ctx.beginPath();
        this.ctx.roundRect(rx, ry, this.rail.width, this.rail.height, 6);
        this.ctx.fill();

        // End caps
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(rx, ry + this.rail.height / 2, 7, 0, Math.PI * 2);
        this.ctx.arc(rx + this.rail.width, ry + this.rail.height / 2, 7, 0, Math.PI * 2);
        this.ctx.fill();

        // Level indicator text on rail with countdown display
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#0f172a';
        this.ctx.font = 'bold 9px Rajdhani, sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        if (this.startCountdown > 0) {
            const sec = Math.ceil(this.startCountdown);
            this.ctx.fillText(`MÀN ${this.level} • THẺ SẼ CHẠY SAU: ${sec}S`, this.rail.x, this.rail.y);
        } else {
            this.ctx.fillText(`MÀN ${this.level} • CẮT DÂY 4 THẺ DI CHUYỂN`, this.rail.x, this.rail.y);
        }

        this.ctx.restore();
    }

    drawCardAndRope(card) {
        this.ctx.save();
        const hookX = card.x;
        const hookY = this.rail.y + this.rail.height / 2;

        // Draw Sliding Trolley Clamp on Rail (Móc trượt kim loại di chuyển dọc trên thanh)
        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.roundRect(hookX - 8, hookY - 6, 16, 12, 3);
        this.ctx.fill();

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 1;
        this.ctx.stroke();

        // Bottom Hook Eyelet
        this.ctx.fillStyle = '#cbd5e1';
        this.ctx.beginPath();
        this.ctx.arc(hookX, hookY + 5, 4, 0, Math.PI * 2);
        this.ctx.fill();

        // 1. Draw Rope (Dây nối từ móc trượt xuống thẻ)
        if (!card.ropeCut) {
            // Intact Rope
            this.ctx.strokeStyle = '#e2e8f0';
            this.ctx.lineWidth = 2.5;
            this.ctx.beginPath();
            this.ctx.moveTo(hookX, hookY + 5);
            this.ctx.lineTo(card.x, card.y);
            this.ctx.stroke();

            // Rope texture dashes
            this.ctx.strokeStyle = '#94a3b8';
            this.ctx.lineWidth = 1;
            this.ctx.setLineDash([3, 4]);
            this.ctx.beginPath();
            this.ctx.moveTo(hookX, hookY + 5);
            this.ctx.lineTo(card.x, card.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        } else {
            // Cut Rope: upper dangling stub on the sliding trolley
            const cutT = card.ropeCutRatio || 0.5;
            const stubX = hookX + cutT * (hookX - card.x) * 0.2;
            const stubY = hookY + 5 + cutT * 22;
            this.ctx.strokeStyle = '#f59e0b';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(hookX, hookY + 5);
            this.ctx.lineTo(stubX, stubY);
            this.ctx.stroke();
        }

        // 2. Draw Card Body (Kích thước 156 x 222 px)
        this.ctx.save();
        this.ctx.translate(card.x, card.y);
        this.ctx.rotate(card.rotation);

        const cw = card.width;
        const ch = card.height;

        // Card Drop Shadow
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
        this.ctx.shadowBlur = 12;
        this.ctx.shadowOffsetY = 5;

        // Card Background
        this.ctx.fillStyle = card.def.bg;
        this.ctx.beginPath();
        this.ctx.roundRect(-cw / 2, 0, cw, ch, 12);
        this.ctx.fill();

        // If custom image is loaded, render image clipped with rounded corners (cover fit)
        if (card.def.imageLoaded && card.def.image) {
            this.ctx.save();
            this.ctx.beginPath();
            this.ctx.roundRect(-cw / 2, 0, cw, ch, 12);
            this.ctx.clip();

            const img = card.def.image;
            const imgRatio = img.width / img.height;
            const cardRatio = cw / ch;
            let sx = 0, sy = 0, sw = img.width, sh = img.height;

            if (imgRatio > cardRatio) {
                sw = img.height * cardRatio;
                sx = (img.width - sw) / 2;
            } else {
                sh = img.width / cardRatio;
                sy = (img.height - sh) / 2;
            }

            this.ctx.drawImage(img, sx, sy, sw, sh, -cw / 2, 0, cw, ch);
            this.ctx.restore();
        } else {
            // Fallback: Default Rank & Suit (Scaled for 156 x 222 px)
            this.ctx.fillStyle = card.def.color;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';

            // Top Corner Symbol
            this.ctx.font = 'bold 22px Outfit, sans-serif';
            this.ctx.fillText(`${card.def.val}`, -cw / 2 + 18, 22);
            this.ctx.font = '20px Outfit, sans-serif';
            this.ctx.fillText(`${card.def.suit}`, -cw / 2 + 18, 44);

            // Center Big Suit
            this.ctx.font = '60px Outfit, sans-serif';
            this.ctx.fillText(card.def.suit, 0, ch / 2 + 5);

            // Card Name Tag
            this.ctx.font = 'bold 15px Rajdhani, sans-serif';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText(card.def.name, 0, ch - 18);
        }

        // Card Border (neon outline)
        this.ctx.shadowBlur = 0;
        this.ctx.strokeStyle = card.def.border;
        this.ctx.lineWidth = 2.5;
        this.ctx.stroke();

        // Top Attachment Ring on Card
        this.ctx.fillStyle = '#e2e8f0';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 4, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
        this.ctx.restore();
    }

    drawAimGuide() {
        this.ctx.save();

        // Trajectory line from cannon
        const startDist = this.cannon.length;
        const startX = this.cannon.x + Math.cos(this.cannon.angle) * startDist;
        const startY = this.cannon.y + Math.sin(this.cannon.angle) * startDist;

        const maxDist = this.height * 0.95;
        const endX = this.cannon.x + Math.cos(this.cannon.angle) * maxDist;
        const endY = this.cannon.y + Math.sin(this.cannon.angle) * maxDist;

        // Dotted glowing laser sight
        this.ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([6, 8]);
        this.ctx.shadowColor = '#06b6d4';
        this.ctx.shadowBlur = 8;

        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.lineTo(endX, endY);
        this.ctx.stroke();

        // Crosshair reticle at aim finger position
        this.ctx.setLineDash([]);
        this.ctx.strokeStyle = '#f59e0b';
        this.ctx.lineWidth = 2;
        this.ctx.shadowColor = '#f59e0b';
        this.ctx.shadowBlur = 10;

        this.ctx.beginPath();
        this.ctx.arc(this.aimX, this.aimY, 16, 0, Math.PI * 2);
        this.ctx.stroke();

        // Crosshair ticks
        const tLen = 6;
        this.ctx.beginPath();
        this.ctx.moveTo(this.aimX - 16 - tLen, this.aimY);
        this.ctx.lineTo(this.aimX - 16, this.aimY);
        this.ctx.moveTo(this.aimX + 16, this.aimY);
        this.ctx.lineTo(this.aimX + 16 + tLen, this.aimY);
        this.ctx.moveTo(this.aimX, this.aimY - 16 - tLen);
        this.ctx.lineTo(this.aimX, this.aimY - 16);
        this.ctx.moveTo(this.aimX, this.aimY + 16);
        this.ctx.lineTo(this.aimX, this.aimY + 16 + tLen);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawCannon() {
        this.ctx.save();
        this.ctx.translate(this.cannon.x, this.cannon.y);

        // Base Turret Plate
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#1e293b';
        this.ctx.beginPath();
        this.ctx.arc(0, 14, 28, Math.PI, Math.PI * 2);
        this.ctx.fill();

        this.ctx.strokeStyle = '#06b6d4';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(0, 14, 28, Math.PI, Math.PI * 2);
        this.ctx.stroke();

        // Rotating Cannon Barrel
        this.ctx.rotate(this.cannon.angle);

        // Barrel with recoil offset
        const barrelLen = this.cannon.length - this.cannon.recoil;
        const barrelW = this.cannon.width;

        const barrelGrad = this.ctx.createLinearGradient(0, -barrelW / 2, 0, barrelW / 2);
        barrelGrad.addColorStop(0, '#64748b');
        barrelGrad.addColorStop(0.5, '#f8fafc');
        barrelGrad.addColorStop(1, '#334155');

        this.ctx.fillStyle = barrelGrad;
        this.ctx.beginPath();
        this.ctx.roundRect(0, -barrelW / 2, barrelLen, barrelW, [0, 4, 4, 0]);
        this.ctx.fill();

        // Barrel glowing neon stripe
        this.ctx.fillStyle = '#06b6d4';
        this.ctx.shadowColor = '#06b6d4';
        this.ctx.shadowBlur = 6;
        this.ctx.fillRect(4, -2, barrelLen - 8, 4);

        // Center Pivot Dome
        this.ctx.shadowBlur = 0;
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 13, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.fillStyle = '#f59e0b';
        this.ctx.beginPath();
        this.ctx.arc(0, 0, 6, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.restore();
    }

    drawBullets() {
        this.ctx.save();
        this.bullets.forEach(b => {
            // Glowing trail
            for (let i = 0; i < b.trail.length; i++) {
                const pt = b.trail[i];
                const alpha = (1 - i / b.trail.length) * 0.6;
                this.ctx.fillStyle = `rgba(245, 158, 11, ${alpha})`;
                this.ctx.beginPath();
                this.ctx.arc(pt.x, pt.y, b.radius * (1 - i / b.trail.length * 0.5), 0, Math.PI * 2);
                this.ctx.fill();
            }

            // Bullet core
            this.ctx.shadowColor = '#f59e0b';
            this.ctx.shadowBlur = 12;
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    drawParticles() {
        this.ctx.save();
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = Math.max(0, p.alpha);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.restore();
    }

    drawFloatingTexts() {
        this.ctx.save();
        this.floatingTexts.forEach(t => {
            this.ctx.globalAlpha = Math.max(0, t.alpha);
            this.ctx.fillStyle = t.color;
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
            this.ctx.shadowBlur = 6;
            this.ctx.font = 'bold 15px Outfit, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(t.text, t.x, t.y);
        });
        this.ctx.restore();
    }

    loop(timestamp) {
        const dt = Math.min((timestamp - this.lastTime) / 1000, 0.1);
        this.lastTime = timestamp;

        this.update(dt);
        this.draw();

        requestAnimationFrame((t) => this.loop(t));
    }
}

// Start game when DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    window.game = new Game();
});
