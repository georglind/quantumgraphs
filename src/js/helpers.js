"use strict";

var QG = QG || {};

// Closure
(function(QG, $, numeric){

// 
// ELMS
// 

QG.elements = QG.elements || {};

QG.elements.loading = function() { return '<div style="text-align: center; padding: 20px; font-size: 20pt"><span class="icon-spin3 animate-spin"></span></div>'; }



//////////////////////////////
// DRAWERS
//////////////////////////////

QG.Drawers = QG.Drawers || {};

// Draw vertical number axes
// Requires vertical axis styling
QG.Drawers.verticalAxis = function(axes, limits)
{
 	var d = limits[1] - limits[0];
	
	// determine number of ticks
	var scale = 1;
	if (d > 10) {scale = .5; }
	if (d > 16) {scale = .25; }
	if (d < 4) { scale = 2; }
	if (d < 2) {scale = 10; }

	// tick parameters
	var tickl = Math.ceil(limits[0]*scale);
	var tickh = Math.floor(limits[1]*scale);
	var nticks = tickh - tickl;

	// create ticks
	for (var i=0; i <= nticks; i++) {
		var pos = (-limits[0] + tickl/scale)*100/d + i*100/(d*scale)
		axes.append($('<div class="qg_tick"></div>').css({bottom: pos + '%'}));
		if ((i + tickl) % scale == 0) {
			var ticklabel = Math.round(i/scale + tickl/scale);
			axes.append($('<div class="qg_ticklabel">' +  ticklabel + '</div>').css({bottom: pos + '%'}));
		}
	}
}

//////////////////////////////
// NAVIGATION
//////////////////////////////

QG.Navigation = QG.Navigation || {};

// Radio class
QG.Navigation.Radio = function(options)
{
	var that = this;
	var radios = {};
	var index = 0;

	var settings = {uselectall: true}
	if (options !== undefined) { $.each(options, function(k, v) { settings[k] = v;}); }

	that.selected = false;

	that.add = function(mode, button, fcnon, fcnoff)
	{	
		radios[mode]= [button, fcnon, fcnoff];
		
		button.attr({'data-mode': mode}).on('mousedown touchstart', function(e)
		{
			e.preventDefault();
			that.toggle($(this).attr('data-mode'));
		});

		index++;
	}

	that.remove = function(mode) 
	{
		radios[mode][0].remove();
		if (that.selected == mode)
		{
			that.selected = false;
		}

		delete radios[mode];
	}

	that.toggle = function(mode) 
	{
		if (that.selected == mode && settings['unselectall'] !== false)
		{
			radios[mode][0].removeClass('qg_toggle');
			that.selected = false;

			if (radios[mode][2]) { radios[mode][2](mode); }
		}
		else
		{
			if (that.selected)
			{
				radios[that.selected][0].removeClass('qg_toggle');

				if (radios[that.selected][2]) { radios[that.selected][2](mode); }
			}

			radios[mode][0].addClass('qg_toggle');
			if (radios[mode][1]) { radios[mode][1](mode); }

			that.selected = mode;
		}
	};

	that.html = function(mode)
	{
		var html = [];
		$.each(radios, function(k, v) { html.push(v[0]); });
		
		return html;
	}

	that.select = function(mode)
	{
		if (that.selected !== mode) 
		{
			that.toggle(mode);
		}
	}

	that.unselect = function(mode)
	{
		if (that.selected == mode)
		{
			that.toggle(mode);
		}
	}

	that.mode = function() 
	{
		return that.selected;
	}
}

// Menu alternative to radio
var Menu = QG.Navigation.Menu = function(options) {
	var that = this;

	this.buttons = {};
	this.events = {'main': {}};
	this.mode = false;

	this.settings = $.extend({unselectall: true}, options)
	// if (options !== undefined) { settings = $.extend(settings, options); }

	that.add = function(mode, $el)
	{	
		$el.attr({'data-mode': mode});
		$el.on('mousedown touchstart', function(e){
			e.preventDefault();
			that.toggle($(this).attr('data-mode'));
		});

		this.buttons[mode]= $el;
		this.events[mode] = {};
	}

	that.remove = function(mode) 
	{
		if (!(mode in this.buttons)) return;

		this.buttons[mode][0].remove();
		if (this.mode === mode) { this.mode = false; }

		delete this.buttons[mode];
		delete this.events[mode];
	}
}

Menu.prototype.listen = function(mode, type, fcn)
{
	var event = {}; event[type] = fcn;

	$.extend(this.events[mode], event);
}

Menu.prototype.unlisten = function(mode, type)
{
	for (var mode in this.events)
	{
		if (!this.events.hasOwnProperty(mode)) {continue;}

		if (type in this.events[mode]) { delete this.events[mode][type]; }
	}
}

Menu.prototype.toggle = function(mode)
{
	if (this.mode === mode)
	{
		if (this.settings['unselectall'] === false) { return; }

		this.buttons[mode].removeClass('qg_toggle');
		var prevmode = this.mode;

		this.mode = false;

		this.trigger(prevmode, 'unselect');
		this.trigger('main', 'unselectall', prevmode);
	}
	else
	{
		var prevmode = false;
		if (this.mode)
		{
			this.buttons[this.mode].removeClass('qg_toggle');
			prevmode = this.mode;
		}

		this.buttons[mode].addClass('qg_toggle');

		this.mode = mode;

		if (prevmode) 
		{ 
			this.trigger(prevmode, 'unselect');
			this.trigger('main', 'unselect', prevmode);
		}

		this.trigger(this.mode, 'select');
		this.trigger('main', 'select', this.mode);
	}

	this.trigger('main', 'change', this.mode);
};

Menu.prototype.select = function(mode)
{
	if (this.mode !== mode) { this.toggle(mode); }
}

Menu.prototype.unselect = function(mode)
{
	if (this.mode == mode) { this.toggle(mode); }
}

Menu.prototype.trigger = function(mode, type, options)
{
	if (!(mode in this.events)) { return; }
	if (!(type in this.events[mode])) {return; }

	this.events[mode][type](options);
}

//////////////////////////////
// TEXT
//////////////////////////////

QG.Text = QG.Text || {};

// Determine pixelwidth of text element
QG.Text.pixelWidth = function(text, font, fontsize)
{
  	var o = $('<div>' + text + '</div>')
            .css({'position': 'absolute', 'float': 'left', 'white-space': 'pre', 'visibility': 'hidden', 'font': font, 'font-size': fontsize})
            .appendTo($('body')),
    	w = o.width();

	o.remove();

	return w;
};

QG.Text.escape = function(text) 
{
	text = '' + text;

	var replace = {
    	'&': '&amp;',
    	'<': '&lt;',
    	'>': '&gt;',
    	'`': '&#x60;',
    	"'": '&#x27;',
	    '"': '&quot;'
  	};

    var keys = $.map(replace, function(v, i){ return i; });
  	
	var escaper = function(match) {
      return replace[match];
    };

    var regm = '(?:' + keys.join('|') + ')';
    var replacer = RegExp(regm, 'g');
    var tester = RegExp(regm);
    
    return tester.test(text) ? text.replace(replacer, escaper) : text;
};

// Formatter
QG.Text.format = function(input, options)
{
	var settings = {
		decimals: 2,
		separator: '.',
		negative: '-'
	}

	settings = $.extend({}, settings, options);

	// from wNumb a very good and nice formatter :) Use that instead perhaps?
	var originalInput = input, inputIsNegative, inputPieces, inputBase, inputDecimals = '';
	var output = '';

	// Rounding away decimals might cause a value of -0
	// when using very small ranges. Remove those cases.
	if ( settings.decimals !== false && parseFloat(input.toFixed(settings.decimals)) === 0 ) {
		input = 0;
	}

	// Formatting is done on absolute numbers,
	// decorated by an optional negative symbol.
	if ( input < 0 ) {
		inputIsNegative = true;
		input = Math.abs(input);
	}

	// Reduce the number of decimals to the specified option.
	if ( settings.decimals !== false ) {
		input = toFixed( input, settings.decimals );
	}

	// Transform the number into a string, so it can be split.
	input = input.toString();

	// Break the number on the decimal separator.
	if ( input.indexOf('.') !== -1 ) {
		inputPieces = input.split('.');

		inputBase = inputPieces[0];

		if ( settings.separator ) {
			inputDecimals = settings.separator + inputPieces[1];
		}
	} else {
		// If it isn't split, the entire number will do.
		inputBase = input;
	}

	// Normal negative option comes after the prefix. Defaults to '-'.
	if ( inputIsNegative && settings.negative ) {
		output += settings.negative;
	}

	// Append the actual number.
	output += inputBase;
	output += inputDecimals;

	return output;

	function toFixed (val, decimals) {
		var scale = Math.pow(10, decimals);
		return ( Math.round(val * scale) / scale).toFixed( decimals );
	};
}

//////////////////////////////
// TIMING
//////////////////////////////

QG.Timing = QG.Timing || {};

// Queue Class
QG.Timing.Queue = function()
{
	var that = this;
	var busy = false;
	var interval = false;
	var timing = 5;
	var queue = [];

	var nadded = 0;
	var nrun = 0;

	this.run = function(retime)
	{
		if (interval) return;
		if (retime !== undefined) { timing = parseInt(retime); }
		
		busy = false;
		interval = setInterval(step, timing);
	};

	function step()
	{	
		if (queue.length < 1) 
		{
			clearInterval(interval);
			interval = false;
			busy = false;
			return;
		}
		if (busy) { return; }
		busy = true;

		var fcn = queue.shift();
		
		fcn[0].apply(fcn[1], fcn[2]);
		nrun += 1;

		busy = false;
		console.log('Queue: ran ' + nrun + ' out of ' + nadded + ' added. Queue length: ' + queue.length);
	};

	this.add = function(fcn, scope, vars)
	{
		queue.push([fcn, scope, vars]);
		nadded += 1;
	};

	this.clear = function()
	{
		queue = [];
	};
};

// Queue Class
// QG.Timing.Queue = function()
// {
// 	var that = this;
// 	that.busy = false;
// 	var interval = false;
// 	var timing = 5;
// 	var queue = [];

// 	var nadded = 0;
// 	var nrun = 0;

// 	that.run = function(retime)
// 	{
// 		if (interval) return;
// 		if (retime !== undefined) { timing = parseInt(retime); }
		
// 		that.busy = false;
// 		// console.log(timing)
// 		interval = setInterval(that.step, timing);
// 	}

// 	that.step = function()
// 	{	
// 		if (queue.length < 1) 
// 		{
// 			clearInterval(interval);
// 			interval = false;
// 			that.busy = false;
// 			return;
// 		}
// 		if (that.busy) { return; }
// 		that.busy = true;

// 		var fcn = queue.shift();
		
// 		fcn[0].apply(fcn[1], fcn[2]);
// 		nrun += 1;

// 		console.log('Queue: ran ' + nrun + ' out of ' + nadded + ' added. Queue length: ' + queue.length);
// 	}

// 	that.add = function(fcn, scope, vars)
// 	{
// 		// defaults
// 		if (vars == undefined) { vars = []; }

// 		// callback
// 		vars.push(that.relax);
		
// 		queue.push([fcn, scope, vars]);

// 		nadded += 1;
// 	}

// 	that.relax = function()
// 	{
// 		that.busy = false;
// 	}

// 	that.clear = function()
// 	{
// 		queue = [];
// 	}
// }

//////////////////////////////
// MATH
//////////////////////////////

QG.Math = QG.Math || {};

// Eigenfunctions
QG.Math.eig = function(H) {

	// Return if H is not defined
	if (!H || H.x.length < 1) { return false; }

	// Return direct answer if H is 1x1
	if (H.x.length == 1)
	{
		return {energies: [H.x[0][0]], orbitals: [{x: [[1]], y: [[0]]}], nrot: 0, niter: 0};
	}

	var n = H.x.length;

	// Diagonalize
	if (H.is_complex) {
		var ev = numeric.jacobi_hermitian(H, 50);
	} else  {
		var ev = numeric.jacobi_real_symmetric(H.x, 50);
		// var ev = numeric.jacobi_hermitian({x: H.x, y: numeric.rep([n,n], 0)}, 50);
	}

	// Reorder by eigenvalues
	var indices = numeric.range(0, (ev.lambda.x).length);

	indices.sort(function(a, b) { return ev.lambda.x[a] < (ev.lambda.x)[b] ? -1 : 1;  });

	var energies = [];
	var orbitals = [];

	var N = indices.length
	for (var i = 0; i < N; i++) 
	{
		var n = indices[i];
		energies[i] = ev.lambda.x[n];

		orbitals[i] = {x: ev.E.x[n], y: ev.E.y[n]};

		// for (var j = 0; j < N; j++) 
		// {
		// 	orbitals.y[i][j] = ev.E.y[n][j];
		// }
	}

	return {energies: energies, orbitals: orbitals, nrot: ev.nrot, niter: ev.niter};
}

QG.Math.modarg = function(x, y) {

	var mod = Math.sqrt(x * x + y * y);

	if (mod == 0) { return {mod: 0, arg: 0}; }

	var phi = Math.atan2(y, x)
	if (phi < 0) { phi += 2 * Math.PI}

 	return {mod: mod, arg: phi};
}

})(QG, jQuery, numeric);
