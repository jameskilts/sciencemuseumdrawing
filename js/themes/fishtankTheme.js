// Fishtank Theme Module
// Exports a function to create the fishtank theme

/**
 * Creates the fishtank theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 * @param {Function} createBubbles - Helper to create bubbles (should be passed in)
 */
export function createFishtankTheme(app, themeElements, createBubbles) {
    // Underwater gradient
    const waterBg = new PIXI.Graphics()
        .beginFill(0x1e90ff)
        .drawRect(0, 0, app.screen.width, app.screen.height)
        .endFill();
    app.stage.addChild(waterBg);
    themeElements.push(waterBg);

    // Add bubbles
    if (typeof createBubbles === 'function') {
        createBubbles(app, themeElements);
    }

    // Add sand at the bottom
    const sand = new PIXI.Graphics()
        .beginFill(0xf5e6b3)
        .drawRect(0, app.screen.height - 50, app.screen.width, 50)
        .endFill();
    app.stage.addChild(sand);
    themeElements.push(sand);
}
