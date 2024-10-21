import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const Visualizer: React.FC = () => {
    const mountRef = useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioContext, setAudioContext] = useState<AudioContext | null>(null);
    const [sound, setSound] = useState<THREE.Audio | null>(null);
    const [analyser, setAnalyser] = useState<THREE.AudioAnalyser | null>(null);

    useEffect(() => {
        if (!mountRef.current) return;

        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;

        // Scene setup
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(width, height);
        mountRef.current.appendChild(renderer.domElement);

        camera.position.z = 5;

        // Shader setup
        const vertexShader = `
            precision mediump float;
            uniform float u_time;
            uniform float u_amplitude;
            varying vec3 vNormal;
            varying vec3 vPosition;

            void main() {
                vec3 newPosition = position + normal * (sin(u_time + position.y * 2.0) * cos(u_time + position.x * 2.0) * u_amplitude);
                vNormal = normalize(normal);
                vPosition = newPosition;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 2);
            }
        `;

        const fragmentShader = `
            uniform vec3 u_color;
            varying vec3 vPosition;
            varying vec3 vNormal;

            void main() {
                float intensity = dot(normalize(vNormal), vec3(0.0, 0.0, 1.0));
                vec3 finalColor = mix(u_color, vec3(0.1, 0.1, 0.1), intensity);
                gl_FragColor = vec4(u_color, 1.0);
            }
        `;

        const shaderMaterial = new THREE.ShaderMaterial({
            vertexShader,
            fragmentShader,
            uniforms: {
                u_time: { value: 0.0 },
                u_amplitude: { value: 0.1 },
                u_color: { value: new THREE.Color(0x00fff2) }
            },
            wireframe: true,
            side: THREE.DoubleSide
        });

        const icosahedronGeometry = new THREE.IcosahedronGeometry(2, 3);
        const icosahedron = new THREE.Mesh(icosahedronGeometry, shaderMaterial);
        scene.add(icosahedron);

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            shaderMaterial.uniforms.u_time.value += 0.05;

            if (isPlaying && analyser) {
                const frequency = analyser.getAverageFrequency();
                shaderMaterial.uniforms.u_amplitude.value = frequency / 256 * 0.3;
            } else {
                shaderMaterial.uniforms.u_amplitude.value = 0.1;
            }

            renderer.render(scene, camera);
        };
        animate();

        // Resize handler
        const handleResize = () => {
            if (!mountRef.current) return;
            const width = mountRef.current.clientWidth;
            const height = mountRef.current.clientHeight;
            camera.aspect = width / height;
            camera.updateProjectionMatrix();
            renderer.setSize(width, height);
        };
        window.addEventListener('resize', handleResize);

        // Cleanup
        return () => {
            window.removeEventListener('resize', handleResize);
            mountRef.current?.removeChild(renderer.domElement);
        };
    }, [isPlaying, analyser]);

    const initializeAudio = () => {
        if (!audioContext) {
            const newAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            setAudioContext(newAudioContext);
            const listener = new THREE.AudioListener();
            const newSound = new THREE.Audio(listener);
            setSound(newSound);
            setAnalyser(new THREE.AudioAnalyser(newSound, 32));

            const audioLoader = new THREE.AudioLoader();
            audioLoader.load('/static/Beats.mp3', (buffer) => {
                newSound.setBuffer(buffer);
                newSound.setLoop(true);
                newSound.setVolume(0.5);
            });
        }
    };

    const handleStartPause = () => {
        initializeAudio();
        if (isPlaying && sound) {
            sound.pause();
        } else if (sound) {
            sound.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="Visualizer" ref={mountRef} style={{ width: '100%', height: '100%' }}>
            <button 
                onClick={handleStartPause} 
                style={{
                    position: 'absolute',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#4deeea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer'
                }}
            >
                {isPlaying ? 'Pause' : 'Play'}
            </button>
        </div>
    );
};

export default Visualizer;
