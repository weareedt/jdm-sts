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
    
    // Create wing-like formations
    float wingTime = u_time * 0.3;
    float wingAngle = atan(position.y, position.x);
    float wingPhase = sin(wingAngle * 4.0 + wingTime) * cos(wingAngle * 2.0);
    
    // Create crystalline structure
    float crystalPhase = sin(wingAngle * 8.0) * cos(distanceFromCenter * 4.0);
    
    // Combine wing and crystal effects
    float structureEffect = wingPhase * crystalPhase * (1.0 + u_avgVolume);
    
    // Add noise for ethereal movement
    vec3 noisePosition = position * 2.0 + vec3(wingTime);
    float noise1 = snoise(noisePosition * 1.0) * 0.5;
    float noise2 = snoise(noisePosition * 2.0) * 0.25;
    float noise3 = snoise(noisePosition * 4.0) * 0.125;
    float combinedNoise = noise1 + noise2 + noise3;

    // Create outward direction with wing influence
    vec3 outwardDir = normalize(position + vec3(structureEffect * 0.5));
    
    // Calculate expansion with ethereal movement
    float baseExpansion = (1.0 + structureEffect) * (1.0 + u_avgVolume);
    float noiseExpansion = combinedNoise * u_explosiveness * (1.0 + u_avgVolume);
    float totalExpansion = baseExpansion + noiseExpansion;

    // Apply ethereal movement
    vec3 etherealOffset = outwardDir * totalExpansion;
    
    // Add spiral movement for flowing effect
    float spiralAngle = wingTime + distanceFromCenter * 2.0;
    vec3 spiralOffset = vec3(
      sin(spiralAngle) * 0.2,
      cos(spiralAngle) * 0.2,
      sin(spiralAngle * 0.5) * 0.1
    ) * (1.0 - baseExpansion * 0.2);

    // Combine movements
    vec3 finalPosition = position + etherealOffset + spiralOffset;
    
    // Store displacement for fragment shader
    vDisplacement = totalExpansion;

    // Dynamic point size based on position and audio
    float size = (2.5 - distanceFromCenter * 0.15) * (1.0 + u_avgVolume);
    gl_PointSize = max(size * (1.0 + structureEffect * 0.3), 1.0);
    
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
    // Create soft particle shape
    vec2 cxy = 2.0 * gl_PointCoord - 1.0;
    float r = dot(cxy, cxy);
    float delta = fwidth(r);
    float alpha = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);

    // Define wisp colors
    vec3 coreColor = vec3(1.0, 0.95, 0.9);  // Bright white-gold core
    vec3 innerColor = vec3(0.2, 0.6, 1.0);  // Bright blue
    vec3 midColor = vec3(0.0, 0.3, 0.8);    // Deep blue
    vec3 outerColor = vec3(1.0, 0.4, 0.2);  // Warm red/orange

    // Distance-based color mixing
    float distanceFromCenter = length(vPosition);
    float normalizedDist = clamp(distanceFromCenter * 0.3, 0.0, 1.0);
    
    // Time-based color variation
    float timeFlow = u_time * 0.2;
    float colorPhase = mod(timeFlow + vDisplacement * 2.0, 6.28318);
    
    // Create ethereal gradient
    vec3 baseColor;
    if (normalizedDist < 0.3) {
        // Intense core
        baseColor = mix(coreColor, innerColor, normalizedDist * 3.33);
    } else if (normalizedDist < 0.6) {
        // Wing region
        baseColor = mix(innerColor, midColor, (normalizedDist - 0.3) * 3.33);
    } else {
        // Outer glow
        baseColor = mix(midColor, outerColor, (normalizedDist - 0.6) * 2.5);
    }

    // Add sparkle effect
    float sparklePhase = sin(colorPhase * 2.0) * cos(colorPhase * 3.0);
    float sparkleIntensity = pow(1.0 - r, 4.0) * (0.5 + sparklePhase * 0.5);
    vec3 sparkleColor = mix(coreColor, innerColor, sparklePhase);
    baseColor += sparkleColor * sparkleIntensity * (0.3 + u_avgVolume * 0.4);

    // Add ethereal glow
    float glowStrength = u_avgVolume * 0.6;
    baseColor += mix(innerColor, coreColor, 0.5) * glowStrength;

    // Particle shadow effect
    float shadowIntensity = smoothstep(0.3, 0.7, r) * 0.4;
    baseColor = mix(baseColor, vec3(0.0, 0.1, 0.2), shadowIntensity);

    // Calculate final alpha with ethereal fade
    float distanceAlpha = 1.0 - smoothstep(0.0, 1.0, normalizedDist);
    float finalAlpha = alpha * (distanceAlpha * 0.7 + 0.3) * (0.6 + glowStrength * 0.4);

    gl_FragColor = vec4(baseColor, finalAlpha);
  }
`;
