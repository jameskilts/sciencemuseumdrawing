// Dinosaur Theme Module
// Exports a function to create the dinosaur theme

/**
 * Creates the dinosaur theme
 * @param {PIXI.Application} app - The PixiJS application instance
 * @param {Array} themeElements - Array to collect created theme elements
 */
export function createDinosaurTheme(app, themeElements) {
    // Create prehistoric background
    const bg = new PIXI.Graphics()
        .beginFill(0x8B4513)  // SaddleBrown
        .drawRect(0, 0, app.screen.width, app.screen.height)
        .endFill()
        .beginFill(0x556B2F)  // DarkOliveGreen
        .drawRect(0, app.screen.height * 0.7, app.screen.width, app.screen.height * 0.3)
        .endFill();
    app.stage.addChild(bg);
    themeElements.push(bg);

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
        plant.x = Math.random() * app.screen.width;
        plant.y = app.screen.height * 0.7;
        app.stage.addChild(plant);
        themeElements.push(plant);
    }
}
