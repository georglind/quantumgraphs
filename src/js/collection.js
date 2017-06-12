"use strict";

// QG namespace
var QG = QG || {};

//////////////////////////////
// Collection of setups
// Each collection has many setups. this.setups
// Each setup has a parent collection.
//////////////////////////////
(function(QG, $){

QG.Collection = function(wrapper)
{	
	var thiscollection = this;

	var options = {
		title: ''
	};

	var sid = 0;
	var setups = [];

	// refrences to collection html dom
	var dom = { wrapper: null, title: null, setup: null };

	this._create = function(wrapper) {
		dom.title = $('<div class="qg_collection_title">' + options.title + '</div>');
		dom.setups = $('<div class="qg_setups"></div>');
		
		dom.wrapper = $('<div class="qg_collection"></div>');

		dom.wrapper
			.append(dom.title)
			.append(dom.setups);

		wrapper.addClass('qg_collections').html('').append(dom.wrapper);
	}
	this._create(wrapper)

	// this._refresh = function() {
	// 	// viewport width
	// 	var wrapper_width = $(wrapper).width();
	// 	var columns = Math.floor((wrapper_width - 8)/226);
	// 	var width = Math.max(672, thiscollection.columns*226 - 6) + 8;

	// 	// modity html
	// 	dom.wrapper.width(thiscollection.width);

	// 	// this
	// }

	// methods
	// render and attach title html
	this.renderTitle = function()
	{
		dom.input_title = $('<input class="qg_collection_title" type="text" name="title" inputmode="latin" size="20" placeholder="Collection" draggable="false"/>')
			.on('keydown change', function(e){
				options.title = $(this).val();
				thiscollection.updateTitle();
			})
			.on('mousedown touchstart', function(e){
				e.stopPropagation();
			});
	
		dom.title.append(dom.input_title)
	}
	this.renderTitle();


	this.setTitle = function(title)
	{
		dom.input_title.val(title);
		options.title = title;

		thiscollection.updateTitle()
	}

	// change the title
	this.updateTitle = function()
	{
		var ow = QG.Text.pixelWidth(options.title, dom.input_title.css('font'), dom.input_title.css('font-size'));
		ow = Math.max(ow, 100);
		ow = Math.min(ow, 400);

		dom.input_title.css('width', (ow + 22) + 'px');
	}

	// add a setup
	this.addSetup = function(options)
	{
		// create html
		var setup_wrapper = $('<div></div>');
		dom.setups.append(setup_wrapper);

		// create setup
		var s = new QG.Setup(setup_wrapper);

		// add colleciton info
		s.id = sid;
		s.collection = thiscollection;

		// add setup to list of setups
		setups[sid] = s;

		// increase sid
		sid += 1;
		return s;
	}

	this.getSetup = function(id)
	{
		return setups[id];
	}

	this.getSetups = function()
	{
		return setups;
	}

	// remove setup
	this.removeSetup = function(id)
	{
		var del = false;
		for (var key in setups)
		{
			if (setups.hasOwnProperty(key))
			{
				if (setups[id] == id)
				{
					del = true;
					break;
				}
			}
		}

		delete setups[key]

		return del;
	}
}
})(QG, jQuery);
