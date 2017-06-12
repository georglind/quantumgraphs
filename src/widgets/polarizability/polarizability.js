"use strict";

// QG namespace
var QG = QG || {};

// closure
(function($, numeric, QG) {

QG.Widgets = QG.Widgets || {};
QG.Graph = QG.Graph || {};

var Polar = QG.Widgets.Polarizability = function(setup, settings) 
{
	QG.Widget.call(this, setup, settings);

	this.name = 'Polarizability';
	this.icon = '<span>P</span>';

	this.model = setup.model;	
	this.stage = null;
	this.layers = {model: null, stage: null};

	this.settings = {
		draggable: true,
		dimensions: [446, 446, 0, 38],
	}

	// widget state
	this.state = {
		nid: null,
		level: Math.round(this.model.nodes.length/2) - 1,
		update: true,
	};

	var blur = $.proxy(this.blur, this);

	// var self = this;
	this.listenTo(this.model, 'move', blur);
	this.listenTo(this.model, 'zoom', blur);
	this.listenTo(this.model, 'refit', blur);
}	

$.extend(Polar.prototype, QG.Widget.prototype);

Polar.prototype.getBodyHeight = function() 
{
	var h = this.widget.$el.height();
	if (h == 0) { h = this.settings.dimensions[1]; }
	return h - this.settings.dimensions[3];
}

Polar.prototype.getBodyWidth = function() 
{
	var w = this.widget.$el.width();
	if (w == 0) { w = this.settings.dimensions[0]; }
	return w;
}

// render html
Polar.prototype.render = function(wrapper) 
{
	this.widget.$el = wrapper;

	// menu
	this.widget.$boxes.menu = $('<div class="qg_widget_menu"></div');

	this.widget.$boxes.menu.append('<div class="qg_widget_title">Atom-atom polarizability</div>');
	// help
	var help_button = $('<a class="qg_smallbutton" title="Help about Polarizability"><span class="icon-help-circled"></span></a>')
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

	var update = $('<a class="qg_button"><span class="icon-ccw"></span></a>')
		.on('mousedown touchstart', $.proxy(function(e)
			{
				e.preventDefault();	
				this.revaluate();
			}, this)
		);
	this.widget.$boxes.menu.append(update);

	// add menu
	this.widget.$boxes.model = $('<div class="qg_polarizability_model"></div>');
	this.widget.$boxes.control = $('<div class="qg_polarizability_controls"></div>');
	
	$.each(this.widget.$boxes, $.proxy(function(key, value) { this.widget.$el.append(value); }, this));

	// create canvas stage
	this.stage = new Kinetic.Stage({
	  container: this.widget.$boxes.model[0],   // id of this.widget.$el <div>
	  width: this.getBodyWidth(),
	  height: this.getBodyHeight() - 120
	});

	// redraw node and level selectors
	var select = $('<select name="nid"></select>');
	for (var i=0; i<this.model.nodes.length; i++)
	{
		select.append($('<option>' + (i + 1) + '</option>'));
	}

	this.widget.target = select.clone();
	this.widget.$boxes.control.append($('<p>Choose Atom: </p>').append(this.widget.target));

	this.widget.level = select.clone();
	this.widget.half = $('<a class="qg_button">½</a>')
		.on('click tap', $.proxy(function(){
			this.setLevel(Math.round(this.model.nodes.length/2));
		}, this));

	this.widget.$boxes.control.append($('<p>Highest Occupied Level: </p>').append(this.widget.level).append(' ').append(this.widget.half));
}

// Working with bands
Polar.prototype.getNode = function(id)
{
	if (this.model.nodes.length == 0) { return undefined; }

	if (id === undefined) id = this.state.nid;

	var node = this.model.nodes.find(function(elm) { return elm.id === id;});

	if (!node && this.model.nodes.length > 0) { node = this.model.nodes[0]; }

	this.state.nid = node.id;

	return node;
}

Polar.prototype.setNode = function(node)
{
	if (node) { this.state.nid = node.id; }
	
	// update html
	if (this.widget.target.val() !== node.index + 1)
	{
		this.widget.target.val(node.index + 1);
	}
}

Polar.prototype.getLevel = function()
{
	return this.state.level;
}

Polar.prototype.setLevel = function(level)
{
	if (level) { this.state.level = level; }

	// update html
	if (this.widget.level.val() !== level + 1)
	{
		this.widget.level.val(level + 1);
	}
}

/////////////////////////////////
// plot
/////////////////////////////////
Polar.prototype.drawAll = function(node, level, update)
{
	console.log('Draw polarizability state');

	this.unblur();
	
	// draw the backdrop
	if (level !== undefined) { this.state.level = level; }

	var p =this.getModelOffsetAndScale();
	this.drawModel(p.offset, p.scale);  // redraw model

	this.widget.$boxes.control.html('');

	// redraw node and level selectors
	var select = $('<select name="nid"></select>');
	
	for (var i=0; i<this.model.nodes.length; i++)
	{
		select.append($('<option>' + (i + 1) + '</option>'));
	}

	this.widget.target = select.clone();

	this.widget.target.on('change', $.proxy(function(e){
		this.state.nid = this.model.nodes[parseInt(this.widget.target.val()) - 1].id;
		this.updatePolarizability();
	}, this));	
	
	// append target to menu
	this.widget.$boxes.control.append($('<p>Choose Atom: </p>').append(this.widget.target));

	// update node
	if (node !== undefined) { this.setNode(node); }

	this.widget.level = select.clone();

	this.widget.level.on('change', $.proxy(function(e){
		this.state.level = parseInt(this.widget.level.val()) - 1;
		this.updatePolarizability();
	}, this));

	this.widget.half = $('<a class="qg_button">½</a>')
		.on('click tap', $.proxy(function(){
			this.setLevel(Math.round(this.model.nodes.length/2) - 1);
		}, this));

	this.widget.$boxes.control.append($('<p>Highest Occupied Level: </p>').append(this.widget.level).append(' ').append(this.widget.half));

	this.widget.level.val(this.state.level + 1);

	// draw the scattering state overlay
	if (update === undefined || update) this.updatePolarizability(node, this.state.level);  // update drawing
};

Polar.prototype.getModelOffsetAndScale = function()
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

Polar.prototype.drawModel = function(offset, scale) 
{
	// then create layer
	if (this.layers.model) { 
		this.layers.model.destroyChildren(); 
	} else { 
		this.layers.model = new Kinetic.FastLayer(); 
		this.stage.add(this.layers.model);
	}

	// color wheel
	// for (var i=0; i < 100; i++)
	// {
	// 	var rgb = QG.Color.HSVtoRGB(3.6*i, .5, .6);
	// 	var circle = new Kinetic.Circle({
	// 		x: 60 + 20*Math.cos(Math.PI * i / 50),
	// 		y: 40 + 20*Math.sin(Math.PI * i / 50),
	// 		radius: 6,
	// 		fill: 'rgb(' + rgb.join() + ')',
	// 	});

	// 	this.layers.model.add(circle);
	// }

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

	// draw links
	for (var i=0; i < this.model.nodes.length; i++)
	{	
		var pos = this.model.nodes[i].getPos();

		var text = new Kinetic.Text({
			x: offset[0] + Math.round(pos[0]*scale) + 5,
			y: offset[1] + Math.round(pos[1]*scale) + 5,
			text: this.model.nodes[i].index + 1,
			fontsize: 9,
			width: 24,
			align: 'center',
			fill: '#5b6879'
		});
		this.layers.model.add(text);
	}

	// // draw extras
	// for (var i=0; i < this.model.extras.length; i++)
	// {
	// 	if (this.model.extras[i].is('band')) 
	// 	{
	// 		var pos = this.model.extras[i].getPos();
	// 		var circle = new Kinetic.Circle({
	// 			x: offset[0] + Math.round(pos[0]*scale),
	// 			y: offset[1] + Math.round(pos[1]*scale),
	// 			radius: 10,
	// 			fill: this.model.extras[i].getColor()
	// 		});
	// 		this.layers.model.add(circle);

	// 		if (this.model.extras[i].id == this.state.bid) 
	// 		{
	// 			var text = new Kinetic.Text({
	// 				x: offset[0] + Math.round(pos[0]*scale) - 8,
	// 				y: offset[1] + Math.round(pos[1]*scale) - 6,
	// 				text: this.model.extras[i].getLabel(),
	// 				fontsize: 7,
	// 				width: 16,
	// 				align: 'center'
	// 			});
	// 			this.layers.model.add(text);
	// 		}
	// 	}
	// }

	this.layers.model.draw();
}


Polar.prototype.updatePolarizability = function(node, level) 
{
	if (this.state.blurred === true) { this.drawAll(); return; }

	if (level !== undefined) { this.state.level = level; }

	var Es = this.setup.getEigenValues();

	if (!this.setup.getEigenStatus()) return;

	var level = this.state.level;
	while(level <= Es.length - 2 && Es[level] + .02 >  Es[level + 1]) { level += 1; }
	this.state.level = level;
	this.widget.level.val(this.state.level + 1);

	if (!node) { node = this.getNode(); }

	if (!node) return;

	var res = this.getPolarizability(node, this.state.level);   // calculate transmission

	if (res === false) { return false; }

	var p = this.getModelOffsetAndScale();

	this.drawOrbital(res, p.offset, p.scale, node.index);
}

Polar.prototype.drawOrbital = function(orbital, offset, scale, nidx)
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
			r = Math.sqrt(w.mod) * (4 + 40 * scale);

		var circle = new Kinetic.Circle({
			x: x,
			y: y,
			fill: 'rgb(' + rgb.join() + ')',
			radius: r,
			zindex: 10
		});

		// var line= new Kinetic.Line({
		// 	points: [x, y, x + Math.cos(w.arg) * r, y + Math.sin(w.arg) * r],
		// 	stroke: 'black',
		// 	strokeWidth: 2,
		// 	zindex: 10
		// });
		this.layers.state.add(circle);

		if (nidx !== undefined && nidx == i) {
			rgb[0] += 70; rgb[1] += 70; rgb[2] += 70;

			var dark = new Kinetic.Circle({
				x: x,
				y: y,
				fill: '#324258',
				radius: Math.max(r - 4, 0),
				zindex: 10
			});
			this.layers.state.add(dark);
		}
		
		// this.layers.state.add(line);
	}

	this.layers.state.draw();
}

