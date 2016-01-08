
var handlerMouseUp, handlerMouseMove, handlerMouseOut;

var DAT = function()
{
	this.container			=	null;
	this.camera				=	null;
	this.scene 				=	null;
	this.sceneAtmosphere	=	null;
	this.renderer 			=	null;
	this.w 					=	null;
	this.h 					=	null;
	this.vector				=	null;
	this.mesh 				=	null;
	this.atmosphere 		=	null;
	this.point 				=	null;
	this.points 			=	null;
	this.Shaders			=	{};
	this.imgDir				=	'';
	this.overRenderer		=	null;
	this.curZoomSpeed		=	0;
	this.zoomSpeed 			=	50;
	this.mouse 				=	{x: 0, y: 0};
	this.mouseOnDown		=	{x: 0, y: 0};
	this.rotation 			=	{x: 0, y: 0};
	this.target 			=	{x: Math.PI * (3/2), y: Math.PI / 6.0}
	this.targetOnDown		=	{x: 0, y: 0};
	this.distance 			=	100000;
	this.distanceTarget 	=	800;
	this.padding			=	40;
	this.PI_HALF			=	Math.PI / 2;
	this.PI2 				=	Math.PI * 2;
	this.projector 			=	null;
	this.particleMaterial 	=	null;
	this.geometry 			=	null;
	this.clickEnabled		=	false;
	this.lastClick 			=	0;
	this.geo;

};

DAT.prototype.Globe = function(container, colorFn)
{
	this.container 	=	container;

	colorFn			=	colorFn || function(x)
	{
    	var c 	=	new THREE.Color();
    	c.setHSV( (0.6 - ( x * 0.5 ) ), 1.0, 1.0);
    	return c;
  	};

	this.Shaders 	=	
	{
	    'atmosphere' : {
	      uniforms: {},
	      vertexShader: [
	        'varying vec3 vNormal;',
	        'void main() {',
	          'vNormal = normalize( normalMatrix * normal );',
	          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
	        '}'
	      ].join('\n'),
	      fragmentShader: [
	        'varying vec3 vNormal;',
	        'void main() {',
	          'float intensity = pow( 0.8 - dot( vNormal, vec3( 0, 0, 1.0 ) ), 16.0 );',
	          'gl_FragColor = vec4(1.0);',
	          'gl_FragColor.a = intensity;',
	        '}'
	      ].join('\n')
	    },
	    'earth' : {
	      uniforms: {
	        'texture': { type: 't', value: 0, texture: null }
	      },
	      vertexShader: [
	        'varying vec3 vNormal;',
	        'varying vec2 vUv;',
	        'void main() {',
	          'gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
	          'vNormal = normalize( normalMatrix * normal );',
	          'vUv = uv;',
	        '}'
	      ].join('\n'),
	      fragmentShader: [
	        'uniform sampler2D texture;',
	        'varying vec3 vNormal;',
	        'varying vec2 vUv;',
	        'void main() {',
	          'vec3 diffuse = vec3(1.0)-texture2D( texture, vUv ).xyz;',
	          'float intensity = pow(1.05 - dot( vNormal, vec3( 0.0, 0.0, 1.0 ) ), 4.0);',
	          'float i = 0.8-pow(clamp(dot( vNormal, vec3( 0, 0, 1.0 )), 0.0, 1.0), 1.5);',
	          'vec3 atmosphere = vec3( 1.0, 1.0, 1.0 ) * intensity;',
	          'float d = clamp(pow(max(0.0,(diffuse.r-0.062)*10.0), 2.0)*5.0, 0.0, 1.0);',
	          'gl_FragColor = vec4( /*(d*vec3(i)) + ((1.0-d)*diffuse)*/ diffuse + atmosphere, 1.0 );',
	        '}'
	      ].join('\n')
	    },
	    'continents' : {
	      uniforms: {},
	      vertexShader: [
	        'varying vec3 vNormal;',
	        'void main() {',
	          'vec4 pos = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );',
	          'vNormal = normalize( normalMatrix * normalize( position ));',
	          'gl_Position = pos;',
	        '}'
	      ].join('\n'),
	      fragmentShader: [
	        'varying vec3 vNormal;',
	        'void main() {',
	          'float i = 0.8-pow(clamp(dot( vNormal, vec3( 0, 0, 1.0 )), 0.0, 1.0), 0.7);',
	          'gl_FragColor = vec4(i);',
	          'gl_FragColor.a = 1.0;',
	        '}'
	      ].join('\n')
	    }
	};

	this.imgDir			=	'assets/img/';

	this.init();
};

