function getComputePointShader(){

  var shader = { 
    uniforms: {
        time: { value: 1.0 },
        u_resolution: { type: "v2", value: new THREE.Vector2() },
        u_mouse: { type: "v2", value: new THREE.Vector2() },
        u_light: { type: "v3", value: new THREE.Vector3() },
        u_color: { type: "v3", value: new THREE.Vector3() },
        texturePosition: { value: null },
        textureVelocity: { value: null },
        normals: {value: null},
        delta: { value: 0.0 }
      }, // remove this
    vertexShader:
        `//template literal open


        varying vec3 vNormal;
        varying vec2 vUv;

        varying vec3 vViewPosition;

        //Custom
        attribute vec2 reference; 
        // attribute float magnitude;
        uniform sampler2D texturePosition;
        uniform float time;

        uniform sampler2D normals;

        // THREE.ShaderChunk[ "common" ], //Bring this back for string version

        void main() {

          vec4 tmpPos = texture2D( texturePosition, reference ); //the texture plus the texture coordinates
          vec3 pos = tmpPos.xyz;
          // vec3 n = texture2D( normals, uv ).xyz;
          float mag = texture2D( normals, reference ).w;

          vec3 newPosition = mat3( modelMatrix ) * pos + normal*2.0; 

          //Add position from texture
          // newPosition += pos;

          vec4 worldPosition = vec4( newPosition, 1.0 );

          vec4 mvPosition = viewMatrix * vec4( newPosition, 1.0 );


          vViewPosition = -mvPosition.xyz;

          vNormal = normalize( normalMatrix * normal );

          vUv = uv;

          gl_PointSize = abs(mag) * 2.0 + ( 3.0 * 100.0) / -mvPosition.z ; //* ( 150.0 / -mvPosition.z );
          gl_Position = projectionMatrix * mvPosition;

        }



          // varying vec2 vUv;
          // varying float noise;
          // uniform float time;

          // void main() {

          //   vUv = uv;
          //   vec3 newPosition = position;

          //   vec4 mvPosition = modelViewMatrix * vec4( newPosition, 1.0 );
          //   gl_PointSize = 3.0 * ( 150.0 / -mvPosition.z );
          //   gl_Position = projectionMatrix * mvPosition;

          // }

        `, //template literal close
      fragmentShader: 
      `//template literal open

          varying vec2 vUv;
          uniform float time;
          uniform vec2 u_resolution;
          uniform float u_noffset;
          uniform vec3 u_color;


          //Circel using the dot product
          float circle(in vec2 _st, in vec2 cp, in float _radius){
              vec2 dist = _st-cp;
            return 1.-smoothstep(_radius-(_radius*0.01),
            _radius+(_radius*0.01),
            dot(dist,dist)*4.0);
          }

          void main() {
            vec2 st = gl_PointCoord.xy/u_resolution.xy;

            vec4 color = vec4(0.0);

            vec2 cp = vec2(0.5,0.5);

            // color = vec4(0.65,.55,.1,circle(st,cp,0.5));
            // vec3 test = vec3(1.0,1.0,1.0);
            color = vec4(u_color,circle(st,cp,0.5)*0.5);

            if ( color.a < 0.2 ) discard;

            gl_FragColor = vec4(color);

          }
      
      `//template literal close
    };

  return shader;
}

