// Butterfly Theme Module
// Exports a function to create the butterfly theme

/**
 * Creates the butterfly theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 */
export function createButterflyTheme(app, themeElements) {
    // Create sky background
    const bg = new PIXI.Graphics()
        .beginFill(0x87CEEB)  // SkyBlue
        .drawRect(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(bg);
    themeElements.push(bg);

    // Add some flowers at the bottom
    for (let i = 0; i < 10; i++) {
        const flower = new PIXI.Graphics()
            .beginFill(0x32CD32)  // LimeGreen
            .drawRect(-5, 0, 10, 30)
            .endFill()
            .beginFill(0xFF69B4)  // HotPink
            .drawCircle(0, 0, 15);
        flower.x = (i + 0.5) * (app.screen.width / 10);
        flower.y = app.screen.height - 15;
        app.stage.addChild(flower);
        themeElements.push(flower);
    }
}
