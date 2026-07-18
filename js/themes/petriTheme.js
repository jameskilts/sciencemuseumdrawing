// Petri Theme Module
// Exports a function to create the petri theme

/**
 * Creates the petri theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 * @param {Function} createGerm - Helper to create germs (should be passed in)
 */
export function createPetriTheme(app, themeElements, createGerm) {
    // Lab background
    const bg = new PIXI.Graphics()
        .beginFill(0xf5f7fa)
        .drawRect(0, 0, app.screen.width, app.screen.height)
        .endFill();
    app.stage.addChild(bg);
    themeElements.push(bg);
    
    // Petri dish
    const dish = new PIXI.Graphics()
        .beginFill(0xffffff, 0.8)
        .drawCircle(app.screen.width / 2, app.screen.height / 2, 200)
        .beginHole()
        .drawCircle(app.screen.width / 2, app.screen.height / 2, 180)
        .endHole()
        .beginFill(0xffffff, 0.3)
        .drawCircle(app.screen.width / 2, app.screen.height / 2, 180);
    app.stage.addChild(dish);
    themeElements.push(dish);
    
    // Add some initial germs
    if (typeof createGerm === 'function') {
        for (let i = 0; i < 3; i++) {
            createGerm(
                app,
                themeElements,
                app.screen.width / 2 + (Math.random() - 0.5) * 100,
                app.screen.height / 2 + (Math.random() - 0.5) * 100,
                Math.random() * 2 + 1
            );
        }
    }
}
