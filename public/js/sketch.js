var container, stats;
var camera, scene, raycaster, renderer;
var mouse = new THREE.Vector2();
var INTERSECTED;
var radius = 100, theta = 0;
var startTime = 0;
var time;
// var objects = [];
var currentState = "word"; //serving as init state too
var currentObject = "canonObj";
var objs = [];
var mats = [];
var objStates = {
  word:{
    order: 1,
    title:"(fore)word",
    subtitle:"First, we start with words: definitions, meanings, intentions."
  },
  shape:{
    order: 2,
    title:"shape",
    subtitle:"On a two dimensional xy plane, is it a pictograph, symbol or icon?",
    obj:"",
    postprocess:"outline",
    mat:"MeshStandardMaterial",
    matstate:{
      color: 0xffffff,
      metalness: 0,
      roughness: 1.0,
      wireframe: false
    }
  },
  scan:{
    order: 2,
    title:"3D scan",
    subtitle:"What is a 3D scan? Here is the scan from the <a target='blank' href='https://www.myminifactory.com/object/3d-print-gold-weight-in-the-form-of-a-mounted-european-style-cannon-at-the-british-museum-london-20886'>British Museum</a>.",
    obj:"",
    mat:"MeshStandardMaterial",
    matstate:{
            color: 0x9f9f9f,
            metalness: 0.0,
            roughness: 1.0,
            wireframe: false
          }
    },
    points:{
      order: 3,
      title:"vertex",
      subtitle:"A vertex is an xyz coordinate in three dimensional Cartesian space.",
      obj:"",
      mat:"pointsMaterial",
      matstate:{u_noffset:0,u_color:new THREE.Vector3(0.4,0.4,0.4)}
    },
    mesh:{
    order: 4,
    title:"mesh",
    subtitle:"Here the vertices are joined together using triangulation to create a mesh.",
      obj:"",
      mat:"MeshStandardMaterial",
      matstate:{
            color: 0x333333,
            metalness: 0.5,
            roughness: 0.5,
            wireframe: true
          }
        },
    material:{
      order: 5,
      title:"material",
      subtitle:"Gold: shaders and physical matter.",
      obj:"",
      mat:"MeshStandardMaterial",
      matstate:{
          color: 0xc5a50e,
          metalness: 0.5,
          roughness: 0.5,
          wireframe: false
        }
    },
    flow:{
      order: 6,
      title:"dust",
      subtitle:"How to rearrange the points? This will become my laboratory.",
      obj:"",
      mat:"pointsMaterial",
      matstate:{u_noffset:50,u_color:new THREE.Vector3(0.65,0.55,0.1)}
    }
  // shape: {obj:"",mat:null,matstate:""}, //name associated with Three mesh/object
  // scan: {},
  // mesh: {},
  // points: {}
  //etc...
}


//Point Shader uniforms
var uniforms = {
      time: { value: 1.0 },
      u_resolution: { type: "v2", value: new THREE.Vector2() },
      u_mouse: { type: "v2", value: new THREE.Vector2() },
      u_light: { type: "v3", value: new THREE.Vector3() },
      u_noffset: { type: "f", value: 0},
      u_color: { type: "v3", value: new THREE.Vector3() }
    };

init();
animate();

