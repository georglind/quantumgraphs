"use strict";

// QG namespace
var QG = QG || {};

(function($, numeric, QG, Kinetic) {

QG.Widgets = QG.Widgets || {};

// Model Widget
var Model = QG.Widgets.Model = function(setup, settings)
{
	QG.Widget.call(this, setup, settings);

	// implementing data slowly
	this.name = 'Model';
	this.icon = 'M';

	// options
	this.settings = $.extend({draggable: false, collapsed: false}, this.settings);

	// html box settings
	this.widget = {};
	this.widget.menus = {nodes: false, links: false, layers: false};
	// this.widget.container = null;
	// this.widget.$el = null,
	this.widget.$boxes = {
		message: null,
		view: null, 
		draw: null,
		layers: null,
		graph: null, 
		editor: null
	};

	// graph
	this.options = $.extend({}, 
							{
								'movable': false,
								'expanded': true,
								'link_highlight': false,
								'editable': true,
								'targetable': false,
								'linkable': true,
								'drawable': true,
								'nodetype': 'site',
								'linking': {
									'site': {'site': true, 'band': true},
									'band': {'band': false, 'site': true}
								}
							})

	this.nodes = [];
	this.extras = [];
	this.links = [];
	this.H = null;
	this._lid = 0;
	this._nid = 0;

	this.target = null;
	this.selected = [];

	this.stage = null;
	this.layer = null;
	this.shadow = {layer: null, node: null, link: null};
	this.overlays = {};

	this.editor = new QG.Graph.Editor(this, this.settings);
}

$.extend(Model.prototype, QG.Widget.prototype);

// 	$$$$$$$\  $$$$$$$$\ $$\   $$\ $$$$$$$\  $$$$$$$$\ $$$$$$$\
// 	$$  __$$\ $$  _____|$$$\  $$ |$$  __$$\ $$  _____|$$  __$$\
// 	$$ |  $$ |$$ |      $$$$\ $$ |$$ |  $$ |$$ |      $$ |  $$ |
// 	$$$$$$$  |$$$$$\    $$ $$\$$ |$$ |  $$ |$$$$$\    $$$$$$$  |
// 	$$  __$$< $$  __|   $$ \$$$$ |$$ |  $$ |$$  __|   $$  __$$<
// 	$$ |  $$ |$$ |      $$ |\$$$ |$$ |  $$ |$$ |      $$ |  $$ |
// 	$$ |  $$ |$$$$$$$$\ $$ | \$$ |$$$$$$$  |$$$$$$$$\ $$ |  $$ |
// 	\__|  \__|\________|\__|  \__|\_______/ \________|\__|  \__|

QG.Widgets.Model.prototype.render = function(wrapper) 
{
	var self = this;
	var widget = self.widget;
	
	widget.$el = wrapper;
	// widget.$el = wrapper.addClass('qg_panel3x2');
	
	// scaffolding
	widget.$boxes.view = $('<div class="qg_model_view_menu"></div>');
	widget.$boxes.draw = $('<div class="qg_model_draw_menu"></div>');
	widget.$boxes.layers = $('<div class="qg_model_layers_menu"></div>');

	widget.$boxes.message = $('<div class="qg_model_message"></div>');
	widget.$boxes.graph = $('<div class="qg_model_stage"></div>');
	widget.$boxes.editor = $('<div class="qg_model_submenu"></div>');
	
	// append scaffolding to panel
	$.each(widget.$boxes, function(key, value) { widget.$el.append(value) });

	// The draw menu
	// node buttons
	var nodebtns = [$('<a class="qg-sidetab" title="Move the graph"><span class="icon-move"></span></a>'),
					$('<a class="qg-sidetab" title="Draw nodes"><span class="icon-graphnode"></span></a>'),
					$('<a class="qg-sidetab" title="Draw bands"><span class="icon-graphnode-big yellow-text"></span></a>'),
					// $('<a class="qg-sidetab qg-icon-carbon"></a>'), 
					// $('<a class="qg-sidetab qg-icon-nitrogen"></a>'),
					// $('<a class="qg-sidetab qg-icon-oxygen"></a>'),
					// $('<a class="qg-sidetab qg-icon-sulphur"></a>'),
					];
	widget.menus.nodes = new QG.Navigation.Menu();
	widget.menus.nodes.add('move', nodebtns[0]);
	widget.menus.nodes.add('site', nodebtns[1]);
	// self.menu.nodes.add('carbon', nodebtns[2]);
	// self.menu.nodes.add('nitrogen', nodebtns[3]);
	// self.menu.nodes.add('oxygen', nodebtns[4]);
	// self.menu.nodes.add('sulphur', nodebtns[5]);
	widget.menus.nodes.add('band', nodebtns[2]);

	// bind trigger events
	widget.menus.nodes.listen('main', 'change', function(mode) { 
		if (mode === 'move') {
			self.options.drawable = false;
			self.options.nodetype = false;
		}
		else
		{
			self.options.drawable = (mode !== false);
			self.options.nodetype = mode;
		}
	});

	widget.menus.nodes.listen('move', 'select', function(mode) { self.setDraggable(true); });
	widget.menus.nodes.listen('move', 'unselect', function(mode) { self.setDraggable(false); });

	widget.menus.nodes.toggle('site');
	
	// append to html
	widget.$boxes.draw.append(nodebtns);

	// The link menu
	// link buttons 
	var linkbtns = [$('<a class="qg-sidetab" title="Toggle link drawing"><span class="icon-graphlink"></span></a>')];
	widget.menus.links = new QG.Navigation.Menu();
	widget.menus.links.add('link', linkbtns[0]);
	widget.menus.links.listen('main', 'change', function(mode) {
		self.options.linkable = (mode !== false);
	})
	widget.menus.links.toggle('link');
	widget.$boxes.draw.append(linkbtns);

	// moving stuff
	// var movebtns = [$('<a class="qg-sidetab"><span class="icon-move"></span></a>')];
	// widget.menus.nav = new QG.Navigation.Menu();
	// widget.menus.nav.add('link', movebtns[0]);
	// widget.menus.nav.listen('main', 'change', function(mode) {		
	// 	self.setDraggable(mode !== false);
	// });
	// widget.$boxes.draw.append(movebtns);

	// The layers_menu
	// icons created by other widgets
	widget.menus.layers = new QG.Navigation.Menu();

	// The view menu 
	// view buttons
	var viewbtns = [$('<a class="qg_button" title="Zoom in"><span class="icon-zoom-in"></span></a>'),
					$('<a class="qg_button" title="Zoom out"><span class="icon-zoom-out"></span></a>'),
					$('<a class="qg_button" title="Center graph"><span class="icon-target"></span></a>')];

	viewbtns[0].on('click', function(e){ e.preventDefault(); self.zoom(+.15, 80, true); });
	viewbtns[1].on('click', function(e){ e.preventDefault(); self.zoom(-.15, 80, true); });
	viewbtns[2].on('click', function(e){ 
		e.preventDefault();
		self.focus(500);
	});
	widget.$boxes.view.append(viewbtns);

	// attach editor to html
	self.editor.attach(widget.$boxes.editor);

	// render graph
	self.renderGraph(widget.$boxes.graph)
	// container.append(container.panel);
	self.addOverlay('values', 0, '', function() { self.overlayValues(); });
}

// Render the graph on canvas
Model.prototype.renderGraph = function(wrapper)
{
	var self = this;
	// setup up rest of app
	// create canvas stage
	self.stage = new Kinetic.Stage(
	{
		container: wrapper[0],
		width: 672,
		height: 446
	});

	// Add stage drawing layer
	self.layer = new Kinetic.Layer({draggable: self.options.draggable});

	//a large transparent background to make everything draggable
	var background = new Kinetic.Rect({
	    x: -2000,
	    y: -2000,
	    width: 4000,
	    height: 4000,
	    fill: "#ffffff",
	    opacity: 0.01,
	    preventDefault: false
	});

	self.addToLayer(background);

	// Listen for clicks on stage
	self.stage.on('contentMousedown contentTouchstart', function(e)
	{
		// huh?
		if (e.evt.which == 3) { return true; }
		
		// How to ???
		if (!self.options.editable) { return true;}

		// control scrolling behaviour for mobile devices
		if (self.options.movable || self.options.nodetype != false) {
			e.evt.preventDefault();
		}

		// get position
		var pos = self.stagePosToLayerPos(self.getStagePointerPos());

		// iterate over nodes and extras
		var item = self.nodesCollision(pos.x, pos.y, self.nodes);
		if (!item) {
			item = self.nodesCollision(pos.x, pos.y, self.extras);
		}
		
		self.setTarget(null);

		// did we hit something?
		if (item) {
			self.select(item);
			return false;
		}

		if (self.options.nodetype != false)
		{
			self.clearOverlay('all'); // clear eigenlayer and update message
		}

		// drawing ?
		if (self.options.drawable == true) {

			var options = false;
			if (self.options.nodetype == 'site') 
			{
				options = {weight: 0, drag: true};
			}
			else if (self.options.nodetype == 'band')
			{
				options = {weight: 8, drag: true, edit: false, type: 'band', label: true, extra: true, dash: true, color: self.settings['bandcolor'], };	
			}
			else 
			{
				options = {drag: true, edit: false, color: 'white', type: 'atom', atom: self.options.nodetype};
			}

			self.addNode(pos.x, pos.y, options, true, false);
		}
	});

	self.renderShadow();

	// listen for mouse moving on stage to update target
	self.stage.on('contentMousemove', function(e)
	{
		self.options.targetable = true;

		var sp = self.getStagePointerPos();
		var pos = self.stagePosToLayerPos(sp);

		var item = self.nodesCollision(pos.x, pos.y, self.nodes);
		if (!item)
			item = self.nodesCollision(pos.x, pos.y, self.extras);

		// select item as target (often this resets because item=null)
		self.setTarget(item);

		// update shadow pos
		self.moveShadow(sp);
	});

	// hide shadow on mouseout
	self.stage.on('contentMouseout', function(e) {
		self.hideShadow();
	});

	// show shadow on mouseover
	self.stage.on('contentMouseover',function(e) {
		self.updateShadow();
	});
}

// 	$$\   $$\ $$$$$$$$\ $$$$$$\ $$\       $$$$$$\ $$$$$$$$\ $$\     $$\
// 	$$ |  $$ |\__$$  __|\_$$  _|$$ |      \_$$  _|\__$$  __|\$$\   $$  |
// 	$$ |  $$ |   $$ |     $$ |  $$ |        $$ |     $$ |    \$$\ $$  /
// 	$$ |  $$ |   $$ |     $$ |  $$ |        $$ |     $$ |     \$$$$  /
// 	$$ |  $$ |   $$ |     $$ |  $$ |        $$ |     $$ |      \$$  /
// 	$$ |  $$ |   $$ |     $$ |  $$ |        $$ |     $$ |       $$ |
// 	\$$$$$$  |   $$ |   $$$$$$\ $$$$$$$$\ $$$$$$\    $$ |       $$ |
// 	 \______/    \__|   \______|\________|\______|   \__|       \__|

Model.prototype.getWidth = function() { return this.widget.$el.width(); }
Model.prototype.getHeight = function() { return this.widget.$el.height(); }
	
// Stage
Model.prototype.getStageWidth = function() { return this.stage.getWidth(); }
Model.prototype.setStageWidth = function(width) { this.stage.setWidth(width); }

Model.prototype.getStageHeight = function() { return this.stage.getHeight(); }
Model.prototype.setStageHeight = function(height) { this.stage.setHeight(height); }

// Layer
Model.prototype.getLayerPosition = function() { return this.layer.getPosition(); }
Model.prototype.setLayerPosition = function(pos) { return this.layer.setPosition(pos); }

Model.prototype.getLayerScale = function() { return this.layer.getScale().x; }
Model.prototype.setLayerScale = function(s) { 
	if (this.shadow.node) {
		this.shadow.node.setScale(s);
		this.shadow.link.setScale(s);
	}
	return this.layer.setScale({x: s, y: s}); 
}

Model.prototype.setDraggable = function(drag) {
	this.options.movable = drag;
	if (drag) { this.widget.$el.addClass('qg_movable') } else {  this.widget.$el.removeClass('qg_movable'); }
	this.layer.draggable(drag);
}

// add to main layer functionality and redraw main layer
Model.prototype.addToLayer = function(elm) { this.layer.add(elm); }
Model.prototype.redraw = function() { this.layer.batchDraw(); };

// get position of pointer in stage coordinates
Model.prototype.getStagePointerPos = function() { return this.stage.pointerPos; }

// convert a position in layer coordinates to state coordinates
Model.prototype.layerPosToStagePos = function(lp)
{
	var lo = this.layer.getPosition(); // layer offset
	var ls = this.layer.getScale().x; // layer scale

	return {x: ls*lp.x + lo.x, y: ls*lp.y + lo.y};
}

// convert a position in stage coordinates to layer coordinates
Model.prototype.stagePosToLayerPos = function(sp)
{
	var lo = this.layer.getPosition(); // layer offset
	var ls = this.layer.getScale().x;  // layer scale

	return {x: (sp.x - lo.x)/ls, y: (sp.y - lo.y)/ls};
}

// display message in top left corner
Model.prototype.displayMessage = function(text, size) 
{
	if (size==undefined) { size = 1; }
	size = 12 + 4*size;

	if (text === undefined) { text = ''; }

	this.widget.$boxes.message.html(text);
}

// 	$$$$$$$$\  $$$$$$\  $$$$$$$\   $$$$$$\  $$$$$$$$\ $$$$$$$$\
// 	\__$$  __|$$  __$$\ $$  __$$\ $$  __$$\ $$  _____|\__$$  __|
// 	   $$ |   $$ /  $$ |$$ |  $$ |$$ /  \__|$$ |         $$ |
// 	   $$ |   $$$$$$$$ |$$$$$$$  |$$ |$$$$\ $$$$$\       $$ |
// 	   $$ |   $$  __$$ |$$  __$$< $$ |\_$$ |$$  __|      $$ |
// 	   $$ |   $$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |         $$ |
// 	   $$ |   $$ |  $$ |$$ |  $$ |\$$$$$$  |$$$$$$$$\    $$ |
// 	   \__|   \__|  \__|\__|  \__| \______/ \________|   \__|

// the target changes the shadow when one is hovering over an existing node

Model.prototype.setTarget = function(target) {
	
	// if currently elements aren't targetable/selectable --> abort	
	if (!this.options.targetable) return;
	
	// if no previous target and no new target
	if (!this.target && !target) { return; }

	// if new target is the same as the existing target, we do nothing and return
	if (this.target && target && this.target.id == target.id) return;
	
	// unhighlight any previous targets
	if (this.target) { this.target.unhighlight(); }

	// set target ref
	this.target = target;

	// if the target exists
	if (this.target) {
		// if nothing else is selected
		if (this.selected.length == 0) {
			// yes -> highlight target
			this.target.highlight();
		} else if (this.selected[0].name != 'node') {
			// reset link width if we target a link?
			this.shadow.link.setWidth(4);
		} else {
			// no --> then what?
			if (this.selected[0].id == this.target.id || this.selected[0].name != 'node') {
				// target and selected identical. reset link width
				this.shadow.link.setWidth(4);
			} 
			else
			{
				// unidentical -> highlight target
				this.target.highlight();

				if (this.testLink(this.target, this.selected)) {
					
					// there is a link between them?
					// yes --> foreshadow link selection
					this.shadow.link.setWidth(20);
					this.shadow.link.show();
					this.options.link_highlight = true;

				} else {

					// there is no link and they are not identical
					if (this.options.linking[this.selected[0].options.type][this.target.options.type])
					{
						// a link can be made
						// yes --> foreshadow link creation
						this.updateShadow();
						this.shadow.link.setWidth(12);
						this.target.highlight();
					}
					else 
					{
						// a link cannot be made 
						// unset any link foreshadowing
						this.updateShadow(true, false);
					}
				}
			}
		} 
	} else {
		// resets link shadow width
		this.shadow.link.setWidth(4);

		if (this.selected.length > 0 && this.selected[0].name == 'node' &&  !this.options.linking[this.selected[0].options.type][this.options.nodetype])
		{
			this.updateShadow(true, false);
		}
		else
		{
			this.updateShadow(); 
		}
	}

	this.redraw();
}

// reset targets
Model.prototype.untargetAll = function() { this.setTarget(null); }

// 	 $$$$$$\  $$\   $$\  $$$$$$\  $$$$$$$\   $$$$$$\  $$\      $$\
// 	$$  __$$\ $$ |  $$ |$$  __$$\ $$  __$$\ $$  __$$\ $$ | $\  $$ |
// 	$$ /  \__|$$ |  $$ |$$ /  $$ |$$ |  $$ |$$ /  $$ |$$ |$$$\ $$ |
// 	\$$$$$$\  $$$$$$$$ |$$$$$$$$ |$$ |  $$ |$$ |  $$ |$$ $$ $$\$$ |
// 	 \____$$\ $$  __$$ |$$  __$$ |$$ |  $$ |$$ |  $$ |$$$$  _$$$$ |
// 	$$\   $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$ |  $$ |$$$  / \$$$ |
// 	\$$$$$$  |$$ |  $$ |$$ |  $$ |$$$$$$$  | $$$$$$  |$$  /   \$$ |
// 	 \______/ \__|  \__|\__|  \__|\_______/  \______/ \__/     \__|
//
// the (fore)shadow helps the user to anticipate the click action

// render the shadow
Model.prototype.renderShadow = function() {
	// shadow
	this.shadow.layer = new Kinetic.FastLayer();

	this.shadow.node = new QG.Graph.ShadowNode(this, [0, 0]);
	this.shadow.link = new QG.Graph.ShadowLink(this, [[0, 0], [0, 0]]);
	
	this.shadow.layer.add(this.shadow.node.drawing);
	this.shadow.layer.add(this.shadow.link.drawing);
	this.shadow.node.show();

	// finally add layers
	this.stage.add(this.shadow.layer);
	this.stage.add(this.layer);

	// stage events
	var self = this;
	this.layer.on('dragstart', function( ) {
		self.hideShadow();
	});
}

// update visibility of the shadow
Model.prototype.updateShadow = function(node, link) {
	// if there is no initiated shadow --> abort
	if (!this.shadow.node) { return; }

	// Node shadow
	// should we show node shadow? default is true
	node = node === undefined ? true : node;
	
	// if undrawable then no
	node = this.options.drawable ? node : false;
	
	if (node) { 
		this.shadow.node.show(); 
	} else {
		this.shadow.node.hide();
	}

	// Link shadow
	// Should we draw the link shadow? default is true
	link = link === undefined ? true : link;

	// If unlinkable or undrawable then no.
	link = this.options.linkable && this.options.drawable ? link : false;

	// if there is no anchoring node then no.
	link = this.selected.length > 0 && this.selected[0].name == 'node' ? link : false;

	if (link) { 
		this.shadow.link.show(); 
	} else { 
		this.shadow.link.hide(); 
	}
}

// hide current shadow
Model.prototype.hideShadow = function() {

	if (!this.shadow.node) { return; }

	this.shadow.node.hide();
	this.shadow.link.hide();
	this.shadow.layer.batchDraw();
}

// move current shadow (based on pointer input)
Model.prototype.moveShadow = function(sp) {

	if (!this.shadow.node) { return; }

	// pos or target
	if (this.target) {
		var lp = this.target.getPos();
		sp = this.layerPosToStagePos({x: lp[0], y: lp[1]});
	}
	this.shadow.node.move([sp.x, sp.y]);

	// link?
	if (this.selected.length > 0 && this.selected[0].name == 'node' && this.shadow.link.visible()) {
		var selp = this.selected[0].getPos();
		var sesp = this.layerPosToStagePos({x: selp[0], y: selp[1]});
		this.shadow.link.setPosition([sesp.x, sesp.y], [sp.x, sp.y]);
	}

	this.shadow.layer.batchDraw();
}

// 	$$\   $$\  $$$$$$\  $$$$$$$\  $$$$$$$$\  $$$$$$\
// 	$$$\  $$ |$$  __$$\ $$  __$$\ $$  _____|$$  __$$\
// 	$$$$\ $$ |$$ /  $$ |$$ |  $$ |$$ |      $$ /  \__|
// 	$$ $$\$$ |$$ |  $$ |$$ |  $$ |$$$$$\    \$$$$$$\
// 	$$ \$$$$ |$$ |  $$ |$$ |  $$ |$$  __|    \____$$\
// 	$$ |\$$$ |$$ |  $$ |$$ |  $$ |$$ |      $$\   $$ |
// 	$$ | \$$ | $$$$$$  |$$$$$$$  |$$$$$$$$\ \$$$$$$  |
// 	\__|  \__| \______/ \_______/ \________| \______/

// Add node at <x,y> with <weight> and <options>
Model.prototype.addNode = function(x, y, options, select_node, reval) {
	// defaults
	if (options === undefined) { options = {}; }
	if (select_node === undefined) { select_node = true; }
	if (reval === undefined) { reval = true; }
	
	if (options['type'] == 'atom')
	{
		var node = new QG.Graph.Atom(this, this._nid, [x, y], options['atom'], $.extend(options, {atom: true}));	
	}
	else if (options['type'] == 'band')
	{
		var node = new QG.Graph.Band(this, this._nid, [x, y], $.extend(options, {band: true}));
	}
	else 
	{
		var node = new QG.Graph.Node(this, this._nid, [x, y], $.extend(options, {type: 'site'}));
	}

	// Draw
	node.draw();
	this._nid ++;

	if (node.is('extra')) {
		this.extras.push(node); 
	} else {
		node.index = this.nodes.length;
		this.nodes.push(node);
	}

	// Add drawing to nodelayer and draw
	this.addToLayer(node.drawing);
	this.redraw();

	// select this node unless select parameter is false.
	if (select_node) { this.select(node); }

	// if only one node then revaluate
	if (reval || this.nodes.length == 1) { this.setup.revaluate(); }
	
	return node.id;
};

// reindex nodes
Model.prototype.indexNodes = function()
{
	for (var i = 0; i < this.nodes.length; i++)
	{
		this.nodes[i].index = i;
	}
}

// Extras labels
// Check if extras label exists
Model.prototype.validExtrasLabel = function(lbl) {
	if (lbl == '') { return false;}
	
	for (var i = 0; i < this.extras.length; i ++) {
		if (this.extras[i].getLabel() == lbl) { return false; }
	}

	return lbl;
}

// Collisions
// Is there a collision between point (x, y) and nodes
Model.prototype.nodesCollision = function(x, y, nodes)
{
	var nl = nodes.length;
	
	var item = null;
	for (var i = 0; i < nl; i++)
	{
		var pos = nodes[i].getPos();
		var r = nodes[i].getRadius() * 3;

		if (x < pos[0] - r || x > pos[0] + r) continue;
		if (y < pos[1] - r || y > pos[1] + r) continue;

		return nodes[i];
	}

	return item;
}

// node overlaps
// Test collision with other nodes at point <x>, <y> of node <node> and randomly choose a new position if <randomize>.
Model.prototype.nodeOverlaps = function(x, y, node, randomize) 
{
	if (randomize===undefined) { randomize = false;}

	var rspace = 1.5*(this.options.nodesize + this.settings.nodemaxweight * this.settings.nodescale);

	for (var i=0; i < this.nodes.length; i++) {
		if (node !== undefined && node.id == this.nodes[i].id) { continue; }
		var pos = this.nodes[i].getPos();
		var r = this.nodeOverlap(pos[0], pos[1], x, y, rspace);
		if (r) { return this.nodes[i]; }
	}

	for (var i=0; i < this.extras.length; i++) {
		if (node !== undefined && node.id == this.extras[i].id) { continue; }
		var pos = this.extras[i].getPos();
		var r = this.nodeOverlap(pos[0], pos[1], x, y, rspace);
		if (r) { return this.extras[i]; }
	}
	return false;
};

// Test for space collision between given node
Model.prototype.nodeOverlap = function(x0, y0, x1, y1, rspace) 
{
	var r = Math.sqrt((x0-x1)*(x0-x1) + (y0-y1)*(y0-y1));

	if (r < rspace)	{ return true; }
	return false;
}

// Update node <nid> with <weight>
Model.prototype.updateNode = function(node, weight) 
{
	node.setWeight(weight); // update data
	
	this.redraw();

	this.setup.revaluate({'Model': node}); //reval
}

// Remove node <nid>
Model.prototype.removeNode = function(node, reval) {
	console.log('Remove ' + node.id); // console

	// unselect if selected
	if (this.selected.length > 0 && node.id == this.selected[0].id) {
		this.unselectAll();
	}

	// untarget if targeted
	if (this.target && node.id == this.target.id) {
		this.untargetAll();
	}

	var nodeLinks = node.links.slice(0);
	for (var i = 0; i < nodeLinks.length; ++i) {
		this.removeLink(nodeLinks[i], false);
	}
			
	if (node.is('extra')) {	
		// find node by index
		var nid = this.extras.findIndex(function(elm) { return elm !== undefined && elm.id == node.id; });
		if (nid !== false) {
			this.extras.splice(nid, 1);
		}
	} else {
		// find node by index
		var nid = this.nodes.findIndex(function(elm) { return elm !== undefined && elm.id == node.id; });
		if (nid !== false) {
			this.nodes.splice(nid, 1);
			this.indexNodes();
		}
	}
	
	// delete node from data structure
	node.destroy();
	this.redraw();

	if (reval) { this.setup.revaluate(); } // reevaluate? 
};
	
// 	$$\       $$$$$$\ $$\   $$\ $$\   $$\  $$$$$$\
// 	$$ |      \_$$  _|$$$\  $$ |$$ | $$  |$$  __$$\
// 	$$ |        $$ |  $$$$\ $$ |$$ |$$  / $$ /  \__|
// 	$$ |        $$ |  $$ $$\$$ |$$$$$  /  \$$$$$$\
// 	$$ |        $$ |  $$ \$$$$ |$$  $$<    \____$$\
// 	$$ |        $$ |  $$ |\$$$ |$$ |\$$\  $$\   $$ |
// 	$$$$$$$$\ $$$$$$\ $$ | \$$ |$$ | \$$\ \$$$$$$  |
// 	\________|\______|\__|  \__|\__|  \__| \______/

// Test if two nodes are linked	
Model.prototype.testLink = function(node1, node2) {
	if (node1.id == node2.id) { return false; } // same site selected: abort

	// if link exists:
	for (var i = 0; i < node1.links.length; i++) {
		if (node1.links[i].nodes[0].id == node2.id || node1.links[i].nodes[1].id == node2.id ) {
			return node1.links[i]; // abort if linked and select node instead
		}
	}

	return false;
};

// Add link between two nodes <nid1>, <nid2> width <weight>
Model.prototype.addLink = function(node1, node2, weight, phase, select, reval) {
	// same sites: abort
	if (node1.id == node2.id) { return true; } 

	// Hack: no links between two bands
	if (node1.is('band') && node2.is('band')) { return true; }

	// link already exists?
	if (this.testLink(node1, node2)) { return; }
	
	// Is this link a link or a bond
	var link = false;

	// Create bond between two atoms
	if (node1.is('atom') && node2.is('atom')) {
		link = new QG.Graph.Bond(this, this._lid, [node1, node2], 1);
	}

	// Create normal link else
	if (!link) {
		link = new QG.Graph.Link(this, this._lid, [node1, node2], weight, phase);
	}

	// Link not allowed by one of the node types?
	if (!(node1.testLink(link) && node2.testLink(link))) { return false }

	// Add to link list		
	this._lid ++; // increment running index
	this.links.push(link);

	// add to nodes
	node1.addLink(link);
	node2.addLink(link);

	// Draw
	link.draw();
	this.layer.add(link.drawing);
	link.moveToBottom();

	// Change to line to dashed if one node demands dashed
	if (node1.is('dash') || node2.is('dash')) { link.dash(); };

	// Debugging console log
	console.log('Added ' + link.id + ' between ' + node1.id + ' and ' + node2.id + '; weight: ' + link.options.weight); // help

	// redraw
	this.redraw();

	// revaluate
	if (reval === undefined || reval) { this.setup.revaluate(); } // reevaluate

	return link;
};

Model.prototype.updateLink = function(link, weight, phase) {
	link.update(weight, phase);
	this.redraw();
	this.setup.revaluate({'Model': link});
};

// Remove link
Model.prototype.removeLink = function(link, reval) {
	console.log('Remove ' + link.id + ' from ' + link.nodes[0].id + ' to ' + link.nodes[1].id);

	this.unselectAll();

	for (var i = 0; i < 2; i ++) {
		link.nodes[i].removeLink(link);
	}

	for (var i = 0; i < this.links.length; i++) {
		if (this.links[i] !== undefined && this.links[i].id == link.id) {
			break;
		}
	}

	link.destroy();
	this.links.splice(i, 1); // remove link
	
	this.redraw();

	if (reval == undefined || reval) { this.setup.revaluate(); }
};

// 	$$\       $$$$$$\ $$\   $$\ $$\   $$\                       $$\   $$\  $$$$$$\  $$$$$$$\  $$$$$$$$\
// 	$$ |      \_$$  _|$$$\  $$ |$$ | $$  |         $$\          $$$\  $$ |$$  __$$\ $$  __$$\ $$  _____|
// 	$$ |        $$ |  $$$$\ $$ |$$ |$$  /          $$ |         $$$$\ $$ |$$ /  $$ |$$ |  $$ |$$ |
// 	$$ |        $$ |  $$ $$\$$ |$$$$$  /        $$$$$$$$\       $$ $$\$$ |$$ |  $$ |$$ |  $$ |$$$$$\
// 	$$ |        $$ |  $$ \$$$$ |$$  $$<         \__$$  __|      $$ \$$$$ |$$ |  $$ |$$ |  $$ |$$  __|
// 	$$ |        $$ |  $$ |\$$$ |$$ |\$$\           $$ |         $$ |\$$$ |$$ |  $$ |$$ |  $$ |$$ |
// 	$$$$$$$$\ $$$$$$\ $$ | \$$ |$$ | \$$\          \__|         $$ | \$$ | $$$$$$  |$$$$$$$  |$$$$$$$$\
// 	\________|\______|\__|  \__|\__|  \__|                      \__|  \__| \______/ \_______/ \________|


// update link or node
Model.prototype.update = function(elm, weight, phase) 
{
	if (elm.name == 'link') { return this.updateLink(elm, weight, phase); }
	return this.updateNode(elm, weight);
};

Model.prototype.remove = function(elm, reval)
{
	if (elm.name == 'link') { return this.removeLink(elm, reval); }
	return this.removeNode(elm, reval);
}


// 	 $$$$$$\  $$$$$$$$\ $$\       $$$$$$$$\  $$$$$$\ $$$$$$$$\
// 	$$  __$$\ $$  _____|$$ |      $$  _____|$$  __$$\\__$$  __|
// 	$$ /  \__|$$ |      $$ |      $$ |      $$ /  \__|  $$ |
// 	\$$$$$$\  $$$$$\    $$ |      $$$$$\    $$ |        $$ |
// 	 \____$$\ $$  __|   $$ |      $$  __|   $$ |        $$ |
// 	$$\   $$ |$$ |      $$ |      $$ |      $$ |  $$\   $$ |
// 	\$$$$$$  |$$$$$$$$\ $$$$$$$$\ $$$$$$$$\ \$$$$$$  |  $$ |
// 	 \______/ \________|\________|\________| \______/   \__|
// 	
// 	
// 	

Model.prototype.multiselect = function(elm) {
	var already_selected = this.selected.findIndex(function(e){return (e !== undefined && e.id == elm.id); });

	if (already_selected) { this.unselectAll(elm, already_selected); return; }

	// Select either node or newly created link
	elm.select();
	
	// add to selected list
	this.selected.push(elm);

	this.clearOverlay();

	this.updateShadow();

	this.redraw();
}

// Select a link or a node
Model.prototype.select = function(elm, draw) {
	// Selected same element twice? 

	var already_selected = this.selected.findIndex(function(e){return e !== undefined && e.id == elm.id});

	if (already_selected > -1) { this.unselect(elm); return; }

	// Are two nodes selected?
	if (this.selected.length > 0 && this.selected[0].name == 'node' && elm.name == 'node') {
		// Are the two nodes already linked?
		var test = this.testLink(elm, this.selected[0]);
		// Are the two nodes different
		if (test !== true) {
			// Good. Is there a link between them?
			if (test !== false) {
				// Then select the link
				if (this.options.targetable) { elm.highlight(); }
				elm = test;
			} else {
				draw = draw === undefined ? this.options.linkable : draw;
				if (draw) { this.addLink(elm, this.selected[0]); }
			}
		}
	}
	
	// Unselect everything
	this.unselectAll();	

	// Clear any overlays
	this.clearOverlay('all');

	// Select either node or newly created link
	elm.select();
		
	// save selected element
	this.selected = [elm];

	// set shadow
	if (this.selected[0].name == 'node') {
		this.updateShadow(true, this.options.linking[this.selected[0].options.type][this.options.nodetype]);
	}

	// Edit element?
	if (this.options.editable == true)
	{
		var lp = elm.getPos();
		var pos =  this.layerPosToStagePos({x: lp[0], y: lp[1]});

		var dy = pos.y + 100 - this.getStageHeight();

		if (dy > 0) { this.move(0, -dy, 100); }

		// something fishy?
		this.editor.edit(elm);
	}

	// drawing
	this.redraw();

	// console
	console.log('Selected ' + elm.id);
};


Model.prototype.unselect = function(elm) {
	if (this.selected.length == 0) { return; }

	this.editor.reset();

	this.hideShadow();

	var idx = this.selected.findIndex(function(sel) { return sel !== undefined && elm.id == sel.id; });
	
	if (idx !== false) {
		elm.unselect();
		this.selected.splice(idx);
	}

	this.redraw();
}

// unselect everything
Model.prototype.unselectAll = function() {	
	if (this.selected.length == 0) { return; }

	// fishy
	this.editor.reset();

	this.hideShadow();  	   // hide any shadows
	
	for (var i=0; i < this.selected.length; i++)
	{
		this.selected[i].unselect(); // deselect graphically
	}

	this.redraw();

	this.selected = [];
}

////////////////////////////////////
/// Move and Zoom
/// -ing on the canvas
////////////////////////////////////

Model.prototype.move = function(dx, dy, duration) {
	if (!duration && duration !== 0) { duration = 200; }

	var pos = this.getLayerPosition();
	var s = this.getLayerScale();

	this.hideShadow();

	this.trigger('move');

	if (duration <= 0) {
		this.setLayerPosition({x: pos.x + dx, y: pos.y + dy});
		this.trigger('moved');
		return;
	}

	var self = this;
	var anim = new Kinetic.Animation({
	    call: function(anim) {
	        if (anim.frame.time >= duration) {
        		anim.stop() ;
    			self.setLayerPosition({x: pos.x + dx, y: pos.y + dy});
    			self.redraw();
    			self.trigger('moved');
    		} else {
    			var p = anim.frame.time/duration;
    			self.setLayerPosition({x: pos.x + p * dx, y: pos.y + p * dy});
    			self.redraw();
    		}
		}
	});

	anim.start();
}

// focus
// focusses on the existing model
// animates zoom for duration milliseconds
// duration <= 0 : instantaneous
Model.prototype.focus = function(duration) {
	// focus on the current model
	var maxs = [-10000, -10000];
	var mins = [10000, 10000];

	for (var i = 0; i < this.nodes.length; i++)
	{	
		var pos = this.nodes[i].getPos();
		maxs[0] = Math.max(maxs[0], pos[0]);
		maxs[1] = Math.max(maxs[1], pos[1]);

		mins[0] = Math.min(mins[0], pos[0]);
		mins[1] = Math.min(mins[1], pos[1]);
	}

	for (var i = 0; i < this.extras.length; i++)
	{	
		var pos = this.extras[i].getPos();
		maxs[0] = Math.max(maxs[0], pos[0]);
		maxs[1] = Math.max(maxs[1], pos[1]);

		mins[0] = Math.min(mins[0], pos[0]);
		mins[1] = Math.min(mins[1], pos[1]);
	}

	if (mins[0] == 10000) {
		return;
	}

	var w = this.getStageWidth();
	var h = this.getStageHeight();

	var origo = [- (maxs[0] + mins[0]) / 2 + w / 2, - (maxs[1] + mins[1]) / 2 + h / 2]

	var s = this.getLayerScale();

	this.setLayerPosition({x: origo[0] - (w/2 - origo[0]) * (s - 1), y: origo[1] - (h/2 - origo[1]) * (s - 1)});

	// zoom
	var scale = [1, 1];
	scale[0] = this.getStageWidth()/(maxs[0] - mins[0] + 100);
	scale[1] = this.getStageHeight()/(maxs[1] - mins[1] + 100);

	scale[0] = Math.min(scale[0], 2)
	scale[1] = Math.min(scale[1], 2)

	this.zoom(Math.min(scale[0], scale[1]) - s, duration);
}

// zoom
// zooms zoomamount in or out (additive factor)
// animates zoom for duration milliseconds
// duration <= 0 : instantaneous
Model.prototype.zoom = function(zoomamount, duration) {

	if (!duration && duration !== 0) { duration = 200; }

	var w = this.getStageWidth();
	var h = this.getStageHeight();

	var s = this.getLayerScale();
	var sn = s + zoomamount;

	var pos = this.getLayerPosition();

	if (sn <= 0.25) { sn = .25; }
	if (sn >= 1) { sn = 1; }

	this.trigger('zoom');

	if (duration <= 0)
	{
		this.setLayerScale(sn);
		this.setLayerPosition({'x': pos.x - (w/2 - pos.x) * (sn/s - 1),
		                       'y': pos.y - (h/2 - pos.y) * (sn/s - 1)});
		this.redraw();
		this.trigger('zoomed');
		return;
	}

	var self = this;
	var anim = new Kinetic.Animation({
	    call: function(anim) {
	        if (anim.frame.time >= duration) {
        		anim.stop() ;
        		self.setLayerScale(sn);
    			self.setLayerPosition({'x': pos.x - (w/2 - pos.x) * (sn/s - 1),
    			                       'y': pos.y - (h/2 - pos.y) * (sn/s - 1)});
    			self.redraw();
    			self.trigger('zoomed');
    		} else {
    			var p = anim.frame.time/duration;
    			var si = s + p * (sn - s);
    			self.setLayerScale(si);
    			self.setLayerPosition({'x': pos.x - (w/2 - pos.x) * (sn/s - 1) * p,
    			                       'y': pos.y - (h/2 - pos.y) * (sn/s - 1) * p});
    			self.redraw();
    		}
		}
	});

	anim.start();
}


///////////////////////////////////////////////
/// HAMILTONIAN (adjencency matrix)
///////////////////////////////////////////////

// hamiltonian
// combines nodes and links into hamiltonian matrix
// returns object {X, Y, is_complex}, containing 
// real part X, imag. part Y and a boolean is_complex for easy evaluation
Model.prototype.hamiltonian = function()
{
	// array
	var N = this.nodes.length; 		  // number of nodes
	var H = numeric.rep([N, N], 0.0)  // empty matrix
	var Hi = numeric.rep([N, N], 0.0)  // empty matrix
	
	// fill array
	for (i = 0; i < N; i++)
	{
		// on-site energies
		H[i][i] = parseFloat(this.nodes[i].getWeight());
	}

	var nl = this.links.length;

	var is_complex = false;
	for (var i = 0; i < nl; i++)
	{
		if (this.links[i].is('dash')) { continue; }

		var i1 = this.links[i].nodes[0].index;
		var i2 = this.links[i].nodes[1].index;

		if (i1 === -1 || i2 === -1) { continue; }

		// if (true || this.links[i].getPhase() > 0)
		// {
		// 	console.log(this.links[i].getWeight())
		is_complex = true;
		H[i1][i2] = parseFloat(this.links[i].getWeight()) * Math.cos(this.links[i].getPhase() + this.links[i].rn * 1e-5);
		Hi[i1][i2] = parseFloat(this.links[i].getWeight()) * Math.sin(this.links[i].getPhase() + this.links[i].rn * 1e-5);

		H[i2][i1] = H[i1][i2];
		Hi[i2][i1] = - Hi[i1][i2];
		// }
		// else 
		// {
		// 	H[i1][i2] = parseFloat(this.links[i].getWeight());
		// 	H[i2][i1] = H[i1][i2];
		// }
	}
 	

	return {'x': H, 'y': Hi, 'is_complex': is_complex};
}

Model.prototype.updateHamiltonian = function(H, elm)
{
	if (elm.name == 'link')
	{
		var i1 = elm.nodes[0].index;
		var i2 = elm.nodes[1].index;

		if (i1 === undefined || i2 === undefined) { return H; }

		// if (H['is_complex'] || elm.getPhase() > 0)
		// {

		H['is_complex'] = true;
		H['x'][i1][i2] = parseFloat(elm.getWeight() * Math.cos(elm.getPhase() + elm.rn * 1e-5));
		H['y'][i1][i2] = parseFloat(elm.getWeight() * Math.sin(elm.getPhase() + elm.rn * 1e-5));

		H['x'][i2][i1] = H['x'][i1][i2];
		H['y'][i2][i1] = - H['y'][i1][i2];

		// if (elm.getPhase() == 0 || elm.getPhase() == Math.PI) {
		// 	var is_complex = false;
		// 	var nl = this.links.length;
		// 	for (var i = 0; i < nl; i++)
		// 	{
		// 		if (this.links[i].is('dash')) { continue; }

		// 		if (this.links[i].getPhase() != 0 && this.links[i].getPhase() != Math.PI)
		// 		{
		// 			is_complex = true;
		// 			break;
		// 		}
		// 	}
		// 	H['is_complex'] = is_complex;
		// }
		// }
		// else
		// {
		// 	H['x'][i1][i2] = parseFloat(elm.getWeight() + 1e-5 * Math.random());
		// 	H['x'][i2][i1] = H['x'][i1][i2];
		// }
	}
	else
	{
		H['x'][elm.index][elm.index] = parseFloat(elm.getWeight());
	}
	console.log(H)
	return H;
}

// calculate the restarted self-energy
// supply a band to only get the self-energy due to a single band.
Model.prototype.sigma = function(band)
{
	// coupling matrix
	var N = this.nodes.length; 		  // number of nodes

	// coupling matrix
	var sigma = {x: numeric.rep([N, N], 0), y: numeric.rep([N, N], 0), is_complex: true}; // zeros
	// var nl = model.links.length;

	var nb = this.extras.length;

	var ns , wsx, wsy;
	for (var i = 0; i < nb; i++)
	{
		if (!this.extras[i].is('band')) { continue; }
		if (band && this.extras[i].id !== band.id) { continue; }
		
		ns = []; wsx = []; wsy = [];

		for (var j = 0; j < this.extras[i].links.length; j++)
		{
			var k = this.extras[i].links[j].nodes[0].is('band') ? 1 : 0;

			ns.push(this.extras[i].links[j].nodes[k].index);
			wsx.push(this.extras[i].links[j].getWeight() * Math.cos(this.extras[i].links[j].getPhase()));
			wsy.push(this.extras[i].links[j].getWeight() * Math.sin(this.extras[i].links[j].getPhase()));
		}

		for (var j = 0; j < ns.length; j++)
		{
			for (var k = 0; k < ns.length; k++)
			{
				sigma.y[ns[j]][ns[k]] -= wsx[j]*wsx[k] + wsy[j]*wsy[k];
				sigma.x[ns[j]][ns[k]] += wsx[j]*wsy[k] - wsy[j]*wsx[k];
			}
		}
	}

	return sigma;
}

Model.prototype.couplings = function(label) 
{
	var N = this.nodes.length;
	var couplings = [];
	for (var i = 0; i < this.extras.length; i++)
	{
		if (!this.extras[i].is('band')) { continue; }
		
		var band = this.extras[i];

		if (label && band.getLabel() != label) continue
			
		var c = {x: numeric.rep([N], 0), y: numeric.rep([N], 0)};
		for (var j = 0; j < band.links.length; j++) 
		{
			var k = (band.links[j].nodes[0].id == band.id ? 1 : 0);
			var w = band.links[j].getWeight();
			var ph = band.links[j].getPhase();
				
			c.x[band.links[j].nodes[k].index] = w * Math.cos(ph);
			if (ph != 0 || ph == Math.PI)
			{
				c.is_complex = true;
				c.y[band.links[j].nodes[k].index] = w * Math.sin(ph);
			}
		}

		couplings.push({label: band.getLabel(), array: c});
	}

	return couplings;
}

// 	$$\       $$$$$$\   $$$$$$\  $$$$$$$\                        $$$$$$$\  $$\   $$\ $$\      $$\ $$$$$$$\
// 	$$ |     $$  __$$\ $$  __$$\ $$  __$$\          $$\          $$  __$$\ $$ |  $$ |$$$\    $$$ |$$  __$$\
// 	$$ |     $$ /  $$ |$$ /  $$ |$$ |  $$ |         $$ |         $$ |  $$ |$$ |  $$ |$$$$\  $$$$ |$$ |  $$ |
// 	$$ |     $$ |  $$ |$$$$$$$$ |$$ |  $$ |      $$$$$$$$\       $$ |  $$ |$$ |  $$ |$$\$$\$$ $$ |$$$$$$$  |
// 	$$ |     $$ |  $$ |$$  __$$ |$$ |  $$ |      \__$$  __|      $$ |  $$ |$$ |  $$ |$$ \$$$  $$ |$$  ____/
// 	$$ |     $$ |  $$ |$$ |  $$ |$$ |  $$ |         $$ |         $$ |  $$ |$$ |  $$ |$$ |\$  /$$ |$$ |
// 	$$$$$$$$\ $$$$$$  |$$ |  $$ |$$$$$$$  |         \__|         $$$$$$$  |\$$$$$$  |$$ | \_/ $$ |$$ |
// 	\________|\______/ \__|  \__|\_______/                       \_______/  \______/ \__|     \__|\__|

// load the graph
Model.prototype.load = function(opts) {
	// load model
	var nodes = opts[0];
	var links = opts[1];

	console.log('load: sw-' + this.getStageWidth() + '-sh' + this.getStageHeight());

	// add nodes
	for (var i = 0; i < nodes.length; i++)
	{
		var val = parseFloat(nodes[i][2]);
		var val = Math.min(Math.max(val, -10), 10);

		var options = (nodes[i].length > 3 ? nodes[i][3] : {});
		options['weight'] = val;

		this.addNode(nodes[i][0], nodes[i][1], options, false, false);
	}

	// add links
	for (var i = 0; i < links.length; i++)
	{
		var val = parseFloat(links[i][2]);
		val = Math.min(Math.max(val, -4), 4);

		var phase = parseFloat(links[i][3]);

		var i1 = links[i][0];
		var n1 = (i1 >= this.nodes.length ? this.extras[i1 - this.nodes.length] : this.nodes[i1]);

		var i2 = links[i][1];
		var n2 = (i2 >= this.nodes.length ? this.extras[i2 - this.nodes.length] : this.nodes[i2]);

		var options = (links[i].length > 3 ? links[i][3] : {});
		this.addLink(n1, n2, val, phase, options, false, false);
	}

	// this.focus(false);
}

// dump the graph
Model.prototype.dump = function() {
	// Dump the model as lists of nodes and links
	var nodes = [];
	var links = [];

	// Add nodes
	for (var i = 0; i < this.nodes.length; i++)
	{
		this.nodes[i]._dindex = i;
		var pos = this.nodes[i].getPos();
		var w = this.nodes[i].options.weight;
		nodes.push([pos[0], pos[1], w, this.nodes[i].options]);
	}

	for (var i = 0; i < this.extras.length; i++)
	{
		this.extras[i]._dindex = this.nodes.length + i;
		
		var pos = this.extras[i].getPos();
		var w = this.extras[i].options.weight;
		nodes.push([pos[0], pos[1], w, this.extras[i].options]);
	}

	// Add links
	for (var i = 0; i < this.links.length; i++)
	{
		var nid1 = this.links[i].nodes[0]._dindex;
		var nid2 = this.links[i].nodes[1]._dindex;
		var w = this.links[i].getWeight();
		var ph = Math.round(this.links[i].getPhase()*1000)/1000;
		links.push([nid1, nid2, w, ph]);
	}

	return [nodes, links];
}

// 	 $$$$$$\  $$\    $$\ $$$$$$$$\ $$$$$$$\  $$\        $$$$$$\ $$\     $$\  $$$$$$\
// 	$$  __$$\ $$ |   $$ |$$  _____|$$  __$$\ $$ |      $$  __$$\\$$\   $$  |$$  __$$\
// 	$$ /  $$ |$$ |   $$ |$$ |      $$ |  $$ |$$ |      $$ /  $$ |\$$\ $$  / $$ /  \__|
// 	$$ |  $$ |\$$\  $$  |$$$$$\    $$$$$$$  |$$ |      $$$$$$$$ | \$$$$  /  \$$$$$$\
// 	$$ |  $$ | \$$\$$  / $$  __|   $$  __$$< $$ |      $$  __$$ |  \$$  /    \____$$\
// 	$$ |  $$ |  \$$$  /  $$ |      $$ |  $$ |$$ |      $$ |  $$ |   $$ |    $$\   $$ |
// 	 $$$$$$  |   \$  /   $$$$$$$$\ $$ |  $$ |$$$$$$$$\ $$ |  $$ |   $$ |    \$$$$$$  |
// 	 \______/     \_/    \________|\__|  \__|\________|\__|  \__|   \__|     \______/

// draw overlays
Model.prototype.addOverlay = function(mode, id, message, fcnon, fcnoff) 
{	
	mode = mode.toLowerCase();
	var overlay = mode + id;

	// does overlay button exist?
	if (!(overlay in this.overlays))
	{
		this.overlays[overlay] = new Kinetic.Group();	

		// manipulate graph
		this.layer.add(this.overlays[overlay]);

		// add button
		var button =  $('<a class="qg_model_layers_' + mode +'"></a>');
		fcnoff = (fcnoff === undefined ? function() {return true;} : fcnoff);

		var self = this; // this hack
		this.widget.menus.layers.add(overlay, button);
		this.widget.menus.layers.listen(overlay, 'select', fcnon);
		this.widget.menus.layers.listen(overlay, 'unselect', function() { self.clearOverlay(mode, id); fcnoff(); });

		this.widget.$boxes.layers.append(button);
	}
	else
	{
		this.overlays[overlay].destroyChildren();
	}

	this.overlays[overlay].moveToTop();

	if (message !== false) { this.displayMessage(message); }

	return this.overlays[overlay];
};

Model.prototype.clearOverlay = function(mode, id)
{	
	mode = mode.toLowerCase();

	if (mode == 'all')
	{
		for (var overlay in this.overlays)
		{
			this.overlays[overlay].destroyChildren();
			this.widget.menus.layers.unselect(overlay);
		}
		this.redraw();
	}
	else if ((mode + id) in this.overlays)
	{
		this.overlays[mode + id].destroyChildren();
		this.redraw();

		this.widget.menus.layers.unselect(mode + id);
	}

	this.displayMessage('');
}

// clear overlay layers
Model.prototype.removeOverlay = function(mode, id)
{
	mode = mode.toLowerCase();

	if (mode == 'all')
	{
		for (var overlay in this.overlays)
		{
			this.widget.menus.layers.remove(overlay);
			this.overlays[overlay].destroy();
			delete this.overlays[overlay];

			
		}
		this.redraw();
	}
	else if (mode + id in this.overlays)
	{
		this.overlays[mode + id].destroy();
		delete this.overlays[mode + id];

		this.widget.menus.layers.remove(mode + id);
	
		// redraw layer
		this.redraw();
	}

	this.displayMessage('');
};

Model.prototype.selectOverlayButton = function(mode, id)
{
	// toggle the overlay button to mark selection
	this.widget.menus.layers.select(mode.toLowerCase() + id);
}

// overlay values
Model.prototype.overlayValues = function()
{
	var self = this;

	var overlay = self.addOverlay('values', 0, '', function() { self.overlayValues(); });
	
	var nl = self.links.length;
	for (var i=0; i<nl; i++)
	{
		var w = self.links[i].getWeight();
		var arg = self.links[i].getPhase();
		var pos = self.links[i].getPos();

		var t = w;
		if (Math.abs(arg - Math.PI) < 0.001) {
			t = - w;
		}
		if (arg != 0 && Math.abs(arg - Math.PI) > 0.001) {
			var t = w + '·exp(' + QG.Text.format(arg/Math.PI, {decimals: 2}) + 'iπ)';
		}
		
		var width = QG.Text.pixelWidth(t, 'Arial', 10) + 6;

		var rect = new Kinetic.Rect({
			x: Math.round(pos[0])-width/2,
			y: Math.round(pos[1])-7,
			height: 14,
			width: width,
			fill: 'white',
			stroke: 'gray',
			strokeWidth: 1
		});
		overlay.add(rect);

		var text = new Kinetic.Text({
			x: Math.round(pos[0])-width/2,
			y: Math.round(pos[1])-5,
			text: t,
			fontSize: 10,
			fontStyle: 'normal',
			fontFamily: 'Arial',
			fill: '#444444',
			width: width,
			height: 10,
			align: 'center'
		})
		overlay.add(text);
	}

	var nn = self.nodes.length;
	for (var i=0; i<nn; i++)
	{
		var w = self.nodes[i].getWeight();
		var pos = self.nodes[i].getPos();

		var rect = new Kinetic.Rect({
			x: pos[0]-19,
			y: pos[1]-8,
			height: 16,
			width: 38,
			fill: 'white',
			stroke: 'gray',
			strokeWidth: 1
		});
		overlay.add(rect);

		var text = new Kinetic.Text({
			x: pos[0]-19,
			y: pos[1]-6,
			text: QG.Text.format(w, {decimals: 2}),
			fontSize: 12,
			fontStyle: 'normal',
			fontFamily: 'Arial',
			fill: '#444444',
			width: 38,
			height: 12,
			align: 'center',
			zindex: 10,
		})
		overlay.add(text);
	}
	self.redraw();
}

// 	$$$$$$$\  $$$$$$$$\ $$$$$$$$\ $$$$$$\ $$$$$$$$\
// 	$$  __$$\ $$  _____|$$  _____|\_$$  _|\__$$  __|
// 	$$ |  $$ |$$ |      $$ |        $$ |     $$ |
// 	$$$$$$$  |$$$$$\    $$$$$\      $$ |     $$ |
// 	$$  __$$< $$  __|   $$  __|     $$ |     $$ |
// 	$$ |  $$ |$$ |      $$ |        $$ |     $$ |
// 	$$ |  $$ |$$$$$$$$\ $$ |      $$$$$$\    $$ |
// 	\__|  \__|\________|\__|      \______|   \__|

Model.prototype.refit = function(norepos)
{
	var w = this.getWidth();
	var h = this.getHeight();

	var sw = this.getStageWidth();
	var sh = this.getStageHeight();

	if (sw == w && sh == h) return;

	this.trigger('refit');

	this.setStageWidth(w);
	this.setStageHeight(h);

	// reposition center of layer
	if (!norepos)
	{
		var pos = this.getLayerPosition();
		var s = this.getLayerScale();

		this.setLayerPosition({x: pos.x - s*(sw-w)/2, y: pos.y - s*(sh-h)/2});
	}
	this.redraw();

	this.editor.refit();
}

// // Minimize model window
// Model.prototype.minimize = function() 
// {	
// 	// modify state
// 	this.options.expanded = false;
// 	this.options.editable = false;

// 	this.unselectAll();
// 	this.editor.reset();

// 	// modify look
// 	this.widget.$el.removeClass('qg_panel3x2').addClass('qg_panel1x1 minimized');

// 	var self = this;
// 	this.setup.addRefitCallback( function() { self.focus(true); } );
// 	this.setup.resizeWidget(this.widget.$el[0], 223, 223);

// 	// this.refit(false);
// 	// change stage
// 	// this.setStageWidth(220);
// 	// this.setStageHeight(220);

// 	this.focus(false);
// }

// // MAximize model window
// Model.prototype.maximize = function()
// {
// 	this.options.expanded = true;
	
// 	// make the graph editable
// 	this.options.editable = true;

// 	this.widget.$el.removeClass('qg_panel1x1 minimized').addClass('qg_panel3x2');
		
// 	var self = this;
// 	this.setup.addRefitCallback( function() { self.focus(true); } );
// 	this.setup.resizeWidget(this.widget.$el[0], 223*3, 223*2);
		
// 	this.focus(false);
// }

// 	$$$$$$$\           $$\    $$\  $$$$$$\  $$\
// 	$$  __$$\          $$ |   $$ |$$  __$$\ $$ |
// 	$$ |  $$ | $$$$$$\ $$ |   $$ |$$ /  $$ |$$ |
// 	$$$$$$$  |$$  __$$\\$$\  $$  |$$$$$$$$ |$$ |
// 	$$  __$$< $$$$$$$$ |\$$\$$  / $$  __$$ |$$ |
// 	$$ |  $$ |$$   ____| \$$$  /  $$ |  $$ |$$ |
// 	$$ |  $$ |\$$$$$$$\   \$  /   $$ |  $$ |$$$$$$$$\
// 	\__|  \__| \_______|   \_/    \__|  \__|\________|

Model.prototype.revaluate = function(elm)
{
	// Redraw values overlay upon change
	if (this.widget.menus.layers.mode == 'values0') { this.overlayValues(); }

	// Update Hamiltonian
	if (elm == undefined)
	{
		this.H = this.hamiltonian();	
	}
	else
	{
		this.H = this.updateHamiltonian(this.H, elm)
	}
	return true;
}

// DESTROY LOAD DUMP AND RESET
// Destroy
Model.prototype.destroy = function()
{
	this.stage.destroy();

	this.reset();
	
	this.stage = null;
	this.layer = null;
	this.shadow = {layer: null, node: null, link: null};

	// Clear container
	this.widget.$el.html('');
}

// Reset
Model.prototype.reset = function(){
	// reset the stage
	this.layer.destroyChildren().setScale(1).setPosition({x: 0, y: 0}).draw();
	
	// reset values
	this.nodes = [];
	this.extras = [];
	this.links = [];
	this._lid = 0;
	this._nid = 0;

	this.H = null;
	this.selected = [];
	this.target = false;

	// reset counters
	this.removeOverlay('all');
	this.overlays = {};
}

Model.prototype.kill = function() {
	// Kill the current model
	// remove from setup
	this.setup.removeWidget(this.id, false);

	// Remove canvas and html
	this.destroy();
}

})(jQuery, numeric, QG, Kinetic);