DAT.prototype.init 		=	function()
{
	if(typeof this.container !== 'undefined')
	{
		this.container.style.color 	=	'#fff';
    	this.container.style.font 	=	'13px/20px Arial, sans-serif';
	}

	var shader, uniforms, material;
    this.w 	=	window.innerWidth;
    this.h 	=	window.innerHeight;

    this.camera 			=	new THREE.Camera(30, (this.w / this.h), 1, 10000);
    this.camera.position.z 	=	this.distance;

    this.vector 			=	new THREE.Vector3();

    this.scene 				=	new THREE.Scene();
    this.sceneAtmosphere 	=	new THREE.Scene();

    this.projector 			=	new THREE.Projector();

    this.particleMaterial 	=	new THREE.ParticleBasicMaterial({
    	color: 0x000000
    });

    this.geometry 			=	new THREE.Sphere(200, 40, 30);

    var shader, uniforms, material;

    shader 					=	this.Shaders['earth'];
    uniforms 				= 	THREE.UniformsUtils.clone(shader.uniforms);

    uniforms['texture'].texture 	=	THREE.ImageUtils.loadTexture(this.imgDir + 'world.jpg');

    material 				= 	new THREE.MeshShaderMaterial({
		uniforms 		: 	uniforms,
		vertexShader 	: 	shader.vertexShader,
		fragmentShader 	: 	shader.fragmentShader
	});

    this.mesh 				=	new THREE.Mesh(this.geometry, material);
    this.mesh.matrixAutoUpdate 		=	false;
    this.scene.addObject(this.mesh);



    shader 					=	this.Shaders['continents'];
    uniforms 				=	THREE.UniformsUtils.clone(shader.uniforms);

    material 				=	new THREE.MeshShaderMaterial(
    {
		uniforms 		: 	uniforms,
		vertexShader 	: 	shader.vertexShader,
		fragmentShader 	: 	shader.fragmentShader
	});

    //Todo Change getWorld function
    this.scene.addObject(this.loadTriMesh(getWorld, material));


    shader 					=	this.Shaders['atmosphere'];
    uniforms 				= 	THREE.UniformsUtils.clone(shader.uniforms);

    material 				=	new THREE.MeshShaderMaterial(
    {
		uniforms 		: 	uniforms,
		vertexShader 	: 	shader.vertexShader,
		fragmentShader 	: 	shader.fragmentShader
	});

    this.mesh					=	new THREE.Mesh(this.geometry, material);
    this.mesh.scale.x 			= 	this.mesh.scale.y 	= 	this.mesh.scale.z = 1.1;
    this.mesh.flipSided 		=	true;
    this.mesh.matrixAutoUpdate	=	false;
    this.mesh.updateMatrix();
    this.sceneAtmosphere.addObject(this.mesh);

    this.sceneAtmosphere.addObject(this.loadLineMesh(getCoast, new THREE.LineBasicMaterial(
    {
		linewidth 	: 	2,
		color 		: 	0xffffff, 
		opacity 	: 	0.8
    })));

	this.geometry 			= 	new THREE.Cube(0.75, 0.75, 1, 1, 1, 1, null, false, {px: true, nx: true, py: true, ny: true, pz: false, nz: true});

    for (var i = 0; i < this.geometry.vertices.length; i++)
    {
      var vertex 			=	this.geometry.vertices[i];
      vertex.position.z 	+=	0.5;
    }

    this.point					=	new THREE.Mesh(this.geometry);

    this.renderer 				=	new THREE.WebGLRenderer({antialias: true});
    this.renderer.autoClear 	=	false;
    this.renderer.setClearColorHex(0x000000, 0.0);
    this.renderer.setSize(this.w, this.h);

    this.renderer.domElement.style.position 	=	'absolute';

    var coastLine = getCoast();

    this.is_animated 	= false;
    this._baseGeometry 	=	new THREE.Geometry();
    this.createPoints();

    this.container.appendChild(this.renderer.domElement);

    this.container.addEventListener('mousedown', this.onMouseDown.bind(this), false);

    this.container.addEventListener('mousewheel', this.onMouseWheel.bind(this), false);

    document.addEventListener('keydown', this.onDocumentKeyDown.bind(this), false);

    window.addEventListener('resize', this.onWindowResize.bind(this), false);
    var self	=	this;

    this.container.addEventListener('mouseover', function()
    {
    	self.overRenderer 	=	true;
    }, false);

    this.container.addEventListener('mouseout', function() 
    {
    	self.overRenderer 	=	false;
    }, false);

    this.__defineGetter__('time', function()
	{
	    return this._time || 0;
	});

 	this.__defineSetter__('time', function(t)
 	{
	    var validMorphs 	=	[];
	    var morphDict 		= 	this.points.morphTargetDictionary;

	    for(var k in morphDict)
	    {
			if(k.indexOf('morphPadding') < 0)
	        	validMorphs.push(morphDict[k]);
	    }

	    validMorphs.sort();
	    var l 			=	validMorphs.length-1;
	    var scaledt 	=	t * l + 1;
	    var index 		=	Math.floor(scaledt);

	    for(i = 0; i < validMorphs.length; i++)
	    {
	      this.points.morphTargetInfluences[validMorphs[i]] 	=	0;
	    }

	    var lastIndex 	=	index - 1;
	    var leftover 	=	scaledt - index;

	    if(lastIndex >= 0)
	      this.points.morphTargetInfluences[lastIndex]			=	1 - leftover;	    

	    this.points.morphTargetInfluences[index]	=	leftover;
	    this._time									=	t;
	});
};

