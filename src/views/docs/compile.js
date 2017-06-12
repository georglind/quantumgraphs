#!/usr/bin/env node

var dok = require('./dok');


var fs = require('fs');
var path = require('path');


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

var widgets = ['model', 'spectrum', 'transmission', 'density', 'scatteringstate', 'localcurrents', 'polarizability'];

var docs = {};
for (var i = 0; i < widgets.length; i++)
{
	var p = '../../widgets/' + widgets[i];
	var doc = JSON.parse(loadf(p + '/docs.json'));
	
	doc['body'] = dok.text(loadf(p + '/docs.katex'));
	
	docs[doc.name] = doc;
	
	fs.writeFile(p + '/docs.html', doc['body'], 'utf8');
}

fs.writeFile('../../../assets/data/docs.json', JSON.stringify(docs), 'utf8');

