// Solar Theme Module
// Exports a function to create the solar theme

/**
 * Creates the solar theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 */
export function createSolarTheme(app, themeElements) {
    // Create space background
    const spaceBg = new PIXI.Graphics()
        .beginFill(0x000033)
        .drawRect(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(spaceBg);
    themeElements.push(spaceBg);

    // Add stars
    for (let i = 0; i < 200; i++) {
        const star = new PIXI.Graphics()
            .beginFill(0xFFFFFF)
            .drawCircle(
                Math.random() * app.screen.width,
                Math.random() * app.screen.height,
                Math.random() * 1.5
            );
        app.stage.addChild(star);
        themeElements.push(star);
    }

    // Add sun
    const sun = new PIXI.Graphics()
        .beginFill(0xFFD700)
        .drawCircle(app.screen.width / 2, app.screen.height / 2, 50);
    app.stage.addChild(sun);
    themeElements.push(sun);
}