DAT.prototype.createPoints 	=	function()
{
	if (this._baseGeometry !== undefined)
	{
		if(this.is_animated === false)
		{
			this.points 	=	new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial(
			{
				color 			: 	0xffffff,
				vertexColors 	: 	THREE.FaceColors,
				morphTargets 	: 	false
			}));
		} 
		else 
		{
			if (this._baseGeometry.morphTargets.length < 8) 
			{
				console.log('t l',this._baseGeometry.morphTargets.length);

				var padding = 8 - this._baseGeometry.morphTargets.length;

				console.log('padding', padding);

				for(var i = 0; i <= padding; i++) 
				{
					console.log('padding',i);
					this._baseGeometry.morphTargets.push({'name': 'morphPadding'+i, vertices: this._baseGeometry.vertices});
				}
			}

			this.points 	=	new THREE.Mesh(this._baseGeometry, new THREE.MeshBasicMaterial(
								{
									color 			: 	0xffffff,
									vertexColors 	: 	THREE.FaceColors,
									morphTargets 	: 	true
								}));
		}

		this.scene.addObject(this.points);
	}
};

DAT.prototype.loadLineMesh	=	function(loader, material)
{
	var lines 	=	loader().children[0].children[0].attributes.Vertex.elements;
	var lineGeo	=	new THREE.Geometry();

	for (var i=0; i<lines.length; i+=3)
	{
		lineGeo.vertices.push(new THREE.Vertex(new THREE.Vector3(lines[i], lines[i+1], lines[i+2])));
	}

	var lineMesh 				=	new THREE.Line(lineGeo, material);

	lineMesh.type 				=	THREE.Lines;
	lineMesh.scale.x 			=	lineMesh.scale.y 	=	lineMesh.scale.z 	=	0.0000318;
	lineMesh.rotation.x 		=	-Math.PI / 2;
	lineMesh.rotation.z 		=	Math.PI;
	lineMesh.matrixAutoUpdate 	=	false;
	lineMesh.updateMatrix();
	return lineMesh;
};

DAT.prototype.loadTriMesh 	=	function(loader, material)
{
	var lines 		=	loader().children[0].children[0].attributes.Vertex.elements;
	var lineGeo 	=	new THREE.Geometry();
	
	for (var i=0; i<lines.length; i+=3) 
	{
		lineGeo.vertices.push(
			new THREE.Vertex(
				new THREE.Vector3(lines[i], lines[i+1], lines[i+2])
			)
		);
	}

	for (var i=0; i<lines.length/3; i+=3)
	{
		lineGeo.faces.push(new THREE.Face3(i, i+1, i+2, null, null));
	}

	lineGeo.computeCentroids();
	lineGeo.computeFaceNormals();
	lineGeo.computeVertexNormals();
	lineGeo.computeBoundingSphere();

	var lineMesh 				=	new THREE.Mesh(lineGeo, material);

	lineMesh.type 				=	THREE.Triangles;
	lineMesh.scale.x 			=	lineMesh.scale.y 	=	lineMesh.scale.z 	=	0.0000319;
	lineMesh.rotation.x 		=	-Math.PI /	2;
	lineMesh.rotation.z 		=	Math.PI;
	lineMesh.matrixAutoUpdate 	=	false;
	lineMesh.doubleSided		=	true;
	lineMesh.updateMatrix();
	return lineMesh;
};

