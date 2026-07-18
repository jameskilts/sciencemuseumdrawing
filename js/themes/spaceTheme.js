// Space Theme Module
// Exports a function to create the space theme

/**
 * Creates the space theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 */
export function createSpaceTheme(app, themeElements) {
    // Create space background
    const spaceBg = new PIXI.Graphics()
        .beginFill(0x000033)
        .drawRect(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(spaceBg);
    themeElements.push(spaceBg);

    // Add stars
    for (let i = 0; i < 300; i++) {
        const size = Math.random() * 1.5;
        const alpha = 0.5 + Math.random() * 0.5;
        const star = new PIXI.Graphics()
            .beginFill(0xFFFFFF, alpha)
            .drawCircle(
                Math.random() * app.screen.width,
                Math.random() * app.screen.height,
                size
            );
        app.stage.addChild(star);
        themeElements.push(star);
    }

    // Add ISS (International Space Station)
    // ... (ISS creation code can be modularized here if needed)
}
