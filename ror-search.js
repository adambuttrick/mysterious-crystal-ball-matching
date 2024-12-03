class PixelParticle {
    constructor(x, y, targetX, targetY, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 4 + 2;
        this.targetX = targetX;
        this.targetY = targetY;
        this.speed = Math.random() * 6 + 3;
        this.color = color;
        this.opacity = Math.random();
        this.life = 1;
        this.delay = Math.random() * 30;
        
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * 50;
        this.spiralSpeed = (Math.random() * 0.1 + 0.05) * (Math.random() < 0.5 ? 1 : -1);
        
        const angle = Math.random() * Math.PI * 2;
        this.vx = Math.cos(angle) * this.speed;
        this.vy = Math.sin(angle) * this.speed;
    }

    update() {
        if (this.delay > 0) {
            this.delay--;
            return;
        }

        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > 1) {
            this.angle += this.spiralSpeed;
            const spiralX = Math.cos(this.angle) * this.radius;
            const spiralY = Math.sin(this.angle) * this.radius;
            
            this.radius *= 0.95;
            
            this.vx += (dx / distance) * 1.2 + spiralX * 0.1;
            this.vy += (dy / distance) * 1.2 + spiralY * 0.1;
            
            this.x += this.vx;
            this.y += this.vy;
            
            this.vx *= 0.95 + Math.random() * 0.1;
            this.vy *= 0.95 + Math.random() * 0.1;
        }
        
        this.opacity = Math.min(1, this.opacity + 0.03);
        this.life -= 0.006;
    }

    draw(ctx) {
        if (this.delay > 0) return;
        
        ctx.shadowColor = this.color;
        ctx.shadowBlur = 5;
        
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity * this.life})`;
        ctx.fillRect(
            Math.round(this.x),
            Math.round(this.y),
            this.size,
            this.size
        );
        
        ctx.shadowBlur = 0;
    }
}

class ParticleEffect {
    constructor(canvas, text) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: true });
        this.particles = [];
        this.text = text;
        this.fontSize = 18;
        this.isAnimating = true;
        
        this.canvas.setAttribute('role', 'img');
        this.canvas.setAttribute('aria-label', 'Animated particle effect showing ROR ID with floating pixels');
        
        this.createLiveRegion();
        this.createParticles();
        this.updateAccessibleStatus();
    }

    createLiveRegion() {
        const liveRegion = document.createElement('div');
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.className = 'sr-only';
        this.canvas.parentElement?.appendChild(liveRegion);
    }

    updateAccessibleStatus() {
        const liveRegion = this.canvas.parentElement?.querySelector('[role="status"]');
        if (liveRegion) {
            if (this.isAnimating) {
                liveRegion.textContent = `Animating particles to form the ROR ID: ${this.text}`;
            } else {
                liveRegion.textContent = `Animation complete. Displaying ROR ID: ${this.text}`;
            }
        }
    }

    createParticles() {
        this.particles = [];
        
        this.ctx.font = `${this.fontSize}px 'Press Start 2P'`;
        const textMetrics = this.ctx.measureText(this.text);
        const textWidth = textMetrics.width;
        const textHeight = this.fontSize;

        const textX = (this.canvas.width - textWidth) / 2;
        const textY = (this.canvas.height - textHeight) / 2 - 25;

        const numParticles = 200;
        const colors = [
            '60, 130, 214',
            '100, 160, 244',
            '140, 190, 255',
            '180, 220, 255',
            '220, 240, 255'
        ];

        for (let i = 0; i < numParticles; i++) {
            const angle = (i / numParticles) * Math.PI * 2;
            const radius = Math.max(this.canvas.width, this.canvas.height);
            const startX = this.canvas.width/2 + Math.cos(angle) * radius;
            const startY = this.canvas.height/2 + Math.sin(angle) * radius;

            const progress = i / numParticles;
            const targetX = textX + (progress * textWidth);
            const targetY = textY + (Math.random() * textHeight);

            const color = colors[Math.floor(Math.random() * colors.length)];
            this.particles.push(new PixelParticle(startX, startY, targetX, targetY, color));
        }
    }

    update() {
        if (!this.isAnimating) return;
        
        let allSettled = true;
        this.particles.forEach(particle => {
            particle.update();
            if (particle.life > 0) allSettled = false;
        });

        if (allSettled) {
            this.isAnimating = false;
            this.updateAccessibleStatus();
        }
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.particles.forEach(particle => {
            particle.draw(this.ctx);
        });

        if (!this.isAnimating) {
            this.ctx.font = `${this.fontSize}px 'Press Start 2P'`;
            const textMetrics = this.ctx.measureText(this.text);
            const x = (this.canvas.width - textMetrics.width) / 2;
            const y = (this.canvas.height + this.fontSize / 2) / 2 - 25;
            
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillText(this.text, x + 2, y + 2);
            
            this.ctx.fillStyle = 'rgb(255, 255, 255)';
            this.ctx.fillText(this.text, x, y);
        }
    }

    animate() {
        if (!this.isAnimating) return;
        
        this.update();
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

async function searchRORDatabase(affiliation) {
    const encodedAffiliation = encodeURIComponent(affiliation);
    const response = await fetch(`https://api.ror.org/organizations?affiliation=${encodedAffiliation}`);
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
}

