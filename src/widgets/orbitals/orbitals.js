"use strict";

var QG = QG || {};

(function($, numeric, QG) {

QG.Widgets = QG.Widgets || {};

////////////////////////////////
// Orbitals
////////////////////////////////

QG.Widgets.Orbitals = function(setup, settings) {
	
	QG.Widget.call(this, setup, settings);

	this.model = this.setup.model

	this.name = 'Orbitals';
	this.icon = '<span>O</span>';

	// this.ns = [];
	
	this.widget.$boxes = {orbitals: null};
}

$.extend(QG.Widgets.Orbitals.prototype, QG.Widget.prototype);


QG.Widgets.Orbitals.prototype.render = function(wrapper)
{
	this.widget.$el = wrapper;

	var menu = $('<div class="qg_widget_menu">' +
					'<div class="qg_widget_title">Orbitals</div>' + 
					'</div');

	var self = this;
	var menu_delete = $('<a class="qg_button" onclick=""><span class="icon-cancel"></span></a>')
		.on('mousedown touchstart', function(e)
		{
			e.preventDefault();
			self.kill();
			self.setup.removeWidget(self.id);
		}
	);
	menu.append(menu_delete);

	var menu_update = $('<a class="qg_button" onclick=""><span class="icon-ccw"></span></a>')
		.on('mousedown touchstart', function(e)
		{
			e.preventDefault();	
			self.draw();
			self.unblur();
		}
	);
	menu.append(menu_update);
	
	// orbitals
	this.widget.$boxes.orbitals = $('<div class="qg_orbitals"></div>');

	// Concatenate
	this.widget.$el.append(menu).append(this.widget.$boxes.orbitals);

	this.draw();
}

QG.Widgets.Orbitals.prototype.draw = function()
{
	var energies = this.setup.getEigenValues();
	var orbitals = this.setup.getEigenVectors();

	if (!this.setup.getEigenStatus()) { return; }

	this.widget.$boxes.orbitals.html('');

	var pos = this.getPosition();

	for (var i = 0; i < orbitals.length; i++)
	{
		// container
		var level = $('<div class="qg_orbitals_level"></div>');
		var text = $('<div class="qg_orbitals_text">E<sub>' +  (i + 1) + '</sub> = ' + Math.round(energies[i]*1000)/1000 + '</div>');
		var orb = $('<div class="qg_orbitals_level"></div>');
		// append
		this.widget.$boxes.orbitals.append(level.append(text).append(orb));

		// draw each molecular orbital
		this.drawOrbital(orb[0], orbitals[i], pos.offset, pos.scale);
	}
}

// zoom to model
QG.Widgets.Orbitals.prototype.getPosition = function()
{
	// stage sizze
	var h = this.model.getStageHeight();
	var w = this.model.getStageWidth();
		
	// scale
	var s = Math.min(140/h, 200/w);

	// model layer
	var ls = this.model.getLayerScale();
	var lpos = this.model.getLayerPosition();

	lpos = [lpos.x*s, lpos.y*s]
	
	return {'offset': lpos, 'scale': s*ls};
}

QG.Widgets.Orbitals.prototype.drawOrbital = function(wrap, orbital, offset, scale)
{
	// create canvas stage
	var stage = new Kinetic.Stage({
	  container: wrap,   // id of container <div>
	  width: 200,
	  height: 140
	});

	// then create layer
	var layer = new Kinetic.FastLayer();
	stage.add(layer);

	// var mpos = model.getLayerPosition();
	// var ms = model.getLayerScale();

	// var h = model.getStageHeight();
	// var w = model.getStageWidth();
	// var s = Math.min(140/h, 200/w);
	var links = this.model.links;

	for (var i=0; i < links.length; i++)
	{
		if (links[i].nodes[0].is('band') || links[i].nodes[1].is('band'))
		{
			continue;
		}
		
		var p1 = links[i].nodes[0].getPos();
		var p2 = links[i].nodes[1].getPos();

		var line = new Kinetic.Line({
			points: [offset[0] + Math.round(p1[0]*scale), offset[1] + Math.round(p1[1]*scale), offset[0] + Math.round(p2[0]*scale), offset[1] + Math.round(p2[1]*scale)],
			strokeWidth: links[i].getWidth() * scale,
			stroke: links[i].getColor()
		});

		layer.add(line);
	}

	for (var i=0; i < orbital.x.length; i ++)
	{
		var p = this.model.nodes[i].getPos();

		var w = QG.Math.modarg(orbital.x[i], orbital.y[i]);
		if (i == 0) { var arg0 = w.arg; w.arg = 0; } 
		else { w.arg = ((w.arg - arg0) + 2 * Math.PI) % (2 * Math.PI); }

			// var fill = ( w < 0 ? '#FF4136' : '#0074D9');
			// var fill = QG.Graph.HSVtoRGB(3.6*i, .8, 1);

		var rgb = QG.Color.HSVtoRGB(w.arg * 180 / Math.PI, .7, .8);
		var r = Math.round(Math.abs(w.mod) * (10 + 40 * scale));

		var circle = new Kinetic.Circle({
			x: p[0] * scale + offset[0],
			y: p[1] * scale + offset[1],
			fill: 'rgb(' + rgb.join() + ')',
			radius: r,
			zindex: 10
		});

		layer.add(circle);
	}

	layer.batchDraw();
}

QG.Widgets.Orbitals.prototype.blur = function()
{
	this.widget.$el.addClass('qg_blurred');
}

QG.Widgets.Orbitals.prototype.unblur = function()
{
	this.widget.$el.removeClass('qg_blurred');
}

QG.Widgets.Orbitals.prototype.revaluate = function()
{
	this.blur()
	return true;
}

QG.Widgets.Orbitals.prototype.refit = function()
{
	this.widget.$boxes.orbitals.height(this.widget.$el.height() - 42);
	this.widget.$boxes.orbitals.width(this.widget.$el.width());
}

QG.Widgets.Orbitals.prototype.dump = function()
{
	return {};
}

QG.Widgets.Orbitals.prototype.load = function(opts)
{
	return true;
}

QG.Widgets.Orbitals.prototype.kill = function()
{
	this.setup.removeWidget(this.id);
	this.widget.$el.remove();
	return true;
}


})(jQuery, numeric, QG)
