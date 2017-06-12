"use strict";

var QG = QG || {};

(function(QG){

// unique id
function _uid() { 
	this.id = 0
	this.get = function() { var id = 'w' + this.id; this.id++; return id; }
}

QG.Id = new _uid();

// Model Widget
var Widget = QG.Widget = function(setup, settings)
{
	this.setup = setup;
	this.settings = settings;

	this.id = QG.Id.get();
	this.widget = {'$el': null, '$boxes': {}};
	
	this._events = {};
}

Widget.prototype.listenTo = function(obj, ev, fnc)
{
	if (!(ev in obj._events)) {
		obj._events[ev] = {};
	}
	obj._events[ev][this.id] = fnc;
}

Widget.prototype.trigger = function(ev, options)
{
	if (!(ev in this._events)) {
		return;
	}

	for (var key in this._events[ev])
	{
		if (this._events[ev].hasOwnProperty(key))
		{
			this._events[ev][key](options);
		}
	}
}

Widget.prototype.unlistenTo = function(obj, ev)
{
	if (!(ev in obj._events)) { return; }

	delete obj._events[ev][this.id];
}

Widget.prototype.hide = function() { this.widget.$el.hide(); }
Widget.prototype.show = function() { this.widget.$el.show(); }
Widget.prototype.fit = function(app) { this.widget.$el.css(app); }

})(QG);
