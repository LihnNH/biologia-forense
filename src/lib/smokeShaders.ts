// Adaptado da referência fumaca-cinza-webgl.html para o fundo preto da aplicação.
export const smokeVertexShader = `attribute vec2 a_position;
        void main() { gl_Position = vec4(a_position, 0.0, 1.0); }`;

export const smokeFragmentShader = `precision highp float;
        uniform vec2 u_resolution;
        uniform float u_time;
        uniform float u_density;

        // Ruído suave com hash rápido; tudo gerado pela GPU, sem imagens.
        float hash(vec2 p) {
          p = fract(p * vec2(123.34, 456.21));
          p += dot(p, p + 45.32);
          return fract(p.x * p.y);
        }
        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
                     mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
        }
        float fbm(vec2 p) {
          float v = 0.0;
          float a = 0.5;
          for (int i = 0; i < 4; i++) {
            v += a * noise(p);
            p = p * 2.05 + vec2(4.1, 1.7);
            a *= 0.5;
          }
          return v / 0.9375;
        }
        void main() {
          // Coordenadas com escala estável no celular e no desktop.
          vec2 uv = (gl_FragCoord.xy - 0.5 * u_resolution) / u_resolution.y;
          float t = u_time;

          // Dois campos de ruído deformam o espaço: redemoinhos orgânicos.
          vec2 p = uv * 2.25;
          p.y -= t * 0.20;
          p.x += sin(p.y * 1.65 + t * 0.33) * 0.14;
          vec2 warp = vec2(
            fbm(p * 0.75 + vec2(3.0, t * 0.16)),
            fbm(p * 0.75 + vec2(11.0, t * 0.11))
          ) - 0.5;
          vec2 swirled = p + warp * 1.65;

          // Camadas de densidade formam bordas suaves e filamentos.
          float broad = fbm(swirled * 1.28 + vec2(0.5, 0.0));
          float detail = fbm(swirled * 2.65 + vec2(4.0, 9.0));
          float vapor = broad * 0.76 + detail * 0.24;
          float cloud = smoothstep(0.42, 0.72, vapor);
          float wisps = smoothstep(0.49, 0.70, detail) * 0.18;

          // Mais fumaça na parte de baixo, dissipando ao subir.
          float fadeUp = 1.0 - smoothstep(-0.30, 0.72, uv.y + warp.y * 0.11);
          float density = (cloud + wisps) * fadeUp;
          // Um pouco de névoa difusa, para não parecer só manchas isoladas.
          density += smoothstep(0.30, 0.72, broad) * fadeUp * 0.13;
          density = clamp(density, 0.0, 1.0);

          // O vermelho colore só a fumaça no canto inferior direito, sem halo fixo.
          vec3 smokeColor = mix(vec3(0.30, 0.30, 0.31), vec3(0.44, 0.44, 0.46), detail);
          vec2 screenUv = gl_FragCoord.xy / u_resolution;
          vec2 redRegion = (screenUv - vec2(0.88, 0.25)) / vec2(0.32, 0.38);
          float redTint = 1.0 - smoothstep(0.0, 1.0, length(redRegion));
          smokeColor = mix(smokeColor, vec3(0.50, 0.16, 0.19), redTint * 0.55);
          float alpha = density * 0.80 * u_density;
          gl_FragColor = vec4(smokeColor, clamp(alpha, 0.0, 0.68));
        }`;
