"use strict";

// QG namespace
var QG = QG || {};

(function($, numeric, QG) {

QG.Graph = QG.Graph || {};

////////////////////////
// QG.Graph.Node
////////////////////////

// QG.Graph.Node(model, id, [123, 213], {'drag': true, 'editable': true, 'extra': true})
QG.Graph.Node = function(model, id, pos, options) 
{
	var self = this;
	self.model = model;
	self.name = 'node';
	self.id = 'node' + id;
	self.links = [];
	self.pos = pos;
	
	self.state = {
		selected: false,
		targeted: false,
	}

	// options
	self.options = options || {weight: 0};
	if (!('drag' in self.options)) { self.options.drag = true; }
	if (!('edit' in self.options)) { self.options.edit = true; }
};

QG.Graph.Node.prototype.is = function(key)
{
	if (key in this.options) { return this.options[key]; }
	return false;
};

QG.Graph.Node.prototype.getWeight = function()
{
	return this.options.weight;
};

QG.Graph.Node.prototype.setWeight = function(weight)
{
	if (weight !== undefined)
	{
		this.options.weight = parseFloat(weight);
	}

	this.circle.setFill(this.getColor())
	this.circle.setRadius(this.getRadius());
	this.stroke.setRadius(this.getRadius() + this.model.settings.nodestroke);
};

QG.Graph.Node.prototype.getColor = function() 
{
	if ('color' in this.options) { return this.options['color']; }

	var c = Math.round(40 - 180*this.getWeight());
	c = Math.max(Math.min(c, 210), 0);
	return 'rgb(' + c + ',' + c + ',' + c +')';	
};

QG.Graph.Node.prototype.getStrokeColor = function()
{	
	if (this.state.selected) return this.model.settings['selectcolor'];
	if (this.state.targeted) return this.model.settings['targetcolor'];
	return 'white';
}

QG.Graph.Node.prototype.updateStroke = function()
{
	this.stroke.setFill(this.getStrokeColor()); // select graphically
}

QG.Graph.Node.prototype.getRadius = function()
{
	return this.model.settings['nodesize'] + Math.abs(this.getWeight()) * this.model.settings['nodescale'];
}

QG.Graph.Node.prototype.getPos = function() 
{
	var op = this.drawing.getPosition();
	return [op.x, op.y];
}

QG.Graph.Node.prototype.getLabel = function()
{
	return this.options.label ? this.options.label : '';
}

QG.Graph.Node.prototype.setLabel = function(label)
{
	this.options['label'] = label;
	this.text.setText(this.options['label']);
}

// selecting
QG.Graph.Node.prototype.select = function() 
{
	this.state.selected = true;
	this.updateStroke();
}

QG.Graph.Node.prototype.unselect = function()
{
	this.state.selected = false;
	this.updateStroke();
}

// targeting
QG.Graph.Node.prototype.highlight = function()
{
	this.state.targeted = true;
	this.updateStroke();
}

QG.Graph.Node.prototype.unhighlight = function()
{
	this.state.targeted = false;
	this.updateStroke();
}

QG.Graph.Node.prototype.testLink = function(link)
{
	return true;
}

// adding links
QG.Graph.Node.prototype.addLink = function(link) 
{
	if (!(link in this.links)) { this.links.push(link); }
	return true;
}

QG.Graph.Node.prototype.removeLink = function(link)
{
	var nlinks = this.links;
		
	// select index and update array
	var ix = nlinks.indexOf(link);
	if (ix > -1) { nlinks.splice(ix, 1); }

	this.links = nlinks;	
}

QG.Graph.Node.prototype.export = function()
{
	return [this.getWeight(), this.getPos(), this.options];
}

// get rid of this;
QG.Graph.Node.prototype.destroy = function()
{
	this.drawing.destroy();
}

QG.Graph.Node.prototype.move = function(xy)
{
	this.drawing.setPosition({'x': xy[0], 'y': xy[1]});
}

QG.Graph.Node.prototype.draw = function() {
	
	this.circle = new Kinetic.Circle(
		{
			x: 0,
			y: 0,
			radius: this.getRadius(),
			fill: this.getColor(),
			name: this.id,
			zindex: 10,
			listening: false
		}); 

	this.stroke = new Kinetic.Circle(
		{
			x: 0,
			y: 0,
			radius: this.getRadius() + this.model.settings['nodestroke'],
			fill: 'rgb(255,255,255)',
			zindex: 5
		});

	this.text = new Kinetic.Text(
        {
        	x: -50,
			y: -8,
			text: this.getLabel(),
			fontSize: 16,
			fontStyle: 'bold',
			fontFamily: 'Arial',
			fill: '#444444',
			width: 100,
			align: 'center',
			listening: false
        });
	
	this.drawing = new Kinetic.Group({draggable: this.is('drag')});

	this.drawing.add(this.stroke);
	this.drawing.add(this.circle);
	this.drawing.add(this.text);

	// this.drawing.setAbsolutePosition({x: pos[0], y: pos[1]});
	this.drawing.setAbsolutePosition({x: this.pos[0], y: this.pos[1]});

	// DRAG
	var self = this;
	// No linking when dragging
	this.drawing.on('dragstart', function(e)
	{
		self.model.trigger('move')
		self.model.unselectAll();
		// document.body.style.cursor = 'move';
		e.cancelBubble = true;
	});

	// Update nodes when dragging
	this.drawing.on('dragmove', function(e)
	{
		e.cancelBubble = true;
		$.each(self.links, function(i,l) { l.move() });
	});

	// Dragend
	this.drawing.on('dragend', function(e)
	{
		// document.body.style.cursor = 'default';

		self.model.unselectAll();

		e.cancelBubble = true;
			
		var coll = true, countr = 0;
		while (coll !== false && countr < 20)
		{	
			var pos = self.getPos();
			
			// check for collisions
			coll = self.model.nodeOverlaps(pos[0], pos[1], self);
				
			if (coll !== false)
			{
				var rspace = 1.5*(self.model.settings.nodesize + self.model.settings.nodemaxweight*self.model.settings.nodescale);
				
				var npos = coll.getPos();

				var r = Math.sqrt((npos[0] - pos[0])*(npos[0] - pos[0]) + (npos[1] - pos[1])*(npos[1] - pos[1]));
				if (countr > 2)
				{
					pos[0] += self.model.settings.nodesize*(Math.random() - .5);
					pos[1] += self.model.settings.nodesize*(Math.random() - .5);
						
					var r = Math.sqrt((npos[0] - pos[0])*(npos[0] - pos[0]) + (npos[1] - pos[1])*(npos[1] - pos[1]));
				}
				
				if (pos[0] == npos[0] && pos[1] == npos[1])
				{
					pos[1] += .1*self.model.settings.nodesize;
					var r = Math.sqrt((npos[0] - pos[0])*(npos[0] - pos[0]) + (npos[1] - pos[1])*(npos[1] - pos[1]));
				}
					
				pos[0] = npos[0] + (pos[0] - npos[0])*rspace/r;
				pos[1] = npos[1] + (pos[1] - npos[1])*rspace/r;
				
				self.drawing.setPosition({x: pos[0], y: pos[1]});
			}
			countr+=1;
		}
		$.each(self.links, function(i,l) { l.move() });
		self.model.redraw();

		self.model.trigger('moved');
	});
}

// end node

////////////////////////
// QG.Graph.Band
////////////////////////

QG.Graph.Band = function(model, id, pos, options) 
{
	var idx = 0;
	while (model.validExtrasLabel(String.fromCharCode(65 + idx)) === false) {
		idx ++;
	}
	options.label = String.fromCharCode(65 + idx);

	QG.Graph.Node.call(this, model, id, pos, options);
}

QG.Graph.Band.prototype = $.extend({}, QG.Graph.Node.prototype);

////////////////////////
// QG.Graph.Atom
////////////////////////

// new QG.Graph.Atom(model, 1, [234, 233], 'C', options)
QG.Graph.Atom = function(model, id, pos, atom, options)
{
	QG.Graph.Node.call(this, model, id, pos, options);

	var self = this;
	self.model = model;
	self.name = 'node';
	self.id = 'node' + id;
	self.links = [];

	self.atom = atom;
	self.options = options || {'valence': 3};

	self.getWeight = function() 
	{
		return 0;
		// return QG.Molecule.Atoms[self.atom][0];
	}

	self.getRadius = function()
	{
		return 16;
	}


	this.is = function(key)
	{
		if (key == 'extra')
		{
			return self.isSP2();
		}

		if (key in this.options)
		{
			return true;
		}
		return false;
	}

	self.isSP2 = function()
	{
		for (var i = 0; i < self.links.length; i++)
		{
			if (self.links[i].getBondType() > 1) { return true;}
		}
		return false;
	}

	self.getNumberOfHs = function()
	{
		var b = 0;
		for (var i = 0; i < self.links.length; i++)
		{
			b = b + 1;
			if (self.links[i].is('bond'))
			{
				b = b + self.links[i].getBondType() - 1;
			}
		}
		return self.options.valence - b;
	}

	self.getLabel = function()
	{
		var lbl = self.atom;
		var n = self.getNumberOfHs();
		if (n > 0)
		{
			lbl = lbl + 'H';
		}
		if (n > 1)
		{
			lbl = lbl + QG.Chemistry.subscripts[n];	
		}
		return lbl;
	}

	self.testLink = function(link)
	{
		if (link in this.links)
		{
			return false;
		}
		if (self.getNumberOfHs() == 0)
		{
			return false;
		}
		return true;
	}

	// maning links
	self.addLink = function(link) 
	{
		this.links.push(link);
		self.setLabel(self.getLabel());
		return true;
	}
}

QG.Graph.Atom.prototype = $.extend({}, QG.Graph.Node.prototype);

////////////////////////
// QG.Graph.Link
////////////////////////

// Link
QG.Graph.Link = function(model, id, nodes, weight, phase)
{ 
	var self = this;
	self.model = model;
	self.name = 'link';
	self.id = self.name + id;
	self.nodes = nodes;
	self.rn = Math.random();

	self.options = {
		weight: (weight === undefined ? parseFloat(self.model.settings.linkdefaultweight) : parseFloat(weight)), 
		phase: (phase === undefined ? 0 : parseFloat(phase)) 
	}

	// self.options.phase = 1.5*Math.PI;
}

QG.Graph.Link.prototype.getWeight = function() { return this.options.weight; }
QG.Graph.Link.prototype.setWeight = function(weight) { this.options.weight = parseFloat(weight); }

QG.Graph.Link.prototype.getPhase = function() { return this.options.phase}
QG.Graph.Link.prototype.setPhase = function(phase) { this.options.phase = parseFloat(phase); }


QG.Graph.Link.prototype.getColor = function()
{
	return 'black';
	// return (this.getWeight() <=0 ? 'black' : 'gray');
}

QG.Graph.Link.prototype.getWidth = function()
{
	return Math.abs(this.getWeight() * this.model.settings.linkscale);
}

QG.Graph.Link.prototype.getPos = function()
{
	var ps = this.line.getPoints();
	return [(ps[0] + ps[2])/2, (ps[1] + ps[3])/2];
}

QG.Graph.Link.prototype.is = function(key)
{
	if (key in this.options)
	{
		return true;
	}
	return false;
}

QG.Graph.Link.prototype.draw = function()
{
	var p0 = [0, 0];
	if (this.nodes[0]) {
		p0 = this.nodes[0].getPos();
	}

	var p1 = [0, 0];
	if (this.nodes[1]) {
		p1 = this.nodes[1].getPos();
	}

	this.line = new Kinetic.Line({
			points: p0.concat(p1),
			stroke: this.getColor(),
			strokeWidth: this.getWidth(),	
			name: this.id,
	});

	// arrow
	var ps = this.getArrowPoints(p0, p1);

	this.arrow = new Kinetic.Line({
			points: ps,
			fill: this.getColor(),
			strokeWidth: 0,
			name: this.id + 'arrow',
			closed: true
	});

	this.drawing = new Kinetic.Group();
	
	this.drawing.add(this.arrow);
	this.drawing.add(this.line);
	

	return this.drawing;
}

QG.Graph.Link.prototype.getArrowPoints = function(p0, p1) 
{
	var ll = this.getWidth();

	// center of line
	var pc = [(p0[0] + p1[0])/2, (p0[1] + p1[1])/2];
		
	// direction + length
	var pr = [p0[0] - p1[0], p0[1] - p1[1]];
	var l = Math.sqrt(pr[0] * pr[0] + pr[1] * pr[1]);
	pr = [pr[0]/l, pr[1]/l];

	var phi = this.getPhase() / Math.PI * 180;
	var pB = 4;  //2 * Math.round(Math.abs(phi - Math.PI));   // base length
	
	if (phi > 180) { phi -= 360; }

	if (Math.abs(phi) < 90) 
	{
		var pL = (20 + pB) * Math.sign(phi);
		var pW = 10 * Math.sqrt(Math.abs(phi) / 90) + ll/2
	}
	else 
	{
		var pL = (1.414 * 20 * Math.sqrt( 1 - Math.abs(phi) / 180) + pB) * Math.sign(phi);
		var pW = 10 + ll/2
	}

	pB = Math.sign(phi) * pB;

	pc[0] -= (pL - pB) * pr[0]/2;
	pc[1] -= (pL - pB) * pr[1]/2;

	return [pL * pr[0] + ll/2 * pr[1] + pc[0], pL * pr[1] - ll/2 * pr[0] + pc[1],
			pL * pr[0] - ll/2 * pr[1] + pc[0], pL * pr[1] + ll/2 * pr[0] + pc[1],
		  - pW * pr[1] + pc[0] + pB * pr[0], + pW * pr[0] + pc[1] + pB * pr[1],
		  - pW * pr[1] + pc[0] - pB * pr[0], + pW * pr[0] + pc[1] - pB * pr[1],
		  + pW * pr[1] + pc[0] - pB * pr[0], - pW * pr[0] + pc[1] - pB * pr[1],
		  + pW * pr[1] + pc[0] + pB * pr[0], - pW * pr[0] + pc[1] + pB * pr[1]];
}	

QG.Graph.Link.prototype.moveToBottom = function()
{
	this.drawing.moveToBottom();
}

QG.Graph.Link.prototype.dash = function()
{
	this.options['dash'] = true;
	this.line.dash([20,10]);
}

QG.Graph.Link.prototype.select = function()
{
	this.line.setStroke(this.model.settings['selectcolor']);
	this.arrow.setFill(this.model.settings['selectcolor']);
}

QG.Graph.Link.prototype.unselect = function()
{
	this.line.setStroke(this.getColor());
	this.arrow.setFill(this.getColor());
}

QG.Graph.Link.prototype.update = function(weight, phase)
{
	if (weight !== undefined)
	{
		this.setWeight(weight);
	}
	if (phase !== undefined)
	{
		this.setPhase(phase);
	}

	this.line.setStrokeWidth(this.getWidth())
	// this.line.setStroke(this.getColor());

	var ps = this.getArrowPoints(this.nodes[0].getPos(), this.nodes[1].getPos());
	this.arrow.setPoints(ps);
	// this.arrow.setFill(this.getColor());
}

// move
QG.Graph.Link.prototype.move = function()
{
	var p0 = this.nodes[0].getPos();
	var p1 = this.nodes[1].getPos();
	this.line.setPoints(p0.concat(p1));

	var ps = this.getArrowPoints(p0, p1);
	this.arrow.setPoints(ps);
}

QG.Graph.Link.prototype.setNode = function(idx, node) {
	this.nodes[idx] = node;
}

QG.Graph.Link.prototype.destroy = function()
{
	this.drawing.destroy();
}

////////////////////////
// QG.Graph.Bond
////////////////////////

// QG.Graph.Bond(model, id, [n1, n2], 2)
QG.Graph.Bond = function(model, id, nodes, type) 
{
	QG.Graph.Link.call(this, model, id, nodes, 0);
	
	var self = this;
	
	this.model = model;
	this.name = 'link';
	this.id = this.name + id;
	this.nodes = nodes;

	this.options = {'bond': true, 'bondtype': parseInt(type)}
}

QG.Graph.Bond.prototype = $.extend({}, QG.Graph.Link.prototype);

QG.Graph.Bond.prototype.getBondType = function() { return this.options.bondtype; }
QG.Graph.Bond.prototype.getWeight = function() { return -1; }

QG.Graph.Bond.prototype.getWidth = function() { return 3; }

QG.Graph.Bond.prototype.getPos = function() {
	var ps = this.nodes[0].getPos().concat(this.nodes[1].getPos());
	return [(ps[0] + ps[2])/2, (ps[1] + ps[3])/2];
}

QG.Graph.Bond.prototype.draw = function() {
	this.lines = [];
	this.drawing = new Kinetic.Group();
	
	switch(this.getBondType())
	{
		case 1:
			// line
			this.lines[0] = new Kinetic.Line({
				points: this.nodes[0].getPos().concat(this.nodes[1].getPos()),
				stroke: 'black',
				strokeWidth: this.getWidth()
			});
			break;
		case 2:
			var pos1 = this.nodes[0].getPos();
			var pos2 = this.nodes[1].getPos();

			var dx = pos1[0] - pos2[0];
			var dy = pos1[1] - pos2[1];

			var d = Math.sqrt(dx*dx + dy*dy);
			var normal = [-dy/d, dx/d];

			this.lines[0] = new Kinetic.Line(
			{
				points: [pos1[0] + normal[0]*3, pos1[1] + normal[1]*3, pos2[0] + normal[0]*3, pos2[1] + normal[1]*3], 
				stroke: 'black',
				strokeWidth: this.getWidth(),
			});

			this.lines[1] = new Kinetic.Line(
			{
				points: [pos1[0] - normal[0]*3, pos1[1] - normal[1]*3, pos2[0] - normal[0]*3, pos2[1] - normal[1]*3], 
				stroke: 'black',
				strokeWidth: this.getWidth(),	
			});
			break;
		case 3:
			var pos1 = this.nodes[0].getPos();
			var pos2 = this.nodes[1].getPos();

			var dx = pos1[0] - pos2[0];
			var dy = pos1[1] - pos2[1];

			var d = Math.sqrt(dx*dx + dy*dy);
			var normal = [-dy/d*5, dx/d*5];

			this.lines[0] = new Kinetic.Line(
			{
				points: [pos1[0] + normal[0], pos1[1] + normal[1], pos2[0] + normal[0], pos2[1] + normal[1]], 
				stroke: 'black',
				strokeWidth: this.getWidth(),	
			});

			self.lines[1] = new Kinetic.Line(
			{
				points: [pos1[0], pos1[1], pos2[0], pos2[1]], 
				stroke: 'black',
				strokeWidth:  this.getWidth(),	
			});

			self.lines[2] = new Kinetic.Line(
			{
				points: [pos1[0] - normal[0], pos1[1] - normal[1], pos2[0] - normal[0], pos2[1] - normal[1]], 
				stroke: 'black',
				strokeWidth: this.getWidth(),	
			});
			break;
	}
	$.each(this.lines, function(k, v) { this.drawing.add(v); });

	return this.drawing;
}

QG.Graph.Bond.prototype.select = function()
{
	$.each(this.lines, function(k, v) { v.setStroke(this.model.settings['selectcolor']); });
}

QG.Graph.Bond.prototype.unselect = function()
{
	$.each(this.lines, function(k, v) { v.setStroke('black'); })
}

// move
QG.Graph.Bond.prototype.move = function()
{
	switch(this.getBondType())
	{
		case 1:
			this.lines[0].setPoints(self.nodes[0].getPos().concat(self.nodes[1].getPos()))
			break;
		case 2:
			var pos1 = nodes[0].getPos();
			var pos2 = nodes[1].getPos();

			var dx = pos1[0] - pos2[0];
			var dy = pos1[1] - pos2[1];

			var d = Math.sqrt(dx*dx + dy*dy);
			var normal = [-dy/d, dx/d];

			this.lines[0].setPoints([pos1[0] + normal[0]*3, pos1[1] + normal[1]*3, pos2[0] + normal[0]*3, pos2[1] + normal[1]*3]);
			this.lines[1].setPoints([pos1[0] - normal[0]*3, pos1[1] - normal[1]*3, pos2[0] - normal[0]*3, pos2[1] - normal[1]*3]);
			break;
		case 3:
			var pos1 = nodes[0].getPos();
			var pos2 = nodes[1].getPos();

			var dx = pos1[0] - pos2[0];
			var dy = pos1[1] - pos2[1];

			var d = Math.sqrt(dx*dx + dy*dy);
			var normal = [-dy/d*5, dx/d*5];

			this.lines[0].setPoints([pos1[0] + normal[0], pos1[1] + normal[1], pos2[0] + normal[0], pos2[1] + normal[1]]); 
			this.lines[1].setPoints([pos1[0], pos1[1], pos2[0], pos2[1]])
			this.lines[2].setPoints([pos1[0] - normal[0], pos1[1] - normal[1], pos2[0] - normal[0], pos2[1] - normal[1]]);
			break;
		default:
			console.log('Error')
	}
}

QG.Graph.Bond.prototype.update = function(type)
{
	// remove current drawing
	this.drawing.destroy();
	this.lines = [];
		
	// update bondtype
	this.options.bondtype = type;
	this.updateNodes();

	// redraw
	this.draw();
}

// nodes ma change depending on which bond is between them
QG.Graph.Bond.prototype.updateNodes = function() 
{
	nodes[0].setLabel(nodes[0].getLabel());
	nodes[1].setLabel(nodes[1].getLabel());
}

QG.Graph.Bond.prototype.destroy = function()
{
	this.drawing.destroy();
	this.updateNodes();
}

////////////////////////
// Shadows
////////////////////////

QG.Graph.ShadowNode = function(model, p)
{
	var scale = 1;
	var radius = 10;

	this.drawing = new Kinetic.Circle(
	{
		x: p[0],
		y: p[1],
		radius: radius,
		fill: model.settings['targetcolor'],
		zindex: 10
	});
	this.drawing.visible(false); 

	this.setScale = function(s) {
		if (s) scale = s;
		this.setRadius();
	}

	this.setRadius = function(r) {
		if (r) radius = r;
		this.drawing.setRadius(r*scale);
	}

	this.move = function(xy)
	{
		this.drawing.setPosition({'x': xy[0], 'y': xy[1]});
	}

	this.hide = function()
	{
		this.drawing.visible(false);
	}

	this.show = function()
	{
		this.drawing.visible(true);
	}

	this.visible = function()
	{
		return this.drawing.visible();
	}
}

QG.Graph.ShadowLink = function(model, ps)
{
	var scale = 1;
	var stroke = 4;

	this.drawing = new Kinetic.Line(
	{
		points: ps[0].concat(ps[1]), // in relative position
		stroke: model.settings['targetcolor'],
		strokeWidth: stroke,	
	});
	this.drawing.visible(false);

	this.setScale = function(s) {
		scale = s;
		this.setWidth();
	}

	this.setPosition = function(p0, p1)
	{
		if (p0 !== false) {ps[0] = p0; }
		if (p1 !== false) {ps[1] = p1; }
		
		if (this.drawing && ps[0] && ps[1])
		{
			this.drawing.setPoints(ps[0].concat(ps[1]));
		}
	}

	this.setWidth = function(w)
	{
		if (w) stroke = w;
		this.drawing.setStrokeWidth(scale*stroke);
	}

	this.setColor = function(color)
	{
		this.drawing.setStroke(color);
	}

	this.hide = function()
	{
		this.drawing.setPoints([0,0,0,0])
		this.drawing.visible(false);
	}

	this.show = function()
	{
		this.drawing.visible(true);
	}

	this.visible = function()
	{
		return this.drawing.visible();
	}
}


// 	$$$$$$$$\ $$$$$$$\  $$$$$$\ $$$$$$$$\  $$$$$$\  $$$$$$$\
// 	$$  _____|$$  __$$\ \_$$  _|\__$$  __|$$  __$$\ $$  __$$\
// 	$$ |      $$ |  $$ |  $$ |     $$ |   $$ /  $$ |$$ |  $$ |
// 	$$$$$\    $$ |  $$ |  $$ |     $$ |   $$ |  $$ |$$$$$$$  |
// 	$$  __|   $$ |  $$ |  $$ |     $$ |   $$ |  $$ |$$  __$$<
// 	$$ |      $$ |  $$ |  $$ |     $$ |   $$ |  $$ |$$ |  $$ |
// 	$$$$$$$$\ $$$$$$$  |$$$$$$\    $$ |    $$$$$$  |$$ |  $$ |
// 	\________|\_______/ \______|   \__|    \______/ \__|  \__|


////////////////////////
// QG.Graph.Editor
////////////////////////

QG.Graph.Editor = function(model, options)
{
	this.model = model;
	this.options = options;
	this.options.rendered = false;
	this.widget = {$el: null, $box: null, $content: null};
}

QG.Graph.Editor.prototype.attach = function(wrapper)
{
	this.widget.$el = wrapper;
}

QG.Graph.Editor.prototype.render = function()
{
	this.options.rendered = true;

	this.widget.$el.html('');
	this.widget.$box = $('<div class="qg_model_editor_content"></div>');
	this.widget.$el.addClass('qg_model_editor').append(this.widget.$box);
}

QG.Graph.Editor.prototype.refit = function()
{
	if (!this.options.rendered) return;

	this.widget.$el.css({'z-index': 10});

	if (this.widget.$el.width() < 420) 
	{
		this.widget.$el.removeClass('qg_model_editor_big').addClass('qg_model_editor');
	}
	else 
	{
		this.widget.$el.removeClass('qg_model_editor').addClass('qg_model_editor_big');
	}

	if (this.widget.$el.width() >= 420 && this.widget.$el.width() < 500) {
		this.widget.$el.addClass('qg_model_editor_med');
	}
	else
	{
		this.widget.$el.removeClass('qg_model_editor_med');
	}
}

// Edit a <type> known by <id>
QG.Graph.Editor.prototype.edit = function(elm) 
{	
	this.render();

	// Rebuild html
	var content = [];

	// choose what to edit. 
	if (elm.is('atom')) {
		this.editAtom(content, elm);
	} else if (elm.is('bond')) {
		this.editBond(content, elm);
	} else if (elm.name == 'link') {
		this.editLink(content, elm);
	} else {
		this.editNode(content, elm);
	}

	this.widget.$box.append(content);

	this.refit();
};

QG.Graph.Editor.prototype.editNode = function(content, elm)
{
	content.push($('<h3 class="qg_model_editor_title">Edit node</h3>'));
	// label
	if (elm.is('label')) {
		var model = this.model;
		// var label = $('<div class="qg_model_editor_label"></div>');
		var label = $('<input class="qg_model_editor_label" type="text" value="' + elm.options.label + '" />');
		label.on('input', function(e)
		{
			var lbl = model.validExtrasLabel($(this).val().substring(0, 2));
			if (lbl)
			{
				elm.setLabel(lbl);
				model.redraw();
			}
		});
		content.push(label);
	}

	if (elm.is('edit')) {
		content.push(this.createSlider(elm));
	}

		// buttons
	var $buttons = $('<div class="qg_model_editor_buttons"></div>');
	$buttons.append(this.createDeleter(elm));
	content.push($buttons);


	return content;
}

QG.Graph.Editor.prototype.editAtom = function(content, elm)
{	
	content.append($('<h3 class="qg_model_editor_title">Edit atom</h3>'));

	var atom_buttons = [
		$('<a class="qg_model_atom_carbon"></a>'),
		$('<a class="qg_model_atom_double"></a>'), 
		$('<a class="qg_model_atom_triple"></a>')
	];

	var model = this.model;

	var menu = new QG.Helpers.Radio();
	menu.add('?', atom_buttons[0], function() { 
		if (elm.is('atom') && elm.getBondType() != 1) 
		{
			elm.update(1);
			model.addToLayer(elm.drawing);
			elm.moveToBottom();
			elm.select();
			model.redraw();
		}; 
	});
	// menu.toggle(elm.getBondType());

	content.append($('<div class="qg_model_editor_menu"></div>').append(atom_buttons));

	// QG.Radio()
	return content;
}

QG.Graph.Editor.prototype.editLink = function(content, elm)
{
	// title
	content.push($('<h3 class="qg_model_editor_title">Edit link</h3>'));

	// slider
	content.push(this.createSlider(elm));

	// angular slider
	content.push(this.createAngleSlider(elm));

	// buttons
	var $buttons = $('<div class="qg_model_editor_buttons"></div>');
	$buttons.append(this.createFlipper(elm));
	$buttons.append(this.createDeleter(elm));
	content.push($buttons);

	return content;
}

QG.Graph.Editor.prototype.editBond = function(content, elm)
{
	content.append(
		$('<h3 class="qg_model_editor_title">Edit bond</h3>')
	);		

	var bond_buttons = [
		$('<a class="qg_model_bond_single"></a>'),
		$('<a class="qg_model_bond_double"></a>'), 
		$('<a class="qg_model_bond_triple"></a>')
	];

	var model = this.model;

	var menu = new QG.Helpers.Radio();
	menu.add('1', bond_buttons[0], function() { 
		if (elm.getBondType() != 1) 
		{
			elm.update(1);
			model.addToLayer(elm.drawing);
			elm.moveToBottom();
			elm.select();
			model.redraw();
		}; 
	});
	menu.add('2', bond_buttons[1], function() { 
		if (elm.getBondType() != 2)
		{ 
			elm.update(2);
			model.addToLayer(elm.drawing);
			elm.moveToBottom();
			elm.select();
			model.redraw();
		}; 
	});
	menu.add('3', bond_buttons[2], function() { 
		if (elm.getBondType() != 3)
		{ 
			elm.update(3);
			model.addToLayer(elm.drawing);
			elm.moveToBottom();
			elm.select();
			model.redraw();
		}; 
	});
	menu.toggle(elm.getBondType());

	content.append($('<div class="qg_model_editor_menu"></div>').append(bond_buttons));

	return content;
}

// creater slider
QG.Graph.Editor.prototype.createSlider = function(elm, min, max)
{
	if (elm.name == 'link') {
		var range = {
			'min': [ this.options['linkminweight'], 0.01 ],
			'max': [ this.options['linkmaxweight']]
		}

		var pips = [0, 25, 50, 75, 100];
	}
	else {
		var range = {
			'min': [ this.options['nodeminweight'], 0.01 ],
			'30%': [ -1 ],
			'70%': [ 1, 0.01],
			'max': [ this.options['nodemaxweight']]
		}

		var pips = [0, 30, 50, 70, 100];
	}
	var maxweight = (elm.name == 'link' ? this.options['linkmaxweight'] : this.options['nodemaxweight']);
	var minweight = (elm.name == 'link' ? this.options['linkminweight'] : this.options['nodeminweight']);
	
	var $slider = $('<div class="qg_slider"></div>');
	var $show = $('<input type="text" size="6" class="qg_slider_show"></input>');
		
	$slider.noUiSlider(
	{
		connect: false,
		behaviour: 'tap',
		start: elm.getWeight(),
		range: range,
		step: 0.01
	});
	
	$slider.noUiSlider_pips(
	{
		mode: 'positions',
		values: pips,
		density: 4
	});

	$slider.Link('lower').to($show);

	var model = this.model;
	$slider.on('slide set', function() 
	{
		var data = $slider.val();
		model.update(elm, data);
	});

	return $('<div class="qg_model_editor_slider"></div>').append([$show, $slider]);
};

QG.Graph.Editor.prototype.createAngleSlider = function(elm)
{
	var $slider = $('<div class="qg_circular"></div>');
	var $show = $('<input type="text" size="6" class="qg_slider_show"></input>');

	// $.fn.roundSlider.prototype._invertRange = true;
	var model = this.model;
	$slider.angleSlider({
	    radius: 36,
	    width: 26,
	    min: 0,
	    max: 360,
	    step: 5,
	    value: elm.getPhase() * 180/Math.PI,
	    // sliderType: "default",
	    // value: 40,
	    // max: 360,
	    // min: 0,
	    // step: 10,
	    // width : 18,
	    // circle: "full",
	    // handleSize: "+4",
	    // startAngle: 0,
	    // counterClockwise: true,
		change: function(s) { model.update(elm, undefined, s.getValue()*Math.PI/180); }

	});

	return $('<div class="qg_model_editor_circular"></div>').append($slider);
}

QG.Graph.Editor.prototype.createFlipper = function(elm)
{
	var self = this;

	var $flipper = $('<div class="qg_model_editor_flip"></div>').html('<a class="qg_button red">Flip<a/>');
	$flipper.on('mousedown',function() 
	{	
		var nodes = elm.nodes;
		elm.nodes = [nodes[1], nodes[0]];
		self.model.update(elm)
		return false;
	});

	return $flipper;
}

QG.Graph.Editor.prototype.createDeleter = function(elm) 
{
	var self = this;
	
	var $remove = $('<div class="qg_model_editor_flip"></div>').html('<a alt="delete element" class="qg_button red"><span class="icon-trash-empty"></span><a/>');
	$remove.on('mousedown',function() 
	{
		self.model.unselectAll();
		self.model.remove(elm, true);
		self.reset();
		return false;
	});

	return $remove;
}

// Reset editor
QG.Graph.Editor.prototype.reset = function()
{
	this.widget.$el.html('').removeClass('qg_model_editor').removeClass('qg_model_editor_big').removeClass('qg_model_editor_med');
	this.options.rendered = false;
};

})(jQuery, numeric, QG);
