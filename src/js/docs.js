"use strict";

var QG = QG || {};

(function(QG, $){

var D = function()
{
	var state = this.state = {'style': false, 'docs': false}

	var path = './assets/data/docs.json';
	var style = './assets/static/katex.min.css';
	var docs = false;

	this.load = function(fcn, context, args)
	{
		var sel
		$.ajax({
			dataType: "json",
			url: path,
			success: function(data) { 
				docs = data;
				state.docs = true;

				fcn.apply(context, args); 
			}
		});
	}

	this.get = function(name) { console.log(docs); return (docs && name in docs) ? docs[name] : false; }
	
	this.loadStyles = function()
	{
		var stylesheet = document.createElement('link');
		stylesheet.href = style;
		stylesheet.rel = 'stylesheet';
		stylesheet.type = 'text/css';
		// temporarily set media to something inapplicable to ensure it'll fetch without blocking render
		stylesheet.media = 'only x';
		// set the media back when the stylesheet loads
		stylesheet.onload = function() { stylesheet.media = 'all'; state.style=true; }
		document.getElementsByTagName('head')[0].appendChild(stylesheet);
	}
}

D.prototype.showasync = function(name, elements)
{
	if (!this.state.style) this.loadStyles();

	if (this.get('Model')) 
	{
		this.show(name, elements);
	}
	else 
	{
		elements.title.text('Loading');
		elements.body.html(QG.elements.loading());
		this.load(this.show, this, [name, elements]);
	}
}

// synchronous
D.prototype.show = function(name, elements)
{	var dok = this.get(name);
	elements.title.text(dok.title);
	elements.body.html(dok.body);
}

QG.Docs = new D();

})(QG, jQuery);