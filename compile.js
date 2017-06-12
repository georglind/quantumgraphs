#!/usr/bin/env node

"use strict";

var fs = require('fs');
var path = require('path');
var hb = null
require('strict-mode')(function () {
	hb = require('moustache'); 
})


function loadf(filename){
	var p = path.join(__dirname, filename);
	if (fs.existsSync(p)) {
		return fs.readFileSync(p, { encoding: 'utf8' });
	}
	else
	{
		return false;
	}
}

var template = loadf('src/views/template.html');

var views = ['index', 'app', 'contact', 'cookiepolicy', 'about']

for (var i=0; i < views.length; i++)
{
	var view = JSON.parse(loadf('src/views/' + views[i] + '/view.json'));
	view['head'] = loadf('src/views/' + views[i] + '/head.html');
	view['body'] = loadf('src/views/' + views[i] + '/body.html');
	view['menu'] = loadf('src/views/' + views[i] + '/menu.html');
	
	var data = hb.render(template, view);
	fs.writeFile(views[i] + '.html', data, 'utf8');
}


