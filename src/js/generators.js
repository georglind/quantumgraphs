"use strict";

// namespace
var QG = QG || {};  

(function($, numeric, QG) {
	
QG.Generators = {
ring: function(N, d, t) {

	t = t === undefined ? 1 : t;

	// hamiltonian
	// var H = hunum.zeros_matrix(N,N);
	// for(var i=0; i<N; i++) {
	// 	H[i][(i+1) % N] = -1;
	// 	H[(i+1)%N][i] = -1;
	// }

	// // xy
	// var w = 520.0; var h = 405.0;
	// var xy = []; 
	// var fN = parseFloat(N);
	// var R = w/6.0 + 2*fN;
	// for (var i=0; i<N; i++) {
	// 	xy[i] = [Math.round(w/2.0 + R*Math.cos(i*2.0*Math.PI/fN)), Math.round(h/2.0 + R*Math.sin(i*2.0*Math.PI/fN))];
	// }

	if (isNaN(d)) { d = 1; }

	var nodes = [];
	var w = 672.0; var h = 365.0;
	var fN = parseFloat(N);
	// var R = w/6.0 + 2*fN;
	
	var R = Math.max(100, 8*fN);

	// L = R * 2 * pi / N
	for (var i=0; i<N; i++)
	{
		var x = Math.round(R*Math.cos(i*2.0*Math.PI/fN));
		var y = Math.round(R*Math.sin(i*2.0*Math.PI/fN));
		
		nodes.push([x, y, 0, {drag: true}])
	}

	var links = [];
	for (var i=0; i<N-1; i++)
	{
		links.push([i, i+1, (i % 2 == 0 ? d * t: t), 0]);
	}
	links.push([N-1, 0, (N % 2 == 1 ? d * t :  t), 0]);

	// Leads
	return {'title': 'Ring[' + N + ']', 'model': [nodes, links], 'widgets': [['Spectrum', {}], ['AddWidgets', {}]]};
}
,
chain: function(N, d, t) {
	
	t = t === undefined ? 1 : t;

	// if (isNaN(d)) { d = -1; }

	// var H = hunum.zeros_matrix(N,N);
	// for (var i=0; i< N-1; i++) {
	// 	if (i % 2 == 0) {
	// 		H[i][i+1] = -d;
	// 		H[i+1][i] = -d;
	// 	} else {
	// 		H[i][i+1] = -1;
	// 		H[i+1][i] = -1;
	// 	}
	// }

	// xy
	// var w = 520.0; var h = 405.0;
	// var xy = []; 
	// var fN = parseFloat(N);
	// for (var i=0; i<N; i++) {
	// 	var dy = -25; if (i % 2 == 0) { dy = -dy; }
	// 	var dx = 50; //10/fN + w/5.8 - 4.3*fN;
	// 	xy[i] = [Math.round(w/2.0 +dx/2 + dx*(i-N/2)), Math.round(h/2 + dy)];
	// }

	if (isNaN(d)) { d = 1; }

	var nodes = [];
	var w = 672.0; var h = 420.0;
	var fN = parseFloat(N);

	var dx = Math.min(50, 1024/fN); //10/fN + w/5.8 - 4.3*fN;	

	for (var i=0; i<N; i++)
	{
		var dy = -25; if (i % 2 == 0) { dy = -dy; }
		var x = Math.round(w/2.0 + dx/2 + dx*(i-N/2));
		var y = Math.round(h/2.0 + dy);
		
		nodes.push([x, y, 0, {drag: true}]);
	}

	var links = [];
	for (var i=0; i<N-1; i++)
	{
		links.push([i, i+1, (i % 2 == 0 ? d * t : t), 0]);
	}

	return {'title': 'Chain['+N+']', 'model': [nodes, links], 'widgets': [['Spectrum', {}], ['AddWidgets', {}]]};
},
squarelattice: function(N, M, d, t) {

	t = t === undefined ? 1 : t;

	N = parseInt(N);
	if (isNaN(M)) { M = N; }
	M = parseInt(M);
	if (isNaN(d)) { d = 1; }

	// var H = hunum.zeros_matrix(L*W, L*W);
	// for (var i = 0; i < L - 1; i++) {
	// 	for (var j = 0; j < W - 1; j++) {
	// 		var n = i*W + j;
	// 		H[n, n+W] = -d;
	// 		H[n+W, n] = -d;
	// 		if (j < W - 1) {
	// 			H[n, n+1] = -d;
	// 			H[n+1, n] = -d;
	// 		}
	// 	}
	// }

	// xy
	var w = 672.0; var h = 443.0;

	var fN = parseFloat(N);
	var fM = parseFloat(M);
	
	var dx = Math.min(Math.max(Math.min(w/(fN - 1), h/(fM - 1)), 100), 200);

	var xoff = (w - dx*(fN - 1))/2;
	var yoff = (h - dx*(fM - 1))/2;

	var nodes = [];
	var links = [];
	for (var i = 0; i < N; i++)
	{
		for (var j = 0; j < M; j++)
		{
			var idx = i*M + j;
			
			// nodes
			nodes.push([i*dx + xoff, j*dx + yoff, 0, {drag: true}]);

			// links
			if (i < N - 1)
			{
				links.push([idx, idx + M, t, 0]);
			}
			if (j < M - 1)
			{
				links.push([idx, idx + 1, t * d, 0]);
			}
		}
	}

	return {'title': 'Lattice[' + N + ', ' + M + ']', 'model': [nodes, links], 'widgets': [['Spectrum', {}], ['AddWidgets', {}]]};

},
hexagonallattice: function(N, M, d) {
	// unfinished
	N = parseInt(N);
	if (isNaN(M)) { M = N; }
	M = parseInt(M);
}
}

})(jQuery, numeric, QG);
