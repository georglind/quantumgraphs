"use strict";

var QG = QG || {};

(function($, numeric, QG) {

QG.Widgets = QG.Widgets || {};

/////////////////////////////
// Density
/////////////////////////////

QG.Widgets.Density  = function(setup, settings) 
{
	QG.Widget.call(this, setup, settings);

	this.name = 'Density';
	this.icon = '<span>D</span>';

	this.model = setup.model;	
	
	this.settings = {
		draggable: true,
		dimensions: [446, 446, 0, 120],
	}

	// widget state
	this.state = {};

	this.ns = numeric.rep([this.model.nodes.length], 0);

	// var blur = $.proxy(this.blur, this);

	// // var self = this;
	// this.listenTo(this.model, 'move', blur);
	// this.listenTo(this.model, 'zoom', blur);
	// this.listenTo(this.model, 'refit', blur);
}	

$.extend(QG.Widgets.Density.prototype, QG.Widget.prototype);

QG.Widgets.Density.prototype.halfFill = function()
{
	var Es = this.setup.getEigenValues();

	if (!this.setup.getEigenStatus) return;

	var N = Es.length;
	
	var ns = numeric.rep([N], 0);

	var nt = 0;
	var k = 0;
	while (nt < N) {
		for (var i = k; i < N; i ++)
		{
			if (ns[i] < 2) { break; }
		}
		k = i == 0 ? 0 : i - 1;

		if (ns[i] == 1) {

			var j = 0;
			while(ns[i + j + 1] < 1 && Es[i] + .1 > Es[i + j + 1])
			{
				j ++;
			}

			if (ns[i + j] == 0) { i = i + j;}


		}
		
		ns[i]++; 
		nt ++;
	}	

	this.ns = ns;
}

QG.Widgets.Density.prototype.render = function(wrapper)
{
	this.widget.$el = wrapper;

	var self = this;

	this.widget.$boxes.menu = $('<div class="qg_widget_menu">' +
					'<div class="qg_widget_title">Electron Density</div>' + 
					'</div');

	var help_button = $('<a class="qg_smallbutton" title="Help Density"><span class="icon-help-circled"></span></a>')
		.on('click tab', $.proxy(function(e){

			var elms = {'title' : $('<span/>'), 'body': $('<div/>')};
			
			QG.Dialog(elms.title, elms.body);
			
			QG.Docs.showasync(this.name, elms);

		}, this));

	this.widget.$boxes.menu.append(help_button);

	// half fill

	var halffill = $('<a class="qg_button" onclick="">½</a>')
		.on('click tap', function(e)
		{
			e.preventDefault();
			self.halfFill();
			self.revaluate();
		}
	);

	var remove = $('<a class="qg_button" onclick=""><span class="icon-cancel"></span></a>')
		.on('click tap', function(e)
		{
			e.preventDefault();
			self.kill();
		}
	);


	this.widget.$boxes.menu.append(remove);
	this.widget.$boxes.menu.append(halffill);

	// body
	this.widget.$boxes.body = $('<div class="qg_density"></div>');

	// Text
	this.widget.$boxes.controls = $('<div class="qg_density_controls"></div>');

	this.widget.$boxes.controls.append($('<a class="qg_density_minus"><span class="icon-minus-squared"></span></a>')
		.on('click tap', function(e) {

			e.preventDefault();
			
			var i = self.ns.length - 1;
			while(self.ns[i] == 0) {i--;}
			if (i >= 0) { self.ns[i]--; }

			self.state.overlay = true;
			
			self.revaluate();
		}));

	this.widget.$boxes.n = $('<a class="qg_density_n"></div>');
	this.widget.$boxes.controls.append(this.widget.$boxes.n)

	this.widget.$boxes.controls.append($('<a class="qg_density_plus"><span class="icon-plus-squared"></span></a>')
		.on('click tap', function(e) {
			e.preventDefault();
			
			var i = 0;
			while(self.ns[i] == 2) { i++; }
			
			if (i == self.ns.length) { return; }

			// ensures that we don't fill more states than we have	
			if (self.ns[i] == 0)
			{ 
				self.ns[i]++; 
			}
			else if (self.ns[i] == 1)
			{
				var energies = self.setup.getEigenValues();
				
				if (!self.setup.getEigenStatus()) { return; }
				
				var j = 0;
				while(self.ns[i + j + 1] < 1 && energies[i] + .1 > energies[i + j + 1])
				{
					j ++;
				}
				if (self.ns[i + j] == 0) { i = i + j;}

				self.ns[i]++;
			}

			self.state.overlay = true;
			self.revaluate();
		}));

	this.widget.$boxes.levels = $('<div class="qg_density_levels"></div>');

	// Concatenate
	this.widget.$el
		.append(this.widget.$boxes.menu)
		.append(this.widget.$boxes.body
	        .append(this.widget.$boxes.levels)
		    .append(this.widget.$boxes.controls)
		    );
}

QG.Widgets.Density.prototype.draw = function()
{
	var Es = this.setup.getEigenValues();

	if (!this.setup.getEigenStatus()){ return; }

	var d = $('<div></div>');
	var N = Es.length;

	var zero = Es[0];
	var delta = Es[N-1] - Es[0]

	var deg = 1;
	var extras = 0;

	var self = this;
	function addoneelectron(e) 
	{
		var i = $(this).data('i');
		self.ns[i] += 1;
		if (self.ns[i] > 2) {self.ns[i] = 0;}
		self.state.overlay = true;
		self.revaluate();
	}

	for(var i = 0; i < N; i++)
	{
		if (i > 0) 
		{
			if (Es[i] - 0.1 < Es[i - 1])
			{
				deg++;
			}
			else
			{
				deg = 1;
			}
		}

		if (this.ns.length < i + 1) { this.ns.push(0); }

		if (deg <= 6)
		{
			var lvl = $('<div class="qg_density_level_' + deg + '" data-i="' + i + '"></div>')
				.css({'top': (100 - 100*(Es[i] - zero)/delta - 1.5) + '%'})
		} 
		else
		{

			var lvl = $('<div class="qg_density_level_' + deg + '" data-i="' + i + '"></div>')
				.css({'bottom': extras*10 + 'px'})	
			extras += 1;
		}

		lvl.append('<div class="qg_density_line"/>');

		if (this.ns[i] == 1)
		{
			lvl.append($('<div class="qg_density_dot"><span class="down"></span></div>'));
		}
		else if (this.ns[i] == 2)
		{
			lvl.append($('<div class="qg_density_dot"><span class="down"></span><span class="up"></span></div>'));
		}

		d.append(lvl);

		lvl.on('tap click', addoneelectron);
	}

	this.widget.$boxes.levels.html(d);

	this.drawAxes(this.getBodyHeight(), [Es[0], Es[N-1]]);
}



QG.Widgets.Density.prototype.getDensity = function(ns)
{
	if (ns === undefined) { return []; }

	var orbitals = this.setup.getEigenVectors();

	if (!this.setup.getEigenStatus()) { return []; }

	var N = orbitals.length;
	
	var dnst = numeric.rep([N], 0);

	for (var n = 0; n < N; n++)
	{
		if (ns[n] > 0) 
		{
			for (var i = 0; i < N; i++)
			{
				var w = Math.abs(orbitals[n].x[i] * orbitals[n].x[i] + orbitals[n].y[i] * orbitals[n].y[i]);
				dnst[i] += ns[n]*w;
			}
		}
	}

	return dnst;
}

QG.Widgets.Density.prototype.showOverlay = function()
{
	var self = this;
	var overlay = this.model.addOverlay(self.name, self.id, '', function() { self.state.overlay = true; self.drawOverlay(); }, function() { self.state.overlay = false; });
	
	this.model.selectOverlayButton(self.name, self.id);
	
	this.drawOverlay();
}

QG.Widgets.Density.prototype.drawOverlay = function()
{
	var self = this;
	var overlay = this.model.addOverlay(this.name, this.id, '', function() { state.overlay = true; self.drawOverlay(); }, function() { state.overlay = false; });
	overlay.destroyChildren();

	var d = this.getDensity(this.ns);

	for (var i = 0; i < d.length; i++)
	{
		var pos = this.model.nodes[i].getPos();

		var fill = '#0074D9';

		var weight = new Kinetic.Circle({
			x: pos[0],
			y: pos[1],
			radius: Math.round(Math.sqrt(d[i])*22),
			fill: fill,
			draggable: false
		});

		var text = new Kinetic.Text({
			x: pos[0] - 40,
			y:  pos[1] - 6,
			text: QG.Text.format(d[i], {decimals: 2}),
			opacity: .7,
			fontStyle: 'normal',
			fontSize: 11,
			fontFamily: 'Arial',
			fill: 'white',
			align: 'center',
			width: 80
		})

		overlay.add(weight);
		overlay.add(text);
	}
	this.model.redraw();
}

QG.Widgets.Density.prototype.drawAxes = function(height, limits) {
		
	if (this.widget.$boxes.axes !== undefined)
	{
		this.widget.$boxes.axes.remove();
	}

	this.widget.$boxes.axes = $('<div class="qg_axes"></div>').css({height: height});
	
	QG.Drawers.verticalAxis(this.widget.$boxes.axes, limits)

	this.widget.$boxes.body.append(this.widget.$boxes.axes);
}

QG.Widgets.Density.prototype.refit = function()
{
	if (this.widget.$boxes.axes)
	{
		this.widget.$boxes.axes.height(this.getBodyHeight());
	}
	this.widget.$boxes.body.height(this.getBodyHeight());
	this.widget.$boxes.body.width(this.getBodyWidth());
}

QG.Widgets.Density.prototype.getBodyHeight = function() 
{
	var h = this.widget.$el.height();
	if (h == 0) { h = this.settings.dimensions[1]; }
	return h - this.settings.dimensions[3];
}

QG.Widgets.Density.prototype.getBodyWidth = function() 
{
	var w = this.widget.$el.width();
	if (w == 0) { w = this.settings.dimensions[0]; }
	return w;
}

QG.Widgets.Density.prototype.hide = function() {
	this.widget.$el.hide();
	this.model.removeOverlay(this.name, this.id);
}

QG.Widgets.Density.prototype.revaluate = function()
{
	var energies = this.setup.getEigenValues();

	if (this.setup.getEigenStatus()) 
	{ 
		var N = energies.length;		
		if (this.ns.length > N)
		{
			this.ns = this.ns.slice(0, N)
		}
		else if (this.ns.length < N)
		{
			for (var i = this.ns.length; i < N; i ++)
			{
				this.ns.push(0);
			}
		}	
	}

	this.widget.$boxes.n.text(numeric.sum(this.ns));
	this.draw();

	this.showOverlay();

	return true;
}

QG.Widgets.Density.prototype.dump = function()
{
	return {'ns' : this.ns};
}

QG.Widgets.Density.prototype.load = function(opts)
{
	var ns = ('ns' in opts ? opts['ns'] : 0);
	this.ns = ns;
}

QG.Widgets.Density.prototype.kill = function()
{
	this.model.removeOverlay(this.name, this.id);
	this.setup.removeWidget(this.id);
	this.widget.$el.remove();
	
	return true;
} // close Density widget

})($, numeric, QG);