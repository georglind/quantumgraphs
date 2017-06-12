"use strict";

var QG = QG || {};

(function(QG){

QG.code = {};

QG.code.comment_format = function(format, str)
{
	switch(format.toLowerCase()) {
		case 'mathematica':
			return '';
		case 'matlab':
			return '%' + str + "\n";
		case 'numpy':
		case 'python':
			return '#' + str + "\n";
	}
}

QG.code.array_format = function(format, mat, precision, is_complex)
{
	var output = '';
	switch(format.toLowerCase()) {
		case 'mathematica':
			var mao = "{";
			var frowo = '{'
			var rowo = '   {';
			var elo = ',';
			var rowe = "},\n";
			var lrowe = "}";
			var mae = '}';
			var compl = 'I*';
			var compf = '  ';
			break;
		case 'matlab':
			var mao = '[';
			var frowo = '';
			var rowo = '   ';
			var elo = ',';
			var rowe = ";\n";
			var lrowe = '';
			var mae = ']';
			var compl = '1j*';
			var compf = '   ';
			break;
		case 'numpy':
		case 'python':
			var mao = 'np.array([';
			var frowo = '[';
			var rowo = '            [';
			var elo = ',';
			var rowe = "],\n";
			var lrowe = ']';
			var mae = '], dtype=np.complex128)';
			var compl = '1j*';
			var compf = '   ';
			break;
	}
	precision = precision === undefined ? 0 : parseInt(precision);
	var roff = " ".repeat(precision);

	output += '=' + mao + frowo;
	for (var j=0; j < mat.x.length; j++) {
		var el = mat.x[j];

		if (el > 0) {
			output += " ";
		}

		if (el == 0) {
			output += " 0 " + roff;
		} else {
			output +=el.toFixed(precision);	
		}

		if (mat.is_complex || is_complex)
			{
				var el = mat.y[j];

				if (el == 0)
				{
					output += compf + "   " + roff;
				}
				else 
				{
					output += el > 0 ? '+' : '-';
					output += compl;
					output += Math.abs(el).toFixed(precision);
				}
			}
		
		if (j < mat.x.length-1) {
			output += elo;
		}
	}
	output += lrowe + mae;

	return output;
}

QG.code.matrix_format = function(format, mat, offset, precision, is_complex)
{
	var output = '';
	switch(format.toLowerCase()) {
		case 'mathematica':
			var mao = "{";
			var frowo = '{'
			var rowo = '   {';
			var elo = ',';
			var rowe = "},\n";
			var lrowe = "}";
			var mae = '}';
			var compl = 'I*';
			var compf = '  ';
			break;
		case 'matlab':
			var mao = '[';
			var frowo = '';
			var rowo = '   ';
			var elo = ',';
			var rowe = ";\n";
			var lrowe = '';
			var mae = ']';
			var compl = '1j*';
			var compf = '   ';
			break;
		case 'numpy':
		case 'python':
			var mao = 'np.array([';
			var frowo = '[';
			var rowo = '            [';
			var elo = ',';
			var rowe = "],\n";
			var lrowe = ']';
			var mae = '], dtype=np.complex128)';
			var compl = '1j*';
			var compf = '   ';
			break;
	}

	precision = precision === undefined ? 0 : parseInt(precision);
	var roff = " ".repeat(precision);

	if (offset) rowo = offset + rowo;

	if (mat === undefined || mat === null) { return '=' + mao + mae};

	output += '=' + mao;
	for (var i = 0; i < mat.x.length; i++)
	{
		if (i == 0) {
			output += frowo;
		} else {
			output += rowo;
		}

		for (var j=0; j < mat.x[0].length; j++) {

			var el = mat.x[i][j];
			// prepend space to positive to align with negative (-)
			if (el > 0) {
				output += " ";
			}

			if (el == 0) {
				output += " 0 " + roff
			} else {
				output += el.toFixed(precision);	
			}
			
			if (mat.is_complex || is_complex)
			{
				var el = mat.y[i][j];

				if (el == 0)
				{
					output += compf + "   " + roff;
				}
				else 
				{
					output += el > 0 ? '+' : '-';
					output += compl;
					output += Math.abs(el).toFixed(precision);
				}
			}

			if (j < mat.x[0].length - 1) {
				output += elo;
			}
		}

		if (i == mat.x.length - 1) {
			output += lrowe;
		} else {
			output += rowe;
		}
	}
	output += mae;

	return output;
}

})(QG);