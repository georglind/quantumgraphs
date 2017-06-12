"use strict";

var QG = QG || {};

(function($, numeric, QG) {

QG.Widgets = QG.Widgets || {};

///////////////////////////
// notes
///////////////////////////

QG.Widgets.Notes = function(setup, settings)
{
	QG.Widget.call(this, setup, settings)
	this.name = 'Notes';
	this.icon = '<span>N</span>';

	this.widget.$boxes = {body: null, text: null};
}

$.extend(QG.Widgets.Notes.prototype, QG.Widget.prototype);

QG.Widgets.Notes.prototype.getBodyWidth = function() { return this.widget.$el.width(); }

QG.Widgets.Notes.prototype.getBodyHeight = function() { return this.widget.$el.height(); }

QG.Widgets.Notes.prototype.render = function(wrapper) 
{
	this.widget.$el = wrapper;

	// Menu
	var menu = $('<div class="qg_widget_menu">' +
					'<div class="qg_widget_title">Notes</div>' + 
					'</div');

	var self = this;
	var menu_delete = $('<a class="qg_button" onclick=""><span class="icon-cancel"></span></a>')
		.on('click tap', function(e) 
		{
			e.preventDefault();
			self.kill();
			self.setup.removeWidget(self.id);
		}
	);

	menu.append(menu_delete);

	// Text
	this.widget.$boxes.body = $('<div class="qg_notes"></div>');
	this.widget.$boxes.text = $('<textarea></textarea>');

	this.widget.$boxes.body.append(this.widget.$boxes.text)

	// Concatenate
	this.widget.$el.append(menu).append(this.widget.$boxes.body);
}

QG.Widgets.Notes.prototype.refit = function()
{
	if (this.widget.$boxes.text)
	{
		this.widget.$boxes.text.height(this.getBodyHeight() - 30 - 42);
		this.widget.$boxes.text.width(this.getBodyWidth() - 40);
	}
}

QG.Widgets.Notes.prototype.revaluate = function() { return true; }

// QG.Widgets.Notes.prototype.refit = function() {
// 		if (elements.text) {
// 			elements.text.height(getBodyHeight() - 30 - 42);
// 			elements.text.width(getBodyWidth() - 40);
// 		}
// 	}

	// dump and load
QG.Widgets.Notes.prototype.dump = function()
{
	return {'text': this.widget.$boxes.text.val()};
}

QG.Widgets.Notes.prototype.load = function(opts)
{
	var t = ('text' in opts ? opts['text'] : '');
	this.widget.$boxes.text.val(t);

	return true;
}

QG.Widgets.Notes.prototype.kill = function()
{
	this.setup.removeWidget(this.id);
	this.widget.$el.remove();
	return true;
}

})($, numeric, QG);