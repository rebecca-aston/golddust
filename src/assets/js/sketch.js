var container, stats;
var camera, scene, raycaster, renderer, CanonPoints;
var mouse = new THREE.Vector2();
var INTERSECTED;
var radius = 100, theta = 0;
var startTime = 0;
var time;

var uniforms = {
      time: { value: 1.0 },
      u_resolution: { type: "v2", value: new THREE.Vector2() },
      u_mouse: { type: "v2", value: new THREE.Vector2() },
      u_light: { type: "v3", value: new THREE.Vector3() }
    };

init();
animate();

function loadSTL(path){


      var loader = new THREE.STLLoader();
      loader.load( path, function ( geometry ) {

        //Gold Canon
        var material = new THREE.MeshStandardMaterial( {
            color: 0xc5a50e,
            metalness: 0.5,
            roughness: 0.5
          } );

        var mesh = new THREE.Mesh( geometry, material );
        mesh.position.set( -10, - 5, 0 );
        mesh.rotation.set( -Math.PI/2, 0, 0 );
        mesh.scale.set( 1, 1, 1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.name = "canonObj";


        scene.add( mesh );

        var CanonPointGeom = new THREE.BufferGeometry();
        var numPoints = mesh.geometry.getAttribute("position").count;
        var positions = [];

        for(var i = 0; i < numPoints; i++){

          var x = mesh.geometry.getAttribute("position").getX(i);
          var y = mesh.geometry.getAttribute("position").getY(i);
          var z = mesh.geometry.getAttribute("position").getZ(i);

          positions.push(x,y,z);

        }

        CanonPointGeom.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        CanonPointGeom.computeBoundingSphere();


        var pointsMaterial = new THREE.PointsMaterial( { size: 1, color: 0xc5a50e} );

        var shaderMaterial = new THREE.ShaderMaterial( {
          uniforms: uniforms,
          vertexShader: document.getElementById( 'vertexShader' ).textContent,
          fragmentShader: document.getElementById( 'fragmentShader' ).textContent
        } );
        
        
        CanonPoints = new THREE.Points( CanonPointGeom, shaderMaterial );
        CanonPoints.position.set( -10, - 5, 0 );
        CanonPoints.rotation.set( -Math.PI/2, 0, 0 );
        

      } );

}

function init() {
  container = document.getElementById("sketch");
  document.body.appendChild( container );



  //Scene Setup
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  scene = new THREE.Scene();
  scene.background = new THREE.Color( 0x01044B );
  scene.background = new THREE.Color( 0xffffff );
  // scene.fog = new THREE.FogExp2( 0xffffff, 0.007 );
  var light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );
  var light = new THREE.HemisphereLight( 0xffffbb, 0x080820, 1 );
  scene.add( light );

  uniforms.u_resolution.value.x = 1;
  uniforms.u_resolution.value.y = 1;


  //Look into this! then can run point system after load
  //And make a loading animation
  // var manager = new THREE.LoadingManager();
  //       manager.onProgress = function ( item, loaded, total ) {
  //         console.log( item, loaded, total );
  //       };
  

  //CANON
  loadSTL('models/canonDecimated03.stl');

  
  //For mouse interaction detection
  raycaster = new THREE.Raycaster();
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild(renderer.domElement);

  //Debug
  stats = new Stats();
  container.appendChild( stats.dom );


  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'click', onClicked, false);
  window.addEventListener( 'resize', onWindowResize, false );
}

function animate(timestamp) {

  requestAnimationFrame( animate );
  time = timestamp;
  uniforms.time.value = (time - startTime) / 100000;
  render();
  stats.update();

}

function render() {
  theta += 0.1;
  camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
  // camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );

  camera.lookAt( scene.position );
  camera.updateMatrixWorld();

  // find intersections
  raycaster.setFromCamera( mouse, camera );
  var intersects = raycaster.intersectObjects( scene.children );
  if ( intersects.length > 0 ) {
    if ( INTERSECTED != intersects[ 0 ].object && intersects[ 0 ].object.name != "ground") {
      // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
      if ( INTERSECTED ) INTERSECTED.material.wireframe = false;

      INTERSECTED = intersects[ 0 ].object;
      // INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();

      INTERSECTED.material.wireframe = true;
      // INTERSECTED.material.emissive.setHex( 0xff0000 );
    }
  } else {
    // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
    if ( INTERSECTED ) INTERSECTED.material.wireframe = false;
    INTERSECTED = null;
  }

  //Render
  renderer.render( scene, camera );
}

function removeObject(name) {
    var selectedObject = scene.getObjectByName(name);
    scene.remove( selectedObject );
}

//Events
function onWindowResize() {
  camera.aspect = window.innerWidth*widthDivider / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight*heightDivider);
}

function onDocumentMouseMove( event ) {
  event.preventDefault();
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
  mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
  uniforms.u_mouse.value.x = mouse.x;
  uniforms.u_mouse.value.y = mouse.y;
}

function onClicked(event){
  if(INTERSECTED) {
    //Open popup with information
    //TODO expand this out so that you can fire different functions
    scene.add( CanonPoints );
    removeObject("canonObj");
    startTime = time;
  }
}




