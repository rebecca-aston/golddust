var cannon;
var container, stats;
var camera, scene, raycaster, renderer,ambientLight, light, light1;
var mouse = new THREE.Vector2();
var INTERSECTED;
var radius = 100, theta = 0;
var startTime = 0;
var drawCount = 1;
var dataArray = [];
var dataLength = 10;
var dataCount = 0;
var time;
//Point Shader uniforms
var uniforms, pShader;
// var objects = [];
var renderState = {state:"default"};
var currentState = "word"; //serving as init state too
var currentObject = "canonObj";
var animateCamera = false;
var fullPageApp = true;
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
    title:"symbol",
    subtitle:"On a two dimensional xy plane, we see a shape, a pictograph, an icon, a symbol?",
    obj:"",
    mat:"MeshStandardMaterial",
    matstate:{
      color: 0xd0d0d0,
      metalness: 0,
      roughness: 1.0,
      wireframe: false
    }
  },
  scan:{
    order: 3,
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
      order: 4,
      title:"vertex",
      subtitle:"A vertex is an xyz coordinate in three dimensional Cartesian space.",
      obj:"",
      mat:"pointsMaterial",
      matstate:{u_noffset:0,u_color:new THREE.Vector3(0.4,0.4,0.4)}
    },
    mesh:{
    order: 5,
    title:"mesh",
    subtitle:"Here the vertices are joined together using triangulation to create a mesh.",
      obj:"",
      mat:"MeshStandardMaterial",
      matstate:{
            color: 0x9f9f9f,
            metalness: 0.0,
            roughness: 0.5,
            wireframe: true
          }
        },
    material:{
      order: 6,
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
      order: 7,
      // title:"dust",
      // subtitle:"", //"The scan has been loaded into a 2D texture, each pixel color (a texel) is the positition data of a vertex. Next I will enter data to morph the mesh using shaders.",
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



init();
animate();

function loadSTL(path,manager){


  var loader = new THREE.STLLoader(manager);
  loader.load( path, function ( geometry ) {


    //Gold 
    var gold = new THREE.MeshStandardMaterial( {
        color: 0xa78d00,
        metalness: 0.5,
        roughness: 0.5
      } );

    gold.name = "MeshStandardMaterial";
    // mats.push(gold);

    var mesh = new THREE.Mesh( geometry, gold );
    // mesh.position.set( -10, - 5, 0 );
    // mesh.rotation.set( -Math.PI/2, 0, 0 );
    mesh.scale.set( 1, 1, 1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    // mesh.geometry.setDrawRange(0,drawCount);

    mesh.name = currentObject;
    objs.push(mesh);

    objStates.shape.obj = mesh.name;
    objStates.scan.obj = mesh.name;
    objStates.mesh.obj = mesh.name;
    objStates.material.obj = mesh.name;


    var pointsMaterial = new THREE.ShaderMaterial( {
      uniforms: uniforms,
      vertexShader: pShader.vertexShader,
      fragmentShader: pShader.fragmentShader
    } );
    
    pointsMaterial.name = "pointsMaterial";
    // mats.push(pointsMaterial);

    var points = new THREE.Points( geometry, pointsMaterial );
    // points.position.set( -10, - 5, 0 );
    // points.rotation.set( -Math.PI/2, 0, 0 );

    points.name = currentObject+"Points";
    objs.push(points);
    
    objStates.points.obj = points.name;
    objStates.flow.obj = points.name;

    // Handle this better
    cannon = new ScanDistort("cannon");
    cannon.init(container,geometry);

    //push the tags object later
    if(dataCount == dataLength && !cannon.dataAdded()) cannon.addData(dataArray);

  } );

}

function loadData(path, manager){

  var loader = new THREE.FileLoader(manager);
  loader.load( path, function ( data ) {
    console.log("Loading: " + path);

    var json = JSON.parse(data);
    dataArray.push(json);

    dataCount ++;

    if(dataCount < dataLength){
      var newPath = path.replace(dataCount,dataCount+1);
      loadData(newPath,manager);
    }else if ( dataCount == dataLength){

      if(typeof cannon != "undefined"){
        if(!cannon.dataAdded()) cannon.addData(dataArray); 
      }

    }

  });

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
    // console.log(obj.material);
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
            // console.log(matstate["u_color"]);
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

  if(state == "flow"){

      if(typeof cannon != "undefined"){
        container.innerHTML = "";
        cannon.appendCanvas(camera.position.x,camera.position.y,camera.position.z);

        renderState.state = "flow";
      }


  }else{

    if(typeof cannon != "undefined"){
        cannon.removeCanvas();
    }

    container.appendChild(renderer.domElement);

    if(renderState.state != "default"){
      renderState.state = "default";
      animate();
    }

    
    if(state in objStates){
      addObject(objStates[state].obj,objStates[state].mat,objStates[state].matstate);
    }

    if(state == "shape"){
      // scene.children[3].position.x = 10;
      camera.position.x = 20;
      camera.position.z = 110;
      animateCamera = false;
      ambientLight.intensity = 1.0;
      light.intensity = 0;
      light1.intensity = 0;
      fullPageApp = false;

      camera.aspect = window.innerWidth / 400;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, 400);
    }else{
      scene.children[3].position.x = -10;
      animateCamera = true;
      ambientLight.intensity = 0.2;
      light.intensity = 1.0;
      light1.intensity = 1.0;
      fullPageApp = true;
      // widthDivider = 1.0;
      // heightDivider = 1.0;
      camera.aspect = window.innerWidth*widthDivider / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize( window.innerWidth, window.innerHeight*heightDivider);
    }
  }


  currentState = state;
}

function init() {

 

  container = document.getElementById("sketch");
  document.body.appendChild( container );



  //Scene Setup
  camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
  camera.position.x = 9.7;
  camera.position.z = 99.5;
  scene = new THREE.Scene();
  // scene.background = new THREE.Color( 0x01044B );
  scene.background = new THREE.Color( 0xf7f7f7 );
  // scene.fog = new THREE.FogExp2( 0xffffff, 0.007 );
  light = new THREE.DirectionalLight( 0xffffff, 1 );
  light.position.set( 1, 1, 1 ).normalize();
  scene.add( light );
  light1 = new THREE.DirectionalLight( 0xffffff, .5 );
  light1.position.set( -1, -1, -1 ).normalize();
  scene.add( light1 );

  ambientLight = new THREE.AmbientLight( 0xffffff, .2 );
  scene.add( ambientLight );


  //Look into this! then can run point system after load
  //And make a loading animation
  var manager = new THREE.LoadingManager();
  manager.onStart = function ( item, itemsLoaded, itemsTotal ) {
    console.log( item, itemsLoaded, itemsTotal );
  };

  //Only useful for when I start loading more objects, extend then
  manager.onProgress = function ( item, loaded, total ) {
    console.log( item, loaded, total );

    //Just for the first cannon object loaded in
    if(item.match("Cannon") && document.getElementsByClassName("lds-dual-ring").length > 0){
      document.querySelectorAll("nav a").forEach(function(element){
        element.classList.remove("lds-dual-ring");
        element.classList.remove("inactive");
      });
    }

  };


  pShader = getBasicPointShader();
  uniforms = pShader.uniforms;
  uniforms.u_resolution.value.x = 1;
  uniforms.u_resolution.value.y = 1;


  //CANON
  loadSTL('models/golddust-Cannon-OriginalScan-RA-Sink.stl',manager);

  loadData('js/json/data1.json',manager);


  
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

  // document.addEventListener( 'click', onClicked, false);
  window.addEventListener( 'resize', onWindowResize, false );
}

function animate(timestamp) {

  

  if(renderState.state == "default"){


    requestAnimationFrame( animate );
    time = timestamp;
    uniforms.time.value = (time - startTime) / 19000;
    render();

   }

  // stats.update();

}

function render() {

    if(animateCamera){
      theta += 0.1;
      camera.position.x = radius * Math.sin( THREE.Math.degToRad( theta ) );
      // camera.position.y = radius * Math.sin( THREE.Math.degToRad( theta ) );
      camera.position.z = radius * Math.cos( THREE.Math.degToRad( theta ) );
    }

    // if(typeof scene.children[3] !== 'undefined' && drawCount < scene.children[3].geometry.getAttribute("position").array.length){
    //   drawCount += 1;
    //   scene.children[3].geometry.setDrawRange(0,drawCount);
    // }

    camera.lookAt( scene.position );
    camera.updateMatrixWorld();


    if(currentState == "flow"){
      uniforms["u_noffset"].value = Math.abs(Math.sin(uniforms.time.value))*10;
      // console.log(uniforms["u_noffset"].value );
    }

    //Render
    renderer.render( scene, camera );
}



//Three.js canvas events
function onWindowResize() {
  if(fullPageApp){
    camera.aspect = window.innerWidth*widthDivider / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight*heightDivider);
  }else{
    camera.aspect = window.innerWidth / 400;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, 400);
  }
}

//HTML handling

function injectContent(state){
  //grab the data loaded in from JSON originally that's associated with obj + state
  //inject into:
  document.querySelectorAll("#state-information h3")[0].innerHTML = "";
  document.querySelectorAll("#state-information p")[0].innerHTML = "";

  //a) state-info div
  if("title" in objStates[state] && "order" in objStates[state]){
    document.querySelectorAll("#state-information h3")[0].innerHTML = objStates[state].order+". "+objStates[state].title;
  }

  if("subtitle" in objStates[state]){
    document.querySelectorAll("#state-information p")[0].innerHTML = objStates[state].subtitle;
  }

  //b) "behind the scenes" nav drawer

  // console.log(state + " information injected");
}


//Nav Events

document.querySelectorAll("nav a").forEach(function(element){
  element.addEventListener("click",changeState,false);
});


function changeState(event){
  //Global variable
  // console.log(event);
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
