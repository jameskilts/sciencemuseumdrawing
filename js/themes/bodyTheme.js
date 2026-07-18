// Body Theme Module
// Exports a function to create the body theme

/**
 * Creates the body theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 */
export function createBodyTheme(app, themeElements) {
    // Create body background (skin tone)
    const bg = new PIXI.Graphics()
        .beginFill(0xFFE4C4)  // Bisque
        .drawRect(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(bg);
    themeElements.push(bg);

    // Add some cells or blood vessels
    for (let i = 0; i < 50; i++) {
        const cell = new PIXI.Graphics()
            .beginFill(0xFF6B6B, 0.5)
            .drawCircle(
                Math.random() * app.screen.width,
                Math.random() * app.screen.height,
                5 + Math.random() * 15
            );
        app.stage.addChild(cell);
        themeElements.push(cell);
    }
}
