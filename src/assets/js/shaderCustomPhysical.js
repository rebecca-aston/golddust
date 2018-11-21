
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

          vec3 newPosition = mat3( modelMatrix ) * pos; 

          //Add position from texture
          // newPosition += pos;


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

