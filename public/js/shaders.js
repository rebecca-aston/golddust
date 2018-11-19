  function getTranslucentShader() {

    /* ------------------------------------------------------------------------------------------
    //  Subsurface Scattering shader
    //    - Base on GDC 2011 – Approximating Translucency for a Fast, Cheap and Convincing Subsurface Scattering Look
    //      https://colinbarrebrisebois.com/2011/03/07/gdc-2011-approximating-translucency-for-a-fast-cheap-and-convincing-subsurface-scattering-look/
    // ------------------------------------------------------------------------------------------ */

    this.uniforms = THREE.UniformsUtils.merge( [

      THREE.UniformsLib[ "common" ],
      THREE.UniformsLib[ "lights" ],

      {
        "color":  { value: new THREE.Color( 0xa78d00 ) },
        "diffuse":  { value: new THREE.Color( 0xffffff ) },
        "specular": { value: new THREE.Color( 0xc1a405 ) },
        "emissive": { value: new THREE.Color( 0x5e5108 ) },
        "opacity": { value: 1 },
        "shininess": { value: 10 },

        "thicknessMap": { value: null },
        "thicknessColor": { value: new THREE.Color( 0xffffff ) },
        "thicknessDistortion": { value: 0.1 },
        "thicknessAmbient": { value: 0.0 },
        "thicknessAttenuation": { value: 0.1 },
        "thicknessPower": { value: 2.0 },
        "thicknessScale": { value: 10.0 }
      }

    ] );

    this.fragmentShader = [
      "#define USE_MAP",
      "#define PHONG",
      "#define TRANSLUCENT",
      "#include <common>",
      "#include <bsdfs>",
      "#include <uv_pars_fragment>",
      "#include <map_pars_fragment>",
      "#include <lights_phong_pars_fragment>",

      "varying vec3 vColor;",

      "uniform vec3 diffuse;",
      "uniform vec3 specular;",
      "uniform vec3 emissive;",
      "uniform float opacity;",
      "uniform float shininess;",

      // Translucency
      "uniform sampler2D thicknessMap;",
      "uniform float thicknessPower;",
      "uniform float thicknessScale;",
      "uniform float thicknessDistortion;",
      "uniform float thicknessAmbient;",
      "uniform float thicknessAttenuation;",
      "uniform vec3 thicknessColor;",

      THREE.ShaderChunk[ "lights_pars_begin" ],

      "void RE_Direct_Scattering(const in IncidentLight directLight, const in vec2 uv, const in GeometricContext geometry, inout ReflectedLight reflectedLight) {",
      " vec3 thickness = thicknessColor * texture2D(thicknessMap, uv).r;",
      " vec3 scatteringHalf = normalize(directLight.direction + (geometry.normal * thicknessDistortion));",
      " float scatteringDot = pow(saturate(dot(geometry.viewDir, -scatteringHalf)), thicknessPower) * thicknessScale;",
      " vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * thickness;",
      " reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;",
      "}",

      "void main() {",

      " vec3 normal = normalize( vNormal );",

      " vec3 viewerDirection = normalize( vViewPosition );",

      " vec4 diffuseColor = vec4( diffuse, opacity );",
      " ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",

        THREE.ShaderChunk[ "map_fragment" ],
        THREE.ShaderChunk[ "color_fragment" ],
        THREE.ShaderChunk[ "specularmap_fragment" ],

      " vec3 totalEmissiveRadiance = emissive;",

        THREE.ShaderChunk["lights_phong_fragment"],

      // Doing lights fragment begin.
      " GeometricContext geometry;",
      " geometry.position = - vViewPosition;",
      " geometry.normal = normal;",
      " geometry.viewDir = normalize( vViewPosition );",

      " IncidentLight directLight;",

      " #if ( NUM_POINT_LIGHTS > 0 ) && defined( RE_Direct )",

      "   PointLight pointLight;",

      "   #pragma unroll_loop",
      "   for ( int i = 0; i < NUM_POINT_LIGHTS; i ++ ) {",
      "     pointLight = pointLights[ i ];",
      "     getPointDirectLightIrradiance( pointLight, geometry, directLight );",

      "     #ifdef USE_SHADOWMAP",
      "     directLight.color *= all( bvec2( pointLight.shadow, directLight.visible ) ) ? getPointShadow( pointShadowMap[ i ], pointLight.shadowMapSize, pointLight.shadowBias, pointLight.shadowRadius, vPointShadowCoord[ i ], pointLight.shadowCameraNear, pointLight.shadowCameraFar ) : 1.0;",
      "     #endif",

      "     RE_Direct( directLight, geometry, material, reflectedLight );",

      "     #if defined( TRANSLUCENT ) && defined( USE_MAP )",
      "     RE_Direct_Scattering(directLight, vUv, geometry, reflectedLight);",
      "     #endif",
      "   }",

      "   #endif",

      " #if ( NUM_DIR_LIGHTS > 0 ) && defined( RE_Direct )",

      "   DirectionalLight directionalLight;",

      "   #pragma unroll_loop",
      "   for ( int i = 0; i < NUM_DIR_LIGHTS; i ++ ) {",
      "     directionalLight = directionalLights[ i ];",
      "     getDirectionalDirectLightIrradiance( directionalLight, geometry, directLight );",

      "     #ifdef USE_SHADOWMAP",
      "     directLight.color *= all( bvec2( directionalLight.shadow, directLight.visible ) ) ? getShadow( directionalShadowMap[ i ], directionalLight.shadowMapSize, directionalLight.shadowBias, directionalLight.shadowRadius, vDirectionalShadowCoord[ i ] ) : 1.0;",
      "     #endif",

      "     RE_Direct( directLight, geometry, material, reflectedLight );",

      "     #if defined( TRANSLUCENT ) && defined( USE_MAP )",
      "     RE_Direct_Scattering(directLight, vUv, geometry, reflectedLight);",
      "     #endif",
      "   }",

      " #endif",

      " #if defined( RE_IndirectDiffuse )",

      "   vec3 irradiance = getAmbientLightIrradiance( ambientLightColor );",

      "   #if ( NUM_HEMI_LIGHTS > 0 )",

      "     #pragma unroll_loop",
      "     for ( int i = 0; i < NUM_HEMI_LIGHTS; i ++ ) {",

      "       irradiance += getHemisphereLightIrradiance( hemisphereLights[ i ], geometry );",

      "     }",

      "   #endif",

      " #endif",

      " #if defined( RE_IndirectSpecular )",

      "   vec3 radiance = vec3( 0.0 );",
      "   vec3 clearCoatRadiance = vec3( 0.0 );",

      " #endif",
        THREE.ShaderChunk["lights_fragment_end"],

      " vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;",
      " gl_FragColor = vec4( outgoingLight, diffuseColor.a );", // TODO, this should be pre-multiplied to allow for bright highlights on very transparent objects

        THREE.ShaderChunk["encodings_fragment"],

      "}"

    ].join( "\n" ),

    this.vertexShader = [ //update this with the latest when releasing as template literals not supported.

      "varying vec3 vNormal;",
      "varying vec2 vUv;",

      "varying vec3 vViewPosition;",

      THREE.ShaderChunk[ "common" ],

      "void main() {",

      " vec4 worldPosition = modelMatrix * vec4( position, 1.0 );",

      " vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );",

      " vViewPosition = -mvPosition.xyz;",

      " vNormal = normalize( normalMatrix * normal );",

      " vUv = uv;",

      " gl_Position = projectionMatrix * mvPosition;",

      "}",

    ].join( "\n" )


    return this;
  }



  function getComputeShaders() {


    var computeShaders = { 
      positionCompute: 
      `
        uniform float time;
        uniform float delta;

        void main() {

          vec2 uv = gl_FragCoord.xy / resolution.xy;
          vec4 tmpPos = texture2D( texturePosition, uv );
          vec3 position = tmpPos.xyz;
          vec3 velocity = texture2D( textureVelocity, uv ).xyz;

          gl_FragColor = vec4( position + velocity * delta * 15. , 1 );

        }

      `,
      velocityCompute:
       `
        uniform float time;
        uniform float delta; // about 0.016
        uniform sampler2D normals;
        uniform float u_noffset;


        // varying vec2 vUv;
        // varying float noise;
        // uniform float u_noffset;

        // https://github.com/stegu/webgl-noise/blob/master/src/classicnoise3D.glsl
        vec3 mod289(vec3 x)
        {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 mod289(vec4 x)
        {
          return x - floor(x * (1.0 / 289.0)) * 289.0;
        }

        vec4 permute(vec4 x)
        {
          return mod289(((x*34.0)+1.0)*x);
        }

        vec4 taylorInvSqrt(vec4 r)
        {
          return 1.79284291400159 - 0.85373472095314 * r;
        }

        vec3 fade(vec3 t) {
          return t*t*t*(t*(t*6.0-15.0)+10.0);
        }
        // Classic Perlin noise, periodic variant
        float pnoise(vec3 P, vec3 rep)
        {
          vec3 Pi0 = mod(floor(P), rep); // Integer part, modulo period
          vec3 Pi1 = mod(Pi0 + vec3(1.0), rep); // Integer part + 1, mod period
          Pi0 = mod289(Pi0);
          Pi1 = mod289(Pi1);
          vec3 Pf0 = fract(P); // Fractional part for interpolation
          vec3 Pf1 = Pf0 - vec3(1.0); // Fractional part - 1.0
          vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
          vec4 iy = vec4(Pi0.yy, Pi1.yy);
          vec4 iz0 = Pi0.zzzz;
          vec4 iz1 = Pi1.zzzz;

          vec4 ixy = permute(permute(ix) + iy);
          vec4 ixy0 = permute(ixy + iz0);
          vec4 ixy1 = permute(ixy + iz1);

          vec4 gx0 = ixy0 * (1.0 / 7.0);
          vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
          gx0 = fract(gx0);
          vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
          vec4 sz0 = step(gz0, vec4(0.0));
          gx0 -= sz0 * (step(0.0, gx0) - 0.5);
          gy0 -= sz0 * (step(0.0, gy0) - 0.5);

          vec4 gx1 = ixy1 * (1.0 / 7.0);
          vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
          gx1 = fract(gx1);
          vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
          vec4 sz1 = step(gz1, vec4(0.0));
          gx1 -= sz1 * (step(0.0, gx1) - 0.5);
          gy1 -= sz1 * (step(0.0, gy1) - 0.5);

          vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
          vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
          vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
          vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
          vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
          vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
          vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
          vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

          vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
          g000 *= norm0.x;
          g010 *= norm0.y;
          g100 *= norm0.z;
          g110 *= norm0.w;
          vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
          g001 *= norm1.x;
          g011 *= norm1.y;
          g101 *= norm1.z;
          g111 *= norm1.w;

          float n000 = dot(g000, Pf0);
          float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
          float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
          float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
          float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
          float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
          float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
          float n111 = dot(g111, Pf1);

          vec3 fade_xyz = fade(Pf0);
          vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
          vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
          float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
          return 2.2 * n_xyz;
        }

        float turbulence( vec3 p ) {

          float w = 100.0;
          float t = -.5;

          for (float f = 1.0 ; f <= 10.0 ; f++ ){
            float power = pow( 2.0, f );
            t += abs( pnoise( vec3( power * p ), vec3( 10.0, 10.0, 10.0 ) ) / power );
          }

          return t;

        }




        void main() {

          vec2 uv = gl_FragCoord.xy / resolution.xy;

          vec3 selfPosition = texture2D( texturePosition, uv ).xyz;
          vec3 selfVelocity = texture2D( textureVelocity, uv ).xyz;


          // u_noffset = 0.0;
          float noise;

          vec3 normal = texture2D( normals, uv ).xyz;
          float mag = texture2D( normals, uv ).w * u_noffset;
          
          // vUv = uv;
          vec3 newPosition = selfPosition;

          // if(u_noffset > 0.0){
            vec3 forceDir = selfPosition - (selfPosition + normal* mag); //last + or - for expansion and contraction

            noise = 5.0 *  -.10 * turbulence( .1 * forceDir + time );
            float b = 0.5 * pnoise( 0.05 * selfPosition + vec3( time ), vec3( 100.0 ) );
            float displacement = - noise + b;

            newPosition = forceDir * displacement;
          // }



          // TODO
          // normal texture
          // check if doing lighting based off OG position or off new modified one


          // vec3 velocity =  vec3(sin(time)*5.0,0,0);

          gl_FragColor = vec4( newPosition, 1.0 );
        }
      `

    }

    return computeShaders;
  }



