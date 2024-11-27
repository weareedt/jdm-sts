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

    // Calculate distance from center
    float distanceFromCenter = length(position);
    
    // Create outward bloom effect
    float bloomTime = u_time * 0.5;
    float bloomSpeed = 1.0 + u_avgVolume * 0.5;
    float bloomPhase = mod(bloomTime * bloomSpeed + distanceFromCenter, 4.0);
    
    // Create expansion wave
    float expansionWave = sin(bloomPhase * 3.14159 * 0.5);
    
    // Add noise for randomness
    vec3 noisePosition = position * 2.0 + vec3(bloomTime);
    float noise1 = snoise(noisePosition * 1.0) * 0.5;
    float noise2 = snoise(noisePosition * 2.0) * 0.25;
    float noise3 = snoise(noisePosition * 4.0) * 0.125;
    float combinedNoise = noise1 + noise2 + noise3;

    // Create outward direction
    vec3 outwardDir = normalize(position);
    
    // Calculate expansion
    float baseExpansion = expansionWave * (1.0 + u_avgVolume);
    float noiseExpansion = combinedNoise * u_explosiveness * (1.0 + u_avgVolume);
    float totalExpansion = baseExpansion + noiseExpansion;

    // Apply outward movement
    vec3 bloomOffset = outwardDir * totalExpansion;
    
    // Add spiral movement
    float spiralAngle = bloomTime + distanceFromCenter * 2.0;
    vec3 spiralOffset = vec3(
      sin(spiralAngle) * 0.2,
      cos(spiralAngle) * 0.2,
      sin(spiralAngle * 0.5) * 0.1
    ) * (1.0 - expansionWave);

    // Combine movements
    vec3 finalPosition = position + bloomOffset + spiralOffset;
    
    // Store displacement for fragment shader
    vDisplacement = totalExpansion;

    // Adjust point size based on position and audio
    float size = (3.0 - distanceFromCenter * 0.2) * (1.0 + u_avgVolume);
    gl_PointSize = max(size * (1.0 + expansionWave * 0.5), 1.0);
    
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
  varying vec3 vPosition;
  varying vec3 vNormal;
  varying float vDisplacement;

  void main() {
    // Create point shape
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    float delta = fwidth(r);
    float alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);

    // Define core colors
    vec3 blue = vec3(0.0, 0.4, 1.0);
    vec3 red = vec3(1.0, 0.2, 0.2);
    vec3 yellow = vec3(1.0, 0.9, 0.2);
    vec3 white = vec3(1.0, 1.0, 1.0);

    // Distance-based color mixing
    float distanceFromCenter = length(vPosition);
    float normalizedDist = clamp(distanceFromCenter * 0.25, 0.0, 1.0);
    
    // Time-based color variation
    float timeFlow = u_time * 0.3;
    float colorPhase = mod(timeFlow + vDisplacement * 2.0, 6.28318);
    
    // Create bloom color gradient
    vec3 innerColor = mix(white, blue, normalizedDist * 0.5);
    vec3 midColor = mix(blue, red, (normalizedDist - 0.5) * 2.0);
    vec3 outerColor = mix(red, yellow, max(0.0, (normalizedDist - 0.75) * 4.0));
    
    // Combine colors based on distance
    vec3 bloomColor;
    if (normalizedDist < 0.5) {
        bloomColor = mix(innerColor, midColor, normalizedDist * 2.0);
    } else {
        bloomColor = mix(midColor, outerColor, (normalizedDist - 0.5) * 2.0);
    }

    // Add sparkle effect
    float sparkle = pow(1.0 - r, 3.0) * (1.0 + sin(colorPhase) * 0.5);
    bloomColor += white * sparkle * (0.3 + u_avgVolume * 0.2);

    // Add glow based on audio
    float glow = u_avgVolume * 0.5;
    bloomColor += glow * mix(blue, white, 0.5);

    // Calculate final alpha
    float distanceAlpha = 1.0 - smoothstep(0.0, 1.0, normalizedDist);
    float finalAlpha = alpha * (distanceAlpha * 0.8 + 0.2) * (0.6 + glow * 0.4);

    gl_FragColor = vec4(bloomColor, finalAlpha);
  }
`;
