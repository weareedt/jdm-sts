// === Initialize the Scene, Camera, and Renderer ===
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);  // Optimize for device pixel ratio
document.body.appendChild(renderer.domElement);  // Attach renderer to the HTML

camera.position.z = 6;  // Move the camera back so we can see the object

// === Vertex Shader for Waving Effect ===
const vertexShader = `
uniform float u_time;
uniform float u_amplitude;

varying vec3 vNormal;
varying vec3 vPosition;

void main() {
    // Waving effect: Modify position based on sine wave and time
    vec3 newPosition = position + normal * sin(u_time + position.y * 0.1) * u_amplitude;
    vNormal = normal;
    vPosition = newPosition;
    
    // Calculate final vertex position
    gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
}
`;

// === Fragment Shader with Color Control ===
const fragmentShader = `
uniform vec3 u_color;  // Add uniform for color

varying vec3 vNormal;

void main() {
    // Color the object based on the uniform color
    gl_FragColor = vec4(u_color, 1.0);  // Use uniform color
}
`;

// === Shader Material with Uniforms for Waving Effect and Color ===
const shaderMaterial = new THREE.ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
        u_time: { value: 0.0 },
        u_amplitude: { value: 0.1 },  // Adjust this value to control the wave strength
        u_color: { value: new THREE.Color(0x00ff00) }  // Initial color
    },
    wireframe: true,  // Keep the wireframe to visualize the vertices
    side: THREE.DoubleSide
});

// === Create the Icosahedron Geometry ===
const geometry = new THREE.IcosahedronGeometry(1, 2);  // Icosahedron geometry
const sphere = new THREE.Mesh(geometry, shaderMaterial);
scene.add(sphere);  // Add the object to the scene

// === Audio Setup ===
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);
const audioLoader = new THREE.AudioLoader();
audioLoader.load('/static/Beats.mp3', function(buffer) {
    sound.setBuffer(buffer);
    sound.setLoop(true);
    sound.setVolume(0.5);
});

const analyser = new THREE.AudioAnalyser(sound, 32);

// let isPlaying = false;  // Track whether the music is playing
// let isRecording = false;  // Track whether the "Start Recording" was clicked

// // === Button to Start or Pause Music ===
// document.addEventListener('DOMContentLoaded', (event) => {
//     const startButton = document.getElementById('start');
//     startButton.addEventListener('click', () => {
//         if (isPlaying) {
//             sound.pause();
//             startButton.textContent = 'Start';
//             isPlaying = false;
//             isRecording = false;  // Stop waving effect when paused
//         } else {
//             sound.play();
//             startButton.textContent = 'Pause';
//             isPlaying = true;
//             isRecording = true;  // Start waving effect when recording
//         }
//     });
// });



// === GUI Color Control ===
const guiParams = {
    red: 0,
    green: 255,
    blue: 0
};

const gui = new dat.GUI();
gui.add(guiParams, 'red', 0, 255).name('Red').onChange(updateColor);
gui.add(guiParams, 'green', 0, 255).name('Green').onChange(updateColor);
gui.add(guiParams, 'blue', 0, 255).name('Blue').onChange(updateColor);

function updateColor() {
    // Update color based on GUI sliders
    const newColor = new THREE.Color(`rgb(${Math.floor(guiParams.red)}, ${Math.floor(guiParams.green)}, ${Math.floor(guiParams.blue)})`);
    shaderMaterial.uniforms.u_color.value = newColor;  // Update shader uniform for color
}

// === Animation Loop with Vertex Waving Effect ===
function animate() {
    setTimeout(() => {  // Limit frame rate to 30 FPS
        requestAnimationFrame(animate);

        // Update time uniform for shader
        shaderMaterial.uniforms.u_time.value += 0.07;  // Adjust this value for wave speed

        // Get frequency data from the audio analyzer
        const dataArray = analyser.getFrequencyData();

        // Use the frequency data to scale the sphere (for a basic visual effect)
        const averageFrequency = analyser.getAverageFrequency();
        const scale = 1 + averageFrequency / 128;  // Scale factor based on average frequency
        sphere.scale.set(scale, scale, scale);  // Apply the scaling

        // Render the scene
        renderer.render(scene, camera);
    }, 1000 / 30);  // 30 FPS
}

// Start the animation loop
animate();

// === Handle Window Resize ===
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
