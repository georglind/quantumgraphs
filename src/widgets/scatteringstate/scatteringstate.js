"use strict";

// QG namespace
var QG = QG || {};

// closure
(function($, numeric, QG) {

QG.Widgets = QG.Widgets || {};
QG.Graph = QG.Graph || {};

var Scat = QG.Widgets.ScatteringState = function(setup, settings) 
{
	QG.Widget.call(this, setup, settings);

	this.name = 'ScatteringState';
	this.icon = '<span>Sc</span>';

	this.model = setup.model;	
	this.stage = null;
	this.layers = {model: null, stage: null};

	this.settings = {
		dimensions: [446, 446, 0, 38],
		help_text: '<p>A particle in <em>one</em> band scatters off your graph. Here, you can inspect the resulting scattered wave as a function of the particle energy.</p><p>You just need to add (at least) one "incoming" band:<ol><li>Choose <span class="qg-icon"><span class="icon-graphnode yellow-text"></span></span> in the draw menu.</li><li>Add some bands to your graph.</li><li>Connect them to your graph.</li><li>Finally, choose one of the bands as "incoming" by clicking the <span class="qg-icon">?</span> up top.</li></ol></p>'
	}

	// widget state
	this.state = {
		bid: undefined,
		omega: 0,
		help: true,
		update: true,
		log: false,
		bid: null,
	};

	var blur = $.proxy(this.blur, this);
	// var self = this;
	this.listenTo(this.model, 'move', blur);
	this.listenTo(this.model, 'zoom', blur);
}	

$.extend(Scat.prototype, QG.Widget.prototype);

Scat.prototype.getBodyHeight = function() 
{
	var h = this.widget.$el.height();
	if (h == 0) { h = this.settings.dimensions[1]; }
	return h - this.settings.dimensions[3];
}

Scat.prototype.getBodyWidth = function() 
{
	var w = this.widget.$el.width();
	if (w == 0) { w = this.settings.dimensions[0]; }
	return w - this.settings.dimensions[2];
}

// render html
Scat.prototype.render = function(wrapper) 
{
	this.widget.$el = wrapper;

	var bands = this.getAllBands ();

	// Choose continuas
	if (bands.length > 0) { this.state.bid = bands[0].id; }
	
	// menu
	this.widget.$boxes.menu = $('<div class="qg_widget_menu"></div');

	this.widget.$boxes.menu.append('<div class="qg_widget_title">Scattering state</div>');
	
	var help_button = $('<a class="qg_smallbutton" title="Help Scattering State"><span class="icon-help-circled"></span></a>')
		.on('click tab', $.proxy(function(e){
			var elms = {'title' : $('<span/>'), 'body': $('<div/>')};
			QG.Dialog(elms.title, elms.body);
			QG.Docs.showasync(this.name, elms);
		}, this));

	this.widget.$boxes.menu.append(help_button);

	this.widget.$boxes.menu.append(
		$('<a class="qg_button" onclick=""><span class="icon-cancel"></span></a>')
		.on('mousedown touchstart', $.proxy(function(e) {
			e.preventDefault();
			this.kill();
		}, this))
	);

	this.widget.target = $('<a class="qg_button" onclick=""></a>');

	this.widget.target.on('mousedown touchstart', $.proxy(function(e) {
		e.preventDefault();

		var incoming = new QG.Navigation.Radio({unselectall: false});

		// iterate all bands
		var bands = this.getAllBands ();
		var Nb = bands.length;
		for (var i = 0; i < Nb; i++)
		{	
			var id = bands[i].id;
			var lbl = bands[i].getLabel();
			var button = $('<a class="qg_togglebutton">' + lbl + '</a>');
			incoming.add(lbl, button, $.proxy(function(val) 
			{
				var bands = this.getAllBands();
				var band = bands.find(function(elm) { return elm !== undefined && elm.getLabel() == val; });
				
				if (band.id != this.state.bid) 
				{
					this.updateBand(band);
					this.revaluate(band);
				}
			}, this));
		}

		var band = this.getBand();
		if (band) { incoming.select(band.getLabel()); }

		var content = $('<div></div>')
			.append($('<p>Choose transmission band:</p>'))
			.append($('<div class="row"/>').append(incoming.html()))
			.append('<div class="row"><span class="icon-down-big"></span></div>')
			.append('<div class="qg_transport_model">Model</div>')
			.append('<div class="row"><span class="icon-down-big"></span></div>');
			
		QG.Dialog('Incoming band', content);

	}, this));

	this.updateBand(); // set band to value 
	
	// append target to menu
	this.widget.$boxes.menu.append(this.widget.target);

	var update = $('<a class="qg_button"><span class="icon-ccw"></span></a>')
		.on('mousedown touchstart', $.proxy(function(e)
			{
				e.preventDefault();	
				this.revaluate();
			}, this)
		);
	this.widget.$boxes.menu.append(update);

	// add menu
	this.widget.$boxes.model = $('<div class="qg_scattering_model"></div>');
	this.widget.$boxes.model.html(this.settings.help_text);

	this.widget.$boxes.slider = $('<div class="qg_scattering_slider"></div>');

	$.each(this.widget.$boxes, $.proxy(function(key, value) { this.widget.$el.append(value); }, this));
}

// Working with bands
Scat.prototype.getAllBands = function()
{
	var bands = [];
	for (var i = 0; i < this.model.extras.length; i++)
	{
		if (this.model.extras[i].is('band'))
		{
			bands.push(this.model.extras[i]);
		}
	}
	return bands;
}

// Get continua
Scat.prototype.getBand = function()
{
	var band = null;

	if (this.state.bid !== null)
	{
		var bid = this.state.bid;
		band = this.model.extras.find(function(elm) { return elm.id === bid;});
	}

	return band;
}

Scat.prototype.setBand = function(band)
{
	if (band) { this.state.bid = band.id; }
	
	// update html
	this.widget.target.text(this.getBandText(band));
}

// set continua
Scat.prototype.updateBand = function(band)
{
	if (!band) { band = this.getBand(); }
	
	this.setBand(band);
}

// continua text
Scat.prototype.getBandText = function(band)
{
	return (band === null ? '?' : band.getLabel());
}

/////////////////////////////////
// plot
/////////////////////////////////
Scat.prototype.drawAll = function(bin, omega)
{
	console.log('Draw scattering state');

	this.unblur();
	
	// draw the backdrop
	if (omega !== undefined) { this.state.omega = omega; }

	var p =this.getModelOffsetAndScale();
	this.drawModel(p.offset, p.scale);  // redraw model

	this.widget.$boxes.slider.html(''); // reset slider
	this.drawSlider(this.widget.$boxes.slider);  // draw new slider

	// draw the scattering state overlay
	this.updateState(bin, this.state.omega);  // update drawing
};

Scat.prototype.getModelOffsetAndScale = function()
{
	// stage sizze
	var mh = this.model.getStageHeight();
	var mw = this.model.getStageWidth();

	// this size
	var h = this.getBodyHeight() - 100;
	var w = this.getBodyWidth();

	// scale
	var s = Math.min(w/mw, h/mh);		

	// model layer
	var ls = this.model.getLayerScale();
	var lpos = this.model.getLayerPosition();

	lpos = [lpos.x*s, lpos.y*s];
	
	if (h/mh > w/mw) 
	{
		lpos[1] += (h - s*mh)/2;
	}
	else
	{
		lpos[0] += (w - s*mw)/2;
	}

	return {'offset': lpos, 'scale': s*ls};
}

Scat.prototype.drawModel = function(offset, scale) 
{
	// then create layer
	if (this.layers.model) { 
		this.layers.model.destroyChildren(); 
	} else { 
		this.layers.model = new Kinetic.FastLayer(); 
		this.stage.add(this.layers.model);
	}

	// color wheel
	for (var i=0; i < 100; i++)
	{
		var rgb = QG.Color.HSVtoRGB(3.6*i, .5, .6);
		var circle = new Kinetic.Circle({
			x: 60 + 20*Math.cos(Math.PI * i / 50),
			y: 40 + 20*Math.sin(Math.PI * i / 50),
			radius: 6,
			fill: 'rgb(' + rgb.join() + ')',
		});

		this.layers.model.add(circle);
	}

	// draw links
	for (var i=0; i < this.model.links.length; i++)
	{
		var p1 = this.model.links[i].nodes[0].getPos();
		var p2 = this.model.links[i].nodes[1].getPos();

		var line = new Kinetic.Line({
			points: [offset[0] + Math.round(p1[0]*scale), offset[1] + Math.round(p1[1]*scale), offset[0] + Math.round(p2[0]*scale), offset[1] + Math.round(p2[1]*scale)],
			strokeWidth: this.model.links[i].getWidth() * scale * 0.8,
			stroke: this.model.links[i].getColor()
		});

		if (this.model.links[i].nodes[0].is('dash') || this.model.links[i].nodes[1].is('dash'))
		{
			line.dash([10, 5]);	
		}
	
		this.layers.model.add(line);
	}

	// draw extras
	for (var i=0; i < this.model.extras.length; i++)
	{
		if (this.model.extras[i].is('band')) 
		{
			var pos = this.model.extras[i].getPos();
			var circle = new Kinetic.Circle({
				x: offset[0] + Math.round(pos[0]*scale),
				y: offset[1] + Math.round(pos[1]*scale),
				radius: 10,
				fill: this.model.extras[i].getColor()
			});
			this.layers.model.add(circle);

			if (this.model.extras[i].id == this.state.bid) 
			{
				var text = new Kinetic.Text({
					x: offset[0] + Math.round(pos[0]*scale) - 8,
					y: offset[1] + Math.round(pos[1]*scale) - 6,
					text: this.model.extras[i].getLabel(),
					fontsize: 7,
					width: 16,
					align: 'center'
				});
				this.layers.model.add(text);
			}
		}
	}

	this.layers.model.draw();
}

Scat.prototype.updateState = function(bin, omega) 
{
	if (this.state.blurred === true) { this.drawAll(); return; }

	if (omega !== undefined) { this.state.omega = omega; }

	console.log('update scattering state');	

	if (!bin) { bin = this.getBand(); }

	var res = this.getScatteringState(bin, this.state.omega);   // calculate transmission

	if (res === false) { return false; }

	var p = this.getModelOffsetAndScale();

	this.drawOrbital(res, p.offset, p.scale);
}

Scat.prototype.drawOrbital = function(orbital, offset, scale)
{
	// destroy previous layer
	if (this.layers.state) { 
		this.layers.state.destroyChildren(); 
	} else { 
		this.layers.state = new Kinetic.FastLayer();
		this.stage.add(this.layers.state);
		
	}

	// init new layer
	var N = orbital.x.length;

	for (var i=0; i < N; i ++)
	{
		var p = this.model.nodes[i].getPos();

		var w = QG.Math.modarg(orbital.x[i], orbital.y[i])

		if (i == 0) { var arg0 = w.arg; w.arg = 0; } 
		else { w.arg = ((w.arg - arg0) + 2 * Math.PI) % (2 * Math.PI); }

		var rgb = QG.Color.HSVtoRGB(w.arg * 180 / Math.PI, .7, .8);

		var x = p[0] * scale + offset[0], 
			y = p[1] * scale + offset[1],
			r = Math.sqrt(w.mod) * (4 + 20 * scale);

		var circle = new Kinetic.Circle({
			x: x,
			y: y,
			fill: 'rgb(' + rgb.join() + ')',
			radius: r,
			zindex: 10
		});

		var line= new Kinetic.Line({
			points: [x, y, x + Math.cos(w.arg) * r, y + Math.sin(w.arg) * r],
			stroke: 'black',
			strokeWidth: 2,
			zindex: 10
		});

		this.layers.state.add(circle);
		this.layers.state.add(line);
	}

	this.layers.state.draw();
}

Scat.prototype.getEnergyScale = function(energies)
{
	var xlim = [-1, 1];
	if (energies !== false)
	{
		var min = Math.min.apply(null, energies);
		var max = Math.max.apply(null, energies);
		var xlim = [min - .1*(max - min), max + .1*(max - min)];

		if (xlim[1] - xlim[0] < 1)
		{
			var avg = (xlim[1] + xlim[0])/2;
			xlim[1] = avg - 1;
			xlim[0] = avg + 1;
		}
	}

	return xlim;
}

Scat.prototype.drawSlider = function(wrap)
{
	var xlim = this.getEnergyScale(this.setup.getEigenValues());
	var xmin = Math.floor(xlim[0]);
	var xmax = Math.ceil(xlim[1]);

	xmin = xmin < -1 ? xmin : -1;
	xmax = xmax > 1 ? xmax : 1;

	var values = Array(xmax - xmin + 1);
	for (var i = 0; i < xmax - xmin + 1; i ++) { values[i] = i + xmin; }

	// slider
	var slider = $('<div class="qg_slider"></div>');
	var show = $('<input type="text" size="6" class="qg_slider_show"></input>');

	slider.noUiSlider(
	{
		connect: false,
		behaviour: 'touchstart',
		step: .021,
		tooltip: true,
		start: this.state.omega,
		range: {
			'min': [xmin],
			'max': [xmax]
		}
	});

	slider.noUiSlider_pips(
	{
		mode: 'values',
		values: values,
		density: 3
	});

	slider.Link('lower').to(show);

	var self = this;
	slider.on('slide set', function() 
	{
		var data = slider.val();
		// console.log('slide update')
		self.updateState(undefined, parseFloat(data));
	});

	wrap.append(slider);

	// add state indications on some layer
	if (this.setup.getEigenStatus())
	{
		var energies = this.setup.getEigenValues();
		
		var N = energies.length;

		var w = this.getBodyWidth();
		var h = this.getBodyHeight() - 100;
		var offset = 39;

		for (var i = 0; i < N; i++) {
			var E = energies[i];

			var x = (E - xmin) / (xmax-xmin) * (w - 2 * offset) + offset;
			
			var line= new Kinetic.Line({
				points: [x, h -4 , x, h - 12],
				stroke: 'red',
				strokeWidth: 2,
				zindex: 10
			});

			this.layers.model.add(line);
		}

		this.layers.model.batchDraw();
	}
}

/////////////////////////////////
// calculate
/////////////////////////////////

// transmission
Scat.prototype.getScatteringState = function(band, omega)
{
	// System size
	var Nn = this.model.nodes.length;
	var N = 0;
	for (var i = 0; i < Nn; i++)
	{
		if (this.model.nodes[i].index !== undefined)
		{
			N++;
		}
	}

	// Hamiltonian
	var h = this.model.H;
	var sigma = this.model.sigma();
	var coupling = this.model.couplings(band.getLabel())[0];
	
	// coupling matrix

		
	var id = numeric.identity(N); 		// matrix identity
	// Complex inverse by solution for (x + i y) of the equation:
	// (Re + i Im) (x + i y) = (a + i b)
	// By a 2Nx2N method:
	//	[ Re, -Im ] . [ x ]  = [ a ]
	//	[ Im,  Re ]   [ y ]    [ b ]

	// Real part E - H
	var X = numeric.add(numeric.neg(h.x), numeric.neg(sigma.x), numeric.diag(numeric.rep([N], omega)));
	var Y = numeric.add(sigma.y, h.y);
	// Extended matrix
	var M = numeric.blockMatrix([[X, Y],[numeric.neg(Y), X]]); // this is not an error

	var rout = numeric.solve(M, coupling.array.x.concat(coupling.array.y));
		
	return {x: rout.slice(0,N), y: rout.slice(N, 2*N)};
}

Scat.prototype.refit = function()
{
	console.log('refit scattering state')
	// only update stage
	if (this.stage)
	{
		this.stage.setWidth(this.getBodyWidth());
		this.stage.setHeight(this.getBodyHeight() - 100);
	}
}

/////////////////////////////////
// revaluate/re-render the widget
/////////////////////////////////
Scat.prototype.revaluate = function(band, omega) 
{
	// no band
	if (!band) {
		var band = this.getBand();
		this.updateBand(band);
	}

	// we have a band?
	if (band)
	{
		if (this.state.help)
		{
			this.state.help = false;
			
			// create canvas stage
			this.stage = new Kinetic.Stage({
			  container: this.widget.$boxes.model[0],   // id of this.widget.$el <div>
			  width: this.getBodyWidth(),
			  height: this.getBodyHeight() - 100
			});
		}
		console.log('revaluate scatteringstate');
		this.drawAll(band, omega);
	}
	else
	{
		if (!this.state.help) {
			thiw.widget.$boxes.model.html(self.setting.help_text);	
		}
		this.state.help = true;
	}
}

Scat.prototype.blur = function()
{
	this.state.blurred = true;
	this.widget.$el.addClass('qg_blurred');
}

Scat.prototype.unblur = function()
{
	this.state.blurred = false;
	this.widget.$el.removeClass('qg_blurred');
}


// dump/save widget
Scat.prototype.dump = function()
{
	var band = this.getBand();
		
	var b = null;
	if (band) { b = band.getLabel(); }
		
	return {'b': b, 'w': this.state.omega};
}

// load widget
Scat.prototype.load = function(opts)
{	
	var b = ('b' in opts ? opts['b'] : undefined);
	var band = this.model.extras.find(function(elm) { return elm.getLabel() == b; });
	
	this.setBand(band);

	if ('w' in opts) { this.state.omega = opts['w']; }
}

	// reset
Scat.prototype.reset = function() 
{
	// widget_plot.html('');
}

// kill
Scat.prototype.kill = function() 
{
	this.setup.removeWidget(this.id);
	this.widget.$el.remove();
}

})(jQuery, numeric, QG);