function loadSTL(path,manager){


      var loader = new THREE.STLLoader(manager);
      loader.load( path, function ( geometry ) {

        // //White
        // var base = new THREE.MeshStandardMaterial( {
        //     color: 0xffffff,
        //     metalness: 0,
        //     roughness: 1.0
        //   } );

        // base.name = "MeshStandardMaterial";
        // mats.push(base);

        //Gold 
        var gold = new THREE.MeshStandardMaterial( {
            color: 0xa78d00,
            metalness: 0.5,
            roughness: 0.5
          } );

        gold.name = "MeshStandardMaterial";
        // mats.push(gold);

        var mesh = new THREE.Mesh( geometry, gold );
        mesh.position.set( -10, - 5, 0 );
        mesh.rotation.set( -Math.PI/2, 0, 0 );
        mesh.scale.set( 1, 1, 1);
        mesh.castShadow = true;
        mesh.receiveShadow = true;


        mesh.name = currentObject;
        objs.push(mesh);

        objStates.shape.obj = mesh.name;
        objStates.scan.obj = mesh.name;
        objStates.mesh.obj = mesh.name;
        objStates.material.obj = mesh.name;


        // scene.add( mesh );

        var pointGeom = new THREE.BufferGeometry();
        var numPoints = mesh.geometry.getAttribute("position").count;
        var positions = [];

        for(var i = 0; i < numPoints; i++){

          var x = mesh.geometry.getAttribute("position").getX(i);
          var y = mesh.geometry.getAttribute("position").getY(i);
          var z = mesh.geometry.getAttribute("position").getZ(i);

          positions.push(x,y,z);

        }

        pointGeom.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
        pointGeom.computeBoundingSphere();


        // var pointsMaterial = new THREE.PointsMaterial( { size: 1, color: 0xc5a50e} );

        var pointsMaterial = new THREE.ShaderMaterial( {
          uniforms: uniforms,
          vertexShader: document.getElementById( 'vertexShader' ).textContent,
          fragmentShader: document.getElementById( 'fragmentShader' ).textContent
        } );
        
        pointsMaterial.name = "pointsMaterial";
        // mats.push(pointsMaterial);

        var points = new THREE.Points( pointGeom, pointsMaterial );
        points.position.set( -10, - 5, 0 );
        points.rotation.set( -Math.PI/2, 0, 0 );

        points.name = currentObject+"Points";
        objs.push(points);
        
        objStates.points.obj = points.name;
        objStates.flow.obj = points.name;

      } );

}

function addObject(name,matname,matstate){
  var obj;
  for(var i = 0; i < objs.length; i++){
    if(objs[i].name == name){
      obj = objs[i]
      break;
    }
  }
  
  if(matname == obj.material.name){
    console.log(obj.material);
    switch(obj.material.name){
      case "MeshStandardMaterial" :
          if("color" in matstate) obj.material.color.setHex(matstate.color);
          if("metalness" in matstate) obj.material.metalness = matstate.metalness;
          if("roughness" in matstate) obj.material.roughness = matstate.roughness;
          if("wireframe" in matstate) obj.material.wireframe = matstate.wireframe;
        break;
      case "pointsMaterial" :
          if("u_noffset" in matstate){
            if(matstate["u_noffset"] == 0){
              uniforms["u_noffset"].value = 0;
            } 
          }
          if("u_color" in matstate){
            console.log(matstate["u_color"]);
            uniforms["u_color"].value = matstate["u_color"];
          } 
        break;
      default:
        console.log("New Material not configured!");
    }
  }else{
    console.log("Wrong material associated with object!");
  }


  scene.add(obj);
}

function removeObject(name) {
    var selectedObject = scene.getObjectByName(name);
    scene.remove( selectedObject );
}

function changeThreeState(state){

  //for any animation potentially
  // startTime = time;

  if(currentState in objStates){
    removeObject(objStates[currentState].obj);
  }
  
  if(state in objStates){
    addObject(objStates[state].obj,objStates[state].mat,objStates[state].matstate);
  }
  //Grab the associated state material

  //Play the camera animation if there is one
  //Either using tweens??
  //OR
  //depending on state moving camera?

  //Play the animation if there is one
  //could be loop states ...
  //using sin etc
  //or variable you change
  //maybe better to keep out of tweens. 

  currentState = state;
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
  var light1 = new THREE.DirectionalLight( 0xffffff, .5 );
  light1.position.set( -1, -1, -1 ).normalize();
  scene.add( light1 );

  var light2 = new THREE.AmbientLight( 0xffffff, .2 );
  scene.add( light2 );

  uniforms.u_resolution.value.x = 1;
  uniforms.u_resolution.value.y = 1;



  //Look into this! then can run point system after load
  //And make a loading animation
  var manager = new THREE.LoadingManager();
  manager.onStart = function ( item, itemsLoaded, itemsTotal ) {
    console.log( item, itemsLoaded, itemsTotal );
  };

  //Only useful for when I start loading more objects, extend then
  manager.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );

    document.querySelectorAll("nav a").forEach(function(element){
      element.classList.remove("lds-dual-ring");
      element.classList.remove("inactive");
    });

  };

  //CANON
  loadSTL('models/canonDecimated03.stl',manager);



  
  //For mouse interaction detection
  //Adapt this for point interaction not object
  raycaster = new THREE.Raycaster();
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild(renderer.domElement);

  //Debug
  // stats = new Stats();
  // container.appendChild( stats.dom );


  document.addEventListener( 'mousemove', onDocumentMouseMove, false );
  document.addEventListener( 'click', onClicked, false);
  window.addEventListener( 'resize', onWindowResize, false );
}

