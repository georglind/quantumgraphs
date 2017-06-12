"use strict";

// QG namespace
var QG = QG || {};

(function($, numeric, QG) {

QG.Widgets = QG.Widgets || {};

QG.Widgets.Transmission = function(setup, settings) 
{
	QG.Widget.call(this, setup, settings);

	this.name = 'Transmission';
	this.icon = '<span>Tr</span>';
	
	// save options
	this.settings = $.extend({ dimensions: [223, 223, 6, 38] }, this.settings)

	this.plot = {
		ref: null,
		options: null
	}

	// shortcut
	this.model = this.setup.model;

	// widget state
	this.state = {
		update: true,
		log: false,
		cut: {level: -1, d: 1}
	};

	this.data = [];
	this._did = 0;

	this._queue = new QG.Timing.Queue();

	// tplot
	this.tplot = false;
	
	// html
	this.widget.$boxes = {plot: null, menu: null, body: null};
	// this.targets = null;
}

$.extend(QG.Widgets.Transmission.prototype, QG.Widget.prototype);


// render html
QG.Widgets.Transmission.prototype.render = function(wrapper) 
{
	var self = this;

	this.widget.$el = wrapper;

	var bands = this.getAllBands();

	// Choose continuas
	if (bands.length == 1)
	{
		this.updateData(-1, [bands[0], bands[0]]);
	}
	else if (bands.length > 1)
	{
		this.updateData(-1, [bands[0], bands[1]]);
	}

	// menu
	this.widget.$boxes.menu = $('<div class="qg_widget_menu"></div');

	// title
	this.widget.$boxes.menu.append('<div class="qg_widget_title">Transmission</div>');

	var help_button = $('<a class="qg_smallbutton" title="Help Transmission"><span class="icon-help-circled"></span></a>')
		.on('click tab', $.proxy(function(e){

			var elms = {'title' : $('<span/>'), 'body': $('<div/>')};
			
			QG.Dialog(elms.title, elms.body);
			
			QG.Docs.showasync(this.name, elms);

		}, this));

	this.widget.$boxes.menu.append(help_button);
	
	// buttons
	this.widget.$boxes.menu.append(
		$('<a class="qg_button"><span class="icon-cancel"></span></a>')
		.on('click tap', function(e) {
			e.preventDefault();
			self.kill();
			self.setup.removeWidget(self.id);
		})
	)

	this.widget.$boxes.menu.append($('<a class="qg_button">log<sub>10</sub></a>')
	    .on('click tap', function(e) {
	    	e.preventDefault();
	    	self.state.log = !self.state.log;
			self.revaluate();
	    })
	);

	this.widget.$boxes.targets = $('<a class="qg_button">+</a>');
	this.widget.$boxes.targets.on('click tap', function(e) {
		e.preventDefault();
		self.editSeries(-1);
	});
	
	// self.updateTransportBands();
	this.widget.$boxes.menu.append(this.widget.$boxes.targets);

	this.widget.$boxes.body = $('<div class="qg_transport"></div>')
		.on('click tap', function(e){
			e.preventDefault();
			var id = $(e.target).data('id');
			if (id === 0 || id > 0) { self.editSeries(id); }
		});

	this.widget.$boxes.plot = $('<div class="qg_transport_plot"></div>');
	
	// CONTROLS
	this.widget.$boxes.controls = $('<div class="qg_transport_controls"></div>');
	this.widget.$boxes.cut = $('<div class="qg_transport_cut"></div>');

	this.widget.cutlevels = $('<select name="level"></select>')
		.append($('<option value="false">no cut</option>'))
		.on('change', $.proxy(function(e){
			this.state.cut.level = parseInt(this.widget.cutlevels.val()) - 1;
			if (this.state.cut.level >= 0) {
				this.cutH(this.state.cut.level, this.state.cut.d);
			}
			this.revaluate();
		}, this));

	this.widget.cutslider = $('<div/>');
	this.widget.$boxes.cutshow = $('<input type="text" size="6" class="qg_transport_cut_show" disabled="true"></input>')
	this.widget.$boxes.cutslider = $('<div class="qg_transport_cut_slider"></div>')
		.append(this.widget.cutslider);

	this.drawSlider(this.widget.cutslider);

	// append target to menu
	this.widget.$boxes.cut
		.append('Cut Levels: ')
		.append(this.widget.cutlevels)
		.append(this.widget.$boxes.cutslider)
		.append(this.widget.$boxes.cutshow);

	this.widget.$el
		.append(this.widget.$boxes.menu)
		.append(this.widget.$boxes.body
		        	.append(this.widget.$boxes.plot)
		)
		.append(this.widget.$boxes.controls
		        	.append(this.widget.$boxes.cut)
		);
}

QG.Widgets.Transmission.prototype.updateCutControls = function(index) 
{
	var content = '';
	if (this.state.cut.level < 0)
	{
		content += '<option selected="true" value="0">no cut</option>';
	}
	else
	{
		content += '<option value="0">no cut</option>';
	}

	for (var i=0; i<this.model.nodes.length - 1; i++)
	{
		if (this.state.cut.level === i)
		{
			content += '<option selected="true" value="' + (i + 1) + '">' + (i+1) + '-' + (i+2) + '</option>';
		}
		else 
		{
			content += '<option value="' + (i + 1) + '">' + (i+1) + '-' + (i+2) + '</option>';
		}
	}

	this.widget.cutlevels.html(content);

	if (this.widget.slider)
	{		
		this.widget.slider.attr('disabled', this.state.cut.level == -1);
		this.widget.$boxes.cutshow.prop('disabled', this.state.cut.level == -1);
	}
}

QG.Widgets.Transmission.prototype.drawSlider = function(wrap)
{
	// slider
	this.widget.slider = $('<div class="qg_slider"></div>');
	
	this.widget.slider.noUiSlider(
	{
		connect: false,
		behaviour: 'touchstart',
		step: .02,
		tooltip: true,
		start: this.state.cut.d,
		range: {
			'min': [0],
			'max': [4]
		}
	});

	if (this.state.cut.level < 0)
	{
		this.widget.slider.attr('disabled', true);
	}

	// slider.noUiSlider_pips(
	// {
	// 	mode: 'values',
	// 	values: values,
	// 	density: 3
	// });

	this.widget.slider.Link('lower').to(this.widget.$boxes.cutshow);

	this.widget.slider.on('slide set', $.proxy(function() 
	{
		this.state.cut.d = this.widget.slider.val();
		this.revaluate();
	}, this));

	wrap.append(this.widget.slider);
}


QG.Widgets.Transmission.prototype.editSeries = function(index) {

	var incoming = new QG.Navigation.Radio({unselectall: false});
	var outgoing = new QG.Navigation.Radio({unselectall: false});

	var self = this;

	// iterate all bands
	var bands = this.getAllBands();
	var Nb = bands.length;

	// if there are no bands in the graph
	if (Nb == 0) {
		var content = $('<div></div>')
			.append('<p>You don\'t have any bands in your graph. You need to add yellow bands before you can calculate the transmission.</p>');
		QG.Dialog('Transmission anchors', content);
		return;
	}

	// if there are some bands
	for (var i = 0; i < Nb; i++)
	{	
		var id = bands[i].id;
		var lbl = bands[i].options.label;
		var button = $('<a class="qg_togglebutton">' + lbl + '</a>');
		incoming.add(lbl, button, function(val) 
		{
			var d = self.getData(index);
			var bids = d === undefined ? [undefined, undefined] : d.bids;

			var bands = self.getAllBands();
			var c0 = bands.find(function(elm) { return elm !== undefined && elm.getLabel() == val; });
			var c1 = bands.find(function(elm) { return elm !== undefined && elm.id == bids[1]; });
			if (c0 !== false)
			{
				index = self.updateData(index, [c0, c1]);
				self.revaluate(index);
			}
		});

		var button = $('<a class="qg_togglebutton">' + lbl + '</a>');
		outgoing.add(lbl, button, function(val) 
		{
			var d = self.getData(index);
			var bids = d === undefined ? [undefined, undefined] : d.bids;

			var bands = self.getAllBands();
			var c0 = bands.find(function(elm) { return elm !== undefined && elm.id == bids[0]; });
			var c1 = bands.find(function(elm) { return elm !== undefined && elm.getLabel() == val; });
			if (c1 !== false)
			{
				index = self.updateData(index, [c0, c1]);
				self.revaluate(index);
			}
		});
	}

	var d = this.getData(index);
	var bids = d === undefined ? [undefined, undefined] : d.bids;

	var bands = bids.map($.proxy(this.getBand, this));
	if (bands[0] !== undefined) { incoming.select(bands[0].getLabel()); }
	if (bands[1] !== undefined) { outgoing.select(bands[1].getLabel()); }

	// delete button
	var del = $('<a class="qg_button red">Ok, delete line</a>')
		.on('click tap',function() {
			if (index == -1) return;
			self.deleteData(index);
			self.plot.ref = $.plot(self.widget.$boxes.plot, self.data, self.plot.options);
			QG.removeDialog();
		});

	var content = $('<div></div>')
		.append('<p>Choose transmission bands:</p>')
		.append($('<ul class="qg_dialog_sections"></ul>')
			.append($('<li/>')
				.append($('<div class="row"/>').append(incoming.html()))
				.append('<div class="row"><span class="icon-down-big"></span></div>')
				.append('<div class="qg_transport_model">Model</div>')
				.append('<div class="row"><span class="icon-down-big"></span></div>')
				.append($('<div class="row"/>').append(outgoing.html()))
			)
			.append($('<li>Or delete this line?</li>').append(del))
		);		
	
	QG.Dialog('Transmission anchors', content);
}

	// Get bands
QG.Widgets.Transmission.prototype.getBand = function(bid)
{
	if (bid === undefined) return undefined;

	return this.model.extras.find(function(elm) { return elm.id == bid;});
}

	// bbands
QG.Widgets.Transmission.prototype.getAllBands= function()
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

QG.Widgets.Transmission.prototype.updateData = function(index, bands) {
	// we update the data 
	var bids = [undefined, undefined];
	var label = '';

	if (bands[0] !== undefined) 
	{
		bids[0] = bands[0].id; 
		label += bands[0].getLabel();
	}
	else
	{
		label += '?';
	}

	label += '-';

	if (bands[1] !== undefined) 
	{ 
		bids[1] = bands[1].id; 
		label += bands[1].getLabel();
	}
	else
	{
		label += '?';
	}

	var d = this.getData(index);

	if (d !== undefined)
	{
		if (d.bids[0] != bids[0] || d.bids[1] != bids[1])
		{
			d.bids = bids; d.label = label;
		}
	}
	else 
	{
		index = this._did;
		this.data.push({'id': this._did, 'bids': bids, 'label': label});
		this._did += 1;
	}

	return index;
}

QG.Widgets.Transmission.prototype.getData = function(index) {
	if (index === 0 || index > 0) 
	{
		return this.data.find(function(elm) { return elm !== undefined && elm.id == index; });
	}

	return undefined;
}

QG.Widgets.Transmission.prototype.deleteData = function(index) {
	var del = false;
	var i = 0;
	for (i = 0; i < this.data.length; i++)
	{
		if (this.data[i].id === index) {
			del = true;
			break;
		}
	}

	if (del) { this.data.splice(i, 1); }
}

	// continua text
	// self.getBandsText = function(bands)
	// {
	// 	var text = [];
	// 	for (var i = 0; i < bands.length; i++)
	// 	{
	// 		text.push(bands[i] === undefined ? '?' : bands[i].getLabel());
	// 	}
	// 	return text.join('-')
	// }

	/////////////////////////////////
	// plot
	/////////////////////////////////
QG.Widgets.Transmission.prototype.plotTransmission = function(index) 
{
	// ylabel
	var y_label = $('<h3>T(E)</h3>');
	if (this.state.log) {
		var y_label = $('<h3></h3>').html('log<sub>10</sub> T(E)');
	}

	// x-axis
	if ($('h3', this.widget.$boxes.body).length == 0)
	{
		this.widget.$boxes.body.html('');
		this.widget.$boxes.body
			.append(y_label)
			.append(this.widget.$boxes.plot)
			.append('<b>E</b>')
	}
	else 
	{
		$('h3', this.widget.$boxes.body).html(y_label.html());
	}

	var color = '#778291';
	var linecolor = '#475261';

	this.plot.options = {
		grid: { color: color, tickColor: linecolor, font: { color: color, size: 14}},
		xaxis: { color: linecolor, tickColor: linecolor, font: { color: color, size: 14}},
		yaxis: { color: linecolor, tickColor: linecolor, font: { color: color, size: 14}},
		shadowSize: 0,
		series : {lines: {linewidth: 1}},
		legend: {
		    show: true,
		    labelFormatter: function(label, series) {
		    	var lbl = '<a class="qg_button" data-id="' + series.id + '"">' + label + '</a>';
		    	return lbl;
		    }
		}
	};

	if (!this.state.log) {
		this.plot.options.yaxis.min = 0;
		this.plot.options.yaxis.max = 1.2;
	};

	// xlimits
	var xlim = this._getXLimits(this.getEs());
	
	if (index === 0 || index > 0) 
	{
		// update only a single line
		var d = this.getData(index);
		var bands = d.bids.map($.proxy(this.getBand, this));

		this.updateData(index, bands);

		if (bands[0] === undefined || bands[1] === undefined)
		{
			d.data = [];
			this.plot.ref = $.plot(this.widget.$boxes.plot, this.data, this.plot.options);

			return;
		}

		d.transfunc = this.generateTransmissionFunction(bands[0], bands[1]);
		d.data = [[xlim[0], d.transfunc(xlim[0])], [xlim[1], d.transfunc(xlim[1])]];

		// get N
		var N = this.model.H.x.length;

		// refine transmission in the following way
		if (N < 10)
		{
			this.refineTransmission(index, 8);
			this.drawEigenValues();
		}
		else 
		{
			this.refineTransmission(index, 4);
			this._queue.clear(); 
			this._queue.add(this.refineTransmission, this, [index, 3]);
			this._queue.add(this.refineTransmission, this, [index, 1]);
			if (N > 20)
			{
				for (var i=0; i < 2; i++) {
					this._queue.add(this.refineTransmission, this, [index, 1]);
				}
			}
			this._queue.add(this.drawEigenValues, this);
			this._queue.run();
		}
	}
	else 
	{	
		var empties = [];
		// update everything
		for (var j = 0; j < this.data.length; j++)
		{
			if (!('bids' in this.data[j])) continue;

			// update only a single line
			var bands = this.data[j].bids.map($.proxy(this.getBand, this));
			this.updateData(this.data[j].id, bands);
	
			if (bands[0] === undefined && bands[1] === undefined)
			{
				empties.push(j)
				// this.data[j].transfunc = function() { return NaN; }
				// this.data[j].data = [[xlim[0], NaN], xlim[1], NaN];
			}
			else if (bands[0] === undefined || bands[1] === undefined)
			{
				// one band selected
				this.data[j].transfunc = function() { return NaN; }
				this.data[j].data = [[xlim[0], NaN], xlim[1], NaN];
			}
			else 
			{
				// two bands selected
				this.data[j].transfunc = this.generateTransmissionFunction(bands[0], bands[1]);
				this.data[j].data = [[xlim[0], this.data[j].transfunc(xlim[0])], [xlim[1], this.data[j].transfunc(xlim[1])]];
			}
		}

		// empty plots
		if (empties.length > 0)
		{
			for (var j = 0; j < empties.length; j++) { this.deleteData(empties[j]);	}
			this.plot.ref = $.plot(this.widget.$boxes.plot, this.data, this.plot.options);
		}
			
			// get N
		var N = this.model.H.x.length;

		// refine transmission in the following way
		if (N < 10)
		{
			this.refineTransmissions(8);
			this.drawEigenValues();
		}
		else 
		{
			this.refineTransmissions(4);
			this._queue.clear(); 
			this._queue.add(this.refineTransmissions, this, [3]);
			this._queue.add(this.refineTransmissions, this, [1]);
			if (N > 20)
			{
				for (var i=0; i < 2; i++) {
					this._queue.add(this.refineTransmissions, this, [1]);
				}
			}
			this._queue.add(this.drawEigenValues, this);
			this._queue.run();
		}
	}
}

QG.Widgets.Transmission.prototype.getEs = function() {
	if (this.state.cut.level < 0 || !this.Es)
	{
		var Es = this.setup.getEigenValues();
		if (!this.setup.getEigenStatus()) return false;
		return Es;
	}
	else 
	{
		return this.Es;
	}
}

QG.Widgets.Transmission.prototype.getH = function() {
	return this.state.cut.level >= 0 ? this.H : this.model.H;
}


QG.Widgets.Transmission.prototype.drawEigenValues = function() {

	var Es = this.getEs();

	var markings = [];
	for (var i = 0; i < Es.length; i++)
	{
		markings.push({ color: "#223248", lineWidth: 3, xaxis: { from: Es[i], to: Es[i] }})
	}
	this.plot.options.grid.markings = markings;

	this.plot.ref = $.plot(this.widget.$boxes.plot, this.data, this.plot.options);
}

QG.Widgets.Transmission.prototype.refineTransmissions = function(it)
{
	for (var j = 0; j < this.data.length; j++)
	{
		this.refineTransmission(this.data[j].id, it);
	}
}

QG.Widgets.Transmission.prototype.refineTransmission = function(index, it)
{
	var d = this.getData(index);
	// if (d!== undefined) { return; }

	var points = d.data;

	for (var j = 0; j < it; j++)
	{
		var N = points.length;

		var ppts = [];
		for (var i = 0; i < N - 1; i++)
		{
			ppts.push(points[i]);
			var pt = (points[i][0] + points[i + 1][0])/2;
			ppts.push([pt, d.transfunc(pt)]);
		}
		ppts.push(points[N - 1]);
		points = ppts;
	}

	d.data = points;

	this.plot.ref = $.plot(this.widget.$boxes.plot, this.data, this.plot.options);	
}

		// tplot.bind("plotselected", function (event, ranges) {
		// 	// clamp the zooming to prevent eternal zoom
		// 	if (ranges.xaxis.to - ranges.xaxis.from < 0.00001) {
		// 		ranges.xaxis.to = ranges.xaxis.from + 0.00001;
		// 	}
		// 	if (ranges.yaxis.to - ranges.yaxis.from < 0.00001) {
		// 		ranges.yaxis.to = ranges.yaxis.from + 0.00001;
		// 	}

		// 	options = {};
		// 	// do the plot zooming
		// 	var plot = $.plot(tplot, res,
		// 		$.extend(true, {}, options, {
		// 			xaxis: { min: ranges.xaxis.from, max: ranges.xaxis.to },
		// 			yaxis: { min: ranges.yaxis.from, max: ranges.yaxis.to }
		// 		})
		// 	);
		// });
	// }

	// xlimits
QG.Widgets.Transmission.prototype._getXLimits = function(energies)
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

	// In out vectors
QG.Widgets.Transmission.prototype._getInOut = function(N, bin, bout)
{
	var inner = numeric.rep([2*N], 0);  // left electrode
	for (var i = 0; i < bin.links.length; i++) 
	{
		var k = (bin.links[i].nodes[0].id == bin.id ? 1 : 0);
		var w = bin.links[i].getWeight();
		var ph = bin.links[i].getPhase();
		
		inner[bin.links[i].nodes[k].index] = w * Math.cos(ph);  ///Math.sqrt(bin.links.length);
		inner[bin.links[i].nodes[k].index + N] = w * Math.sin(ph);  ///Math.sqrt(bin.links.length);
	}

	var outer = numeric.rep([2*N], 0);  // right electrode
	for (var i = 0; i < bout.links.length; i++) 
	{
		var k = (bout.links[i].nodes[0].id == bout.id ? 1 : 0);
		var w = bout.links[i].getWeight();
		var ph = bout.links[i].getPhase();
		
		outer[bout.links[i].nodes[k].index] = w * Math.cos(ph); ///Math.sqrt(bout.links.length);
		outer[bout.links[i].nodes[k].index + N] = - w * Math.sin(ph); ///Math.sqrt(bout.links.length);
	}

	return {'in': inner, 'out': outer};
}


QG.Widgets.Transmission.prototype.cutH = function(level, delta)
{
	var Ls = this.setup.getEigenValues();

	var Es = numeric.clone(Ls);
	var Os = this.setup.getEigenVectors();

	var Ux = [], Uy = [];

	for (var i = 0; i < Es.length; i++)
	{
		Es[i] += (i <= level) ? -delta/2 : delta/2;
		Ux[i] = Os[i].x;
		Uy[i] = Os[i].y;
	}
	
	var U = new numeric.T(Ux, Uy);
	
	var Eds = numeric.diag(Es);
	
	this.Es = Es;
	this.H = U.transjugate().dot(Eds).dot(U);
}

	// genrate Transmission function
QG.Widgets.Transmission.prototype.generateTransmissionFunction = function(bin, bout)
{
	var H = this.getH();
	var N = H.x.length;

	// gather
	var sigma = this.model.sigma();
	var inout = this._getInOut(N, bin, bout);

	// reflection or transmission
	var reflection = (bin.id == bout.id);

	// Complex inverse by solution for (x + i y) of the equation:
	// (Re + i Im) (x + i y) = (a + i b)
	// By a 2Nx2N method:
	//	[ Re, -Im ] . [ x ]  = [ a ]
	//	[ Im,  Re ]   [ y ]    [ b ]

	var X = numeric.add(H.x, sigma.x);
	var Y = numeric.add(H.y, sigma.y);

	var G = numeric.blockMatrix([[X, numeric.neg(Y)],[Y, X]]);
	
	var M, Gin, rout, lout, t, x, y;

	var log = this.state.log;
	// single parameter function
	var transfunc = function(omega)
	{
		M = numeric.clone(G);
		for (var i = 0; i < 2*N; i ++) { M[i][i] -= omega; }

		Gin = numeric.solve(M, inout.in);

		rout = {x: Gin.slice(0, N), y: Gin.slice(N, 2 * N) };
		lout = {x: inout.out.slice(0, N), y: inout.out.slice(N, 2 * N)};

		x = numeric.dot(lout.x, rout.x) - numeric.dot(lout.y, rout.y)
		y = numeric.dot(lout.x, rout.y) +  numeric.dot(lout.y, rout.x)
		// Helpers

		t = 4 * (Math.pow(x, 2) + Math.pow(.5 * reflection - y, 2));
		
		if (!log) return t
		
		return Math.log(t)/2.302585092994046;
	}

	return transfunc;
}

	// size plugs
QG.Widgets.Transmission.prototype.getBodyWidth = function() {
	var w = this.widget.$el.width();
	if (!w) { w = this.settings.dimensions[0]; }
	return w - this.settings.dimensions[2];
}

QG.Widgets.Transmission.prototype.getBodyHeight = function() {
	var h = this.widget.$el.height();
	if (!h) { h = this.settings.dimensions[1]; }
	return h - this.settings.dimensions[3];
}

	/////////////////////////////////
	// revaluate/re-render the widget
	/////////////////////////////////
QG.Widgets.Transmission.prototype.revaluate = function(index) 
{
	if (this.data.length > 0)
	{
		if (this.state.cut.level >= 0) this.cutH(this.state.cut.level, this.state.cut.d);

		this.plotTransmission(index);
		this.updateCutControls();
	} 
	else
	{
		this.widget.$boxes.body.html('');
		this.widget.$boxes.plot.html('<p>Transmission quantifies how easily a particle moves through your graph from one band to the other.</p><p>Add "bands" by choosing <span class="qg-icon"><span class="icon-graphnode yellow-text"></span></span> from the draw menu.</p>');
		this.widget.$boxes.body.append(this.widget.$boxes.plot)
	}
}


	// refit
QG.Widgets.Transmission.prototype.refit = function() {

	console.log('refitted transport')
	this.widget.$boxes.plot.width(this.getBodyWidth() - 20);
	this.widget.$boxes.plot.height(this.getBodyHeight() - 100);

	if (this.plot.ref)
	{
		this.plot.ref.resize();
		this.plot.ref.setupGrid();
		this.plot.ref.draw();
	}
}


	// dump/save widget
QG.Widgets.Transmission.prototype.dump = function()
{
	var lbls = [];
	for (var key in this.data)
	{
		if (this.data.hasOwnProperty(key))
		{
			var b1 = this.getBand(this.data[key].bids[0]);
			var b2 = this.getBand(this.data[key].bids[1]);

			var lbl = [0, 0];
			
			if (b1) lbl[0] = b1.getLabel();
			if (b2) lbl[1] = b2.getLabel();

			lbls.push(lbl);
		}
	}

	return {'bs': lbls, 'log': this.state.log, 'cut': this.state.cut.level, 'd': this.state.cut.d};
}

	// load widget
QG.Widgets.Transmission.prototype.load = function(opts)
{	
	this.data = [];
	// console.log(opts);
	this.state.log = 'log' in opts ? opts['log'] : this.state.log;
	this.state.cut.level = 'cut' in opts ? parseInt(opts['cut']) : -1;
	this.state.cut.d = 'd' in opts ? parseFloat(opts['d']) : 1;

	if (this.widget.slider) {this.widget.slider.val(this.state.cut.d); }

	console.log(this.state.cut.d);

	var self = this;
	function getBandByLabel(lbl)
	{	
		return self.model.extras.find(function(elm) { return elm.getLabel() == lbl; });
	}

	for (var i = 0; i < opts['bs'].length; i++)
	{
		var c0 = getBandByLabel(opts['bs'][i][0]);
		var c1 = getBandByLabel(opts['bs'][i][1]);

		this.updateData(-1, [c0, c1]);
	}
}

// kill
QG.Widgets.Transmission.prototype.kill = function() 
{
	this.setup.removeWidget(this.id);
	this.widget.$el.remove();
}


})(jQuery, numeric, QG);