function createResultElement() {
    const resultDiv = document.createElement('div');
    resultDiv.style.fontFamily = "'Press Start 2P', cursive";
    resultDiv.style.fontSize = '12px';
    resultDiv.style.marginTop = '20px';
    resultDiv.style.textAlign = 'center';
    resultDiv.style.padding = '20px';
    resultDiv.style.backgroundColor = 'white';
    resultDiv.style.borderRadius = '8px';
    resultDiv.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
    resultDiv.style.maxWidth = '500px';
    resultDiv.style.wordWrap = 'break-word';
    return resultDiv;
}

function createParticleCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = 384;
    canvas.height = 384;
    canvas.style.position = 'absolute';
    canvas.style.left = '20px';
    canvas.style.top = '20px';
    canvas.style.pointerEvents = 'none';
    canvas.style.imageRendering = 'pixelated';
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Animated particle effect showing ROR ID with floating pixels');
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.className = 'sr-only';
    canvas.parentElement?.appendChild(liveRegion);
    return canvas;
}

function createSparkles(container) {
    const numberOfSparkles = 30;  // More sparkles since they're smaller
    const containerRect = container.getBoundingClientRect();
    
    // Create sparkles in waves
    for (let wave = 0; wave < 3; wave++) {
        setTimeout(() => {
            for (let i = 0; i < numberOfSparkles; i++) {
                const sparkle = document.createElement('div');
                sparkle.className = 'sparkle';
                
                // Random position within and around the container
                const x = Math.random() * (containerRect.width + 60) - 30;
                const y = Math.random() * (containerRect.height + 60) - 30;
                
                // Smaller size for pixel-like appearance
                const size = Math.random() * 4 + 2;  // 2-6px size range
                
                sparkle.style.width = `${size}px`;
                sparkle.style.height = `${size}px`;
                sparkle.style.left = `${Math.round(x)}px`;  // Round to whole pixels
                sparkle.style.top = `${Math.round(y)}px`;   // Round to whole pixels
                
                // Shorter duration for snappier effect
                const duration = Math.random() * 800 + 400;
                sparkle.style.animation = `sparkle ${duration}ms steps(8) forwards`;  // Use steps for pixelated animation
                
                container.appendChild(sparkle);
                
                // Remove sparkle after animation
                setTimeout(() => {
                    sparkle.remove();
                }, duration);
            }
        }, wave * 150);  // Slightly faster waves
    }
}

function startAnimation(effect, resultDiv, showSparkles = false) {
    const waitForAnimation = new Promise(resolve => {
        function checkAnimation() {
            if (!effect.isAnimating) {
                resolve();
            } else {
                requestAnimationFrame(checkAnimation);
            }
        }
        checkAnimation();
    });

    effect.animate();
    
    waitForAnimation.then(async () => {
        const canvas = document.getElementById('pixelArtCanvas');
        canvas.classList.add('flash-effect');
        await new Promise(resolve => setTimeout(resolve, 400));
        canvas.classList.remove('flash-effect');
        
        // Show the result and create sparkles only if an organization was found
        resultDiv.style.opacity = '1';
        if (showSparkles) {
            setTimeout(() => {
                createSparkles(resultDiv);
            }, 100);
        }
    });
}

function displaySearchResult(resultDiv, data) {
    const containerDiv = document.querySelector('.pixel-art-container');
    containerDiv.style.position = 'relative';
    const particleCanvas = createParticleCanvas();
    particleCanvas.classList.add('animation-canvas');
    
    const previousCanvas = containerDiv.querySelector('.animation-canvas');
    if (previousCanvas) {
        previousCanvas.remove();
    }
    
    containerDiv.appendChild(particleCanvas);
    
    // Set up result container positioning
    resultDiv.style.position = 'relative';  
    resultDiv.style.opacity = '0';
    resultDiv.style.transition = 'opacity 0.5s ease-in';

    if (data.items && data.items.length > 0 && data.items.find(item => item.chosen === true)) {
        const chosenResult = data.items.find(item => item.chosen === true);
        const rorId = chosenResult.organization.id.replace('https://ror.org/', '');
        
        resultDiv.innerHTML = `
            <div style="margin-bottom: 10px;">Found matching organization:</div>
            <div style="color: #0066cc;">Name: ${chosenResult.organization.name}</div>
            <div style="margin-top: 5px;">ROR ID: <a href=${chosenResult.organization.id}>${chosenResult.organization.id}<a></div>
            <div style="margin-top: 5px;">Location: ${chosenResult.organization.country.country_name}</div>
        `;
        
        const effect = new ParticleEffect(particleCanvas, rorId);
        startAnimation(effect, resultDiv, true);  // Show sparkles for found organization
    } else {
        const effect = new ParticleEffect(particleCanvas, "?");
        resultDiv.innerHTML = `
            <div style="color: #ff0000;">No matching organizations found.</div>
        `;
        startAnimation(effect, resultDiv, false);  // Don't show sparkles for no results
    }
}

async function handleSubmit(event) {
    event.preventDefault();
    const affiliation = document.getElementById('affiliation').value;
    const resultDiv = createResultElement();

    try {
        const data = await searchRORDatabase(affiliation);
        displaySearchResult(resultDiv, data);
    } catch (error) {
        resultDiv.innerHTML = `
            <div style="color: #ff0000;">Error searching for organization: ${error.message}</div>
        `;
    }

    const resultContainer = document.getElementById('resultContainer');
    resultContainer.innerHTML = '';
    resultContainer.appendChild(resultDiv);
}