function animate(timestamp) {

  requestAnimationFrame( animate );
  time = timestamp;
  uniforms.time.value = (time - startTime) / 19000;
  render();
  // stats.update();

}

function render() {
  theta += 0.1;
  camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
  // camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
  camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );

  camera.lookAt( scene.position );
  camera.updateMatrixWorld();


  if(currentState == "flow"){
    uniforms["u_noffset"].value = Math.abs(Math.sin(uniforms.time.value))*10;
    // console.log(uniforms["u_noffset"].value );
  }


  // find intersections
  // raycaster.setFromCamera( mouse, camera );
  // var intersects = raycaster.intersectObjects( scene.children );
  // if ( intersects.length > 0 ) {
  //   if ( INTERSECTED != intersects[ 0 ].object && intersects[ 0 ].object.name != "ground") {
  //     // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
  //     if ( INTERSECTED ) INTERSECTED.material.wireframe = false;

  //     INTERSECTED = intersects[ 0 ].object;
  //     // INTERSECTED.currentHex = INTERSECTED.material.emissive.getHex();

  //     INTERSECTED.material.wireframe = true;
  //     // INTERSECTED.material.emissive.setHex( 0xff0000 );
  //   }
  // } else {
  //   // if ( INTERSECTED ) INTERSECTED.material.emissive.setHex( INTERSECTED.currentHex );
  //   if ( INTERSECTED ) INTERSECTED.material.wireframe = false;
  //   INTERSECTED = null;
  // }



  //Render
  renderer.render( scene, camera );
}



//Three.js canvas events
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
    // scene.add( points );
  }
}

//HTML handling

function injectContent(state){
  //grab the data loaded in from JSON originally that's associated with obj + state
  //inject into:

  //a) state-info div
  if("title" in objStates[state] && "order" in objStates[state]){
    document.querySelectorAll("#state-information h3")[0].innerHTML = objStates[state].order+". "+objStates[state].title;
  }

  if("subtitle" in objStates[state]){
    document.querySelectorAll("#state-information p")[0].innerHTML = objStates[state].subtitle;
  }

  //b) "behind the scenes" nav drawer

  console.log(state + " information injected");
}


//Nav Events

document.querySelectorAll("nav a").forEach(function(element){
  element.addEventListener("click",changeState,false);
});


function changeState(event){
  //Global variable
  console.log(event);
  if(!event.target.classList.contains("active")){
    document.querySelectorAll("nav a").forEach(function(element){
      element.classList.remove("active");
    });
    var state = event.target.getAttribute("state");

    //inject content into HTML
    injectContent(state); 

    //update CSS
    document.body.setAttribute("state",state);
    event.target.classList.add("active");

    //update three canvas materials and animations
    if(state != "word"){
      changeThreeState(state);
    }
  }


}


// Nav Drawer Events
  
  // var navButton = document.getElementById("nav-button");
  // var navElement = document.getElementById("drawer");


  // navButton.addEventListener("click",navClicked,false);



  // navElement.addEventListener("animationstart", listener, false);
  // navElement.addEventListener("animationend", listener, false);
  // navElement.addEventListener("animationiteration", listener, false);


  // function navClicked(event) {
  //   navElement.style["animation-play-state"] = "running";
    
  //   if(!navElement.classList.contains("slide-in")){
  //     navElement.classList.add("slide-in");
  //   }

  //   if(!navElement.classList.contains("open")){
  //     navElement.classList.add("open");
  //     //resize the three.js canvas
  //     widthDivider = 2.0;
  //     heightDivider = 0.5;
  //     window.dispatchEvent(new Event('resize'));
  //   }else{
  //     navElement.classList.remove("open");
  //     //resize the three.js canvas
  //     heightDivider = 1.0;
  //     widthDivider = 1.0; 
  //     window.dispatchEvent(new Event('resize'));
  //   }
  // }


  // function listener(event) {
  //   var l = document.createElement("li");
  //   switch(event.type) {
  //     case "animationstart":
        
  //       break;
  //     case "animationend":
          
  //       break;
  //     case "animationiteration":
  //         navElement.style["animation-play-state"] = "paused";
  //       break;
  //   }
    
  // }




