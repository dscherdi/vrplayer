class VRVideoPlayer {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.sphere = null;
    this.video = null;
    this.texture = null;
    this.controls = {
      isMouseDown: false,
      mouseX: 0,
      mouseY: 0,
      lat: 0,
      lon: 0,
      phi: 0,
      theta: 0,
    };
    this.mode = "180"; // 'mono', '180' or '360'
    this.isPlaying = false;

    this.init();
    this.setupEventListeners();
    this.animate();
  }

  init() {
    // Get DOM elements
    this.canvas = document.getElementById("canvas");
    this.video = document.getElementById("video");

    // Create scene
    this.scene = new THREE.Scene();

    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.set(0, 0, 0);

    // Create renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);

    // Create sphere geometry
    this.createSphere();

    // Initialize camera rotation
    this.controls.lat = 0;
    this.controls.lon = 0;
    this.updateCamera();
  }

  createSphere() {
    // Remove existing sphere
    if (this.sphere) {
      this.scene.remove(this.sphere);
    }

    // Create geometry based on mode
    let geometry;
    if (this.mode === "mono") {
      // Create plane for mono mode
      const aspectRatio =
        this.video && this.video.videoWidth
          ? this.video.videoWidth / this.video.videoHeight
          : 16 / 9;
      const width = 10;
      const height = width / aspectRatio;
      geometry = new THREE.PlaneGeometry(width, height);
    } else {
      // Create sphere for 180/360 modes
      geometry = new THREE.SphereGeometry(500, 60, 40);
    }

    // Create material
    let material;
    if (this.texture) {
      material = new THREE.MeshBasicMaterial({
        map: this.texture,
        side: this.mode === "mono" ? THREE.FrontSide : THREE.BackSide,
      });
    } else {
      material = new THREE.MeshBasicMaterial({
        color: 0x222222,
        side: this.mode === "mono" ? THREE.FrontSide : THREE.BackSide,
      });
    }

    // Create mesh
    this.sphere = new THREE.Mesh(geometry, material);

    // Position and adjust based on mode
    if (this.mode === "mono") {
      this.sphere.position.set(0, 0, -5);
    } else {
      this.sphere.position.set(0, 0, 0);

      // Adjust UV mapping for 180° mode
      if (this.mode === "180") {
        const uvs = geometry.attributes.uv.array;
        for (let i = 1; i < uvs.length; i += 2) {
          uvs[i] = uvs[i] * 0.5 + 0.25; // Map to middle half of texture
        }
        geometry.attributes.uv.needsUpdate = true;
      }
    }

    this.scene.add(this.sphere);
  }

  setupEventListeners() {
    // File input
    const fileInput = document.getElementById("fileInput");
    fileInput.addEventListener("change", (e) =>
      this.loadVideo(e.target.files[0]),
    );

    // Drag and drop
    document.addEventListener("dragover", (e) => this.onDragOver(e));
    document.addEventListener("dragenter", (e) => this.onDragEnter(e));
    document.addEventListener("dragleave", (e) => this.onDragLeave(e));
    document.addEventListener("drop", (e) => this.onDrop(e));

    // Mode buttons
    const modeMono = document.getElementById("modeMono");
    const mode180 = document.getElementById("mode180");
    const mode360 = document.getElementById("mode360");

    modeMono.addEventListener("click", () => this.setMode("mono"));
    mode180.addEventListener("click", () => this.setMode("180"));
    mode360.addEventListener("click", () => this.setMode("360"));

    // Play/pause button
    const playPause = document.getElementById("playPause");
    playPause.addEventListener("click", () => this.togglePlayPause());

    // Volume control
    const volume = document.getElementById("volume");
    volume.addEventListener("input", (e) => this.setVolume(e.target.value));

    // Fullscreen button
    const fullscreen = document.getElementById("fullscreen");
    fullscreen.addEventListener("click", () => this.toggleFullscreen());

    // Progress bar
    const progress = document.getElementById("progress");
    progress.addEventListener("click", (e) => this.seekTo(e));

    // Mouse controls
    this.canvas.addEventListener("mousedown", (e) => this.onMouseDown(e));
    this.canvas.addEventListener("mousemove", (e) => this.onMouseMove(e));
    this.canvas.addEventListener("mouseup", () => this.onMouseUp());
    this.canvas.addEventListener("wheel", (e) => this.onWheel(e));

    // Touch controls
    this.canvas.addEventListener("touchstart", (e) => this.onTouchStart(e));
    this.canvas.addEventListener("touchmove", (e) => this.onTouchMove(e));
    this.canvas.addEventListener("touchend", () => this.onTouchEnd());

    // Video events
    this.video.addEventListener("loadedmetadata", () => this.onVideoLoaded());
    this.video.addEventListener("loadeddata", () => this.onVideoLoadedData());
    this.video.addEventListener("canplay", () => this.onVideoCanPlay());
    this.video.addEventListener("canplaythrough", () =>
      this.onVideoCanPlayThrough(),
    );
    this.video.addEventListener("timeupdate", () => this.updateProgress());
    this.video.addEventListener("play", () => this.onVideoPlay());
    this.video.addEventListener("pause", () => this.onVideoPause());
    this.video.addEventListener("ended", () => this.onVideoEnded());
    this.video.addEventListener("waiting", () => this.onVideoWaiting());
    this.video.addEventListener("stalled", () => this.onVideoStalled());
    this.video.addEventListener("error", (e) => this.onVideoError(e));

    // Window resize
    window.addEventListener("resize", () => this.onWindowResize());

    // Fullscreen change
    document.addEventListener("fullscreenchange", () =>
      this.onFullscreenChange(),
    );

    // Prevent context menu
    this.canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  }

  loadVideo(file) {
    if (!file) return;

    // Reset video state
    this.video.pause();
    this.isPlaying = false;
    this.updatePlayButton();

    // Clean up previous video URL
    if (this.video.src && this.video.src.startsWith("blob:")) {
      URL.revokeObjectURL(this.video.src);
    }

    const url = URL.createObjectURL(file);
    this.video.src = url;
    this.video.preload = "auto";
    this.video.load();

    // Create video texture
    this.texture = new THREE.VideoTexture(this.video);
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.format = THREE.RGBFormat;
    this.texture.generateMipmaps = false;

    // Update sphere material
    this.createSphere();
  }

  onVideoLoaded() {
    this.updateTimeDisplay();
  }

  onVideoLoadedData() {}

  onVideoCanPlay() {}

  onVideoCanPlayThrough() {}

  onVideoWaiting() {}

  onVideoStalled() {}

  onVideoError(e) {
    console.error("Video error:", e, this.video.error);
  }

  setMode(mode) {
    this.mode = mode;

    // Update button states
    document
      .getElementById("modeMono")
      .classList.toggle("active", mode === "mono");
    document
      .getElementById("mode180")
      .classList.toggle("active", mode === "180");
    document
      .getElementById("mode360")
      .classList.toggle("active", mode === "360");

    // Reset camera position when switching modes
    if (mode === "mono") {
      this.controls.lat = 0;
      this.controls.lon = 0;
    } else if (this.mode === "mono") {
      // Switching from mono to VR mode
      this.controls.lat = 0;
      this.controls.lon = 0;
    }

    // Recreate sphere with new geometry
    this.createSphere();
  }

  togglePlayPause() {
    if (!this.video.src) return;

    if (this.video.paused) {
      this.video.play().catch((err) => {
        console.error("Play failed:", err);
        this.updatePlayButton();
      });
    } else {
      this.video.pause();
    }
  }

  setVolume(value) {
    this.video.volume = parseFloat(value);
  }

  onVideoPlay() {
    this.isPlaying = true;
    this.updatePlayButton();
  }

  onVideoPause() {
    this.isPlaying = false;
    this.updatePlayButton();
  }

  onVideoEnded() {
    this.isPlaying = false;
    this.updatePlayButton();
  }

  updatePlayButton() {
    const playPauseBtn = document.getElementById("playPause");
    playPauseBtn.textContent = this.isPlaying ? "⏸️" : "▶️";
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.log(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  }

  onFullscreenChange() {
    const fullscreenBtn = document.getElementById("fullscreen");
    if (document.fullscreenElement) {
      fullscreenBtn.textContent = "⛷";
    } else {
      fullscreenBtn.textContent = "⛶";
    }
    this.onWindowResize();
  }

  seekTo(e) {
    if (!this.video.duration) return;

    const rect = e.target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * this.video.duration;

    this.video.currentTime = time;
  }

  updateProgress() {
    if (!this.video.duration) return;

    const percentage = (this.video.currentTime / this.video.duration) * 100;
    document.getElementById("progressBar").style.width = percentage + "%";
    this.updateTimeDisplay();
  }

  updateTimeDisplay() {
    const current = this.formatTime(this.video.currentTime || 0);
    const duration = this.formatTime(this.video.duration || 0);
    document.getElementById("time").textContent = `${current} / ${duration}`;
  }

  formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  }

  // Mouse event handlers
  onMouseDown(e) {
    this.controls.isMouseDown = true;
    this.controls.mouseX = e.clientX;
    this.controls.mouseY = e.clientY;
    this.canvas.style.cursor = "grabbing";
  }

  onMouseMove(e) {
    if (!this.controls.isMouseDown) return;

    const deltaX = e.clientX - this.controls.mouseX;
    const deltaY = e.clientY - this.controls.mouseY;

    this.controls.lon += deltaX * 0.1;

    this.controls.lat -= deltaY * 0.1;

    // Limit vertical movement in mono mode
    if (this.mode === "mono") {
      this.controls.lat = Math.max(-20, Math.min(20, this.controls.lat));
    } else {
      this.controls.lat = Math.max(-85, Math.min(85, this.controls.lat));
    }

    this.updateCamera();

    this.controls.mouseX = e.clientX;
    this.controls.mouseY = e.clientY;
  }

  onMouseUp() {
    this.controls.isMouseDown = false;
    this.canvas.style.cursor = "grab";
  }

  onWheel(e) {
    e.preventDefault();
    // Optional: Add zoom functionality here
  }

  // Touch event handlers
  onTouchStart(e) {
    e.preventDefault();
    if (e.touches.length === 1) {
      this.controls.isMouseDown = true;
      this.controls.mouseX = e.touches[0].clientX;
      this.controls.mouseY = e.touches[0].clientY;
    }
  }

  onTouchMove(e) {
    e.preventDefault();
    if (!this.controls.isMouseDown || e.touches.length !== 1) return;

    const deltaX = e.touches[0].clientX - this.controls.mouseX;
    const deltaY = e.touches[0].clientY - this.controls.mouseY;

    this.controls.lon += deltaX * 0.1;

    this.controls.lat -= deltaY * 0.1;

    // Limit vertical movement in mono mode
    if (this.mode === "mono") {
      this.controls.lat = Math.max(-20, Math.min(20, this.controls.lat));
    } else {
      this.controls.lat = Math.max(-85, Math.min(85, this.controls.lat));
    }

    this.updateCamera();

    this.controls.mouseX = e.touches[0].clientX;
    this.controls.mouseY = e.touches[0].clientY;
  }

  onTouchEnd(e) {
    e.preventDefault();
    this.controls.isMouseDown = false;
  }

  updateCamera() {
    this.controls.phi = THREE.MathUtils.degToRad(90 - this.controls.lat);
    this.controls.theta = THREE.MathUtils.degToRad(this.controls.lon);

    if (this.mode === "mono") {
      // For mono mode, position camera to look at the plane
      const distance = 5;
      const x =
        Math.sin(this.controls.phi) * Math.cos(this.controls.theta) * distance;
      const y = Math.cos(this.controls.phi) * distance;
      const z =
        Math.sin(this.controls.phi) * Math.sin(this.controls.theta) * distance -
        5;

      this.camera.position.set(x, y, z);
      this.camera.lookAt(0, 0, -5);
    } else {
      // For 180/360 modes, use spherical coordinates from center
      this.camera.position.set(0, 0, 0);
      const x = Math.sin(this.controls.phi) * Math.cos(this.controls.theta);
      const y = Math.cos(this.controls.phi);
      const z = Math.sin(this.controls.phi) * Math.sin(this.controls.theta);

      this.camera.lookAt(x, y, z);
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  // Drag and drop handlers
  onDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  }

  onDragEnter(e) {
    e.preventDefault();
    document.body.classList.add("drag-over");
    document.getElementById("dropZone").classList.add("active");
  }

  onDragLeave(e) {
    if (!e.relatedTarget || e.relatedTarget === document.body) {
      document.body.classList.remove("drag-over");
      document.getElementById("dropZone").classList.remove("active");
    }
  }

  onDrop(e) {
    e.preventDefault();
    document.body.classList.remove("drag-over");
    document.getElementById("dropZone").classList.remove("active");

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith("video/")) {
        this.loadVideo(file);
      } else {
        console.warn("Please drop a video file");
      }
    }
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Update video texture only when video is playing and has new data
    if (
      this.texture &&
      this.isPlaying &&
      this.video.readyState >= this.video.HAVE_CURRENT_DATA
    ) {
      this.texture.needsUpdate = true;
    }

    this.renderer.render(this.scene, this.camera);
  }
}

// Initialize the VR video player when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new VRVideoPlayer();
});
