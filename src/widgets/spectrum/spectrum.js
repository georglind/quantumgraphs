'use strict';

var QG = QG || {};

(function($, numeric, QG){

// QG namespace
QG.Widgets = QG.Widgets || {};
QG.Graph = QG.Graph || {};

// Widget
QG.Widgets.Spectrum = function(setup, settings) 
{
	QG.Widget.call(this, setup, settings);

	// setups
	this.name = 'Spectrum';
	this.icon = '<span>Eig</span>';

	// model shortcut
	this.model = this.setup.model;  // backref

	// state of Widget
	this.state = {selected: null, update: true, expanded: false, overlay: true}; // selected 
	
	// current energies and orbitals
	this.energies = null;     // eigenenergies
	this.orbitals = null;     // eigenfunctions

	// html box settings
	this.widget.menus = {};
	this.widget.$boxes = {menu : null, body: null, levels: null};
	
	this.stage = null;
	this.layer = null;

	this._queue = new QG.Timing.Queue();
}

$.extend(QG.Widgets.Spectrum.prototype, QG.Widget.prototype);

QG.Widgets.Spectrum.prototype.getBodyHeight = function()
{
	return this.widget.$el.height() - 42 - 40;
}

QG.Widgets.Spectrum.prototype.getBodyWidth = function()
{
	return this.widget.$el.width();
}

QG.Widgets.Spectrum.prototype.render = function(wrapper)
{
	this.widget.$el = wrapper;
	// this.widget.$el.addClass(state.expanded ? 'qg_panel1x2' : 'qg_panel1x1');

	this.widget.$boxes.menu = $('<div class="qg_widget_menu"></div>');

	// title
	this.widget.$boxes.menu.append('<div class="qg_widget_title">Eigenspectrum</div>');

	// export button
	var self = this;
	var export_button = $('<a class="qg_smallbutton" title="Export Eigenspectrum"><span class="icon-export-alt"></span></a>')
		.on('click tap', function(e){
			e.preventDefault();

			var content = $('<div></div>')
				.append($('<ul class="qg_tabs">' +
							'<li><a class="current">Mathematica</a></li>'  +
						   	'<li><a>matlab</a></li>' +
						   	'<li><a>numpy</a></li>' +
						   '</ul>'))
				.append($('<textarea wrap="off"></textarea>').append(self.exportString('mathematica', self.energies, self.orbitals)));

			$('.qg_tabs a', content).on('click tap', function(e) {
				e.preventDefault();
				if ($(this).hasClass('current')){  //detection for current tab
 					return;   
				}
				else
				{      
					$('.qg_tabs a', content).removeClass('current'); //Reset id's
					$(this).addClass("current"); // Activate this

					$('textarea', content).val(self.exportString($(this).html(), self.energies, self.orbitals));
				}
			});

			$('textarea, input', content).on('click tap', function(e){
				e.preventDefault();
				$(this).focus();
				$(this).select();
			});

			QG.Dialog('Export Eigenspectrum', content);
		});
	this.widget.$boxes.menu.append(export_button);

	// help
	var help_button = $('<a class="qg_smallbutton" title="Help Eigenspectrum"><span class="icon-help-circled"></span></a>')
		.on('click tab', $.proxy(function(e){
			var elms = {'title' : $('<span/>'), 'body': $('<div/>')};
			QG.Dialog(elms.title, elms.body);
			QG.Docs.showasync(this.name, elms);

		}, this));
	this.widget.$boxes.menu.append(help_button);

	// body
	this.widget.$boxes.body = $('<div class="qg_spectrum"></div>');

	this.widget.$boxes.instruction = $('<p>Build a graph and see its eigenmodes here.</p>');

	this.widget.$boxes.levels = $('<div></div>');

	// Concatenate
	this.widget.$el
		.append(this.widget.$boxes.menu)
		.append(this.widget.$boxes.instruction)
		.append(this.widget.$boxes.body.append(this.widget.$boxes.levels));

	// drawing stage where we put everything
	this.stage = new Kinetic.Stage({
		container: this.widget.$boxes.levels[0],
		width: this.getBodyWidth() - 60,
		height: this.getBodyHeight()
	});

	this.layer = new Kinetic.Layer();
	this.stage.add(this.layer);

	this.drawControls();
}

QG.Widgets.Spectrum.prototype.exportString = function(format, energies, orbitals)
{
	var out = '';
	out += QG.code.comment_format(format, 'Eigenenergies');
	if (energies.length < 1 || orbitals.length < 1)
	{
		out += 'W' + QG.code.array_format(format, {x: []}, 4, false) + "\n\n";

		out += QG.code.comment_format(format, 'Eigenvectors');
		out += 'V' + QG.code.array_format(format, {x: []}, 4, false) + "\n\n";

		return out;
	}
	out += 'W' + QG.code.array_format(format, {x: energies}, 4, false) + "\n\n";

	out += QG.code.comment_format(format, 'Eigenvectors (in columns)');

	var Ux = [], Uy = [];

	for (var i = 0; i < orbitals.length; i++)
	{
		Ux[i] = orbitals[i].x; Uy[i] = orbitals[i].y;
	}

	var U = numeric.t(Ux, Uy);
	out += 'V' + QG.code.matrix_format(format, U.transpose(), 0, 4, true) + "\n\n";

	return out;
}

	// draw up-down controls
QG.Widgets.Spectrum.prototype.drawControls = function()
{
	if (this.widget.$boxes.up !== undefined) 
	{
		this.widget.$boxes.up.remove();
		this.widget.$boxes.down.remove();
	}

	this.widget.$boxes.up = $('<a class="qg_spectrum_up"><span class="icon-up-open"></span></a>');

	var self = this;
	this.widget.$boxes.up.on('touchstart mousedown',function(e)
	{
		e.preventDefault();
		self.state.overlay = true;
		self.selectNext(+1);
    });
	
	this.widget.$boxes.body.append(this.widget.$boxes.up);

	this.widget.$boxes.down = $('<a class="qg_spectrum_down"><span class="icon-down-open"></span></a>');

	this.widget.$boxes.down.on('touchstart mousedown',function(e) 
	{
		e.preventDefault();
		self.state.overlay = true;
		self.selectNext(-1);
    });

    this.widget.$boxes.body.append(this.widget.$boxes.down);
}

// draw widget
QG.Widgets.Spectrum.prototype.drawLevels = function()
{
	// wipe the slate clean
	this.layer.destroyChildren();

	// draw levels
	var maxl = Math.max.apply(null, this.energies);
	var minl =  Math.min.apply(null, this.energies);
	var scale = Math.max(Math.max(maxl, Math.abs(minl)), 0.1);

	var N = (this.energies).length;
	for(var i = 0; i < N; i++)
	{
		var group = this.drawLevel(i, this.energies[i], N, scale);	
		this.layer.add(group);

		if (this.state.selected == i)
		{
			this.setLevelColor(group, '#FF4136', '#86424b', "700");
			group.moveToTop(); // so I better can see you
		}
	}

	// draw the energylayer
	this.layer.batchDraw();

	// draw axes
	var rscale = scale*(this.getBodyHeight() - 20)/(this.getBodyHeight() - 40);
	this.drawAxes(this.getBodyHeight() - 20, [-rscale, rscale]);
};

// draw energy level
QG.Widgets.Spectrum.prototype.drawLevel = function(i, energy, N, scale)
{	
	var height = this.getBodyHeight();
	var width = this.getBodyWidth() - 120;

	var yE = - energy/scale*(height/2 - 20) + height/2

	var yeq = (N > 1 ? -i/(N - 1)*(height - 40) + height - 20 : height/2)

	var line = new Kinetic.Line(
	{
		points: [40, yE, parseInt(2*width/3), yE],
		// points: [30 - dx, -i/(N-1)*140 + 160 , 60 - dx, -energy/scale*70+90, 140, -energy/scale*70+90],
		stroke: '#f9fafc',
		strokeWidth: 1.5
	});

	var dash = new Kinetic.Line({
		points: [parseInt(2*width/3), yE, parseInt(width - 40), yeq],
		// points: [30 - dx, -i/(N-1)*140 + 160 , 60 - dx, -energy/scale*70+90, 140, -energy/scale*70+90],
		stroke: '#59677a',
		strokeWidth: 1.6,
		name: 'dash' + i
		// opacity: .8,
		// dash: [10,5]
	});

	// collect in group
	var group = new Kinetic.Group({name: 'E' + i});
	group.add(line);
	group.add(dash);
	// group.add(dot);

	// add numering with spacing
	var step = Math.ceil(18*(N -1)/height);
	
	if (N == 1 || (i + 1) % step == 0) 
	{
		var fontsize = N == 1 ? 20 :  1.8*Math.min(Math.round(height/(2*N/step)) - 1, 10)

		var dx = 0;
		if (i + 1 > 9) { dx = fontsize/2; }

		var text = new Kinetic.Text(
		{
			x: width - 20 - dx,
			y:  yeq - fontsize/2,
			text: i+1,
			fontStyle: 'normal',
			fontSize: fontsize,
			fontFamily: 'Arial',
			fill: '#f9fafc',
		});

		var r = Math.round(40/Math.sqrt(N)) + 3;
		var dot = new Kinetic.Circle(
		{
			x: width - 10 - r/2,
			y: yeq,
			radius: r,
			fill: 'transparent',
		});

		group.add(dot)
		group.add(text);

	}

	var self = this;
	group.on('mouseover', function(e) 
	{
		var i = parseInt((group.getName()).slice(1), 10);
		self.selectLevel(i)
		e.evt.preventDefault();
	});

	return group;
}

QG.Widgets.Spectrum.prototype.drawAxes = function(height, limits)
{
	if (this.widget.$boxes.axes !== undefined)
	{
		this.widget.$boxes.axes.remove();
	}

	this.widget.$boxes.axes = $('<div class="qg_axes"></div>').css({height: height});
	
	QG.Drawers.verticalAxis(this.widget.$boxes.axes, limits)

	this.widget.$boxes.body.append(this.widget.$boxes.axes);
}

// draw overlay
// QG.Widgets.Spectrum.prototype.drawOverlay = function()
// {
// 	// show overlay?
// 	if (this.state.overlay === true && this.state.selected !== null)
// 	{
// 		this.model.selectOverlayButton(this.name, this.id);
// 	}
// }

// select level
QG.Widgets.Spectrum.prototype.selectLevel = function(i)
{
	if (this.state.selected !== null && this.state.selected == i ) 
	{
		return;
	}

	$( document.activeElement ).blur(); // ???

	this.unselectAll();
	this.state.selected = i;
	
	// draw overlay
	this.drawOverlay();

	// highlight selected
	var group = this.layer.find('.E' + i)[0];
	this.setLevelColor(group, '#FF4136', '#86424b', "700");
	group.moveToTop(); // so I better can see you
};

// (un)set select color
QG.Widgets.Spectrum.prototype.setLevelColor = function(group, stroke, faint, fontsize) {
	if (!group) { return; }
	var children = group.getChildren(); // get children of group

	for(var i=0;i<children.length;i++)
	{
		if (children[i].className == 'Text')
		{
			children[i].setFill(stroke);
			if (fontsize) { children[i].setFontStyle(fontsize); }
   		}
   		else if (children[i].className == 'Circle') 
   		{
   			// children[i].setFill(stroke);
   		}
   		else if (children[i].className == 'Line') 
   		{
   			console.log(children[i].name());
   			if (children[i].name()) {
   				children[i].setStroke(faint);
   			} else {
   				children[i].setStroke(stroke);
   			}
   		}
   	}
};

// select using arrows
QG.Widgets.Spectrum.prototype.selectNext = function(diff) 
{
	if (this.energies == undefined || this.energies.length == 0) { return; }

	var j = diff > 0 ? 0 : ((this.energies).length+diff);
	if (this.state.selected !== null) 
	{
		if (diff < 0)
		{
			j = this.state.selected + diff;
			j = j < 0 ? (this.energies.length - 1) : j;
		}
		else if (diff > 0)
		{
			j = (this.state.selected + 1) % (this.energies.length);
		}
		else 
		{
			j = this.state.selected;
		}
	}
	else
	{
		j = 0;
	}

	this.selectLevel(j);
};

// remove selection
QG.Widgets.Spectrum.prototype.unselectAll = function()
{
	if (this.state.selected !== null) 
	{
		var group = this.layer.find('.E' + this.state.selected)[0];
		this.setLevelColor(group, '#f9fafc', '#59677a', "100");			
	}
	
	this.state.selected = null;

	this.layer.batchDraw();
};

	// draw eigenfunctions
QG.Widgets.Spectrum.prototype.drawOverlay = function(selectOverlayButton) 
{
	if (selectOverlayButton == undefined) {selectOverlayButton = true; }

	var index = this.state.selected + 1;
	var energy = this.energies[this.state.selected];
	var orbital = this.orbitals[this.state.selected];

	var message = this.state.selected > 0 || this.state.selected === 0 ? 'Energy[' + index + ']: ' + Math.round(energy*1000)/1000 : false;

	// create new overlay or select existing overlay
	var self = this;
	var overlay = this.model.addOverlay(self.name, self.id, 
	                               message, 
	                               function() { 
	                               		self.state.overlay = true; // toggle overlay switch
	                               		if (self.state.selected === null) { self.selectLevel(0); } // select level
	                                	self.drawOverlay(false); // draw the overlay
	                            	},
	                               function() { self.state.overlay = false; }
	                               );

	// select overlay button ?
	if (selectOverlayButton === true)  { this.model.selectOverlayButton(this.name, this.id); }

	overlay.destroyChildren();
	
	if (this.state.overlay === true && orbital !== undefined) 
	{
		var N = this.model.nodes.length;
		// var sgn = orbital[0] > 0 ? 1 : -1;
		var r = 1;

		for(var j = 0; j < N; j++) 
		{
			// position
			var pos = this.model.nodes[j].getPos();

			// weight and phase
			var w = QG.Math.modarg(orbital.x[j], orbital.y[j]);

			if (j == 0) { var arg0 = w.arg; w.arg = 0; } 
			else { w.arg = ((w.arg - arg0) + 2 * Math.PI) % (2 * Math.PI); }
			
			// color
			var rgb = QG.Color.HSVtoRGB(w.arg * 180 / Math.PI, .7, .8);
			
			// radius
			var r = Math.round(Math.abs(w.mod) * (10 + 40 *  Math.sqrt(N)/2));

			// circle
			var weight = new Kinetic.Circle({
				x: pos[0],
				y: pos[1],
				radius: r,
				fill: 'rgb(' + rgb.join() + ')',
				draggable: false
			});
			overlay.add(weight);

			// if (Math.abs(w.arg - Math.PI) > 0.001 && w.arg != 0) {				
			var dot = new Kinetic.Circle({
				x: pos[0] + (r-3) * Math.cos(w.arg),
				y: pos[1] + (r-3) * Math.sin(w.arg),
				radius: 3,
				fill: 'black',
				opacity: .4,
				draggable: false

			})

			overlay.add(dot);
			// }

			if (this.settings['overlayvalues'])
			{
				var t = QG.Text.format(w.mod, {decimals: 2});
				
				var text = new Kinetic.Text({
					x: pos[0] - 50,
					y:  pos[1] - 5,
					text: t,
					fontStyle: 'normal',
					fontSize: 9,
					fontFamily: 'Arial',
					fill: 'white',
					align: 'center',
					width: 100,
					opacity: .5
				});

				overlay.add(text);
			}
		}
	}
	this.model.redraw();
};


	// redo calculation
QG.Widgets.Spectrum.prototype.revaluate = function(update) 
{
	if (this.widget.$boxes.instruction) { this.widget.$boxes.instruction.hide(); }

	if (this.state.update || update)
	{
		this._queue.clear();
		this._queue.add(this.evaluate, this, []);
		this._queue.run(25);
	} 
	else 
	{
		this.layer.destroyChildren();
		this.reset();
	}
}

QG.Widgets.Spectrum.prototype.evaluate = function() 
{
	console.log('Spectrum evaluate')
	this.energies = this.setup.getEigenValues();
	this.orbitals = this.setup.getEigenVectors();		

	if (!this.setup.getEigenStatus()) 
	{
		this.model.clearOverlay(this.name, this.id);
		this.reset();
		return;
	}

	// redraw overlay straightaway?
	if (this.state.overlay === true) {
		this.drawOverlay(false);
	}

	// draw new level structure
	this.drawLevels();
};

QG.Widgets.Spectrum.prototype.hide = function() { 
	this.widget.$el.hide(); 
	this.model.removeOverlay(this.name, this.id); 
}

// refit
QG.Widgets.Spectrum.prototype.refit = function()
{
	if (this.stage)
	{
		this.stage.setHeight(this.getBodyHeight());
		this.stage.setWidth(this.getBodyWidth() - 80);
	
		if (this.energies && this.energies.length > 0)
		{
			// console.log('huh');
			// console.log(this.energies);
			this.drawLevels();
			this.drawOverlay();
		}
	}
}

// dump and load
QG.Widgets.Spectrum.prototype.dump = function()
{
	return {};
}

QG.Widgets.Spectrum.prototype.load = function(opts)
{
	return true;
}

// Back to initial stage
QG.Widgets.Spectrum.prototype.reset = function() 
{
	this.energies = [];
	this.orbitals = [];

	// clear overlay
	this.model.clearOverlay(this.name, this.id);
	this.unselectAll();

	// clear layer
	this.layer.destroyChildren().draw();
};

// Kill completely
QG.Widgets.Spectrum.prototype.kill = function() 
{
	// remove canvas
	this.stage.destroy();
	this.stage = null;

	// remove html
	this.widget.$el.remove();

	// remove overlay from model
	this.model.removeOverlay(this.name, this.id);

	// removewidget
	this.setup.removeWidget(this.id);

	return true;
}

})(jQuery, numeric, QG);