# Science Museum Drawing

An interactive web application that brings children's drawings to life using PixiJS and webcam integration. The app captures drawings using the device's camera and animates them in different themed environments.

## Features

- 🎨 Real-time webcam capture of drawings
- 🚀 Space theme with floating animations
- 🐠 Fish tank theme with swimming animations
- 📸 Spacebar capture functionality
- 🖌️ Image processing for drawing extraction
- 📱 Responsive design that works on different screen sizes

## Getting Started

### Prerequisites

- A modern web browser with camera access (Chrome, Firefox, Safari, Edge)
- A webcam
- Node.js (optional, for local development server)

### Installation

1. Clone the repository or download the source code
2. Open `index.html` in a modern web browser
3. Allow camera access when prompted

### How to Use

1. Point your webcam at a drawing (preferably on a well-lit surface)
2. Press the SPACEBAR to capture the drawing
3. Watch as your drawing comes to life in the selected theme
4. Press SPACEBAR again to capture more drawings

## Project Structure

```
science-museum-drawing/
├── index.html          # Main HTML file
├── css/
│   └── style.css      # Styles for the application
├── js/
│   └── app.js         # Main JavaScript application
└── README.md           # This file
```

## Themes

### Space Theme
- Drawings float in zero gravity
- Space station background
- Twinkling stars
- Gentle bobbing animation

### Fish Tank Theme
- Drawings swim like fish
- Underwater background
- Bubbles animation
- Smooth swimming motion

## Browser Support

The application uses modern web APIs including:
- WebRTC for camera access
- Canvas API for image processing
- ES6+ JavaScript features

## License

This project is open source and available under the [AGPL License](LICENSE).

## Acknowledgments

- Built with [PixiJS](https://www.pixijs.com/)
- Inspired by interactive museum exhibits
