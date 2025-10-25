# VR Video Player

A lightweight web-based VR video player that supports mono, 180° and 360° video playback using Three.js.

## Features

- **Mono, 180° and 360° video support** - Switch between viewing modes
- **Mouse/touch controls** - Click and drag to look around
- **Standard video controls** - Play, pause, seek, volume control
- **File upload & drag/drop** - Load local video files directly or drag and drop
- **Fullscreen mode** - Immersive viewing experience
- **Audio support** - Full volume control and audio playback
- **Responsive design** - Works on desktop and mobile devices
- **WebGL acceleration** - Smooth performance using Three.js

## Usage

1. Open `index.html` in a web browser
2. Load a video by clicking "Choose File" or drag and drop a video file
3. Select the appropriate viewing mode (Mono, 180° or 360°)
4. Click play and drag to look around
5. Use fullscreen button for immersive experience
6. Use the progress bar to seek through the video

## Supported Formats

- MP4, WebM, OGV and other HTML5 video formats
- **Mono**: Regular flat videos
- **180°/360°**: Equirectangular projection videos

## Controls

- **Mouse/Touch**: Click and drag to rotate camera view
- **Play/Pause**: Toggle video playback
- **Progress Bar**: Click to seek to specific time
- **Volume Slider**: Adjust audio volume
- **Mode Toggle**: Switch between Mono, 180° and 360° viewing modes
- **Fullscreen**: Enter/exit fullscreen mode for immersive viewing
- **Drag & Drop**: Drag video files directly onto the browser window

## Technical Details

- Built with vanilla JavaScript and Three.js
- Uses WebGL for 3D rendering
- Video texture mapping on sphere geometry
- Responsive canvas that adapts to window size

## Browser Requirements

- Modern browser with WebGL support
- Chrome, Firefox, Safari, Edge (recent versions)