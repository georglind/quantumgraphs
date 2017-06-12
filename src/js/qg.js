"use strict";

var Kinetic = Kinetic || (Konva || {}) || {};

Kinetic.pixelRatio = 2;

// QG namespace
var QG = QG || {};

// Keyboard
QG.Keys = {select: false}

function keydown(e) 
{
	 e = e || window.event;

	 if (e.keyCode == 16) 
	 {
	 	QG.Keys.select = true;
	 }
}

function keyup(e)
{
	e = e || window.event;

	if (e.keyCode == 16) 
	{
		QG.Keys.select = false;
	}
}