DAT.prototype.addData 		=	function(data, opts)
{
	var lat, lng, size, color, i, step, colorFnWrapper;
	opts.animated 		= 	opts.animated || false;
    this.is_animated 	=	opts.animated;

    opts.format 		= 	opts.format || 'magnitude'; // other option is 'legend'
    console.log(opts.format);

    if(opts.format === 'magnitude')
    {
		step 	=	3;
		colorFnWrapper	=	function(data, i) { return colorFn(data[i+2]); }
    }
    else if(opts.format === 'legend')
    {
		step = 4;
		colorFnWrapper = function(data, i) { return colorFn(data[i+3]); }
    } 
    else
    {
		throw('error: format not supported: '+opts.format);
    }

    if(opts.animated)
    {
		if(this._baseGeometry === undefined)
		{
			this._baseGeometry = new THREE.Geometry();
			for (i = 0; i < data.length; i += step)
			{
				lat = data[i];
				lng = data[i + 1];
				//size = data[i + 2];
				color = colorFnWrapper(data,i);
				size = 0;
				addPoint(lat, lng, size, color, this._baseGeometry);
			}
		}

		if(this._morphTargetId === undefined)		
			this._morphTargetId = 0;		
		else 		
        	this._morphTargetId += 1;

		opts.name 	=	opts.name || 'morphTarget'+this._morphTargetId;
    }

    var subgeo 	=	new THREE.Geometry();

    for (i = 0; i < data.length; i += step)
    {
      lat 	= 	data[i];
      lng 	= 	data[i + 1];
      color =	colorFnWrapper(data,i);
      size 	=	data[i + 2];
      size 	=	size * 200;

      this.addPoint(lat, lng, size, color, subgeo);
    }

    if(opts.animated)
		this._baseGeometry.morphTargets.push({'name': opts.name, vertices: subgeo.vertices});
    else
		this._baseGeometry = subgeo;    
};

DAT.prototype.addPointXYZ 		=	function(x, y, z, size, color, subgeo)
{
	this.point.position.x 	=	x;
	this.point.position.y 	=	y;
	this.point.position.z 	=	z;

	this.point.lookAt(this.mesh.position);

	this.point.scale.z = -size;
	this.point.updateMatrix();

	for (var i = 0; i < this.point.geometry.faces.length; i++)
	{
		this.point.geometry.faces[i].color 	=	color;
	}

	GeometryUtils.merge(subgeo, point);
};

DAT.prototype.addPoint 		=	function(lat, lng, size, color, subgeo)
{
    var phi 	=	(90 - lat) * Math.PI / 180;
    var theta	=	(180 - lng) * Math.PI / 180;

    var x = 200 * Math.sin(phi) * Math.cos(theta);
    var y = 200 * Math.cos(phi);
    var z = 200 * Math.sin(phi) * Math.sin(theta);

    return this.addPointXYZ(x, y, z, size, color, subgeo);
};

DAT.prototype.addPoint 		=	function(p, size, color, subgeo)
{
	return this.addPointXYZ(p.x, p.y, p.z, size, color, subgeo);
};

DAT.prototype.animate		=	function()
{
    requestAnimationFrame(this.animate.bind(this));
    this.render();
};

DAT.prototype.render 		=	function()
{
	this.zoom(this.curZoomSpeed);

    this.rotation.x 	+=	(this.target.x - this.rotation.x) * 0.1;
    this.rotation.y 	+=	(this.target.y - this.rotation.y) * 0.1;
    this.distance 		+= 	(this.distanceTarget - this.distance) * 0.3;

    this.camera.position.x 	=	this.distance * Math.sin(this.rotation.x) * Math.cos(this.rotation.y);
    this.camera.position.y 	=	this.distance * Math.sin(this.rotation.y);
    this.camera.position.z 	=	this.distance * Math.cos(this.rotation.x) * Math.cos(this.rotation.y);

    this.vector.copy(this.camera.position);

    this.renderer.clear();
    this.renderer.render(this.scene, this.camera);
    this.renderer.render(this.sceneAtmosphere, this.camera);
};


