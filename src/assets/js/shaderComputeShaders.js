
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
          // float magnitude = texture2D( textureVelocity, uv ).w;


          // u_noffset = 0.0;
          float noise;

          vec3 normal = texture2D( normals, uv ).xyz;
          float mag = texture2D( normals, uv ).w * u_noffset;
          
          // vUv = uv;
          vec3 newPosition = vec3(0,0,0);

          if(u_noffset > 0.0 && selfPosition.x > 0.0){
            newPosition = selfPosition;

            vec3 forceDir = selfPosition - (selfPosition + normal * mag); //last + or - for expansion and contraction

            noise = 5.0 *  -.10 * turbulence( .1 * forceDir + time );
            float b = 0.5 * pnoise( 0.05 * selfPosition + vec3( time ), vec3( 100.0 ) );
            float displacement = - noise + b;

            newPosition = forceDir * displacement;
          }



          // TODO
          // normal texture
          // check if doing lighting based off OG position or off new modified one


          // vec3 velocity =  vec3(sin(time)*5.0,0,0);

          gl_FragColor = vec4( newPosition, 1.0 );//magnitude
        }
      `,
      encodeFloat:   
      `
            //Maybe have num for R / G / B
            uniform float rgb;
            uniform sampler2D texture;
            // Integer to float conversion from https://stackoverflow.com/questions/17981163/webgl-read-pixels-from-floating-point-render-target
            float shift_right( float v, float amt ) {
              v = floor( v ) + 0.5;
              return floor( v / exp2( amt ) );
            }
            float shift_left( float v, float amt ) {
              return floor( v * exp2( amt ) + 0.5 );
            }
            float mask_last( float v, float bits ) {
              return mod( v, shift_left( 1.0, bits ) );
            }
            float extract_bits( float num, float from, float to ) {
              from = floor( from + 0.5 ); to = floor( to + 0.5 );
              return mask_last( shift_right( num, from ), to - from );
            }
            vec4 encode_float( float val ) {
              if ( val == 0.0 ) return vec4( 0, 0, 0, 0 );
              float sign = val > 0.0 ? 0.0 : 1.0;
              val = abs( val );
              float exponent = floor( log2( val ) );
              float biased_exponent = exponent + 127.0;
              float fraction = ( ( val / exp2( exponent ) ) - 1.0 ) * 8388608.0;
              float t = biased_exponent / 2.0;
              float last_bit_of_biased_exponent = fract( t ) * 2.0;
              float remaining_bits_of_biased_exponent = floor( t );
              float byte4 = extract_bits( fraction, 0.0, 8.0 ) / 255.0;
              float byte3 = extract_bits( fraction, 8.0, 16.0 ) / 255.0;
              float byte2 = ( last_bit_of_biased_exponent * 128.0 + extract_bits( fraction, 16.0, 23.0 ) ) / 255.0;
              float byte1 = ( sign * 128.0 + remaining_bits_of_biased_exponent ) / 255.0;
              return vec4( byte4, byte3, byte2, byte1 );
            }
            void main() {
                vec2 uv = gl_FragCoord.xy / resolution.xy;

                float floatVal;

                if(rgb == 1.0){
                  floatVal = texture2D( texture, uv ).x;
                }else if(rgb == 2.0) {
                  floatVal = texture2D( texture, uv ).y;
                }else{
                  floatVal = texture2D( texture, uv ).z;
                }


                gl_FragColor = encode_float( floatVal );

            }


      `

    }

    return computeShaders;
  }