//For hacking purposes, with template literals
//Support is not super great across all browsers
function getCustomShader(){

  var customPhysical = { 
  uniforms: this.scanUniforms,
  vertexShader:
      `//template literal open

        varying vec3 vNormal;
        varying vec2 vUv;

        varying vec3 vViewPosition;

        //Custom
        attribute vec2 reference; 
        uniform sampler2D texturePosition;
        uniform float time;

        // THREE.ShaderChunk[ "common" ], //Bring this back for string version

        void main() {

          vec4 tmpPos = texture2D( texturePosition, reference ); //the texture plus the texture coordinates
          vec3 pos = tmpPos.xyz;

          vec3 newPosition = mat3( modelMatrix ) * position; 

          //Add position from texture
          newPosition += pos;


          vec4 worldPosition = vec4( newPosition, 1.0 );

          vec4 mvPosition = viewMatrix * vec4( newPosition, 1.0 );


          vViewPosition = -mvPosition.xyz;

          vNormal = normalize( normalMatrix * normal );

          vUv = uv;

          gl_Position = projectionMatrix * mvPosition;

        }

      `, //template literal close
    fragmentShader: 
    `//template literal open
        varying vec4 vColor;
        varying float z;

        uniform vec3 color;

        uniform float time;

        void main() {

          gl_FragColor = vec4( abs(sin(time)), .5, .5, 1. );

        }

    `//template literal close
  };

  return customPhysical;
}