DAT.prototype.onMouseDown 		=	function(event)
{
    event.preventDefault();
    
    handlerMouseMove	=	this.onMouseMove.bind(this);
    handlerMouseOut		=	this.onMouseOut.bind(this);
    handlerMouseUp		=	this.onMouseUp.bind(this);

    this.container.addEventListener('mousemove', handlerMouseMove, false);
    this.container.addEventListener('mouseup', handlerMouseUp, false);
    this.container.addEventListener('mouseout', handlerMouseOut, false);

    this.mouseOnDown.x 		= 	- event.clientX;
    this.mouseOnDown.y 		= 	event.clientY;

    this.targetOnDown.x 	=	this.target.x;
    this.targetOnDown.y 	=	this.target.y;

    this.clickEnabled 		= true;

    this.container.style.cursor 	=	'move';
};

DAT.prototype.onMouseMove 		=	function(event)
{
    this.mouse.x 	=	- event.clientX;
    this.mouse.y 	=	event.clientY;

    var dx 	=	this.mouseOnDown.x - (-event.clientX);
    var dy 	=	this.mouseOnDown.y - event.clientY;
    var d 	=	Math.sqrt((dx * dx) + (dy * dy));

    if(d > 5)
		this.clickEnabled 	=	false;
    

    var zoomDamp = this.distance / 1000;

    this.target.x 	=	this.targetOnDown.x + (this.mouse.x - this.mouseOnDown.x) * 0.005 * zoomDamp * 3;
    this.target.y 	=	this.targetOnDown.y + (this.mouse.y - this.mouseOnDown.y) * 0.005 * zoomDamp * 3;

    this.target.y 	=	this.target.y > this.PI_HALF ? this.PI_HALF : this.target.y;
    this.target.y 	=	this.target.y < - this.PI_HALF ? - this.PI_HALF : this.target.y;
};

DAT.prototype.onMouseUp 		=	function(event)
{
	this.unBindMouseEvents();
	
    this.container.style.cursor = 'auto';

    if (this.clickEnabled)
    {
		var t 			=	new Date().getTime();
		var dblClick 	=	(t-this.lastClick < 300);
		this.lastClick 	=	t;

		//Event on Double click
    }
};

DAT.prototype.onMouseOut 		=	function(event)
{
	this.unBindMouseEvents();
};
 
DAT.prototype.unBindMouseEvents	=	function()
{
	this.container.removeEventListener('mousemove', handlerMouseMove, false);
    this.container.removeEventListener('mouseup', handlerMouseUp, false);
    this.container.removeEventListener('mouseout', handlerMouseOut, false);
}

DAT.prototype.onMouseWheel		=	function(event)
{
	event.preventDefault();

	if(this.overRenderer) 
		this.zoom(event.wheelDeltaY * 0.3);
    
    return false;
};

DAT.prototype.onDocumentKeyDown	=	function(event)
{
	switch (event.keyCode)
	{
		case 38:
    		this.zoom(100);
			event.preventDefault();
		break;
		case 40:
			this.zoom(-100);
			event.preventDefault();
		break;
    }
};

DAT.prototype.onWindowResize	=	function(event)
{
	console.log('resize');
    this.camera.aspect 	=	window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
};

DAT.prototype.zoom 				=	function(delta)
{
	this.distanceTarget	-=	delta;
    this.distanceTarget	= 	this.distanceTarget > 1000 ? 1000 : this.distanceTarget;
    this.distanceTarget	=	this.distanceTarget < 350 ? 350 : this.distanceTarget;
};



var webgl 	=	function(){};

webgl.prototype.init 	=	function()
{
	var container 	=	document.getElementById('globe');
    var globe 		=	new DAT();
    globe.Globe(container)
    globe.animate();
    globe.zoom(-200);
};

$(document).ready(function()
{        
	if( ! Detector.webgl)
	{
    	Detector.addGetWebGLMessage();
    }
    else
    {
    	var WebGL 	=	new webgl();
    	WebGL.init();  
    }
});