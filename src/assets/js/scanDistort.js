function ScanDistort(name){
	var WIDTH = 256;//

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
  	var originalPositions = [];
  	var scanMesh, points; // points will serve as having the original 
  	var navElement, baseHUD;
  	var dataArray,bucketSize;
  	var orderedList = [];
  	var interactionCount; // This is a copy of tags, but the array for each is just first times added, second times removed
  	var tags = {
	  value:{
	    social:[],
	    economic:[],
	    linguistic:[]
	  }
	  // exchange:{
	  //   political:[]
	  // }
	};
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

		velocityVariable = gpuCompute.addVariable( "textureVelocity", computeShaders.velocityCompute, dtVelocity );
		positionVariable = gpuCompute.addVariable( "texturePosition", computeShaders.positionCompute, dtPosition );

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
		// var posAttribute = baseGeometry.getAttribute("position");

		var i = 0;//count for different item size of source array i.e. vec3 
		for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) { 


		  if(i < originalPositions.length){ 
		    theArray[ k  ] = originalPositions[i];
		    theArray[ k + 1 ] = originalPositions[i+1];
		    theArray[ k + 2 ] = originalPositions[i+2];
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

		    i+=3;

		  }else{
		    theArray[ k  ] = 1;
		    theArray[ k + 1 ] = 1;
		    theArray[ k + 2 ] = 1;
		    theArray[ k + 3 ] = 0;
		  }

		}
	}

	function newNormalTexture( texture, category, tag) { //maybe bering back index

		var theArray = texture.image.data;
		var normalAttribute = scanMesh.geometry.getAttribute("normal");
		var magAttribute = scanMesh.geometry.getAttribute("magnitude");
		// var indices = scanMesh.geometry.index.array;

		var c = 0;//count for different item size of source array i.e. vec3 
		for ( var k = 0; k < theArray.length; k += 4 ) { 

		  if(c < normalAttribute.array.length){ 
		    theArray[ k  ] = normalAttribute.array[c];
		    theArray[ k + 1 ] = normalAttribute.array[c+1];
		    theArray[ k + 2 ] = normalAttribute.array[c+2];

		   	theArray[ k + 3 ] = 0;
		    
		    c+=3;

		  }else{
		    theArray[ k  ] = 1;
		    theArray[ k + 1 ] = 1;
		    theArray[ k + 2 ] = 1;
		    theArray[ k + 3 ] = 1;
		  }

		}


		var collection = document.getElementById("info-area").children;

		// tags[category][tag].length
		for(var i = 0; i < collection.length; i++){
			// var pIndex = tags[category][tag][i].pIndex;
			var pIndex = parseInt(collection[i].getAttribute("pindex"));
			var min = pIndex - Math.floor(bucketSize/2);
			var max = pIndex + Math.floor(bucketSize/2);
			for(var j = min; j < max; j++){
				// var a = indices[j]*4;
				var a = orderedList[j]*4;
				if(j <= pIndex){
					theArray[a+3] = (j - min) * (1.5 - 0.4) / (pIndex - min) + 0.4;
				}else{
					theArray[a+3] = (j - pIndex) * (0.4 - 1.5) / (max - pIndex) + 1.5;
				}
			}
		}
	}

	function subtractNodeTexture( texture, pIndex) { //maybe bering back index

		var theArray = texture.image.data;
		var normalAttribute = scanMesh.geometry.getAttribute("normal");
		var magAttribute = scanMesh.geometry.getAttribute("magnitude");
		// var indices = scanMesh.geometry.index.array;

		var c = 0;//count for different item size of source array i.e. vec3 
		for ( var k = 0; k < theArray.length; k += 4 ) { 

		  if(c < normalAttribute.array.length){ 
		    theArray[ k  ] = normalAttribute.array[c];
		    theArray[ k + 1 ] = normalAttribute.array[c+1];
		    theArray[ k + 2 ] = normalAttribute.array[c+2];

		   	theArray[ k + 3 ] = 0;
		    
		    c+=3;

		  }else{
		    theArray[ k  ] = 1;
		    theArray[ k + 1 ] = 1;
		    theArray[ k + 2 ] = 1;
		    theArray[ k + 3 ] = 1;
		  }

		}

		var min = pIndex - Math.floor(bucketSize/2);
		var max = pIndex + Math.floor(bucketSize/2);
		for(var j = min; j < max; j++){
			// var a = indices[j]*4;
			var a = orderedList[j]*4;
			if(j <= pIndex){
				theArray[a+3] = ((j - min) * (1.5 - 0.4) / (pIndex - min) + 0.4)*-1;
			}else{
				theArray[a+3] = ((j - pIndex) * (0.4 - 1.5) / (max - pIndex) + 1.5)*-1;
			}
		}

	}

	function fillVelocityTexture( texture ) {

		var theArray = texture.image.data;

		for ( var k = 0, kl = theArray.length; k < kl; k += 4 ) {

		  theArray[ k + 0 ] = 0 ;
		  theArray[ k + 1 ] = 0 ;
		  theArray[ k + 2 ] = 0 ;
		  theArray[ k + 3 ] = 0 ;

		}

	}

  	function initMesh(baseGeometry) {

  		// Convert to Geometry to make use of mergeVertices functionality
		baseGeometry = new THREE.Geometry().fromBufferGeometry( baseGeometry );
        baseGeometry.computeFaceNormals();              
        baseGeometry.mergeVertices()
        baseGeometry.computeVertexNormals();

		// Build indexed Buffer Geometry based off of faces of Geometry	
		var geometry = new THREE.BufferGeometry();

		var references = new THREE.BufferAttribute( new Float32Array( baseGeometry.vertices.length * 2 ), 2 ); // x and y coordinates of the texel associated to a particular vertex.
		var magnitudes = new THREE.BufferAttribute( new Float32Array( baseGeometry.vertices.length ), 1 );
		var positions = new THREE.BufferAttribute( new Float32Array( baseGeometry.vertices.length * 3 ), 3 );
		var normals = new THREE.BufferAttribute( new Float32Array( baseGeometry.vertices.length * 3 ), 3 );
		var indices = [];

		for(var i = 0; i < baseGeometry.vertices.length; i++){
			positions.array[i*3] = baseGeometry.vertices[i].x;
			positions.array[i*3+1] = baseGeometry.vertices[i].y;
			positions.array[i*3+2] = baseGeometry.vertices[i].z;
		}

		for(var i = 0; i < baseGeometry.faces.length; i++){
			indices.push(baseGeometry.faces[i].a);
			indices.push(baseGeometry.faces[i].b);
			indices.push(baseGeometry.faces[i].c);

			normals.array[baseGeometry.faces[i].a*3] = baseGeometry.faces[i].vertexNormals[0].x;
			normals.array[baseGeometry.faces[i].a*3+1] = baseGeometry.faces[i].vertexNormals[0].y;
			normals.array[baseGeometry.faces[i].a*3+2] = baseGeometry.faces[i].vertexNormals[0].z;

			normals.array[baseGeometry.faces[i].b*3] = baseGeometry.faces[i].vertexNormals[1].x;
			normals.array[baseGeometry.faces[i].b*3+1] = baseGeometry.faces[i].vertexNormals[1].y;
			normals.array[baseGeometry.faces[i].b*3+2] = baseGeometry.faces[i].vertexNormals[1].z;

			normals.array[baseGeometry.faces[i].c*3] = baseGeometry.faces[i].vertexNormals[2].x;
			normals.array[baseGeometry.faces[i].c*3+1] = baseGeometry.faces[i].vertexNormals[2].y;
			normals.array[baseGeometry.faces[i].c*3+2] = baseGeometry.faces[i].vertexNormals[2].z;
		}

		geometry.addAttribute( 'position', positions );
		geometry.addAttribute( 'reference', references );
		geometry.addAttribute( 'normal', normals );
		geometry.addAttribute( 'magnitude', magnitudes ); //? am I using this
		geometry.setIndex(indices);


		for( var v = 0; v < geometry.getAttribute('position').count; v++ ) {
		  var i = ~~(v);
		  var x = (i % WIDTH) / WIDTH; 
		  var y = ~~(i / WIDTH) / WIDTH;

		  references.array[ v * 2    ] = x; 
		  references.array[ v * 2 + 1 ] = y;

		  magnitudes.array[v] = 0;

		  originalPositions.push(positions.array[v*3]);
		  originalPositions.push(positions.array[v*3+1]);
		  originalPositions.push(positions.array[v*3+2]);


		}


		//Bring back if not using points but solid shader
		// var shader = getCustomShader();
		// var tShader = getTranslucentShader();

		// scanUniforms = THREE.UniformsUtils.merge([tShader.uniforms, shader.uniforms]);

		// var customPhysicalMaterial = new THREE.ShaderMaterial( { 
		// 	uniforms:       scanUniforms,
		// 	vertexShader:   shader.vertexShader,
		// 	fragmentShader: tShader.fragmentShader,
		// 	lights: true,
		// 	side: THREE.DoubleSide
		// });

		//Normal gold for when add modified model to scene
		var gold = new THREE.MeshStandardMaterial( {
			color: 0xa78d00,
			metalness: 0.5,
			roughness: 0.5,
			side: THREE.DoubleSide
		} );

		scanMesh = new THREE.Mesh( geometry, gold );
		scanMesh.name = "scanMesh";
		// scene.add(scanMesh);

		//Points Geometry
		var pCompShader = getComputePointShader();
		pUniforms = pCompShader.uniforms;
		pUniforms.u_color.value = new THREE.Vector3(0.65,0.55,0.1);

		pUniforms.u_resolution.value.x = 1;
		pUniforms.u_resolution.value.y = 1;

        var pointsMaterial = new THREE.ShaderMaterial( {
          uniforms: pUniforms,
          vertexShader: pCompShader.vertexShader,
          fragmentShader: pCompShader.fragmentShader
          // transparent: true
        } );
        
        points = new THREE.Points( geometry, pointsMaterial );
        points.name = "points";
		scene.add(points);

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

    function roughSpatialSort(){
		
    	var positions = scanMesh.geometry.getAttribute("position").array;
    	var firstPoint = new THREE.Vector3(positions[0],positions[1],positions[2]);
		var unorderedList = [];//This will just be objects with distance and original index (will then remove and just store index for speed of lookup)
		for(var i = 0; i < scanMesh.geometry.getAttribute("position").count; i++){
			var o = {dist:0,index:i};
			var v3 = new THREE.Vector3(positions[i*3],positions[i*3+1],positions[i*3+2]);
			o.dist = v3.distanceToSquared(firstPoint);
			unorderedList.push(o);
		}

		unorderedList.sort(function(obj1, obj2) {
			if(obj1.dist > obj2.dist){
				return 1;
			}else{
				return -1;
			}
		});

		for(var i = 0; i < unorderedList.length;i++){
			orderedList.push(unorderedList[i].index);
		}

    }

    //for now just called on the cannon
    function createDataBuckets(){
    	// var pL = scanMesh.geometry.getAttribute("position").count;
    	var pL = orderedList.length;
    	var dL = dataArray.length;
    	bucketSize = Math.floor(pL/dL);
   		var pIndex = (bucketSize%2!=0)?Math.round(bucketSize/2):bucketSize/2;

   		for(var i = 0; i < dL;i++){
   			dataArray[i]["pIndex"] = bucketSize*i+pIndex; 
   		}
    }

    function sortDataTags(){

		for(var i = 0; i < dataArray.length; i++){
			dataArray[i]["indexOrder"] = i;
			for(key in tags){
			  for(subKey in tags[key]){
			    if(dataArray[i].tags.includes(subKey)){
			      tags[key][subKey].push(dataArray[i]);
			    }
			  }
			}
		}

		constructHTML();
	}

    function addData(d) {
    	dataArray = d;
    	
   		sortDataTags();

   		roughSpatialSort();

    	createDataBuckets();
    }

    function dataAdded() {
    	if(typeof dataArray == "undefined"){
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
		info.setAttribute("tag",tag);
		// info.innerHTML = "";
		var count = 0;
    	for(var i = 0; i < tags[category][tag].length; i++){


    		if(info.querySelectorAll('[pindex="'+tags[category][tag][i].pIndex+'"]').length == 0){

    			//Interaction tracking
    			interactionCount[category][tag][0] += 1;

    			//Content
    			var div = document.createElement('div');
    			var bttn = document.createElement('span');
	    		div.classList.add("info-item");
	    		div.setAttribute("pindex",tags[category][tag][i].pIndex);
	    		div.setAttribute("tag",tag);
	    		div.setAttribute("category",category);
	    		div.setAttribute("order",tags[category][tag][i].indexOrder);
	    		bttn.innerHTML = "X";
	    		div.append(bttn);
	    		bttn.addEventListener("click",removeDataPoint,false);
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
	   			info.prepend(div);
    		}else{
    			count ++;
    			
    		}

    		if(count < tags[category][tag].length && i == tags[category][tag].length-1)  velocityUniforms.u_noffset.value = 1.0;
    	}

    }

    function injectHUD() { //ONLY INJECT HUD ONCE to preserve state

	    if(window.innerWidth > 900){
	    	navElement.classList.add("open");    
	    } else {
	    	navElement.classList.remove("open");    
	    }

	    var tagContainer = document.getElementById("hud-container");
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

    function reset(){
		activeRender = false;

		for(category in interactionCount){
			for(tag in interactionCount[category]){
				interactionCount[category][tag][0] = 0;
				interactionCount[category][tag][1] = 0;
			}
		}

		//Also empty the info area

		// scene.remove(scene.getObjectByName("points"));
		// console.log(scene.getObjectByName("scanMesh"));
		scene.remove(scene.getObjectByName("scanMesh"));

		document.getElementById("info-area").innerHTML = "";
		document.querySelectorAll(".hud .hud-bttn").forEach(function(e){
			e.classList.remove("active");
		});

		gpuCompute = {};
		initComputeRenderer(); //This needs work

		//!!!!

		activeRender = true;
	    animate();
    }

	function init(container,baseGeometry) {

		if(!initialized){

			console.log("Init: " + name);

			interactionCount = JSON.parse(JSON.stringify(tags));

			for(category in interactionCount){
				for(tag in interactionCount[category]){
					interactionCount[category][tag].push(0);
					interactionCount[category][tag].push(0);
				}
			}

			//TODO store a ref to container somehow.
			//Or just an element to check if in DOM before runnning Animate

	        camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 10000 );
	        
	        scene = new THREE.Scene();
	        scene.background = new THREE.Color( 0xf7f7f7 );
	        // scene.fog = new THREE.Fog( 0xffffff, 100, 1000 );
	        
	        var light = new THREE.DirectionalLight( 0xffffff, 1 );
	        light.position.set( 1, 1, 1 ).normalize();
	        scene.add( light );
	        var  light1 = new THREE.DirectionalLight( 0xffffff, .5 );
			light1.position.set( -1, -1, -1 ).normalize();
			scene.add( light1 );
			var ambientLight = new THREE.AmbientLight( 0xffffff, .5 );
  			scene.add( ambientLight );

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
	        mouse = new THREE.Vector2();
	        controls.minDistance = 10;
			controls.maxDistance = 300;
	    
	        // document.addEventListener( 'touchstart', onDocumentTouchStart, false );
	        // document.addEventListener( 'touchmove', onDocumentTouchMove, false );


	        var downloadButton = document.getElementById("download-button");
  			var navButton = document.getElementById("nav-button");
  			var rButton =  document.getElementById("refresh-button");
			navElement = document.getElementById("side-panel");

	        window.addEventListener( 'resize', onWindowResize, false );
	        document.addEventListener( 'mousemove', onDocumentMouseMove, false );
	        navButton.addEventListener( 'click', onClicked, false);
	        downloadButton.addEventListener( 'click', download, false);
	        rButton.addEventListener( 'click', reset, false);



	        initMesh(baseGeometry);
	        initComputeRenderer();
	                
	        initialized = true;

		}else{
			console.log("Already initialized: " + name);
		}
 
	}	

	function animate() {

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

		positionUniforms.time.value = now;
		positionUniforms.delta.value = delta;   
		velocityUniforms.time.value = Math.sin(now*0.001);
		velocityUniforms.delta.value = delta;  

		// scanUniforms.time.value = now;
		// scanUniforms.delta.value = delta;
		pUniforms.time.value = now;
		pUniforms.delta.value = delta;


        if(velocityUniforms.u_noffset.value > 0.0){
        	velocityUniforms.u_noffset.value -= 0.01;
        }
 
        gpuCompute.compute();

        // scanUniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget( positionVariable ).texture;
        // scanUniforms.textureVelocity.value = gpuCompute.getCurrentRenderTarget( velocityVariable ).texture;
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

		e.preventDefault();

		mouse.x = ( e.clientX / window.innerWidth ) * 2 - 1;
		mouse.y = - ( e.clientY / window.innerHeight ) * 2 + 1;


	}

	function onClicked(e){

		navElement.classList.toggle("open");

	}

	function updateMeshOnCPU(){

		//Encode the gpgpu floating point textures into bytes to read into mesh.
		//Using an encoding shader (see below). Not sure how to encode three numbers at once if at all possible
		//But this works for now.

  		//http://concord-consortium.github.io/lab/experiments/webgl-gpgpu/script.js
   		//https://github.com/mrdoob/three.js/blob/master/examples/webgl_gpgpu_water.html

		var encodeFloat = gpuCompute.createShaderMaterial( getComputeShaders().encodeFloat, {
			rgb : {value: 1.0}, // 1.0 = x val, 2.0 = y val, else z
			texture: { value: gpuCompute.getCurrentRenderTarget( positionVariable ).texture }
		} );

		var encodeRenderTarget = new THREE.WebGLRenderTarget( WIDTH, WIDTH, {
			wrapS: THREE.ClampToEdgeWrapping,
			wrapT: THREE.ClampToEdgeWrapping,
			minFilter: THREE.NearestFilter,
			magFilter: THREE.NearestFilter,
			format: THREE.RGBAFormat,
			type: THREE.UnsignedByteType,
			stencilBuffer: false,
			depthBuffer: false
		} );

		var gl = renderer.context;

		//Encode the x postiion floats
		gpuCompute.doRenderTarget( encodeFloat, encodeRenderTarget );

		var xPixels = new Uint8Array(WIDTH * WIDTH * 4);
		gl.readPixels(0, 0, WIDTH, WIDTH, gl.RGBA, gl.UNSIGNED_BYTE, xPixels);
	
		var x = new Float32Array(xPixels.buffer);


		//Encode the y postiion floats
		encodeFloat.uniforms.rgb.value = 2.0;

		gpuCompute.doRenderTarget( encodeFloat, encodeRenderTarget );

		var yPixels = new Uint8Array(WIDTH* WIDTH * 4);
		gl.readPixels(0, 0, WIDTH, WIDTH, gl.RGBA, gl.UNSIGNED_BYTE, yPixels);
	
		var y = new Float32Array(yPixels.buffer);


		//Encode the z position floats
		encodeFloat.uniforms.rgb.value = 3.0;

		gpuCompute.doRenderTarget( encodeFloat, encodeRenderTarget );

		var zPixels = new Uint8Array(WIDTH * WIDTH * 4);
		gl.readPixels(0, 0, WIDTH, WIDTH, gl.RGBA, gl.UNSIGNED_BYTE, zPixels);
	
		var z = new Float32Array(zPixels.buffer);

		gl.finish();


		var positions = new THREE.BufferAttribute( new Float32Array( scanMesh.geometry.getAttribute('position').count * 3 ), 3 );

		for ( var i = 0; i < scanMesh.geometry.getAttribute('position').count; i ++ ) { 
			positions.array[i*3] = x[i];
		    positions.array[i*3+1] = y[i];
		    positions.array[i*3+2] = z[i];
		}

		scanMesh.geometry.addAttribute( 'position', positions );

		scene.add(scanMesh);

	}

	function download(e){

		activeRender = false; // do I need this?

        renderer.setViewport( 0, 0, window.innerWidth, window.innerHeight );
        renderer.render( scene, camera );

        renderer.render(scene, camera);
	    renderer.domElement.toBlob(function(blob){
			var a = document.createElement('a');
			var url = URL.createObjectURL(blob);
			a.href = url;
			a.download = 'golddust-Cannon-DustRender-Aston-Sink.png';
			a.click();
	    }, 'image/png', 1.0);

	    renderer.clear();

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
			a.download = 'golddust-Cannon-VerticeData2D-Aston-Sink.png';
			a.click();
	    }, 'image/png', 1.0);

	    renderer.setSize(window.innerWidth,window.innerHeight);

		
		//Move this to another button functionality (i.e. have an eye to see the mesh, then you choose download)
		updateMeshOnCPU();


	    //Original scan
 	 	// var a = document.createElement('a');
		// a.href = '/models/golddust-Cannon-OriginalScan-RA-Sink.stl';
		// a.download = 'golddust-Cannon-OriginalScan-RA-Sink.stl';
		// a.click();


		var exportMesh = new THREE.Mesh( scanMesh.geometry );

		//Export Mesh
	    var exporter = new THREE.STLExporter();
		var data = exporter.parse( exportMesh, { binary: true } );
		var blob = new Blob([data], {'type': 'application/octet-stream'});
		var url = URL.createObjectURL(blob);

		var dA = document.createElement('a');
		dA.href = url;
		dA.download = 'golddust-Cannon-FracturedObject-Aston-Sink.stl';
		dA.click();


		//Export TEXT
		var textString = "Gold Dust Text \n \n";
		var indexString = "Gold Dust Bibliography \n \n";
		var collection = document.getElementById("info-area").children;

		for(var i = 0; i < collection.length; i++){
			textString += collection[i].getElementsByClassName("italic")[0].innerHTML;
			textString += "("+(i+1)+")\n \n";
			var s = collection[i].getElementsByClassName("small")[0].innerHTML;
			indexString += (i+1)+". "+s.split("Citation:")[1].split("<")[0]+"\n";
			if(collection[i].getElementsByTagName('a').length > 0 ) indexString += collection[i].getElementsByTagName('a')[0].getAttribute('href');
			indexString += "\n \n";
		}

		var textFile = new Blob([textString], {type: 'text/plain'});
		var tA = document.createElement("a");
		tA.href = URL.createObjectURL(textFile);
		tA.download = 'golddust-Cannon-Text-Aston-Sink.txt';
		tA.click();

		var indexFile = new Blob([indexString], {type: 'text/plain'});
		var iA = document.createElement("a");
		iA.href = URL.createObjectURL(indexFile);
		iA.download = 'golddust-Cannon-Bibliography-Aston-Sink.txt';
		iA.click();


		//Interaction Tracking
		var interactionString = "Gold Dust Collecting \n";
		var now = new Date();
		interactionString += "On "+ now.toDateString()+", at "+now.toTimeString().split(" ")[0]+"\n\n";
		for(category in interactionCount){
			interactionString += category+": \n \n";
			for(tag in interactionCount[category]){
				interactionString += tag+" point added "+interactionCount[category][tag][0]+" times \n"
				interactionString += tag+" point removed "+interactionCount[category][tag][1]+" times\n \n"
			}
		}


		var collectFile = new Blob([interactionString], {type: 'text/plain'});
		var cA = document.createElement("a");
		cA.href = URL.createObjectURL(collectFile);
		cA.download = 'golddust-Cannon-Collecting-Aston-Sink.txt';
		cA.click();

	
	    activeRender = true;
	    animate();

	}


	//called when tag buttons are clicked
    function morphMesh(e){
    	// console.log(e.target.getAttribute("category"));

    	if(!e.target.classList.contains("active")){
    		document.querySelectorAll(".hud a").forEach(function(element){
			  element.classList.remove("active");
			});

			e.target.classList.add("active");

			injectTagData(e.target.getAttribute("category"),e.target.getAttribute("tag"));



		  	var nT = gpuCompute.createTexture();
		  	newNormalTexture(nT,e.target.getAttribute("category"),e.target.getAttribute("tag"));

		  	velocityUniforms.normals.value = nT;
			pUniforms.normals.value = nT;

			
    	}
    	
    }

    function removeDataPoint(e){
    	// console.log(e);

		var nT = gpuCompute.createTexture();

		subtractNodeTexture(nT,parseInt(e.target.parentElement.getAttribute("pindex")));
		velocityUniforms.normals.value = nT;
		pUniforms.normals.value = nT;
		velocityUniforms.u_noffset.value = 1.0;

		interactionCount[e.target.parentElement.getAttribute("category")][e.target.parentElement.getAttribute("tag")][1] += 1;

    	document.getElementById("info-area").removeChild(e.target.parentElement);
    }



	return {
		getName: getName,
		getMesh: getMesh,
		addData: addData,
		dataAdded: dataAdded,
		init: init,
		reset: reset,
		initMesh: initMesh,
		animate: animate,
		render: render,
		removeCanvas: removeCanvas,
		appendCanvas: appendCanvas
	};

}