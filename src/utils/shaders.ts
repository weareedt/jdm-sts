export const vertexShader = `
  uniform float u_time;
  uniform float u_amplitude;
  uniform float u_explosiveness;
  uniform float u_avgVolume;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vDisplacement;

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
    vNormal = normalize(normalMatrix * normal);
    vUv = uv;
    vPosition = position;

    // Enhanced wisp particle effect
    float timeScale = u_time * 0.8;
    vec3 noisePosition = position * 2.0;
    
    // Create multiple layers of noise for more complex movement
    float noise1 = snoise(noisePosition + vec3(timeScale * 0.5));
    float noise2 = snoise(noisePosition * 2.0 + vec3(timeScale * 0.3));
    float noise3 = snoise(noisePosition * 4.0 + vec3(timeScale * 0.2));
    
    // Combine noise layers with different weights
    float combinedNoise = (
      noise1 * 0.5 +
      noise2 * 0.3 +
      noise3 * 0.2
    ) * (0.5 + u_avgVolume);

    // Create spiral movement
    float angle = timeScale + length(position) * 2.0;
    vec3 spiral = vec3(
      sin(angle) * (1.0 + combinedNoise * 0.5),
      cos(angle) * (1.0 + combinedNoise * 0.5),
      sin(timeScale * 0.5) * combinedNoise
    );

    // Add audio-reactive displacement
    vec3 displacement = vNormal * (combinedNoise * 0.5 + u_avgVolume * 0.3);
    displacement += spiral * (0.2 + u_avgVolume * 0.1);

    // Create particle-like movement
    float particleOffset = snoise(position + vec3(timeScale)) * u_explosiveness;
    displacement += vNormal * particleOffset * (0.3 + u_avgVolume * 0.2);

    // Store displacement for fragment shader
    vDisplacement = combinedNoise + particleOffset;

    // Apply final position with smooth transitions
    vec3 finalPosition = position + displacement * (0.8 + u_amplitude * 0.4);
    
    gl_Position = projectionMatrix * modelViewMatrix * vec4(finalPosition, 1.0);
    gl_PointSize = (2.0 + u_avgVolume * 3.0) * (1.0 - length(finalPosition) * 0.1);
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
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;

  void main() {
    // Define our color palette
    vec3 blue = vec3(0.0, 0.4, 1.0);
    vec3 red = vec3(1.0, 0.2, 0.2);
    vec3 yellow = vec3(1.0, 0.9, 0.2);
    vec3 white = vec3(1.0, 1.0, 1.0);

    // Create dynamic color transitions
    float timeFlow = u_time * 0.3;
    float displacement = vDisplacement * 2.0;
    
    // Mix colors based on displacement and time
    vec3 color1 = mix(blue, red, sin(timeFlow + displacement) * 0.5 + 0.5);
    vec3 color2 = mix(yellow, white, cos(timeFlow - displacement) * 0.5 + 0.5);
    vec3 baseColor = mix(color1, color2, sin(timeFlow * 0.5) * 0.5 + 0.5);

    // Add white highlights for particle effect
    float highlight = pow(1.0 - length(vPosition) * 0.15, 3.0);
    baseColor = mix(baseColor, white, highlight * (0.3 + u_avgVolume * 0.2));

    // Create soft particle effect
    float distanceFromCenter = length(gl_PointCoord - vec2(0.5));
    float softness = 0.05 + u_avgVolume * 0.02;
    float alpha = smoothstep(0.5, 0.5 - softness, distanceFromCenter);

    // Add audio-reactive glow
    float glow = u_avgVolume * 0.5;
    baseColor += glow * mix(blue, white, 0.5);

    // Add fresnel effect for edge glow
    vec3 viewDirection = normalize(cameraPosition - vPosition);
    float fresnel = pow(1.0 - max(dot(viewDirection, vNormal), 0.0), 3.0);
    baseColor += fresnel * white * 0.3;

    // Final color with transparency
    gl_FragColor = vec4(baseColor, alpha * (0.6 + glow * 0.4));
  }
`;
