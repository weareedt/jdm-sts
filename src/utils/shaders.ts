export const vertexShader = `
  uniform float u_time;
  uniform float u_amplitude;
  uniform float u_explosiveness;
  uniform float u_avgVolume;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition; //Pass position to fragment shader

  // Simplex 3D noise function
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;

    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    // Pass normal and uv to fragment shader
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;

    // Create a waving effect using sine function
    float waveAmplitude = 0.03; // Reduced from 0.05
    float waveFrequency = 2.0; // Reduced from 2.0
    float waveSpeed = 1.0; // Reduced from 1.0

    // Calculate wave displacement in all dimensions for more interesting movement
    float waveX = sin(position.y * waveFrequency + u_time * waveSpeed) * waveAmplitude;
    float waveY = cos(position.x * waveFrequency + u_time * waveSpeed) * waveAmplitude;
    float waveZ = sin(position.z * waveFrequency + u_time * waveSpeed) * waveAmplitude;
    vec3 waveDisplacement = vec3(waveX, waveY, waveZ);

    // Calculate noise for reactive animation with reduced intensity
    float noise = snoise(position + vec3(u_time * 0.8)); // Slowed down noise movement
    vec3 noiseDisplacement = position * noise * (u_explosiveness * 0.8) * (u_avgVolume * 0.8); // Reduced intensity

    // Smoother transition between animations
    float audioInfluence = smoothstep(0.0, 0.6, u_avgVolume); // Increased smoothstep range for gentler transition

    // Combine wave (idle) and noise (reactive) animations
    vec3 finalPosition = position;
    finalPosition += waveDisplacement * (1.0 - audioInfluence * 0.7); // Keep more of the wave animation
    finalPosition += noiseDisplacement * audioInfluence; // Gentler noise influence

    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
  }
`;

export const fragmentShader = `
  uniform float u_time;
  uniform float u_amplitude;
  uniform float u_explosiveness;
  uniform float u_avgVolume;
  uniform vec3 u_color1;
  uniform vec3 u_color2;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;

  // Add bloom helper function
  vec3 applyBloom(vec3 color, float threshold, float intensity) {
    float brightness = dot(color, vec3(0.2126, 0.7152, 0.0722));
    float contribution = max(0.0, brightness - threshold) * intensity;
    return color + (color * contribution);
  }

  void main() {
    // Basic lighting for the white sphere
    vec3 light = normalize(vec3(0.5, 0.2, 1.0));
    float dProd = max(0.0, dot(vNormal, light));
    vec3 sphereColor = vec3(1.0) * dProd;

    // Calculate rim glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float rimStrength = 1.0 - max(dot(normalize(vNormal), viewDirection), 0.0);

    // Create pulsing effect for the glow
    float pulse = sin(u_time * 2.0) * 0.5;
    
    // Mix glow colors
    vec3 glowColor = mix(u_color1, u_color2, pulse);
    
    // Calculate glow strength with increased intensity
    float glowStrength = rimStrength * (0.9 + pulse * 0.8);
    glowStrength += u_avgVolume * 0.15; // Increased audio reactivity

    // Combine sphere and glow with increased intensity
    vec3 finalColor = sphereColor + glowColor * glowStrength * 2.5;
    
    // Apply bloom effect
    finalColor = applyBloom(finalColor, 0.6, 1.5);
    
    // Set alpha for proper glow effect
    float alpha = max(0.8, glowStrength);

    gl_FragColor = vec4(finalColor, alpha);
  }
`;
