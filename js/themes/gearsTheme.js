// Gears Theme Module
// Exports a function to create the gears theme

/**
 * Creates the gears theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 */
export function createGearsTheme(app, themeElements) {
    // Create mechanical background
    const bg = new PIXI.Graphics()
        .beginFill(0x2F4F4F)  // DarkSlateGray
        .drawRect(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(bg);
    themeElements.push(bg);

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
        app.stage.addChild(gear);
        themeElements.push(gear);
        
        // Animate rotation
        app.ticker.add(() => {
            gear.rotation += rotationSpeed;
        });
    };
    
    // Add some gears
    createGear(200, 200, 40, 12, 0.01);
    createGear(300, 200, 30, 10, -0.015);
    createGear(400, 300, 50, 15, 0.008);
}
