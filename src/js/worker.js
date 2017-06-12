importScripts(numerico.min.js');


addEventListener('message', function(e) {
	var data = e.data;

	postMessage('Worker started: ' + data.msg);

}, false);


addEventListener('error', function(e) {
	var data = e.data;

	postMessage('Worker started: ' + data.msg);

}, false);