"use strict";

// QG namespace
var QG = QG || {};

//////////////////////////////
// Setup
// - has a title.
// - and a list of widgets.
//////////////////////////////

(function(QG, $, window){


// 	$$\        $$$$$$\ $$\     $$\  $$$$$$\  $$\   $$\ $$$$$$$$\ $$$$$$$$\ $$$$$$$\
// 	$$ |      $$  __$$\\$$\   $$  |$$  __$$\ $$ |  $$ |\__$$  __|$$  _____|$$  __$$\
// 	$$ |      $$ /  $$ |\$$\ $$  / $$ /  $$ |$$ |  $$ |   $$ |   $$ |      $$ |  $$ |
// 	$$ |      $$$$$$$$ | \$$$$  /  $$ |  $$ |$$ |  $$ |   $$ |   $$$$$\    $$$$$$$  |
// 	$$ |      $$  __$$ |  \$$  /   $$ |  $$ |$$ |  $$ |   $$ |   $$  __|   $$  __$$<
// 	$$ |      $$ |  $$ |   $$ |    $$ |  $$ |$$ |  $$ |   $$ |   $$ |      $$ |  $$ |
// 	$$$$$$$$\ $$ |  $$ |   $$ |     $$$$$$  |\$$$$$$  |   $$ |   $$$$$$$$\ $$ |  $$ |
// 	\________|\__|  \__|   \__|     \______/  \______/    \__|   \________|\__|  \__|


QG.Layouter = function(options) {
	this.screen = {height: 100, width: 100};
	this.options = {top: 0, left: 0, bottom: 0, right: 0};
	this.options.nav = {height: 52, width: 'auto'};
	this.options.sidebar = {height: 'auto', width: 42};
	this.options.panel = {'min-width': 330, 'max-height': 800, 'min-height': 400, 'max-vertical-height': 400}

	// extend options?
	if (options) $.extend(this.options, options);

	this.app = {orientation: 'vertical'}
	
	this.fit = function(space) {
		this.window = space;

		if (this.window.width > 2 * this.options.panel['min-width'])
		{
			this.app.orientation = 'horizontal';
		}
		else 
		{
			this.app.orientation = 'vertical';
		}

		$.extend(this.app, this[this.app.orientation](space));		

		return this.app;
	}

	// height > width
	this.vertical = function(space)
	{
		var app = {};

		// panel defaults
		var width = Math.max(space.width, this.options.panel['min-width']);
		var height = 2 * Math.min(width, this.options.panel['max-vertical-height']);

		app.el = {'height': height + 'px', 'width': width + 'px'};

		// app.nav = {'height': this.options.nav.height + 'px'};
		
		app.model = {'width': width + 'px', 'height': (height)/2 + 'px'}
		app.divider = {'display': 'none'}
		app.explorer = {'width': width + 'px', 'height': app.model.height, 'top': height/2 + 'px', 'left': 0};
		
		app.widget = {'width': width - this.options.sidebar.width + 'px', 'height': app.explorer.height};
		app.sidebar = {'width': this.options.sidebar.width + 'px', 'height': app.explorer.height};

		return app;
	}

	// height < width
	this.horizontal = function(space)
	{
		var app = {};

		// should fit two panels of the minimum width
		var width = 2 * Math.round(Math.max(space.width / 2, this.options.panel['min-width']));
		var height = Math.max( Math.min(space.height, this.options.panel['max-height']) - this.options.nav.height, this.options.panel['min-height']);

		height = Math.min(height, 1.5 * width)

		app.el = {'height': height + 'px', 'width': width + 'px'};

		// app.nav = {'height': this.options.nav.height + 'px'};
		 
		app.model = {'width': width / 2 + 'px', 'height': height + 'px'};
		app.divider = {'display': 'auto', 'height': app.model.height, 'left': app.model.width};
		app.explorer = {'width': width / 2 + 'px', 'height': app.model.height, 'top': '0', 'left': 'auto', 'right': 0};
		
		app.widget = {'width': width / 2  - this.options.sidebar.width + 'px', 'height': app.explorer.height};
		app.sidebar = {'width': this.options.sidebar.width + 'px', 'height': app.explorer.height};

		return app;
	}

	this.single = function(space)
	{
		var app = {};

		// should fit two panels of the minimum width
		var width = 2 * Math.round(Math.max(space.width / 2, this.options.panel['min-width']));
		var height = Math.min(space.height, this.options.panel['max-height']) - this.options.nav.height;

		height = Math.min(height, 1.5 * width)

		app.el = {'height': height + 'px', 'width': width + 'px'};

		// app.nav = {'height': this.options.nav.height + 'px'};
		 
		app.model = {'width': width - this.options.sidebar.width + 'px', 'height': height + 'px'};
		app.divider = {'display': 'auto', 'height': app.model.height, 'left': app.model.width};
		app.explorer = {'width': this.options.sidebar.width + 'px', 'height': app.model.height, 'top': '0', 'left': 'auto', 'right': 0};
		
		app.widget = {'width': 0, 'height': app.explorer.height};
		app.sidebar = {'width': this.options.sidebar.width + 'px', 'height': app.explorer.height};

		return app;
	}

}


// 	 $$$$$$\  $$$$$$$$\ $$$$$$$$\ $$\   $$\ $$$$$$$\
// 	$$  __$$\ $$  _____|\__$$  __|$$ |  $$ |$$  __$$\
// 	$$ /  \__|$$ |         $$ |   $$ |  $$ |$$ |  $$ |
// 	\$$$$$$\  $$$$$\       $$ |   $$ |  $$ |$$$$$$$  |
// 	 \____$$\ $$  __|      $$ |   $$ |  $$ |$$  ____/
// 	$$\   $$ |$$ |         $$ |   $$ |  $$ |$$ |
// 	\$$$$$$  |$$$$$$$$\    $$ |   \$$$$$$  |$$ |
// 	 \______/ \________|   \__|    \______/ \__|


QG.Setup = function(wrapper, settings)
{
	var thissetup = this;
	thissetup.title = '';
	thissetup.state = {'evaluating': false, 'reevaluate': false};	
	thissetup.eigen = {valid: false, status: false, values: [], vectors: []};
	// should the options really go into each setup?
	// options
	thissetup.options = {
		'Setup': {}
		,
		'Layout': {}
		,
		'Model' : {
			'nodeminweight': -10,
			'nodemaxweight': 10,
			'nodescale': 1.2,
			'nodesize': 10,
			'nodestroke': 6,
			'linkminweight': -4,
			'linkmaxweight': 0,
			'linkdefaultweight': -1,
			'linkscale': 5,
			'selectcolor': '#FFA54B',
			'targetcolor': '#EFE6CB',
			'bandcolor': '#EFCC60'
		},
		'Spectrum' : {
			'overlayvalues': true
		}
	};

	if (settings && 'Setup' in settings) $.extend(thissetup.options.Setup, settings.Setup);
	if (settings && 'Layout' in settings) $.extend(thissetup.options.Layout, settings.Layout);

	// color:  #C19856;
	
	// widgets
	thissetup.widgets = {}; 
	thissetup.selected = false;

	// collection
	thissetup.collection = false
	thissetup.id = false;
	
	// setup html
	var wrapper = wrapper;

	var html = $('<div class="qg_setup_container"></div>');

	var dom = {
		menu : $('<div class="qg_setup_menu"></div>'),
		options : $('<div class="qg_setup_options"></div>'),
		body : $('<div class="qg_setup_body"></div>'),
		model: $('<div class="qg_model"></div>'),
		divider: $('<div class="qg_divider"></div>'),
		widgets : $('<div class="qg_widgets"></div>'),
		sidebar : $('<div class="qg_sidebar"></div>'),
		clear : $('<div class="qg_clear"></div>')
	}

	this.setupSidebar = function() {
		this.menu = new QG.Navigation.Menu();

		this.menu.listen('main', 'select', function(mode){
			thissetup.selectWidget(mode); 
		});

		this.menu.listen('main', 'unselectall', function(mode){
			var w = thissetup.getWidget(thissetup.selected);
			w.hide();
			thissetup.selected = false;
			thissetup.fit();
		});
	}
	this.setupSidebar();
	
	var x = 0;
	dom.divider.on('mousedown touchstart', function(e) {
		x = e.offsetX;
		wrapper.on('mousemove touchmove', function(e){
			var dx = x - e.offsetX;
			// console.log(dx)
			// thissetup.fit();
		});

		wrapper.on('mouseup touchend mouseleave touchleave', function(){
			wrapper.off('mousemove touchmove mouseup touchend mouseleave touchleave');
		});

	});

	var layouter = new QG.Layouter();

	html.append(dom.menu)
		.append(dom.options)
		.append(dom.body
			.append(dom.model)
			.append(dom.divider)
			.append(dom.widgets.append(dom.sidebar))
			.append(dom.clear)
		);

	wrapper.addClass('qg').append(html);


	this.fit = function() 
	{
		var shape = {width: wrapper.width(), height: $(window).height()};
		var app = layouter.fit(shape);

		if (app.orientation == 'horizontal' && this.selected === false)
		{
			app = layouter.single(shape);
		}

		dom.body.css(app.el);


		var is_mobile =  parseInt(app.el.width) < 600
		wrapper.toggleClass('qg_mobile', is_mobile);

		
		// dom.menu.css(app.nav);
		dom.model.css(app.model);
		dom.divider.css(app.divider);
		dom.widgets.css(app.explorer);
		dom.sidebar.css(app.sidebar);

		if (this.model)
		{
			this.model.refit();
		}

		if (thissetup.selected !== false) 
		{	
			var w = this.getWidget(this.selected);
			w.fit(app.widget);
			w.refit();
		}
	}

	
	// var wall = new HV(dom['widgets'][0]);
	// wall.reset({
	// 	selector: '.qg_widget',
	// 	// animate: true,
	// 	cellW: 223,
	// 	cellH: 223,
	// 	// keepOrder: true,
	// 	// delay: 10,
	// 	// fixSize: 0,
	// 	// cacheSize: true,
	// 	gutterX: 1,
	// 	gutterY: 1,
	// 	onResize: function() {
	// 		wall.layout();
	// 	},
	// 	onComplete: function() {
	// 		thissetup.refit();
	// 	}
	// });
	// wall.fitWidth();

	// thissetup.addRefitCallback = function(callback) {
	// 	refitCallbacks.push(callback);
	// }

	// thissetup.relayout = function()
	// {
	// 	wall.layout();
	// }

	// thissetup.resizeWidget = function(block, width, height)
	// {
	// 	console.log('resizeWidget')
	// 	wall.resizeBlock(block, width, height);
	// 	wall.layout();
	// }

	// thissetup.refit = function()
	// {
	// 	// iterate
	// 	$.each(thissetup.widgets, function(key, value) 
	// 		{	
	// 			// check revaluability
	// 			if (value && value.refit)
	// 			{
	// 				// var t0 = performance.now();
	// 				// add options?
	// 				if (options && options[value.name]) 
	// 				{
	// 					value.refit(options[value.name]);
	// 				}
	// 				else 
	// 				{
	// 					value.refit(); 	
	// 				}
	// 				// var t1 = performance.now();
	// 				// console.log('Call to ' + value.name + ' took ' + (t1 - t0) + ' ms.');
	// 			}
	// 		});

	// 	// run any callbacks after refitting
	// 	// console.log(refitCallbacks.length);
	// 	while(refitCallbacks.length > 0) 
	// 	{	
	// 		refitCallbacks.shift().call();
	// 	}
	// }

	// add sortability to widgets
	//	new Sortable(dom['widgets'][0], {
	//		animation: 0,
	//		handle: ".qg_widget_menu", // Restricts sort start click/touch to the specified element
	//		draggable: ".qg_widget" // Specifies which items inside the element should be sortable
	//	});

	// render setup menu
	thissetup.render_menu = function() 
	{
		dom.logo = $('<a class="qg_setup_logo" title="Versions"><span class="icon-qgr"></span></a>')
			.on('click tap', function(){

				var N = QG.versions.length;
				var content = '<p class="qg_center">Currently version <b>' + QG.versions[N-1].n + '</b></p>';
				content += '<dl>';
				for (var i=0; i < N; i ++)
				{
					content+= '<dt>' + QG.versions[N-i-1].n + '</dt><dd>' + QG.versions[N-i-1].desc + '</dd>';
				} 
				content += '</dl>';

				QG.Dialog('quantumgraphs.com', content)
			});
		dom.menu.append(dom.logo);

		dom.title = $('<input class="qg_setup_title" type="text" name="title" inputmode="latin" size="10" placeholder="Model" draggable="false"/>')
			.on('keydown change', function(e){
				thissetup.title = $(this).val();
				thissetup.updateTitle();
			})
			.on('click tap', function(e){
				e.stopPropagation();
			});

		dom.menu.append(dom.title);

		dom.burger = $('<a class="qg_burger" title="Drop down menu options">&nbsp;<span class="icon-down-open"></span>&nbsp;</a>')
			.on('click tap', function(e){
				dom.menu.toggleClass('qg_unfold')
			})
		;
		dom.menu.append(dom.burger);

		dom.import = $('<a class="qg_link" title="Import graphs into the app"><span class="icon-folder-open"></span> Import</a>')
			.on('click tap', function(e) {
				// don't follow links
				e.preventDefault();
				e.stopPropagation();
				
				// build dialog
				var select = $('<select name="N"></select>');
				for (var i=3; i<41; i++)
				{
					select.append($('<option>'+i+'</option>'));
				}

				var ringform = $('<form action="#" name="SF" id="SF"></form>')
					.append(select.clone())
					.append('Dimerization:')
					.append($('<input class="d" type="text" name="d" value="1" size="2"/>'))
					.append($('<input type="submit" value="Load"/>')
						.on('click tap', function(e){
							e.preventDefault();
							var N = $(this).siblings("select").val();
							var d = $(this).siblings("input.d").val();
							thissetup.reset(false);
							thissetup.loadFromObject(QG.Generators.ring(N, d, -1));
							QG.removeDialog();
						})
					);

				var chainform = $('<form action="#" name="NF" id="NF"></form>')
						.append(select.clone())
						.append('Dimerization:')
						.append($('<input class="d" type="text" name="d" value="1" size="2"/>'))
						.append($('<input type="submit" value="Load"/>')
							.on('click tap', function(e){
								e.preventDefault();
								var N = $(this).siblings("select").val();
								var d = $(this).siblings("input.d").val();
								thissetup.reset(false);
								thissetup.loadFromObject(QG.Generators.chain(N, d, -1));
								QG.removeDialog();
							})
						);

				var Nselect = $('<select name="N"></select>');
				var Mselect = $('<select name="M"></select>');
				for (var i = 2; i < 11; i ++)
				{	
					Nselect.append($('<option>'+i+'</option>'));
					Mselect.append($('<option>'+i+'</option>'));
				}

				var latticeform = $('<form action="#" name="NF" id="NF"></form>')
					.append(Nselect)
					.append('x')
					.append(Mselect)
					.append('Scale:')
					.append($('<input class="d" type="text" name="d" value="1" size="2"/>'))
					.append($('<input type="submit" value="Load"/>')
						.on('click tap', function(e){
							e.preventDefault();
							var N = $(this).siblings("select[name=N]").val();
							var M = $(this).siblings("select[name=M]").val();
							var d = $(this).siblings("input.d").val();
							thissetup.reset(false);
							thissetup.loadFromObject(QG.Generators.squarelattice(N, M, d, -1));
							QG.removeDialog();
						})
					);

				var loadmol = $('<input name="file" type="file"/>');
				molreader(loadmol[0], function(out) { thissetup.loadFromMol(out); QG.removeDialog(); });	

				
				var content = $('<div></div>')
					.append($('<p>When you import a new graph, it replaces your current graph. You can save your current graph by using the Export feature.</p>'))
					.append(
						$('<ul class="qg_dialog_sections"></ul>')
						.append($('<li class="icon-link">Import a graph link: </li>')
							.append($('<input type="text" width=30 />')
								.on('change', function(){
									var href = $(this).val();
									var hash = href.substr(href.indexOf('#')+1);
									// thissetup.reset();
									thissetup.loadFromString(hash);
									QG.removeDialog();
								})
							)
							.append($('<input type="submit" value="Load"/>')
							    .on('click touchstart', function(e)
							    {
							    	e.preventDefault();
							    	var href = $(this).siblings('input')[0].val();
							    	var hash = href.substr(href.indexOf('#')+1);
									// thissetup.reset();
									thissetup.loadFromString(hash);
									QG.removeDialog();
							    })
							)
						)
						.append($('<li>MDL .mol file </li>').append(loadmol))
						.append($('<li><b>Rings</b> </li>')
							.append(ringform)
						)
						.append($('<li><b>Chains</b> </li>')
							.append(chainform)
						)
						.append($('<li><b>Square lattice</b> </li>')
							.append(latticeform)
						)
					);

				QG.Dialog('Import model', content);
			});

		dom.menu.append(dom.import);

		dom.export = $('<a class="qg_link" title="Export graph as link or to another program"><span class="icon-export-alt"></span> Export</a>')
			.on('click tap', function(e) {
				e.preventDefault();
				e.stopPropagation();

				var dump = thissetup.dump();

				// generate export json
				var json = window.JSURL.stringify(dump);

				// generate link
				var href = 'https://quantumgraphs.com/app.html#' + json;
				var copy = $('<input type="text" />').val(href);
				var link = $('<a>Link</a>').attr('href',href);

				var content = $('<div></div>')
					.append($('<p>Copy the export link and save it. You can import the model again by following the link or pasting it into the Import menu.</p>'))
					.append($('<p class="icon-link"></p>')
						.append(link).append(copy)
					)
					.append($('<ul class="qg_tabs">' +
								'<li><a class="current">Mathematica</a></li>'  +
							   	'<li><a>matlab</a></li>' +
							   	'<li><a>numpy</a></li>' +
							   '</ul>'))
					.append($('<textarea wrap="off"></textarea>').append(exportString('mathematica', thissetup.model)));

				$('.qg_tabs a', content).on('click tap', function(e) {
					e.preventDefault();
    				if ($(this).hasClass('current')){  //detection for current tab
     					return;   
    				}
    				else
    				{      
    					$('.qg_tabs a', content).removeClass('current'); //Reset id's
    					$(this).addClass("current"); // Activate this

    					$('textarea', content).val(exportString($(this).html(), thissetup.model));
    				}
				});

				$('textarea, input', content).on('click tap', function(e){
					e.preventDefault();
					$(this).focus();
					$(this).select();
				});

				QG.Dialog('Export model', content);
			});

		dom.menu.append(dom.export);

		dom.right = $('<div class="right"></div>');
		dom.menu.append(dom.right);
		dom.clear = $('<a class="qg_link" title="Erase current graph">&nbsp;<span class="icon-eraser"></span>&nbsp;</a>')
			.on('click', function(e){
				e.preventDefault();

				var content = $('<div></div>')
					.append($('<p>Would you really like to throw away this model?</p>'))
					.append($('<div class="row"></div>')
						.append(
							$('<a class="qg_button red"><span class="icon-eraser"></span> Yes, erase it</a>')
							.on('click', function(e) {
								e.preventDefault();
								thissetup.reset();
								// thissetup.addWidget('Spectrum', undefined, false, false);
								// thissetup.addWidget('AddWidgets', undefined, true, true);
								QG.removeDialog();
							})
						)
						.append(
							$('<a class="qg_button green">No, keep my model</a>')
							.on('click', function(e) {
								e.preventDefault();
								QG.removeDialog();
							})
						)
					);

				QG.Dialog('<span class="icon-attention"></span> Clear model?', content);
			});
		dom.right.append(dom.clear);

		if (!('delete' in this.options.Setup) || this.options.Setup.delete === true) 
		{	
			dom.delete = $('<a class="qg_link" title="Delete the entire instance of this app">&nbsp;<span class="icon-trash-empty"></span>&nbsp;</a>')
				.on('click', function(e){
					e.preventDefault();

					var content = $('<div></div>')
						.append($('<p>Do you really want to delete this model? This cannot be undone!</p>'))
						.append($('<div class="row"></div>')
							.append(
								$('<a class="qg_button red"><span class="icon-trash-empty"></span> Yes, trash everything</a>')
								.on('click', function(e) {
									e.preventDefault();
									QG.removeDialog();
									thissetup.kill();
								})
							)
							.append(
								$('<a class="qg_button green">No, keep my model</a>')
								.on('click', function(e) {
									e.preventDefault();
									QG.removeDialog();
								})
							)
						);

					QG.Dialog('<span class="icon-attention"></span> Delete model?', content);
				});
			dom.right.append(dom.delete);
		}

		// dom.menu_options = $('<a class="qg_button"><span class="icon-cog"></span></a>')
		// 	.on('click', function(e){
		// 		e.preventDefault();

		// 		if (dom.options.hasClass('selected'))
		// 		{
		// 			dom.options.removeClass('selected');
		// 		}
		// 		else
		// 		{
		// 			dom.options.addClass('selected');
		// 		}	
		// 	});

		// dom.right.prepend(dom.menu_options);
	}

	function exportString(format, model)
	{
		var out = '';
		out += QG.code.comment_format(format, 'Hamiltonian');
		out += 'H' + QG.code.matrix_format(format, model.H, 0, 2) + "\n\n";

		var cs = model.couplings();
		if (cs.length > 0) 
		{
			var sigma = model.sigma();
			out += QG.code.comment_format(format, 'Couplings');
			for (var i = 0; i < cs.length; i++)
			{
				out += QG.code.comment_format(format, cs[i].label + ' coupling');
				out += cs[i].label + QG.code.array_format(format, cs[i].array, 2) + "\n\n"
			}

			out += QG.code.comment_format(format, 'Coupling matrix (Sigma)');
			out += 'G' + QG.code.matrix_format(format, sigma, 0, 2) + "\n\n";
		}

		return out;
	}

	thissetup.loadFromString = function(str)
	{
		try 
		{
			// var loaded = thissetup.loadFromObject($.parseJSON(str));
			var loaded = thissetup.loadFromObject(window.JSURL.parse(str))
		} 
		catch(err) 
		{
			console.log(err);
			return false;
		}	
	}

	thissetup.loadFromObject = function(obj)
	{
		var title = '';
		if ('title' in obj)
		{
			var title = obj.title;
		}

		var model = false;
		if ('model' in obj)
		{
			model = obj.model;
		}

		var widgets = false;
		if ('widgets' in obj)
		{
			widgets = obj.widgets;
		}

		return thissetup.load(title, model, widgets);
	}

	thissetup.loadFromMol = function(mol)
	{
		console.log(mol);
		var title = mol.title;
		var atoms = mol.atoms;
		var bonds = mol.links;

		var scale = 100;

		var nodes = [];
		for (var i = 0; i < atoms.length; i++)
		{
			nodes.push([scale*atoms[i].x, scale*atoms[i].y, 0]);
		}

		var links = [];
		for (var i = 0; i < bonds.length; i++)
		{
			links.push([bonds[i][0]-1, bonds[i][1]-1, -1]);
		}

		var model = [nodes, links];
		return thissetup.load(title, model, false);
	}

	thissetup.load = function(title, model, widgets)
	{
		// reset current setup
		thissetup.reset(false);
		
		// setup
		thissetup.setTitle(title);

		// widgets
		if (widgets === false || widgets === undefined)
		{	
			widgets = [['Spectrum', {}], ['AddWidgets', {}]];
		}

		thissetup.model.load(model);

		var ws = [];
		for(var i = 0; i < widgets.length; i++) 
		{	
			ws.push(thissetup.addWidget(widgets[i][0], undefined, false));
		}
		
		for (var i = 0; i < widgets.length; i++)
		{
			if (widgets[i].length > 1) { 
				ws[i].load(widgets[i][1]);
			};
		}

		if (ws.length > 0) thissetup.selectWidget(ws[0].id);

		thissetup.model.focus();

		thissetup.revaluate();

		return true;
	}

	thissetup.dump = function()
	{
		var obj = {};
		obj.title = thissetup.title;
		obj.model = thissetup.model.dump();
		
		// add widgets
		obj.widgets = [];
		for (var key in thissetup.widgets)
		{
			if (thissetup.widgets.hasOwnProperty(key))
			{
				var v = thissetup.widgets[key];
				if (v.name != thissetup.model.name) 
				{
					obj.widgets.push([v.name, v.dump()]); 
				}
			}
		}
		return obj;
	}

	// the set title
	thissetup.setTitle = function(title)
	{
		dom.title.val(title);
		thissetup.title = title;

		thissetup.updateTitle();
	}

	// change the title
	thissetup.updateTitle = function() 
	{
		var o = QG.Text.pixelWidth(thissetup.title, dom.title.css('font'), dom.title.css('font-size'));
		o = Math.max(o, 80);
		o = Math.min(o, 200);
		dom.title.css('width', o + 12 + 'px');
	}

	// add widget
	thissetup.addWidget = function(widget, options, revaluate)
	{	
		revaluate = revaluate === undefined ? true : false;

		// default
		if (widget === undefined) { widget='AddWidgets'; }
		
		// options
		var opts = {};
		if (!options)
		{
			// fill standard options
			if (thissetup.options[widget])
			{
				opts = thissetup.options[widget];
			}
		}
		else
		{
			// insert custom options
			for (key in options)
			{
				if (options.hasOwnProperty(key))
				{
					opts[key] = options[key];
				}
			}
		}

		// create new widget
		var w = new QG.Widgets[widget](thissetup, opts);

		// add to setup
		thissetup.widgets[w.id] = w;

		// create html container
		var container = $('<div class="qg_widget"></div>').css(layouter.app.widget);
		dom.widgets.append(container);

		var icon = $('<a class="qg_icon"></div>').html(w.icon);
		this.menu.add(w.id, icon);

		// append icon to sidebar
		dom.sidebar.append(icon);

		// render widget
		w.render(container);
		

		if (revaluate && 'revaluate' in w) { 
			console.log('addWidget revaluate'); thissetup.selectWidget(w.id); 
		} else {
			w.hide();
		}

		// return widget
		return w;
	}

	thissetup.getWidget = function(id) {
		var widget = false;

		for (var key in thissetup.widgets) 
		{			
			if (thissetup.widgets.hasOwnProperty(key))
			{
				if (thissetup.widgets[key].id === id)
				{
					widget = thissetup.widgets[key];
					break;
				}
			}
		}

		return widget;
	}

	thissetup.selectWidget = function(id) 
	{
		if (this.selected === id) { return; }

		var sWidget = this.getWidget(this.selected);

		if (sWidget) { sWidget.hide(); this.selected = false; }

		var widget = this.getWidget(id);

		if (!widget) return;

		this.selected = widget.id;
		widget.show();

		this.fit();
		this.menu.select(id);

		widget.revaluate();
	}

	// delete widget
	thissetup.removeWidget = function(id, relayout)
	{
		// state var
		var del = false;
		
		// iterate widgets
		for (var key in thissetup.widgets)
		{
			if (thissetup.widgets.hasOwnProperty(key))
			{
				if (thissetup.widgets[key].id === id)
				{
					// del state
					var del = true;
					break;
				}
			}
		}
	
		// delete
		if (del === true) {
			this.menu.remove(id);

			delete thissetup.widgets[key]; 
			if (id == this.selected) { this.selected = false;}
		}

		if (relayout) thissetup.fit();

		return del;
	}

	thissetup.getEigenStatus = function() {
		return thissetup.eigen.status;
	}

	thissetup.getEigenValues = function() {
		if (!thissetup.eigen.valid) { thissetup.diagonalize(); }
		return thissetup.eigen.values;
	}

	thissetup.getEigenVectors = function() {
		if (!thissetup.eigen.valid) { thissetup.diagonalize(); }
		return thissetup.eigen.vectors;
	}

	thissetup.diagonalize = function() {
		var H = thissetup.model.H; // import Hamiltonian from model

		var t0 = performance.now();
		var ev = QG.Math.eig(H);
		var t1 = performance.now();

		thissetup.eigen.valid = true;

		// no result. fail immediately
		if (ev === false)
		{
			thissetup.eigen.status = false;
			thissetup.eigen.values = [];
			thissetup.eigen.vectors = [];
			
			return;
		}

		thissetup.eigen.status = true;

		// set new values
		thissetup.eigen.values = ev.energies;
		thissetup.eigen.vectors = ev.orbitals;

		console.log("Diagonalize: " + (t1 - t0) + " ms using " +  ev.niter + " iterations and " + ev.nrot + " jacobi rotations.");
	}

	// reevaluate widgets
	thissetup.revaluate = function(options)
	{
		if (options && options.Model)
		{
			thissetup.model.revaluate(options.Model);
		}
		else
		{
			thissetup.model.revaluate();
		}

		thissetup.eigen.valid = false;

		if (thissetup.selected === false) { return; }

		var w = thissetup.getWidget(thissetup.selected);

		// add options?
		if (options && options[w.name]) 
		{
			w.revaluate(options[w.name]);
		}
		else 
		{
			w.revaluate(); 	
		}
	}

	// kill this entire setup
	thissetup.kill = function()
	{
		thissetup.removeResizer();
		// remove from collection
		if (thissetup.collection !== false)
		{
			thissetup.collection.removeSetup(thissetup.id);
		}

		// iterate widgets
		for (var key in thissetup.widgets)
		{
			if (thissetup.widgets.hasOwnProperty(key))
			{
				thissetup.widgets[key].kill();
			}
		}
	
		thissetup.widgets = {};
		
		// remove html
		wrapper.remove();
	}

	thissetup.reset = function(widgets)
	{
		this.removeResizer();

		widgets = widgets === undefined ? true : false;

		thissetup.selected = false;
		// clear text
		thissetup.setTitle('');

		// iterate over widgets removing them all
		for (var key in thissetup.widgets)
		{
			if (thissetup.widgets.hasOwnProperty(key))
			{
				thissetup.widgets[key].kill();
			}
		}
		// new model
		thissetup.model = null;
		thissetup.widgets = {};
		thissetup.eigen = {valid: false, status: false, values: [], vectors: []};
		
		// new model
		thissetup.model = new QG.Widgets.Model(thissetup, this.options['Model']);
		thissetup.model.render(dom.model);
		thissetup.widgets[thissetup.model.id] = thissetup.model;

		thissetup.fit();

		// thissetup.model.refit();

		if (widgets)
		{
			var w = thissetup.addWidget('Spectrum', undefined, false);
			thissetup.addWidget('AddWidgets', undefined, false);
			thissetup.selectWidget(w.id);
		}

		thissetup.setupResizer();
	}

	thissetup.setupResizer = function()
	{
		var running = false;

		 // setup resize event;
		$(window).on('resize', thissetup.resizer);
	}

	thissetup.running = 0;
	thissetup.resizer = function()
	{
		if (thissetup.running) return;
	        
    	thissetup.running = 1;
        
	    setTimeout(function() 
	    {
	        thissetup.running = 0;
	        console.log('resize fit');
		    thissetup.fit();
	    }, 
	    122);
		// thissetup.fit();
	}

	thissetup.removeResizer = function()
	{
		$(window).off('resize', thissetup.resizer);
		// if (thissetup.resizer)
		// {
		// 	clearInterval(thissetup.resizer);
		// }
	}

	thissetup.render_menu();
	this.reset();
}



})(QG, jQuery, window);
