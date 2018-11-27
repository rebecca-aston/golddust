function ScanDistort(name){
	var WIDTH = 512;

	var initialized = false;
	var activeRender = false;

	var last = performance.now();
    var start = performance.now();

  	var gpuCompute;
  	var velocityVariable;
  	var positionVariable;
  	var normalVariable;
  	var positionUniforms;
  	var velocityUniforms;
  	var dtNormal;

  	var scanUniforms,pUniforms;
  	var scanMesh, points;
  	var navElement, navButton,baseHUD;
  	var tags;
  	var buttons = [
  		{text:"expand",action:"expand"},
  		{text:"contract",action:"contract"}
  	];

	var camera,scene,renderer, mouse;
	var cameraOrtho,sceneInset,plane;

	var dir = 1;

	function initComputeRenderer() {


		gpuCompute = new GPUComputationRenderer( WIDTH, WIDTH, renderer );
		var computeShaders = getComputeShaders();

		var dtPosition = gpuCompute.createTexture();
		var dtVelocity = gpuCompute.createTexture();
		dtNormal = gpuCompute.createTexture();
		fillPositionTexture( dtPosition );
		fillVelocityTexture( dtVelocity );
		fillNormalTexture( dtNormal );

		velocityVariable = gpuCompute.addVariable( "textureVelocity", computeShaders.velocityCompute, dtVelocity );
		positionVariable = gpuCompute.addVariable( "texturePosition", computeShaders.positionCompute, dtPosition );
		// normalVariable = gpuCompute.addVariable( "textureNormal", document.getElementById( 'fragmentShaderPosition' ).textContent, dtPosition );

		gpuCompute.setVariableDependencies( velocityVariable, [ positionVariable, velocityVariable ] );
		gpuCompute.setVariableDependencies( positionVariable, [ positionVariable, velocityVariable ] );

		positionUniforms = positionVariable.material.uniforms;
		velocityUniforms = velocityVariable.material.uniforms;

		positionUniforms.time = { value: 0.0 };
		positionUniforms.delta = { value: 0.0 };
		velocityUniforms.time = { value: 1.0 };
		velocityUniforms.delta = { value: 0.0 };
		velocityUniforms.u_noffset = { value: 0.0 };

		velocityUniforms.normals = {value: dtNormal};

		pUniforms.normals = {value: dtNormal};

		velocityVariable.wrapS = THREE.RepeatWrapping;
		velocityVariable.wrapT = THREE.RepeatWrapping;
		positionVariable.wrapS = THREE.RepeatWrapping;
		positionVariable.wrapT = THREE.RepeatWrapping;


		var error = gpuCompute.init();
		if ( error !== null ) {
		    console.error( error );
		}

	}


	function fillPositionTexture( texture ) {

		var theArray = texture.image.data;
		var posAttribute = scanMesh.geometry.getAttribute("position");

		var i = 0;//count for different item size of source array i.e. vec3 
		for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) { 


		  if(i < posAttribute.array.length){ 
		    theArray[ k  ] = posAttribute.array[i];
		    theArray[ k + 1 ] = posAttribute.array[i+1];
		    theArray[ k + 2 ] = posAttribute.array[i+2];
		    theArray[ k + 3 ] = 1;

		    i+=3;

		  }else{
		    theArray[ k  ] = 1;
		    theArray[ k + 1 ] = 1;
		    theArray[ k + 2 ] = 1;
		    theArray[ k + 3 ] = 0;
		  }

		}

	}

	function fillNormalTexture( texture ) {

		var theArray = texture.image.data;
		var posAttribute = scanMesh.geometry.getAttribute("normal");
		var magAttribute = scanMesh.geometry.getAttribute("magnitude");

		var i = 0;//count for different item size of source array i.e. vec3 
		for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) { 


		  if(i < posAttribute.array.length){ 
		    theArray[ k  ] = posAttribute.array[i];
		    theArray[ k + 1 ] = posAttribute.array[i+1];
		    theArray[ k + 2 ] = posAttribute.array[i+2];
		    theArray[ k + 3 ] = magAttribute.array[i/3];

		    // if(i < posAttribute.array.length/2){
		    //   theArray[ k + 3 ] = .1;
		    // }else{
		    //   theArray[ k + 3 ] = .1;
		    // }
		      

		    i+=3;

		  }else{
		    theArray[ k  ] = 1;
		    theArray[ k + 1 ] = 1;
		    theArray[ k + 2 ] = 1;
		    theArray[ k + 3 ] = 0;
		  }

		}
	}

	function newNormalTexture( texture, val) { //maybe bering back index

		var theArray = texture.image.data;
		var posAttribute = scanMesh.geometry.getAttribute("normal");
		var magAttribute = scanMesh.geometry.getAttribute("magnitude");

		var i = 0;//count for different item size of source array i.e. vec3 
		for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) { 


		  if(i < posAttribute.array.length){ 
		    theArray[ k  ] = posAttribute.array[i];
		    theArray[ k + 1 ] = posAttribute.array[i+1];
		    theArray[ k + 2 ] = posAttribute.array[i+2];

		    // if(k > index-10000 && k < index+10000){
		    // 	console.log(k);
		    // 	theArray[ k + 3 ] = 10;
		    // }else{
		    	theArray[ k + 3 ] = val;
		    // }
		    

		    // if(i < posAttribute.array.length/2){
		    //   theArray[ k + 3 ] = val;
		    // }else{
		    //   theArray[ k + 3 ] = .1;
		    // }
		      

		    i+=3;

		  }else{
		    theArray[ k  ] = 1;
		    theArray[ k + 1 ] = 1;
		    theArray[ k + 2 ] = 1;
		    theArray[ k + 3 ] = 1;
		  }

		}
	}

	function fillVelocityTexture( texture ) {

		var theArray = texture.image.data;

		for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {

		  var x = Math.random() - 0.5;
		  var y = Math.random() - 0.5;
		  var z = Math.random() - 0.5;

		  // theArray[ k + 0 ] = x ;
		  // theArray[ k + 1 ] = y ;
		  // theArray[ k + 2 ] = z ;
		  // theArray[ k + 3 ] = 1;

		  theArray[ k + 0 ] = 0 ;
		  theArray[ k + 1 ] = 0 ;
		  theArray[ k + 2 ] = 0 ;
		  theArray[ k + 3 ] = 0 ;

		}

	}

  	function initMesh(baseGeometry) {
  		
		var geometry = new THREE.BufferGeometry();


		//var points = new etc 

			
		var references = new THREE.BufferAttribute( new Float32Array( baseGeometry.getAttribute('position').count * 2 ), 2 ); // x and y coordinates of the texel associated to a particular vertex.
		var magnitudes = new THREE.BufferAttribute( new Float32Array( baseGeometry.getAttribute('position').count ), 1 );

		geometry.addAttribute( 'position', baseGeometry.getAttribute('position') );
		geometry.addAttribute( 'reference', references );
		geometry.addAttribute( 'normal', baseGeometry.getAttribute('normal') );
		geometry.addAttribute( 'magnitude', magnitudes ); //? am I using this


		// var pointsReferences = new THREE.BufferAttribute( new Float32Array( (baseGeometry.getAttribute('position').count / 3) * 2 ), 2 ); // x and y coordinates of the texel associated to a particular vertex.
		// var pointsPositions = new THREE.BufferAttribute( new Float32Array( (baseGeometry.getAttribute('position').count / 3) * 3 ), 3 );
		// points.addAttribute( 'position', pointsPositions); //DOn't even really need to init point pos
		// points.addAttribute( 'reference', pointsReferences );

		//create points index ref

		for( var v = 0; v < geometry.getAttribute('position').count; v++ ) {
		  var i = ~~(v);
		  var x = (i % WIDTH) / WIDTH; 
		  var y = ~~(i / WIDTH) / WIDTH;


		  references.array[ v * 2    ] = x; 
		  references.array[ v * 2 + 1 ] = y;

		  magnitudes.array[v] = 0;
		  		  //need to grab this reference for only every first point of three
		  //and add them to a shorter reference array on the point material
		  // if(i%3 == 0){
		  	// for points index ref, just need to figure out the pot length of 
		  	// i think it's position.count * 4 --> so v*4 give first r (of rgbw) of all verts	
		  	// so yes when i%3 == 0  -> pointsIndexRef[ figure out ] = v * 4

		  // 	pointsReferences.array[ figure out  ] = x; 
		  // 	pointsReferences.array[ figure out   ] = y;
		  // }
		}

		console.log(geometry);

		var shader = getCustomShader();
		var tShader = getTranslucentShader();

		scanUniforms = THREE.UniformsUtils.merge([tShader.uniforms, shader.uniforms]);

		var customPhysicalMaterial = new THREE.ShaderMaterial( { 
		  uniforms:       scanUniforms,
		  vertexShader:   shader.vertexShader,
		  fragmentShader: tShader.fragmentShader,
		  lights: true,
		  side: THREE.DoubleSide
		});


		  var gold = new THREE.MeshStandardMaterial( {
            color: 0xa78d00,
            metalness: 0.5,
            roughness: 0.5
          } );

		scanMesh = new THREE.Mesh( geometry, customPhysicalMaterial );
		// scanMesh.rotation.y = Math.PI / 2;
		// scanMesh.position.set( -10, - 5, 0 );
        scanMesh.rotation.set( -Math.PI/2, 0, 0 );
		scanMesh.matrixAutoUpdate = false;
		scanMesh.updateMatrix();

		var pCompShader = getComputePointShader();
		pUniforms = pCompShader.uniforms;
		pUniforms.u_color.value = new THREE.Vector3(0.65,0.55,0.1);//new THREE.Vector3(0.8,0.8,0.8);// new THREE.Vector3(0.65,0.55,0.1);

		pUniforms.u_resolution.value.x = 1;
		pUniforms.u_resolution.value.y = 1;

        var pointsMaterial = new THREE.ShaderMaterial( {
          uniforms: pUniforms,
          vertexShader: pCompShader.vertexShader,
          fragmentShader: pCompShader.fragmentShader
          // transparent: true
        } );
        
        pointsMaterial.name = "pointsMaterial";
        // mats.push(pointsMaterial);

        points = new THREE.Points( geometry, pointsMaterial );
        // points.position.set( -10, - 5, 0 );
        points.rotation.set( -Math.PI/2, 0, 0 );

		mouse = new THREE.Vector2();

		// add existing points shader to a 
		// getPointsShader function in shaders.js
		// remove both shaders from the default.ejs
		// use point frag
		//AND
		// create custom vert shader that is setting point pos from texturePosition with custom ref array
		// plus an offset by 2 * normal from normal texture with custom ref array
		// and point size based on a fraction of the magnitude from normal texture with custom ref array

		//points shader and material etc etc
		//points update rotation etc
		//scene.add(points);

		// scene.add(scanMesh);
		scene.add(points);

		//on click of points will need to have stored an index to the one vertex it represents
		//so can iterate by three through the normal texture to update 
		//all three vertices magnitude 
		//will be super quick to grab the k index of texture
		// always the k + 3 (w of texel in normalTexture)
		// where k is incrementing by 4 
		// for(int k = interactPointIndexRef, kl = interactPointIndexRef+4*3; k += 4)
		//texArray[k(+3)] --> is the magnitude val for all three texels 

    } 

    function appendCanvas(camX,camY,camZ){
    	activeRender = true;
    	container.appendChild( renderer.domElement );
		// start = performance.now();
		camera.position.x = camX;
		camera.position.y = camY;
		camera.position.z = camZ;
		controls.update();
		injectHUD();
        animate();
    }

    function removeCanvas() {
    	activeRender = false;
    	container.innerHTML = "";
    }

    function getName() {
    	return name;
    }

    function getMesh() {
    	return scanMesh;
    }

    function addData(t) {
    	tags = t;
    	console.log("WHOOOOT")
    	constructHTML();
    }

    function dataAdded() {
    	if(typeof tags == "undefined"){
			return false;
    	}else{
    		return true;
    	}
    	
    }

    function constructHTML(){

	    //tags
    	baseHUD = document.createElement('div');
    	var c = document.createElement('div')
    	c.id = 'category';

    	
    	// for(var i = 0; i < buttons.length; i++){
    	// 	var bttn = document.createElement('a');
    	// 	bttn.className = "hud-bttn";
    	// 	// bttn.createAttribute("action");
    	// 	bttn.setAttribute("action", buttons[i].action);
    	// 	bttn.innerHTML = buttons[i].text;
    	// 	el.append(bttn);
    	// }

    	console.log(tags);

	    for(key in tags){

	    	var bttn = document.createElement('a');
			bttn.className = "category-bttn";
			bttn.setAttribute("category", key);
			if(key == "value") bttn.classList.add("active");
			bttn.innerHTML = key;
			c.append(bttn);

			var h = document.createElement('div');
			h.setAttribute("category", key);
			h.classList.add("hud");
			if(key == "value"){
				h.classList.add("active");
			}else{
				h.classList.add("inactive");
			}

			for(subKey in tags[key]){
				var bttn = document.createElement('a');
				bttn.classList.add("hud-bttn");
				// bttn.createAttribute("action");
				bttn.setAttribute("category", key);
				bttn.setAttribute("tag", subKey);
				bttn.innerHTML = subKey;
				h.append(bttn);
			}

			baseHUD.append(h);
	    }


		baseHUD.prepend(c);
    	
    	console.log(baseHUD);

    }

    function injectTagData(category,tag){
 		// 	"title": "Test",
		// "subtitle": "Subtitle",
		// "date-of-encounter": 2017,
		// "loc-long": -17.692050,
		// "loc-lat": 31.147271,
		// "citation": "",
		// "tags": ["social"],
		// "quote": "",
		// "text":"120 characters"
		var info = document.getElementById("info-area");
		info.innerHTML = "";
    	for(var i = 0; i < tags[category][tag].length; i++){
    		var div = document.createElement('div');
    		div.classList.add("info-item");
    		if(tags[category][tag][i].text != ""){
				var p = document.createElement('p');
				p.innerHTML = tags[category][tag][i].text;
				div.appendChild(p);
    		}
    		if(tags[category][tag][i].quote != ""){
    			var p = document.createElement('p');
    			p.classList.add("italic");
    			p.innerHTML = "'"+tags[category][tag][i].quote+"'";
    			div.appendChild(p);
    		}
    		if(tags[category][tag][i].citation != ""){
    			var p = document.createElement('p');
				p.innerHTML = "citation: "+tags[category][tag][i].citation;
				p.classList.add("small");
    			if(tags[category][tag][i].link != ""){
    				var a = document.createElement('a');
    				a.classList.add("out-arrow");
    				a.setAttribute("href",tags[category][tag][i].link);
    				p.append(a);
    			}
    			div.appendChild(p);
    		}
   			info.appendChild(div);
    	}

    }

    function injectHUD() { //ONLY INJECT HUD ONCE to preserve state

	    if(window.innerWidth > 900){
	    	navElement.classList.add("open");    
	    } else {
	    	navElement.classList.remove("open");    
	    }

	    var tagContainer = document.getElementById("hud-container");
	    // tagContainer.setAttribute("category","value");
	    tagContainer.innerHTML = "";
	    tagContainer.append(baseHUD);

	    document.querySelectorAll(".hud a").forEach(function(element){
		  element.addEventListener("click",morphMesh,false);
		});
    }

    //TODO 
    //Add in a remove self function


	function init(container,baseGeometry) {

		if(!initialized){

			console.log("Init: " + name);


			//TODO store a ref to container somehow.
			//Or just an element to check if in DOM before runnning Animate

	        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
	        
	        scene = new THREE.Scene();
	        scene.background = new THREE.Color( 0xf7f7f7 );
	        scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );
	        
	        var light = new THREE.DirectionalLight( 0xffffff, 1 );
	        light.position.set( 1, 1, 1 ).normalize();
	        scene.add( light );
	        var  light1 = new THREE.DirectionalLight( 0xffffff, .5 );
			light1.position.set( -1, -1, -1 ).normalize();
			scene.add( light1 );

	        renderer = new THREE.WebGLRenderer();
			  renderer.setPixelRatio( window.devicePixelRatio );
			  renderer.setSize( window.innerWidth, window.innerHeight );
	        // container.appendChild( renderer.domElement );

	        renderer.autoClear = false;  //!!!!!!

	        cameraOrtho = new THREE.OrthographicCamera(    
	          -400 , // frustum left plane
	          400 , // frustum right plane.
	          400, // frustum top plane.
	          -400 , // frustum bottom plane. 
	          0, // frustum near plane. //Set to 0 so plane is visible
	          1000 // frustum far plane.
	        );

	        sceneInset = new THREE.Scene();

	        var pGeom = new THREE.PlaneGeometry( 400,400 );
	        var pMat = new THREE.MeshBasicMaterial( {color: 0xffffff});
	        plane = new THREE.Mesh( pGeom, pMat );
	        plane.lookAt( cameraOrtho.position );
	        sceneInset.add(plane);

	        controls = new THREE.OrbitControls( camera, renderer.domElement );

	    
	        // document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	        // document.addEventListener( 'touchmove', onDocumentTouchMove, false );


  			navButton = document.getElementById("nav-button");
			navElement = document.getElementById("side-panel");

	        window.addEventListener( 'resize', onWindowResize, false );
	        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	        navButton.addEventListener( 'click', onClicked, false);


	        initMesh(baseGeometry);
	        initComputeRenderer();
	                
	        initialized = true;

		}else{
			console.log("Already initialized: " + name);
		}
 
	}	

	function animate() {

		//TODO add in conditional to check if DOM element before call AnimFrame and render
		//Or just an element to check if in DOM before runnning Animate

		if(activeRender){
			requestAnimationFrame( animate );
        	render();
		}

	}

	function render() {

		var now = performance.now();
        var delta = (now - last) / 1000;

        if (delta > 1) delta = 1; // safety cap on large deltas
        last = now;


        //TODO
        //Add a degrade to u_noffset to get to 0 slowly.

        //Use start for start of transition perhaps
        // if(now - start < 5000 == true){
      
          positionUniforms.time.value = now;
          positionUniforms.delta.value = delta;   
          velocityUniforms.time.value = Math.sin(now*0.001);
          velocityUniforms.delta.value = delta;  

          scanUniforms.time.value = now;
          scanUniforms.delta.value = delta;
          pUniforms.time.value = now;
          pUniforms.delta.value = delta;
        // }else{
          // velocityUniforms.u_noffset.value = 0.0;
        // }


        if(velocityUniforms.u_noffset.value > 0.01){
        	velocityUniforms.u_noffset.value -= 0.01;
        }
 

        gpuCompute.compute();

        scanUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
        scanUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
        pUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
        pUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;


        plane.material.needsUpdate = true;
        plane.material.map = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;





        
        //3D Camera
        renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
        renderer.render( scene, camera );

        //Orthographic Camera for UI laid over 3D view.
        renderer.setViewport( -50, -50, 250, 250 );
        renderer.render( sceneInset, cameraOrtho );

	}

	function onWindowResize() {

    	camera.aspect = window.innerWidth/ window.innerHeight;
    	camera.updateProjectionMatrix();
    	renderer.setSize( window.innerWidth, window.innerHeight);


	}

	function onDocumentMouseMove( event ) {

		event.preventDefault();

		mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;


	}

	function onClicked(event){
		console.log("click");

		navElement.classList.toggle("open");


	}


    function morphMesh(e){
    	console.log(e.target.getAttribute("category"));

    	document.querySelectorAll(".hud a").forEach(function(element){
		  element.classList.remove("active");
		});

		e.target.classList.add("active");

		injectTagData(e.target.getAttribute("category"),e.target.getAttribute("tag"));

    	switch(e.target.getAttribute("tag")){
    		case "expand" :
    			dir = 1;
    			break;
    		case "contract" :
				dir = -1;
    			break;
    		default:
    			console.log("No action case found.");
    			break;
    	}

		

		//pseudo 
		//store the old dtNormal image and additively add new stuff
		//have a revert old model option too    	

	  	var nT = gpuCompute.createTexture();
	  	newNormalTexture(nT,1*dir);

	  	velocityUniforms.normals.value = nT;
		pUniforms.normals.value = nT;

		velocityUniforms.u_noffset.value = 1.0;
    }




	return {
		getName: getName,
		getMesh: getMesh,
		addData: addData,
		dataAdded: dataAdded,
		init: init,
		initMesh: initMesh,
		animate: animate,
		render: render,
		removeCanvas: removeCanvas,
		appendCanvas: appendCanvas
	};

}