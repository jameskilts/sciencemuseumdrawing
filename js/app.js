// Copyright (c) James Kilts

document.addEventListener('DOMContentLoaded', function() {
    // Show theme selection screen first
    const themeSelection = document.getElementById('theme-selection');
    const mainApp = document.getElementById('main-app');
    const themeOptions = document.querySelectorAll('.theme-option');
    
    // Ensure theme selection is visible
    themeSelection.style.display = 'flex';
    themeSelection.style.opacity = '1';
    
    // Handle theme selection
    themeOptions.forEach(option => {
        option.addEventListener('click', () => {
            const theme = option.dataset.theme;
            
            // Add loading class to show visual feedback
            option.classList.add('loading');
            
            // Fade out theme selection
            themeSelection.style.opacity = '0';
            
            setTimeout(() => {
                // Hide theme selection and show main app
                themeSelection.style.display = 'none';
                mainApp.style.display = 'flex';
                
                // Small delay to ensure display updates before fading in
                setTimeout(() => {
                    mainApp.style.opacity = '1';
                    // Initialize app with selected theme
                    new ScienceMuseumDrawing(theme);
                }, 50);
                
            }, 300); // Match this with CSS transition duration
        });
    });
});

class ScienceMuseumDrawing {
    constructor(initialTheme = 'space') {
        // Initialize PixiJS application
        this.app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            backgroundColor: 0x1099bb,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            resizeTo: window
        });
        
        document.getElementById('game-container').appendChild(this.app.view);
        
        // Game state
        this.drawings = [];
        this.isCapturing = false;
        this.themeElements = [];
        this.currentTheme = initialTheme;
        
        // Initialize components
        this.initCamera();
        this.initInput();
        this.initTheme();
        this.setupResizeHandler();
        
        // Add back button to return to theme selection
        this.addBackButton();
    }
    
    addBackButton() {
        const backButton = document.createElement('button');
        backButton.id = 'back-button';
        backButton.innerHTML = '←';
        backButton.addEventListener('click', () => {
            // Clean up before going back
            if (this.video && this.video.srcObject) {
                const tracks = this.video.srcObject.getTracks();
                tracks.forEach(track => track.stop());
                this.video.srcObject = null;
            }
            
            // Clean up PixiJS app safely
            if (this.app) {
                // Stop any running animations
                if (this.app.ticker) {
                    this.app.ticker.stop();
                }
                
                // Remove all children and destroy them
                if (this.app.stage) {
                    this.app.stage.destroy({ children: true });
                }
                
                // Remove the view from DOM
                if (this.app.view && this.app.view.parentNode) {
                    this.app.view.parentNode.removeChild(this.app.view);
                }
                
                // Destroy the application
                this.app.destroy(true, {
                    children: true,
                    texture: true,
                    baseTexture: true
                });
                
                this.app = null;
            }
            
            // Clear any remaining elements in game container
            const gameContainer = document.getElementById('game-container');
            while (gameContainer.firstChild) {
                gameContainer.removeChild(gameContainer.firstChild);
            }
            
            // Show theme selection and hide main app with fade
            const themeSelection = document.getElementById('theme-selection');
            const mainApp = document.getElementById('main-app');
            
            mainApp.style.opacity = '0';
            setTimeout(() => {
                mainApp.style.display = 'none';
                themeSelection.style.display = 'flex';
                setTimeout(() => {
                    themeSelection.style.opacity = '1';
                }, 50);
            }, 300);
        });
        
        // Insert back button at the beginning of main-app
        const mainApp = document.getElementById('main-app');
        const firstChild = mainApp.firstChild;
        mainApp.insertBefore(backButton, firstChild);
    }
    
    initCamera() {
        this.video = document.getElementById('webcam');
        this.captureCanvas = document.getElementById('capture-canvas');
        this.captureCtx = this.captureCanvas.getContext('2d', { willReadFrequently: true });
        
        // Set up webcam
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
            navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
                .then(stream => {
                    this.video.srcObject = stream;
                    this.video.play();
                })
                .catch(error => {
                    console.error('Error accessing camera:', error);
                });
        }
    }
    
    initInput() {
        // Spacebar capture
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !this.isCapturing) {
                e.preventDefault();
                this.captureDrawing();
            }
        });

        // File upload handling
        const fileUpload = document.getElementById('file-upload');
        fileUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            if (!file.type.match('image.*')) {
                alert('Please select an image file');
                return;
            }
            
            this.processFileUpload(file);
            
            // Reset the file input to allow selecting the same file again
            e.target.value = '';
        });
    }
    
    /**
     * Processes an uploaded image file
     * @param {File} file - The image file to process
     */
    async processFileUpload(file) {
        if (this.isCapturing) return;
        this.isCapturing = true;
        
        // Show loading indicator
        const hint = document.getElementById('hint');
        const originalHint = hint.textContent;
        hint.textContent = 'Processing your drawing...';
        hint.style.color = '#ffcc00';
        
        try {
            // Create a temporary image element to load the file
            const img = new Image();
            const objectUrl = URL.createObjectURL(file);
            
            await new Promise((resolve, reject) => {
                img.onload = () => {
                    URL.revokeObjectURL(objectUrl); // Clean up
                    resolve();
                };
                img.onerror = (e) => {
                    console.error('Error loading image:', e);
                    reject(new Error('Failed to load image'));
                };
                img.src = objectUrl;
            });

            // Create a canvas to process the image
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // Draw the image to the canvas
            ctx.drawImage(img, 0, 0, img.width, img.height);
            
            // Get the image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Update hint to show processing stage
            hint.textContent = 'Scanning QR code...';
            
            // Process the image (QR code detection and trimming)
            const { imageData: processedImageData, nameImageData, debugInfo } = await this.processImage(imageData);
            
            // Log debug info
            console.debug('Image processing debug info:', debugInfo);
            
            // Create a canvas for the processed image
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = processedImageData.width;
            processedCanvas.height = processedImageData.height;
            const processedCtx = processedCanvas.getContext('2d');
            processedCtx.putImageData(processedImageData, 0, 0);
            
            // Create a texture from the processed canvas
            const texture = PIXI.Texture.from(processedCanvas);
            const drawingSprite = new PIXI.Sprite(texture);

            // Create a sprite for the name
            let nameSprite = null;
            if (nameImageData) {
                const nameCanvas = document.createElement('canvas');
                nameCanvas.width = nameImageData.width;
                nameCanvas.height = nameImageData.height;
                const nameCtx = nameCanvas.getContext('2d');
                nameCtx.putImageData(nameImageData, 0, 0);
                const nameTexture = PIXI.Texture.from(nameCanvas);
                nameSprite = new PIXI.Sprite(nameTexture);
            }
            
            // Position and scale the sprite
            drawingSprite.anchor.set(0.5);
            
            // Calculate position based on theme
            let posX, posY;
            switch(this.currentTheme) {
                case 'space':
                    posX = Math.random() * this.app.screen.width * 0.6 + this.app.screen.width * 0.2;
                    posY = Math.random() * this.app.screen.height * 0.6 + this.app.screen.height * 0.2;
                    break;
                case 'fishtank':
                    posX = Math.random() * this.app.screen.width * 0.6 + this.app.screen.width * 0.2;
                    posY = Math.random() * this.app.screen.height * 0.5 + this.app.screen.height * 0.2;
                    break;
                case 'rocket':
                    posX = this.app.screen.width * 0.5;
                    posY = this.app.screen.height * 0.7;
                    break;
                case 'petri':
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.min(this.app.screen.width, this.app.screen.height) * 0.3 * Math.random();
                    posX = this.app.screen.width / 2 + Math.cos(angle) * radius;
                    posY = this.app.screen.height / 2 + Math.sin(angle) * radius;
                    break;
                default:
                    posX = Math.random() * this.app.screen.width * 0.6 + this.app.screen.width * 0.2;
                    posY = Math.random() * this.app.screen.height * 0.6 + this.app.screen.height * 0.2;
            }
            
            drawingSprite.position.set(posX, posY);
            
            // Scale down the sprite if it's too large
            const maxSize = Math.min(this.app.screen.width, this.app.screen.height) * 
                           (this.currentTheme === 'petri' ? 0.15 : 0.3);
            const scale = Math.min(1, maxSize / Math.max(drawingSprite.width, drawingSprite.height));
            drawingSprite.scale.set(scale);
            
            // Add to drawings array first
            this.drawings.push(drawingSprite);
            
            // Add animation based on theme - this will handle adding the sprite to stage
            // after the tether is created to ensure proper z-ordering
            this.animateDrawing(drawingSprite, nameSprite, true);
            
            // Show success message
            hint.textContent = 'Drawing added successfully!';
            hint.style.color = '#4caf50';
            
            // Reset hint after delay
            setTimeout(() => {
                hint.textContent = originalHint;
                hint.style.color = '';
            }, 3000);
            
        } catch (error) {
            console.error('Error processing uploaded image:', error);
            
            // Show error message
            hint.textContent = 'Error: ' + (error.message || 'Failed to process image');
            hint.style.color = '#f44336';
            
            // Reset hint after delay
            setTimeout(() => {
                hint.textContent = originalHint;
                hint.style.color = '';
            }, 3000);
            
        } finally {
            this.isCapturing = false;
        }
    }

    initTheme() {
        // Clear previous theme elements
        if (this.themeElements) {
            this.themeElements.forEach(element => {
                if (element && element.destroy) element.destroy();
            });
        }
        this.themeElements = [];
        this.app.stage.removeChildren();
        
        // Set body class for theme styling
        document.body.className = `theme-${this.currentTheme}`;
        
        // Initialize the selected theme
        switch(this.currentTheme) {
            case 'space':
                this.createSpaceTheme();
                break;
            case 'fishtank':
                this.createFishtankTheme();
                break;
            case 'rocket':
                this.createRocketTheme();
                break;
            case 'dinosaur':
                this.createDinosaurTheme();
                break;
            case 'petri':
                this.createPetriTheme();
                break;
            case 'solar':
                this.createSolarTheme();
                break;
            case 'body':
                this.createBodyTheme();
                break;
            case 'butterfly':
                this.createButterflyTheme();
                break;
            case 'gears':
                this.createGearsTheme();
                break;
        }
    }
    
    initStarman() {
        this.starman = PIXI.Sprite.from('images/misc/starman_sm_dark.png');
        this.starman.anchor.set(0.5);
        this.starman.visible = false;
        
        this.app.stage.addChild(this.starman);
    }
    
    startStarmanAnimation() {
        if (!this.starman) return;
        
        clearTimeout(this.starmanTimeout);
        
        this.starman.x = -100;
        this.starman.y = 100 + Math.random() * (this.app.screen.height - 200);
        this.starman.scale.set(0.5 + Math.random() * 0.5);
        this.starman.visible = true;
        
        // Random speed between 0.5 and 2
        const speed = 0.5 + Math.random() * 1.5;
        
        // Random rotation speed and direction
        let rotationSpeed = -0.03 + Math.random() * 0.06;
        
        // Animation ticker
        const animate = () => {
            if (!this.starman.visible) {
                this.app.ticker.remove(animate);
                return;
            }
            
            this.starman.x += speed;
            this.starman.rotation += rotationSpeed;
            
            // Hide when off screen to the right
            if (this.starman.x > this.app.screen.width + 100) {
                this.app.ticker.remove(animate);
                this.starman.visible = false;
                
                // Schedule next starman
                const nextStarmanDelay = 10000 + Math.random() * 20000; // 10-30 seconds
                this.starmanTimeout = setTimeout(() => this.startStarmanAnimation(), nextStarmanDelay);
            }
        };
        
        // Start animation
        this.app.ticker.add(animate);
    }
    
    createSpaceTheme() {
        // Create space background
        const spaceBg = new PIXI.Graphics()
            .beginFill(0x000033)
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.app.stage.addChild(spaceBg);
        this.themeElements.push(spaceBg);

        // Add stars
        for (let i = 0; i < 300; i++) {
            const size = Math.random() * 1.5;
            const alpha = 0.5 + Math.random() * 0.5;
            const star = new PIXI.Graphics()
                .beginFill(0xFFFFFF, alpha)
                .drawCircle(
                    Math.random() * this.app.screen.width,
                    Math.random() * this.app.screen.height,
                    size
                );
            this.app.stage.addChild(star);
            this.themeElements.push(star);
        }

        // Add photorealistic Earth arc at the bottom
        const earthRadius = Math.max(this.app.screen.width, this.app.screen.height);
        const earthCenterX = this.app.screen.width / 2;
        const earthCenterY = this.app.screen.height + earthRadius * 0.9;
        
        // Create a canvas for the radial gradient
        const gradCanvas = document.createElement('canvas');
        gradCanvas.width = gradCanvas.height = Math.ceil(earthRadius * 2);
        const gradCtx = gradCanvas.getContext('2d');
        const grad = gradCtx.createRadialGradient(
            gradCanvas.width / 2, gradCanvas.height / 2, earthRadius * 0.2, // inner
            gradCanvas.width / 2, gradCanvas.height / 2, earthRadius * 0.98  // outer
        );
        // grad.addColorStop(0, '#001f4d');
        // grad.addColorStop(0.25, '#1565c0');
        // grad.addColorStop(0.45, '#3399ff');
        grad.addColorStop(0.75, '#001f4d');
        grad.addColorStop(1, '#6699ff');
        gradCtx.arc(gradCanvas.width / 2, gradCanvas.height / 2, earthRadius, 0, Math.PI, true);
        gradCtx.fillStyle = grad;
        gradCtx.fill();
        
        // Create PIXI texture from the gradient canvas
        const earthTexture = PIXI.Texture.from(gradCanvas);
        const earthSprite = new PIXI.Sprite(earthTexture);
        earthSprite.anchor.set(0.5, 0.5);
        earthSprite.x = earthCenterX;
        earthSprite.y = earthCenterY * 1.02;
        earthSprite.width = earthRadius * 2;
        earthSprite.height = earthRadius * 2;
        earthSprite.alpha = 1;
        
        // Add dark blue glow using a blurred circle
        const glow = new PIXI.Graphics();
        const glowRadius = earthRadius * 1.01;
        glow.beginFill(0x001f9d, 0.7);
        glow.drawCircle(earthCenterX, earthCenterY, glowRadius);
        glow.endFill();
        glow.filters = [new PIXI.filters.BlurFilter(32, 4)];
        glow.alpha = 0.8;
        this.app.stage.addChild(glow);
        this.themeElements.push(glow);
        
        // Add the Earth arc
        this.app.stage.addChild(earthSprite);
        this.themeElements.push(earthSprite);

        // Initialize starman starting the animation after a delay
        this.initStarman();
        const initialDelay = 5000 + Math.random() * 10000; // 5-15 seconds
        this.starmanTimeout = setTimeout(() => this.startStarmanAnimation(), initialDelay);

        // Create ISS container
        const iss = new PIXI.Container();
        const centerX = this.app.screen.width / 2;
        const centerY = this.app.screen.height / 2;
        
        // Main truss (long central body)
        const truss = new PIXI.Graphics()
            .beginFill(0x444444)
            .drawRoundedRect(-370, -12, 800, 24, 3);
        
        // Add the truss last so it's on top of some elements
        iss.addChild(truss);
        
        // Solar panel arrays (4 segments on each side, top and bottom)
        const panelLength = 180;
        const panelWidth = 70;
        const gap = 15;
        
        // Create solar panel function
        const createSolarPanel = (x, y, isTop) => {
            const panel = new PIXI.Graphics();
            const yOffset = isTop ? -panelWidth/2 : panelWidth/2;
            
            // Main panel
            panel.beginFill(0x2A4B8D)
                .drawRoundedRect(x, y + yOffset, panelLength, panelWidth, 10);
            
            // Solar cells
            const cellWidth = 30;
            const cellHeight = panelWidth * 0.8;
            const cellGap = 10;
            const startX = x + 10;
            const startY = y + yOffset + (panelWidth - cellHeight)/2;
            
            for (let i = 0; i < 4; i++) {
                panel.beginFill(0x88CCFF, 0.3)
                    .drawRect(
                        startX + i * (cellWidth + cellGap),
                        startY,
                        cellWidth,
                        cellHeight
                    );
            }
            
            return panel;
        };
        
        // Add solar panel arrays (top and bottom, left and right)
        for (let i = 0; i < 4; i++) {
            const xPos = -350 + i * (panelLength + gap);
            
            // Top panels
            const topPanel1 = createSolarPanel(xPos, -70, true);
            const topPanel2 = createSolarPanel(xPos, -120, true);
            
            // Bottom panels
            const bottomPanel1 = createSolarPanel(xPos, 10, false);
            const bottomPanel2 = createSolarPanel(xPos, 60, false);
            
            iss.addChild(topPanel1, topPanel2, bottomPanel1, bottomPanel2);
        }
        
        // Add modules (cylindrical sections)
        const modules = [
            { x: -300, width: 40, height: 80, color: 0x888888, name: 'Zarya' },
            { x: -150, width: 30, height: 60, color: 0x777777, name: 'Unity' },
            { x: 0, width: 50, height: 100, color: 0x999999, name: 'Destiny' },
            { x: 200, width: 40, height: 70, color: 0x888888, name: 'Columbus' },
            { x: 300, width: 35, height: 65, color: 0x777777, name: 'Kibo' }
        ];
        
        modules.forEach(module => {
            // Main module
            const moduleGfx = new PIXI.Graphics()
                .beginFill(module.color)
                .drawRoundedRect(
                    module.x - module.width/2, 
                    -module.height/2, 
                    module.width, 
                    module.height,
                    5
                );
            
            // Add some details
            moduleGfx.beginFill(0x666666)
                .drawRect(
                    module.x - module.width/3, 
                    -module.height/2 + 5, 
                    (module.width/3) * 2, 
                    8
                );
                
            // Add windows
            for (let i = 0; i < 3; i++) {
                moduleGfx.beginFill(0x88CCFF)
                    .drawCircle(
                        module.x - module.width/4 + i * (module.width/4),
                        0,
                        3
                    );
            }
            
            iss.addChild(moduleGfx);
        });
        
        // Add radiators (white panels)
        const radiators = [
            { x: -250, width: 60, height: 40 },
            { x: 250, width: 60, height: 40 }
        ];
        
        radiators.forEach(rad => {
            const radGfx = new PIXI.Graphics()
                .beginFill(0xEEEEEE)
                .drawRoundedRect(
                    rad.x - rad.width/2,
                    -rad.height/2,
                    rad.width,
                    rad.height,
                    3
                );
            iss.addChild(radGfx);
        });
        
        // Position and add to stage
        iss.position.set(centerX, centerY);
        iss.scale.set(0.7); // Scale to fit screen nicely
        this.app.stage.addChild(iss);
        this.themeElements.push(iss);
        
        // Add slow rotation animation
        this.app.ticker.add(() => {
            iss.rotation += 0.0003; // Very slow rotation
        });
    }
    
    createFishtankTheme() {
        // Underwater gradient
        const waterBg = new PIXI.Graphics()
            .beginFill(0x1e90ff)
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height)
            .endFill();
        this.app.stage.addChild(waterBg);
        this.themeElements.push(waterBg);
        
        // Add bubbles
        this.createBubbles();
        
        // Add sand at the bottom
        const sand = new PIXI.Graphics()
            .beginFill(0xf5e6b3)
            .drawRect(0, this.app.screen.height - 50, this.app.screen.width, 50)
            .endFill();
        this.app.stage.addChild(sand);
        this.themeElements.push(sand);
    }
    
    createBubbles() {
        for (let i = 0; i < 30; i++) {
            const bubble = new PIXI.Graphics()
                .beginFill(0xFFFFFF, 0.3)
                .drawCircle(0, 0, Math.random() * 20 + 5)
                .endFill();
                
            bubble.x = Math.random() * this.app.screen.width;
            bubble.y = this.app.screen.height + Math.random() * 100;
            bubble.speed = Math.random() * 2 + 1;
            
            this.app.stage.addChild(bubble);
            
            this.app.ticker.add(() => {
                bubble.y -= bubble.speed;
                if (bubble.y < -50) {
                    bubble.y = this.app.screen.height + 50;
                    bubble.x = Math.random() * this.app.screen.width;
                }
            });
        }
    }
    
    async captureDrawing() {
        if (this.isCapturing) return;
        this.isCapturing = true;
        
        // Show loading indicator
        const hint = document.getElementById('hint');
        const originalHint = hint.textContent;
        hint.textContent = 'Processing your drawing...';
        hint.style.color = '#ffcc00';
        
        try {
            // Set canvas size to match video
            this.captureCanvas.width = this.video.videoWidth;
            this.captureCanvas.height = this.video.videoHeight;
            
            // Draw current frame from video to canvas
            this.captureCtx.drawImage(this.video, 0, 0, this.captureCanvas.width, this.captureCanvas.height);
            
            // Show the capture canvas for visual feedback
            this.captureCanvas.style.display = 'block';
            
            // Get the image data and process it (QR code detection and trimming)
            const originalImageData = this.captureCtx.getImageData(0, 0, this.captureCanvas.width, this.captureCanvas.height);
            
            // Update hint to show processing stage
            hint.textContent = 'Scanning QR code...';
            
            // Process the image
            const { imageData: processedImageData, debugInfo } = await this.processImage(originalImageData);
            
            // Log debug info
            console.debug('Image processing debug info:', debugInfo);
            
            // Create a canvas for the processed image
            const processedCanvas = document.createElement('canvas');
            processedCanvas.width = processedImageData.width;
            processedCanvas.height = processedImageData.height;
            const processedCtx = processedCanvas.getContext('2d');
            processedCtx.putImageData(processedImageData, 0, 0);
            
            // Create a texture from the processed canvas
            const texture = PIXI.Texture.from(processedCanvas);
            const sprite = new PIXI.Sprite(texture);
            
            // Position and scale the sprite
            sprite.anchor.set(0.5);
            
            // Calculate position based on theme
            let posX, posY;
            switch(this.currentTheme) {
                case 'space':
                    posX = Math.random() * this.app.screen.width * 0.6 + this.app.screen.width * 0.2;
                    posY = Math.random() * this.app.screen.height * 0.6 + this.app.screen.height * 0.2;
                    break;
                case 'fishtank':
                    posX = Math.random() * this.app.screen.width * 0.6 + this.app.screen.width * 0.2;
                    posY = Math.random() * this.app.screen.height * 0.5 + this.app.screen.height * 0.2;
                    break;
                case 'rocket':
                    posX = this.app.screen.width * 0.5;
                    posY = this.app.screen.height * 0.7;
                    break;
                case 'petri':
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.min(this.app.screen.width, this.app.screen.height) * 0.3 * Math.random();
                    posX = this.app.screen.width / 2 + Math.cos(angle) * radius;
                    posY = this.app.screen.height / 2 + Math.sin(angle) * radius;
                    break;
                default:
                    posX = Math.random() * this.app.screen.width * 0.6 + this.app.screen.width * 0.2;
                    posY = Math.random() * this.app.screen.height * 0.6 + this.app.screen.height * 0.2;
            }
            
            sprite.position.set(posX, posY);
            
            // Scale down the sprite if it's too large
            const maxSize = Math.min(this.app.screen.width, this.app.screen.height) * 
                           (this.currentTheme === 'petri' ? 0.15 : 0.3);
            const scale = Math.min(1, maxSize / Math.max(sprite.width, sprite.height));
            sprite.scale.set(scale);
            
            // Add to drawings array first
            this.drawings.push(sprite);
            
            // Add animation based on theme - this will handle adding the sprite to stage
            // after the tether is created to ensure proper z-ordering
            this.animateDrawing(sprite, true);
            
            // Show success message
            hint.textContent = 'Drawing captured! Press SPACEBAR to capture another.';
            hint.style.color = '#4caf50';
            
            // Reset hint after delay
            setTimeout(() => {
                hint.textContent = originalHint;
                hint.style.color = '';
            }, 3000);
            
        } catch (error) {
            console.error('Error capturing drawing:', error);
            hint.textContent = 'Error: ' + (error.message || 'Failed to capture drawing');
            hint.style.color = '#f44336';
            
            // Reset hint after delay
            setTimeout(() => {
                hint.textContent = originalHint;
                hint.style.color = '';
            }, 3000);
        } finally {
            this.isCapturing = false;
            // Hide the capture canvas after a short delay
            setTimeout(() => {
                this.captureCanvas.style.display = 'none';
            }, 1000);
        }
    }
    
    /**
     * Processes the captured image to detect QR code and apply bitmask trimming
     * @param {ImageData} imageData - The image data from the canvas
     * @returns {Promise<{imageData: ImageData, debugInfo: object}>} - Object containing the processed image and debug info
     */
    async processImage(imageData) {
        const debugInfo = {
            qrDetection: null,
            bitmaskLoad: null,
            processingTime: 0,
            error: null
        };
        
        const startTime = performance.now();
        
        try {
            // Create a temporary canvas to work with the image
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = imageData.width;
            tempCanvas.height = imageData.height;
            const tempCtx = tempCanvas.getContext('2d');
            
            // Put the image data onto the temporary canvas
            tempCtx.putImageData(imageData, 0, 0);
            
            // 1. Detect QR code in the lower-left corner
            const qrResult = await this.detectQRCode(tempCanvas);
            debugInfo.qrDetection = qrResult.debugInfo;
            
            if (!qrResult.data) {
                console.error('QR Code not found');
                
                return {
                    imageData: tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height),
                    debugInfo
                };
            }
            
            // 2. Load the bitmask image asynchronously
            const bitmaskLoadStart = performance.now();
            try {
                const bitmaskImg = await this.loadBitmaskImage(qrResult.data);
                debugInfo.bitmaskLoad = {
                    success: true,
                    loadTime: performance.now() - bitmaskLoadStart,
                    identifier: qrResult.data
                };
                
                // 3. Apply the bitmask to trim the image
                const processedImage = this.applyBitmask(tempCtx, bitmaskImg);
                
                // Create a new canvas for the result
                const resultCanvas = document.createElement('canvas');
                resultCanvas.width = processedImage.width;
                resultCanvas.height = processedImage.height;
                const resultCtx = resultCanvas.getContext('2d', { willReadFrequently: true });
                
                // Put the processed image data onto the new canvas
                resultCtx.putImageData(processedImage, 0, 0);

                // Calculate QR code area dimensions (20% of the smaller dimension)
                const qrSize = Math.min(resultCanvas.width, resultCanvas.height) * 0.2;

                // Extract the name area (next to where QR code was)
                const nameArea = {
                    x: qrSize + 10, // Start after QR code area + some padding
                    y: resultCanvas.height - qrSize + (qrSize * 0.2), // Vertically centered in QR area
                    width: resultCanvas.width - (qrSize * 2) - 20, // Width between QR and right edge
                    height: qrSize * 0.6 // 60% of QR code height
                };
                
                // Get the name area as a separate image
                const nameImageData = resultCtx.getImageData(
                    nameArea.x,
                    nameArea.y,
                    nameArea.width,
                    nameArea.height
                );
                
                // Clear the QR code area (bottom-left corner), and the name area (bottom-right)
                resultCtx.clearRect(0, resultCanvas.height - qrSize, resultCanvas.width, qrSize);
                
                // Clear the orientation square area (top-right corner)
                resultCtx.clearRect(resultCanvas.width - qrSize, 0, qrSize, qrSize);
                
                debugInfo.processingTime = performance.now() - startTime;
                
                // Get the final image data from the result canvas
                const finalImageData = resultCtx.getImageData(0, 0, resultCanvas.width, resultCanvas.height);
                
                return {
                    imageData: finalImageData,
                    nameImageData,
                    debugInfo
                };
                
            } catch (error) {
                debugInfo.bitmaskLoad = {
                    success: false,
                    loadTime: performance.now() - bitmaskLoadStart,
                    identifier: qrResult.data,
                    error: error.message
                };
                
                console.error(`Error loading mask: ${error.message}`);
                
                return {
                    imageData: tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height),
                    debugInfo
                };
            }
            
        } catch (error) {
            console.error('Error processing image:', error);
            debugInfo.error = error.message;
            
            // Create error canvas
            // const errorCanvas = document.createElement('canvas');
            // errorCanvas.width = imageData.width;
            // errorCanvas.height = imageData.height;
            // const errorCtx = errorCanvas.getContext('2d');
            // errorCtx.putImageData(imageData, 0, 0);
            
            // Draw error message
            // errorCtx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            // errorCtx.fillRect(0, 0, errorCanvas.width, 40);
            // errorCtx.fillStyle = '#ff0000';
            // errorCtx.font = '16px Arial';
            // errorCtx.fillText('Error processing image. Please try again.', 10, 25);
            
            return {
                imageData: errorCtx.getImageData(0, 0, errorCanvas.width, errorCanvas.height),
                debugInfo
            };
        }
    }

    /**
     * Detects a QR code in the lower-left corner of the image
     * @param {HTMLCanvasElement} canvas - The canvas containing the image
     * @returns {Promise<{data: string|null, debugInfo: object}>} - Object containing the decoded data and debug information
     */
    async detectQRCode(canvas) {
        const debugInfo = {
            detectionTime: 0,
            attempts: 0,
            error: null,
            position: null
        };
        
        const startTime = performance.now();
        const ctx = canvas.getContext('2d');
        
        try {
            // Calculate QR code search area (lower-left corner)
            const qrSize = Math.min(canvas.width, canvas.height) * 0.4; // 40% of the smaller dimension
            const qrX = 0;
            const qrY = canvas.height - qrSize;
            
            // Get image data from the QR code area
            const qrImageData = ctx.getImageData(qrX, qrY, qrSize, qrSize);
            
            // Try multiple inversion attempts for better detection
            const inversionAttempts = ['dontInvert', 'attemptBoth', 'invertFirst'];
            let code = null;
            
            for (const attempt of inversionAttempts) {
                debugInfo.attempts++;
                code = jsQR(
                    qrImageData.data,
                    qrImageData.width,
                    qrImageData.height,
                    {
                        inversionAttempts: attempt,
                        // Add more options for better detection
                        canOverwriteImage: false,
                        canResize: true,
                        maxScalingFactor: 2.0
                    }
                );
                
                if (code) {
                    debugInfo.position = code.location;
                    break;
                }
            }
            
            debugInfo.detectionTime = performance.now() - startTime;
            
            return {
                data: code ? code.data : null,
                debugInfo
            };
            
        } catch (error) {
            debugInfo.error = error.message;
            console.error('QR Code detection error:', error);
            return {
                data: null,
                debugInfo
            };
        } finally {
            // Ensure context is always restored
            if (ctx && typeof ctx.restore === 'function') {
                ctx.restore();
            }
        }
    }

    /**
     * Cache for loaded mask images
     */
    maskImageCache = {};

    /**
     * Loads a bitmask image asynchronously and caches it for future use
     * @param {string} identifier - The identifier for the mask image
     * @returns {Promise<HTMLImageElement>} - Resolves with the loaded image or rejects if loading fails
     */
    loadBitmaskImage(identifier) {
        // Return cached image if available
        if (this.maskImageCache[identifier]) {
            return Promise.resolve(this.maskImageCache[identifier]);
        }

        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                // Cache the loaded image
                this.maskImageCache[identifier] = img;
                resolve(img);
            };
            
            img.onerror = (error) => {
                console.error(`Failed to load mask image: images/masks/${identifier}.png`, error);
                reject(new Error(`Failed to load mask image: ${identifier}`));
            };
            
            // Start loading the image
            img.src = `images/masks/${identifier}.png`;
        });
    }

    /**
     * Applies a bitmask to the image to trim it, using white from the mask as transparent
     * @param {CanvasRenderingContext2D} ctx - The canvas context with the original image
     * @param {HTMLImageElement} maskImg - The mask image where white will be transparent
     * @returns {ImageData} - The processed image data with white areas from mask made transparent
     */
    applyBitmask(ctx, maskImg) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Create a temporary canvas for the result
        const resultCanvas = document.createElement('canvas');
        resultCanvas.width = width;
        resultCanvas.height = height;
        const resultCtx = resultCanvas.getContext('2d', { willReadFrequently: true });
        
        // 1. Draw the original image
        resultCtx.drawImage(canvas, 0, 0);
        
        // 2. Create a canvas for the mask
        const maskCanvas = document.createElement('canvas');
        maskCanvas.width = width;
        maskCanvas.height = height;
        const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
        
        // 3. Draw the mask (resize to match the canvas)
        maskCtx.drawImage(maskImg, 0, 0, width, height);
        
        // 4. Create a temporary canvas for the mask processing
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        
        // 5. Draw the mask onto the temp canvas
        tempCtx.drawImage(maskCanvas, 0, 0);
        
        // 6. Create a new canvas for the final result
        const finalCanvas = document.createElement('canvas');
        finalCanvas.width = width;
        finalCanvas.height = height;
        const finalCtx = finalCanvas.getContext('2d', { willReadFrequently: true });
        
        // 7. Draw the original image first
        finalCtx.drawImage(canvas, 0, 0);
        
        // 8. Get the mask data
        const maskData = tempCtx.getImageData(0, 0, width, height).data;
        const resultData = finalCtx.getImageData(0, 0, width, height);
        const resultPixels = resultData.data;
        
        // 9. Apply the mask by setting alpha based on mask whiteness
        for (let i = 0; i < maskData.length; i += 4) {
            const maskR = maskData[i];
            const maskG = maskData[i + 1];
            const maskB = maskData[i + 2];
            
            // If the mask is white (or close to white), make it transparent
            if (maskR > 240 && maskG > 240 && maskB > 240) {
                resultPixels[i + 3] = 0; // Set alpha to 0 (transparent)
            }
        }
        
        // 10. Put the modified pixels back
        finalCtx.putImageData(resultData, 0, 0);
        
        // 11. Clear the result canvas and draw the final masked image
        resultCtx.clearRect(0, 0, width, height);
        resultCtx.drawImage(finalCanvas, 0, 0);
        
        // 12. Return the resulting image data
        return resultCtx.getImageData(0, 0, width, height);
    }
    
    createRocketTheme() {
        // Sky gradient
        const sky = new PIXI.Graphics()
            .beginFill(0x1a2980)
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height)
            .endFill();
        this.app.stage.addChild(sky);
        this.themeElements.push(sky);
        
        // Add launch pad
        const launchPad = new PIXI.Graphics()
            .beginFill(0x666666)
            .drawRect(this.app.screen.width * 0.4, this.app.screen.height - 100, 200, 20)
            .endFill()
            .beginFill(0x999999)
            .drawRect(this.app.screen.width * 0.45, this.app.screen.height - 150, 120, 50)
            .endFill();
        this.app.stage.addChild(launchPad);
        this.themeElements.push(launchPad);
        
        // Add clouds
        for (let i = 0; i < 5; i++) {
            this.createCloud(
                Math.random() * this.app.screen.width,
                Math.random() * (this.app.screen.height * 0.5),
                Math.random() * 0.5 + 0.5
            );
        }
    }
    
    createPetriTheme() {
        // Lab background
        const bg = new PIXI.Graphics()
            .beginFill(0xf5f7fa)
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height)
            .endFill();
        this.app.stage.addChild(bg);
        this.themeElements.push(bg);
        
        // Petri dish
        const dish = new PIXI.Graphics()
            .beginFill(0xffffff, 0.8)
            .drawCircle(this.app.screen.width / 2, this.app.screen.height / 2, 200)
            .beginHole()
            .drawCircle(this.app.screen.width / 2, this.app.screen.height / 2, 180)
            .endHole()
            .beginFill(0xffffff, 0.3)
            .drawCircle(this.app.screen.width / 2, this.app.screen.height / 2, 180);
        this.app.stage.addChild(dish);
        this.themeElements.push(dish);
        
        // Add some initial germs
        for (let i = 0; i < 3; i++) {
            this.createGerm(
                this.app.screen.width / 2 + (Math.random() - 0.5) * 100,
                this.app.screen.height / 2 + (Math.random() - 0.5) * 100,
                Math.random() * 2 + 1
            );
        }
    }
    
    createCloud(x, y, scale = 1) {
        const cloud = new PIXI.Graphics()
            .beginFill(0xffffff, 0.8)
            .drawCircle(0, 0, 30 * scale)
            .drawCircle(25 * scale, -10 * scale, 25 * scale)
            .drawCircle(45 * scale, 0, 20 * scale)
            .drawCircle(25 * scale, 10 * scale, 25 * scale);
        cloud.position.set(x, y);
        this.app.stage.addChild(cloud);
        this.themeElements.push(cloud);
        
        // Make clouds move slowly
        this.app.ticker.add(() => {
            cloud.x += 0.1;
            if (cloud.x > this.app.screen.width + 50) {
                cloud.x = -50;
            }
        });
    }
    
    createGerm(x, y, size) {
        const germ = new PIXI.Graphics()
            .beginFill(0x88cc44, 0.7)
            .drawCircle(0, 0, 20 * size);
        germ.position.set(x, y);
        this.app.stage.addChild(germ);
        this.themeElements.push(germ);
        
        // Add some movement
        const speedX = (Math.random() - 0.5) * 0.5;
        const speedY = (Math.random() - 0.5) * 0.5;
        
        this.app.ticker.add(() => {
            germ.x += speedX;
            germ.y += speedY;
            
            // Bounce off edges of petri dish
            const dx = germ.x - this.app.screen.width / 2;
            const dy = germ.y - this.app.screen.height / 2;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 160) {
                germ.x -= speedX * 2;
                germ.y -= speedY * 2;
            }
        });
    }
    
    /**
     * Animates the drawing and name sprites based on the current theme
     * @param {PIXI.Sprite} drawingSprite - The main drawing sprite to animate
     * @param {PIXI.Sprite | null} nameSprite - The name sprite to animate alongside
     * @param {boolean} [addToStage=false] - Whether to add the container to the stage
     */
    animateDrawing(drawingSprite, nameSprite, addToStage = false) {
        const container = new PIXI.Container();
        
        // Set drawing sprite properties
        drawingSprite.anchor.set(0.5);
        drawingSprite.scale.set(0.3);
        container.addChild(drawingSprite);

        // If there's a name sprite, position it based on the drawing's angle from center
        if (nameSprite) {
            nameSprite.anchor.set(0.5);
            nameSprite.scale.set(0.2);
            
            // Position the container first to calculate angles correctly
            const screenCenterX = this.app.screen.width / 2;
            const screenCenterY = this.app.screen.height / 2;
            container.position.set(screenCenterX, screenCenterY);
            
            // Calculate angle from center
            const dx = container.x - screenCenterX;
            const dy = container.y - screenCenterY;
            const angle = Math.atan2(dy, dx);
            
            // Calculate distance from center
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Position name sprite further along the same angle
            const nameDistance = distance * 1.3; // 30% further from center than drawing
            const nameX = Math.cos(angle) * nameDistance;
            const nameY = Math.sin(angle) * nameDistance;
            
            // Position name sprite relative to container
            nameSprite.x = nameX - (container.x - screenCenterX);
            nameSprite.y = nameY - (container.y - screenCenterY);
            
            // Add name sprite to container
            container.addChild(nameSprite);
            
            // Store original positions for animation reference
            container.nameOffset = { x: nameX - dx, y: nameY - dy };
        }

        // Use drawingSprite's initial position and scale for the container
        container.position.copyFrom(drawingSprite.position);
        container.scale.copyFrom(drawingSprite.scale);
        
        // Reset drawingSprite's position relative to the container
        drawingSprite.position.set(0, 0);
        
        // If we need to add the container to stage (for uploaded images), do it now
        if (addToStage) {
            this.app.stage.addChild(container);
        }

        switch(this.currentTheme) {
            case 'space': {
                // Animate astronaut from center outward, scaling up, then return after 30s
                const stationX = this.app.screen.width / 2;
                const stationY = this.app.screen.height / 2;
                const maxDistance = Math.min(this.app.screen.width, this.app.screen.height) * 0.35;
                const minScale = 0.2;
                const maxScale = 0.5;
                const outwardDuration = 30000; // 30 seconds outward
                const inwardDuration = 9000;   // 2 seconds back to center
                let startTime = Date.now();
                let animatingOutward = true;
                let progress = 0;

                // Set initial position/scale
                container.position.set(stationX, stationY);
                container.scale.set(minScale);

                // Create tether cord (drawn behind astronaut)
                const tether = new PIXI.Graphics();
                this.app.stage.addChild(tether);
                this.themeElements.push(tether);
                container.tether = tether;

                // Choose a random angle for this astronaut's path
                const angle = Math.random() * Math.PI * 2;
                // Pick a random offset for floating
                const floatAmplitude = 20 + Math.random() * 15;
                const floatSpeed = 0.002 + Math.random() * 0.002;

                // Animation ticker
                const animate = () => {
                    const now = Date.now();
                    let elapsed = now - startTime;
                    if (animatingOutward) {
                        progress = Math.min(1, elapsed / outwardDuration);
                    } else {
                        progress = 1 - Math.min(1, elapsed / inwardDuration);
                    }
                    // Position along the path
                    const distance = maxDistance * progress;
                    const x = stationX + Math.cos(angle) * distance;
                    const y = stationY + Math.sin(angle) * distance + Math.sin(now * floatSpeed) * floatAmplitude;
                    container.position.set(x, y);
                    // Scale
                    const scale = minScale + (maxScale - minScale) * progress;
                    container.scale.set(scale);
                    // Rotation (gentle float)
                    container.rotation = Math.sin(now * floatSpeed * 0.7) * 0.1;

                    // Draw tether
                    tether.clear();
                    tether.lineStyle(3, 0xFFFFFF, 0.7);
                    tether.moveTo(stationX, stationY);
                    // Control points for a nice curve
                    const midX = (stationX + x) / 2;
                    const midY = (stationY + y) / 2;
                    const cp1x = stationX + (midX - stationX) / 2;
                    const cp1y = stationY + 100;
                    const cp2x = midX + (x - midX) / 2;
                    const cp2y = midY - 100;
                    tether.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x, y);
                    // Dots along tether
                    const segments = 10;
                    for (let i = 1; i < segments; i++) {
                        const t = i / segments;
                        const dotX = Math.pow(1-t, 3) * stationX + 3 * Math.pow(1-t, 2) * t * cp1x + 3 * (1-t) * t * t * cp2x + t * t * t * x;
                        const dotY = Math.pow(1-t, 3) * stationY + 3 * Math.pow(1-t, 2) * t * cp1y + 3 * (1-t) * t * t * cp2y + t * t * t * y;
                        tether.beginFill(0xFFFFFF, 0.8).drawCircle(dotX, dotY, 1.5).endFill();
                    }

                    // Animation phase switching
                    if (animatingOutward && elapsed >= outwardDuration) {
                        animatingOutward = false;
                        startTime = now;
                    } else if (!animatingOutward && elapsed >= inwardDuration) {
                        // Reset for next loop
                        animatingOutward = true;
                        startTime = now;
                    }
                };
                this.app.ticker.add(animate);

                container.on('removed', () => {
                    if (container.tether) {
                        this.app.stage.removeChild(container.tether);
                        container.tether.destroy();
                    }
                    this.app.ticker.remove(animate);
                });
                break;
            }
                
            case 'fishtank': {
                const fishStartX = container.x;
                const fishStartY = container.y;
                const fishAmplitude = 50;
                const fishFrequency = 0.01;
                const fishStartTime = Date.now();
                
                this.app.ticker.add(() => {
                    const time = (Date.now() - fishStartTime) * 0.001;
                    container.x = fishStartX + Math.sin(time * fishFrequency) * fishAmplitude;
                    container.y = fishStartY + Math.sin(time * 0.5) * 30;
                    
                    if (Math.sin(time * fishFrequency + Math.PI) > 0) {
                        container.scale.x = Math.abs(container.scale.x);
                    } else {
                        container.scale.x = -Math.abs(container.scale.x);
                    }
                });
                break;
            }
            
            case 'petri': {
                // Bouncing germ animation for petri dish
                const petriRadius = Math.min(this.app.screen.width, this.app.screen.height) * 0.4;
                const centerX = this.app.screen.width / 2;
                const centerY = this.app.screen.height / 2;
                
                const angle = Math.random() * Math.PI * 2;
                const distance = Math.random() * petriRadius * 0.8;
                container.x = centerX + Math.cos(angle) * distance;
                container.y = centerY + Math.sin(angle) * distance;
                
                const speed = 1 + Math.random() * 2;
                let vx = (Math.random() - 0.5) * speed;
                let vy = (Math.random() - 0.5) * speed;
                
                const rotationSpeed = (Math.random() - 0.5) * 0.02;
                
                this.app.ticker.add(() => {
                    container.x += vx;
                    container.y += vy;
                    container.rotation += rotationSpeed;
                    
                    const dx = container.x - centerX;
                    const dy = container.y - centerY;
                    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
                    
                    // Bounce off edges of petri dish
                    if (distanceFromCenter + container.width / 2 > petriRadius) {
                        const nx = dx / distanceFromCenter;
                        const ny = dy / distanceFromCenter;
                        
                        const dot = vx * nx + vy * ny;
                        
                        vx = vx - 2 * dot * nx;
                        vy = vy - 2 * dot * ny;
                        
                        // Add some randomness to the bounce
                        vx += (Math.random() - 0.5) * 0.5;
                        vy += (Math.random() - 0.5) * 0.5;
                        
                        // Normalize speed to maintain consistent movement
                        const currentSpeed = Math.sqrt(vx * vx + vy * vy);
                        vx = (vx / currentSpeed) * speed;
                        vy = (vy / currentSpeed) * speed;
                        
                        // Move sprite back inside the petri dish
                        const correction = (distanceFromCenter + container.width / 2 - petriRadius) * 1.1;
                        container.x -= nx * correction;
                        container.y -= ny * correction;
                    }
                });
                break;
            }
                
            case 'rocket': {
                const rocketStartY = container.y;
                const launchSpeed = 2 + Math.random() * 2;
                
                this.app.ticker.add(() => {
                    container.y -= launchSpeed;
                    
                    if (container.y < -container.height) {
                        container.y = this.app.screen.height + container.height;
                        container.x = Math.random() * this.app.screen.width;
                    }
                });
                break;
            }
        }
    }
    
    createDinosaurTheme() {
        // Create prehistoric background
        const bg = new PIXI.Graphics()
            .beginFill(0x8B4513)  // SaddleBrown
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height)
            .endFill()
            .beginFill(0x556B2F)  // DarkOliveGreen
            .drawRect(0, this.app.screen.height * 0.7, this.app.screen.width, this.app.screen.height * 0.3)
            .endFill();
        this.app.stage.addChild(bg);
        this.themeElements.push(bg);

        // Add some prehistoric plants
        for (let i = 0; i < 10; i++) {
            const plant = new PIXI.Graphics()
                .beginFill(0x2E8B57)  // SeaGreen
                .drawPolygon([
                    new PIXI.Point(0, 0),
                    new PIXI.Point(5, -20),
                    new PIXI.Point(10, 0)
                ])
                .endFill();
            plant.x = Math.random() * this.app.screen.width;
            plant.y = this.app.screen.height * 0.7;
            this.app.stage.addChild(plant);
            this.themeElements.push(plant);
        }
    }

    createSolarTheme() {
        // Create space background
        const spaceBg = new PIXI.Graphics()
            .beginFill(0x000033)
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.app.stage.addChild(spaceBg);
        this.themeElements.push(spaceBg);

        // Add stars
        for (let i = 0; i < 200; i++) {
            const star = new PIXI.Graphics()
                .beginFill(0xFFFFFF)
                .drawCircle(
                    Math.random() * this.app.screen.width,
                    Math.random() * this.app.screen.height,
                    Math.random() * 1.5
                );
            this.app.stage.addChild(star);
            this.themeElements.push(star);
        }

        // Add sun
        const sun = new PIXI.Graphics()
            .beginFill(0xFFD700)
            .drawCircle(this.app.screen.width / 2, this.app.screen.height / 2, 50);
        this.app.stage.addChild(sun);
        this.themeElements.push(sun);
    }

    createBodyTheme() {
        // Create body background (skin tone)
        const bg = new PIXI.Graphics()
            .beginFill(0xFFE4C4)  // Bisque
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.app.stage.addChild(bg);
        this.themeElements.push(bg);

        // Add some cells or blood vessels
        for (let i = 0; i < 50; i++) {
            const cell = new PIXI.Graphics()
                .beginFill(0xFF6B6B, 0.5)
                .drawCircle(
                    Math.random() * this.app.screen.width,
                    Math.random() * this.app.screen.height,
                    5 + Math.random() * 15
                );
            this.app.stage.addChild(cell);
            this.themeElements.push(cell);
        }
    }

    createButterflyTheme() {
        // Create sky background
        const bg = new PIXI.Graphics()
            .beginFill(0x87CEEB)  // SkyBlue
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.app.stage.addChild(bg);
        this.themeElements.push(bg);

        // Add some flowers at the bottom
        for (let i = 0; i < 10; i++) {
            const flower = new PIXI.Graphics()
                .beginFill(0x32CD32)  // LimeGreen
                .drawRect(-5, 0, 10, 30)
                .endFill()
                .beginFill(0xFF69B4)  // HotPink
                .drawCircle(0, 0, 15);
            flower.x = (i + 0.5) * (this.app.screen.width / 10);
            flower.y = this.app.screen.height - 15;
            this.app.stage.addChild(flower);
            this.themeElements.push(flower);
        }
    }

    createGearsTheme() {
        // Create mechanical background
        const bg = new PIXI.Graphics()
            .beginFill(0x2F4F4F)  // DarkSlateGray
            .drawRect(0, 0, this.app.screen.width, this.app.screen.height);
        this.app.stage.addChild(bg);
        this.themeElements.push(bg);

        // Add some gears
        const createGear = (x, y, size, teeth, rotationSpeed) => {
            const gear = new PIXI.Graphics();
            gear.x = x;
            gear.y = y;
            
            // Draw gear
            const drawGear = () => {
                gear.clear()
                    .beginFill(0x708090)  // SlateGray
                    .lineStyle(2, 0x000000, 1);
                
                // Draw outer circle
                gear.drawCircle(0, 0, size);
                
                // Draw teeth
                for (let i = 0; i < teeth; i++) {
                    const angle = (i / teeth) * Math.PI * 2;
                    const x1 = Math.cos(angle) * size;
                    const y1 = Math.sin(angle) * size;
                    const x2 = Math.cos(angle) * (size + 10);
                    const y2 = Math.sin(angle) * (size + 10);
                    
                    gear.moveTo(x1, y1)
                         .lineTo(x2, y2);
                }
            };
            
            drawGear();
            this.app.stage.addChild(gear);
            this.themeElements.push(gear);
            
            // Animate rotation
            this.app.ticker.add(() => {
                gear.rotation += rotationSpeed;
            });
        };
        
        // Add some gears
        createGear(200, 200, 40, 12, 0.01);
        createGear(300, 200, 30, 10, -0.015);
        createGear(400, 300, 50, 15, 0.008);
    }

    setupResizeHandler() {
        window.addEventListener('resize', () => {
            this.app.renderer.resize(window.innerWidth, window.innerHeight);
            // Rebuild theme on resize
            this.initTheme();
        });
    }
}
