"use strict";

var QG = QG || {};

(function($, numeric, QG) {

QG.Widgets = QG.Widgets || {};

// Addwidget
QG.Widgets.AddWidgets = function(setup, settings)
{
	QG.Widget.call(this, setup, settings)
	
	this.name = 'AddWidgets';
	this.icon = '<span>+</span>';
}

$.extend(QG.Widgets.AddWidgets.prototype, QG.Widget.prototype);

QG.Widgets.AddWidgets.prototype.render = function(wrapper) 
{
	this.widget.$el = wrapper;
	
	var body = this.widget.$boxes.body = $('<div class="qg_add_widget"></div>');

	this.widget.$el.append(body);

	this.widget.$el.append($('<div class="qg_widget_menu"><div class="qg_widget_title">Add Widget</div></div>'));
	body.append('<p>Analyze your graph with widgets:</p>');
	// body.append($('<div class="qg_add_widget"><span class="icon-plus-circled"></span></div>'));
    // body.append($('<p>Choose a widget from the list below:</p>'))
	body.append($('<ul class="qg_menu_list"></ul>')
	    .append($('<li><a data-widget="Orbitals"><div class="qg_icon"><span>O</span></div> Orbitals</a></li>'))
	    // .append($('<li><a data-widget="Density"><div class="qg_icon"><span>D</span></div> Density</a></li>'))
	    .append($('<li><a data-widget="Transmission"><div class="qg_icon"><span>Tr</span></div> Transmission</a></li>'))
	    .append($('<li><a data-widget="ScatteringState"><div class="qg_icon"><span>Sc</span></div> Scattering</a></li>'))
        .append($('<li><a data-widget="LocalCurrents"><div class="qg_icon"><span>LC</span></div> Local Currents</a></li>'))
	    // .append($('<li><a data-widget="TransmissionWithScissors">Transmission with Scissors</a></li>'))
	    // .append($('<li><a data-widget="Resolvent">Resolvent</a></li>'))
	    .append($('<li><a data-widget="Notes"><div class="qg_icon"><span>N</span></div> Notes</a></li>'))
	)

	body.append('<p>Chemistry-specific widgets:</p>');
	body.append($('<ul class="qg_menu_list"></ul>')
        .append($('<li><a data-widget="Density"><div class="qg_icon"><span>D</span></div> Density</a></li>'))
        .append($('<li><a data-widget="BondOrder"><div class="qg_icon"><span>BO</span></div> Bond Order</a></li>'))
	    .append($('<li><a data-widget="Polarizability"><div class="qg_icon"><span>P</span></div> Polarizability</a></li>'))
	)

	var self = this;
	body.on('click tap', function(e){
		// e.preventDefault();
		var $target = $(e.target);

		var widget = false;
		if ($target.is('a')) {
			widget = $target.attr('data-widget');
		}
		else {
			var as = $target.parents('a');
			if (as.length > 0)
			{
				widget = $(as[0]).attr('data-widget');
			}
		}

		if (widget) {
			var w = self.setup.addWidget(widget, undefined, false);
			
			self.setup.removeWidget(self.id, false);
			self.kill();
			self.setup.addWidget('AddWidgets', undefined, false);
			
			self.setup.selectWidget(w.id);
			// self.setup.fit();
			$('#qg_popup').remove();
		}
	});
}
QG.Widgets.AddWidgets.prototype.getBodyWidth = function() { return this.widget.$el.width(); }
QG.Widgets.AddWidgets.prototype.getBodyHeight = function() { return this.widget.$el.height() - 38; }

QG.Widgets.AddWidgets.prototype.refit = function() { 
	this.widget.$boxes.body.css({'width': this.getBodyWidth() + 'px', 'height': this.getBodyHeight()});
}
QG.Widgets.AddWidgets.prototype.revaluate = function() { return true; }
QG.Widgets.AddWidgets.prototype.dump = function() { return {}; }
QG.Widgets.AddWidgets.prototype.load = function() { return true }
QG.Widgets.AddWidgets.prototype.reset = function() { return true; }

QG.Widgets.AddWidgets.prototype.kill = function() 
{
	this.setup.removeWidget(this.id);
	this.widget.$el.remove();
	return true;
}

})($, numeric, QG);