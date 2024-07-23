import { Vector3, ShaderMaterial,TextureLoader,RepeatWrapping, SphereGeometry, Mesh,SRGBColorSpace } from 'three'
import { GLOBALS } from '../../Globals';

var noise = new TextureLoader().load('./assets/textures/noise.jpg');
noise.wrapS = noise.wrapT = RepeatWrapping
var matcap = new TextureLoader().load('./assets/textures/matcap.png');
matcap.colorSpace = SRGBColorSpace;

//setTimeout(() => {
    GLOBALS.UNIFORMS_DISSOLVER = {
        u_EffectOrigin: { value: new Vector3(3,2,3) },
        u_Time: { value: 0 },
        diffuseMap: { value: matcap },
        t_Noise: { value: noise }
    };
    
    const vshader = `
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv; // Pass UV coordinates to fragment shader
    
    #include <normal_pars_vertex>
    #include <uv_pars_vertex> // Include UV handling
    
    void main() {
      #include <beginnormal_vertex>
      #include <defaultnormal_vertex>
      #include <normal_vertex>
    
      #include <begin_vertex>
      #include <project_vertex>
    
      // Position of the mesh in world space
      vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

      // Pass UV coordinates to fragment shader
      vUv = uv;
    
      vViewPosition = -mvPosition.xyz;
    }
    `;
    
    const fshader = `
    varying vec3 vViewPosition;
    varying vec3 vWorldPosition;
    varying vec2 vUv; // Receive UV coordinates from vertex shader
    
    uniform vec3 u_EffectOrigin;
    uniform sampler2D t_Noise;
    uniform float u_Time;
    uniform sampler2D diffuseMap; // Texture map
    
    #include <normal_pars_fragment>
    
    void main() {
      vec4 diffuseColor = texture2D(diffuseMap, vUv); // Sample texture map
      vec4 glowColor = vec4(0.2667, 0.8745, 0.6, 0.0);
    
      #include <normal_fragment_begin>
    
      vec3 viewDir = normalize(vViewPosition);
        vec3 x = normalize( vec3(viewDir.z, 0.0, - viewDir.x));
        vec3 y = cross(viewDir, x);
        vec2 uv = vec2( dot( x, normal ), dot( y, normal ) ) * 0.495 + 0.5; // 0.495 to remove artifacts caused by undersized matcap disks
    
      vec4 tNoise = texture2D(t_Noise, uv+vec2(u_Time* -0.2, u_Time*0.1));
      float noise = (tNoise.r + tNoise.g + tNoise.b) / 3.0;
    
      float distancefromEffectOrigin = distance(vWorldPosition, u_EffectOrigin);
      
      float falloff = step(1.0, distancefromEffectOrigin - noise);

      // Apply falloff to dissolve effect
        float dissolveFactor = 1.0 - falloff; // Invert falloff for dissolve effect

        // Combine texture color with custom effect using dissolveFactor
        vec4 finalColor = mix(diffuseColor, glowColor, dissolveFactor);

        // Set fragment color
        gl_FragColor = finalColor;

        #include <tonemapping_fragment>
        #include <colorspace_fragment>
    }
    `;
    
    GLOBALS.MATERIAL_DISSOLVER = new ShaderMaterial({
        uniforms: GLOBALS.UNIFORMS_DISSOLVER,
        vertexShader: vshader,
        fragmentShader: fshader,
        side: 2,
        transparent: true,
        depthWrite: false
    });
    
    console.log(GLOBALS.MATERIAL_DISSOLVER)
    
    /*const geometry = new SphereGeometry(1, 32, 32)
    const cube = new Mesh( geometry, GLOBALS.MATERIAL_DISSOLVER ); 
    cube.position.set(3,3,3)
    //
    GLOBALS.SCENE.add( cube );*/
//}, 4000);

