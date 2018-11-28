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
  	var dtNormal, dtPosition;

  	var scanUniforms,pUniforms;
  	var scanMesh, points;
  	var navElement, baseHUD;
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

		dtPosition = gpuCompute.createTexture();
		var dtVelocity = gpuCompute.createTexture();
		dtNormal = gpuCompute.createTexture();
		fillPositionTexture( dtPosition );
		fillVelocityTexture( dtVelocity );
		fillNormalTexture( dtNormal );

		console.log(dtPosition);

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

		console.log(texture);

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
    	
    	//Slight hack in case someone navigates to dust section before json is loaded in
    	if(document.getElementById("hud-container").classList.contains("lds-dual-ring") ){
    		document.getElementById("hud-container").classList.remove("lds-dual-ring");
    		injectHUD();
    	}
    	

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
				p.innerHTML = "Citation: "+tags[category][tag][i].citation;
				p.classList.add("small");
    			if(tags[category][tag][i].link != ""){
    				var a = document.createElement('a');
    				a.classList.add("out-arrow");
    				a.setAttribute("href",tags[category][tag][i].link);
    				a.setAttribute("target","_blank");
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
	    if(typeof baseHUD != "undefined"){
	    	tagContainer.append(baseHUD);
	    }else{
	    	tagContainer.classList.add("lds-dual-ring");
	    }

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

	        var pGeom = new THREE.PlaneGeometry( 800,800 );
	        var pMat = new THREE.MeshBasicMaterial( {color: 0xffffff});
	        plane = new THREE.Mesh( pGeom, pMat );
	        plane.lookAt( cameraOrtho.position );
	        sceneInset.add(plane);

	        controls = new THREE.OrbitControls( camera, renderer.domElement );

	    
	        // document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	        // document.addEventListener( 'touchmove', onDocumentTouchMove, false );


	        var downloadButton = document.getElementById("download-button");
  			var navButton = document.getElementById("nav-button");
			navElement = document.getElementById("side-panel");

	        window.addEventListener( 'resize', onWindowResize, false );
	        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	        navButton.addEventListener( 'click', onClicked, false);
	        downloadButton.addEventListener( 'click', download, false);


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
        renderer.setViewport( 15, 15, 140, 140 );
        renderer.render( sceneInset, cameraOrtho );

	}

	function onWindowResize() {

    	camera.aspect = window.innerWidth/ window.innerHeight;
    	camera.updateProjectionMatrix();
    	renderer.setSize( window.innerWidth, window.innerHeight);


	}

	function onDocumentMouseMove( e ) {

		event.preventDefault();

		mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;


	}

	function onClicked(e){

		navElement.classList.toggle("open");

	}

	function download(e){
		console.log("Download");

		activeRender = false; // do I need this?




		        //3D Camera
		// renderer.setSize(window.innerWidth*3,window.innerHeight*2);
        renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
        renderer.render( scene, camera );



        renderer.render(scene, camera);
	    renderer.domElement.toBlob(function(blob){
			var a = document.createElement('a');
			var url = URL.createObjectURL(blob);
			a.href = url;
			a.download = 'golddust-Render-RA-Sink.png';
			a.click();
	    }, 'image/png', 1.0);

	    renderer.clear();

	    //Need to do a whole shader that then stores everything as bytes
	    //to then read back as floats

	 //    renderer.setPixelRatio( 1 );
  //       //Orthographic Camera for UI laid over 3D view.
  //       renderer.setSize(512,512);
  //       renderer.render(scene, camera);
  //       renderer.clear();

  //       renderer.setViewport(0,0, 512, 512 );
  //       renderer.render( sceneInset, cameraOrtho );


  //       //Now read pixel data from canvas

  //       //http://concord-consortium.github.io/lab/experiments/webgl-gpgpu/script.js
  //       //https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_water.html

  //       var gl = renderer.context;
		// var pixels = new Uint8Array(gl.drawingBufferWidth * gl.drawingBufferHeight * 4);
		// gl.readPixels(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
	
		// var result = new Float32Array(pixels.buffer)

		// console.log(result);


	    renderer.setPixelRatio( window.devicePixelRatio );
	    renderer.setSize(1000,1000);
        renderer.render(scene, camera);
        renderer.clear();

        renderer.setViewport(0,0, 1000, 1000 );
        renderer.render( sceneInset, cameraOrtho );


	    renderer.domElement.toBlob(function(blob){
			var a = document.createElement('a');
			var url = URL.createObjectURL(blob);
			a.href = url;
			a.download = 'golddust-VerticeData-RA-Sink.png';
			a.click();
	    }, 'image/png', 1.0);

	    renderer.setSize(window.innerWidth,window.innerHeight);




	 //  console.log(dtPosition);
	  	
	 //  	var geometry = new THREE.BufferGeometry();

		// var positions = new THREE.BufferAttribute( new Float32Array( scanMesh.geometry.getAttribute('position').count * 3 ), 3 );
		// // var normals = new THREE.BufferAttribute( new Float32Array( scanMesh.getAttribute('normal').count * 3 ), 3 );

		// var pixels = new Uint8Array(WIDTH * WIDTH * 4);
		// var texture = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
		// console.log(texture);
		// var textureArray = texture.image.data;

		// var i = 0;//count for different item size of source array i.e. vec3 
		// for ( var k = 0, kl = textureArray.length; k < kl; k += 4 ) { 


		//   if(i < positions.array.length){ 
		//     positions.array[i] = textureArray[ k  ];
		//     positions.array[i+1] = textureArray[ k + 1 ];
		//     positions.array[i+2] = textureArray[ k + 2 ];

		//     i+=3;

		//   }else{
		//     theArray[ k  ] = 1;
		//     theArray[ k + 1 ] = 1;
		//     theArray[ k + 2 ] = 1;
		//     theArray[ k + 3 ] = 0;
		//   }

		// }

		// geometry.addAttribute( 'position', positions );
		// geometry.addAttribute( 'normal', scanMesh.geometry.getAttribute('normal') );


	    // var exporter = new THREE.STLExporter();
		// var data = exporter.parse( mesh, { binary: true } );

			

	    activeRender = true;
	    animate();


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