
// Add in all the attributes you will need here
THREE.ScanGeometry = function (geometry,WIDTH) { // add argument geometry from the STL loader 

  THREE.BufferGeometry.call( this );

  var references = new THREE.BufferAttribute( new Float32Array( geometry.getAttribute('position').count * 2 ), 2 ); // x and y coordinates of the texel associated to a particular vertex.
  var magnitudes = new THREE.BufferAttribute( new Float32Array( geometry.getAttribute('position').count ), 2 );

  this.addAttribute( 'position', geometry.getAttribute('position') );
  this.addAttribute( 'reference', references );
  this.addAttribute( 'normal', geometry.getAttribute('normal') );
  this.addAttribute( 'magnitude', magnitudes );

  for( var v = 0; v < geometry.getAttribute('position').count; v++ ) {

    var i = ~~(v);
    var x = (i % WIDTH) / WIDTH; 
    var y = ~~(i / WIDTH) / WIDTH;

    references.array[ v * 2    ] = x; 
    references.array[ v * 2 + 1 ] = y;

  }

};


THREE.ScanGeometry.prototype = Object.create( THREE.BufferGeometry.prototype );
