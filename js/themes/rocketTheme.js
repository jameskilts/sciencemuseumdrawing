// Rocket Theme Module
// Exports a function to create the rocket theme

/**
 * Creates the rocket theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 * @param {Function} createCloud - Helper to create clouds (should be passed in)
 */
export function createRocketTheme(app, themeElements, createCloud) {
    // Sky gradient
    const sky = new PIXI.Graphics()
        .beginFill(0x1a2980)
        .drawRect(0, 0, app.screen.width, app.screen.height)
        .endFill();
    app.stage.addChild(sky);
    themeElements.push(sky);
    
    // Add launch pad
    const launchPad = new PIXI.Graphics()
        .beginFill(0x666666)
        .drawRect(app.screen.width * 0.4, app.screen.height - 100, 200, 20)
        .endFill()
        .beginFill(0x999999)
        .drawRect(app.screen.width * 0.45, app.screen.height - 150, 120, 50)
        .endFill();
    app.stage.addChild(launchPad);
    themeElements.push(launchPad);
    
    // Add clouds
    if (typeof createCloud === 'function') {
        for (let i = 0; i < 5; i++) {
            createCloud(
                app,
                themeElements,
                Math.random() * app.screen.width,
                Math.random() * (app.screen.height * 0.5),
                Math.random() * 0.5 + 0.5
            );
        }
    }
}
