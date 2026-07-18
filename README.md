# Science Museum Drawing

An interactive web application that brings children's drawings to life using PixiJS and webcam integration. The app captures drawings using the device's camera and animates them in different themed environments.

## Features

- Fun exhibit for children to bring their drawings to life
- Works well on commodity hardware (webcam capture of drawings)
- Simple operation (spacebar captures a drawing, which fixes orientation and adds the drawing to the screen

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

## Getting Started

### Prerequisites

- A modern web browser with camera access (Chrome, Firefox, Safari, Edge)
- A webcam
- Python 3.7 or higher

### Installation and Running the App

1. Clone the repository or download the source code.  Extract it to a folder on your computer, like "C:\Users\ScienceUser\Desktop\ScienceApp"
2. Make sure you have Python installed by running "python --version" in a terminal (in windows you can use "Command Prompt" or "PowerShell")
3. If you don't have Python installed, download it and install it from https://www.python.org/downloads/
4. Restart the terminal
5. Run `python server.py` to start the server and launch the webpage
6. Allow camera access when prompted

### How to Use

1. Run the server and select a theme
2. Point your webcam at a drawing (preferably on a well-lit surface)
3. Press the SPACEBAR to capture the drawing
4. Watch as your drawing comes to life in the selected theme
5. Press SPACEBAR again to capture more drawings

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

## License

This project is open source and available under the [AGPL License](LICENSE).

## Made with :heart:

If used as an exhibit, an acknowledgment would be appreciated.  Either "Made with :heart: by James Kilts" or "Donated with :heart: by Timothy Kilts" would be great.