Polar.prototype.getEnergyScale = function(energies)
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

/////////////////////////////////
// calculate
/////////////////////////////////

// transmission
Polar.prototype.getPolarizability = function(node, level)
{
	var cs = this.setup.getEigenVectors();
	var Es = this.setup.getEigenValues();

	if (!this.setup.getEigenStatus()) return;

	// System size
	var Nn = this.model.nodes.length;
	var res = numeric.rep([Nn], 0)

	if (level == Nn - 1) { return {x: res, y: res}; }

	var r = node.index;
	
	for (var s=0; s < Nn; s++)
	{
		for (var j=0; j<=level; j++)
		{
			for (var k = level+1; k < Nn; k++)
			{
				res[s] -= 4 * (cs[j].x[r]*cs[j].x[s] + cs[j].y[r]*cs[j].y[s])* (cs[k].x[r]*cs[k].x[s] + cs[k].y[r]*cs[k].y[s]) / (Es[k] - Es[j]);
			}
		}
	}

	return {x: res, y: numeric.rep([Nn], 0)};
}

Polar.prototype.refit = function()
{
	this.stage.setWidth(this.getBodyWidth());
	this.stage.setHeight(this.getBodyHeight() - 120);
}

/////////////////////////////////
// revaluate/re-render the widget
/////////////////////////////////
Polar.prototype.revaluate = function(node, level) 
{
	// no band
	if (!node) {
		var node = this.getNode();
	}

	// we have a band?
	if (node)
	{	
		console.log('revaluate polarizability');

		this.drawAll(node, level);
	}
}

Polar.prototype.blur = function()
{
	this.state.blurred = true;
	this.widget.$el.addClass('qg_blurred');
}

Polar.prototype.unblur = function()
{
	this.state.blurred = false;
	this.widget.$el.removeClass('qg_blurred');
}


// dump/save widget
Polar.prototype.dump = function()
{
	var nidx = this.getNode().index;
	var lvl = this.getLevel();
		
	return {'n': nidx, 'l': lvl};
}

// load widget
Polar.prototype.load = function(opts)
{	
	this.setNode(this.model.nodes[opts['n']]);
	this.setLevel(opts['l']);
}

	// reset
Polar.prototype.reset = function() 
{
	// widget_plot.html('');
}

// kill
Polar.prototype.kill = function() 
{
	this.setup.removeWidget(this.id);
	this.widget.$el.remove();
}

})(jQuery, numeric, QG);
