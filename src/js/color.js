"use strict";

// QG namespace
var QG = QG || {};

// closure
(function($, numeric, QG) {

QG.Color = QG.Color || {};

QG.Color.HSVtoRGB = function(H, S, V)
{
	var C = V * S;
	var m = V - C;

	var Hp = H / 60;

	var X = C * (1 - Math.abs((Hp % 2) - 1));

	var rgb = [0, 0, 0];
	if (Hp < 0) { rgb = [m, m, m]; }
	else if (Hp < 1 ) { rgb = [C + m, X + m, m]; }
	else if (Hp < 2) { rgb = [X + m, C + m, m]; }
	else if (Hp < 3) { rgb = [m, C + m, X + m]; }
	else if (Hp < 4) { rgb = [m, X + m, C + m]; }
	else if (Hp < 5) { rgb = [X + m, m, C + m]; }
	else if (Hp < 6) { rgb = [C + m, m, X + m]; }

	return [parseInt(rgb[0]*255), parseInt(rgb[1]*255), parseInt(rgb[2]*255)]
}

QG.Color.CIELChtoRGB = function(L, C, h)
{
	var a = C*Math.cos(h);
	var b = C*Math.sin(h);

	var finv = function(t)
	{
		if (t > 6/29.) { return t*t*t; }
		return 3*(6./29.)*(6./29.)*(t - 4/29);
	}
	
	var X = 0.95047 * finv((L+16)/116 + a/500);
	var Y = 1.00 * finv((L+16)/116);
	var Z = 1.08833 * finv((L+16)/116 - b/200);

	var R = X *  3.2406 + Y * (-1.5372) + Z * (-0.4986);
	var G = X * (-0.9689) + Y *  1.8758 + Z *  0.0415;
	var B = X *  0.0557 + Y * (-0.2040) + Z *  1.0570;

	if ( R > 0.0031308 ) { R = 1.055 * Math.exp( Math.log(R) / 2.4 ) - 0.055; }
	else 				 { R = 12.92 * R }
	if ( G > 0.0031308 ) { G = 1.055 * Math.exp( Math.log(G) / 2.4 ) - 0.055; }
	else                 { G = 12.92 * G; }
	if ( B > 0.0031308 ) { B = 1.055 * Math.exp( Math.log(B) / 2.4 ) - 0.055; }
	else                 { B = 12.92 * B; }

	return [parseInt(255*R), parseInt(255*G), parseInt(255*B)];
	
}

QG.Color.CIELtoRGB = function(L, C, ch, sh)
{
	var a = C*ch;
	var b = C*sh;

	var finv = function(t)
	{
		if (t > 6/29.) { return t*t*t; }
		return 3*(6./29.)*(6./29.)*(t - 4/29);
	}
	
	var X = 0.95047 * finv((L+16)/116 + a/500);
	var Y = 1.00 * finv((L+16)/116);
	var Z = 1.08833 * finv((L+16)/116 - b/200);

	var R = X *  3.2406 + Y * (-1.5372) + Z * (-0.4986);
	var G = X * (-0.9689) + Y *  1.8758 + Z *  0.0415;
	var B = X *  0.0557 + Y * (-0.2040) + Z *  1.0570;

	if ( R > 0.0031308 ) { R = 1.055 * Math.exp( Math.log(R) / 2.4 ) - 0.055; }
	else 				 { R = 12.92 * R }
	if ( G > 0.0031308 ) { G = 1.055 * Math.exp( Math.log(G) / 2.4 ) - 0.055; }
	else                 { G = 12.92 * G; }
	if ( B > 0.0031308 ) { B = 1.055 * Math.exp( Math.log(B) / 2.4 ) - 0.055; }
	else                 { B = 12.92 * B; }

	return [parseInt(255*R), parseInt(255*G), parseInt(255*B)];
}

})(jQuery, numeric, QG);