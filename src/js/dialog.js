// Namespace

var QG = QG || {};

// closure
(function($, QG, window){

// Dialog
QG.Dialog = function(title, content, dtype) 
{
	switch(dtype) 
	{
		case 'warning':
			var ddtype = ' icon-attention';
			break;
		case 'error':
			var ddtype = ' icon-attention';	
			break;
		default:
			var ddtype = ''
	}

	var viewport_width = $(window).width();
	var viewport_height = $(window).height();

	var modal_y = Math.round(Math.max(viewport_height/3 - 100, 0));
	var modal_w = Math.min(viewport_width, 400);

	var popup = $('<div class="qg_popup" style="width: ' +  viewport_width + 'px" id="qg_popup"></div>');

	var blur = $('<div class="qg_blur"></div>')
		.on('click tap', function(e)
		{
			e.stopPropagation();
			e.preventDefault();
			e.cancelBubble = true;
			popup.remove();
		});

	var dialog = $('<div class="qg_dialog"></div>')
		.css('margin-top', modal_y + 'px')
		.css('width', modal_w + 'px');

	dialog.append($('<div class="qg_dialog_close">✖</div>')
			.on('click tap', function(e) {
				e.preventDefault();
				popup.remove();
			})
		)
		.append($('<div></div>')
			.append($('<div class="qg_dialog_title'+ ddtype +'""></div>').append(title))
			.append($('<div class="qg_dialog_content"></div>')
			        	.css({'max-height': (viewport_height - 2*modal_y - 30 - 50) + 'px'})
			        .append(content))
		)

	$('body').append(popup.append(blur).append(dialog));

	window.setTimeout(function()
	{
		blur.css('opacity', .6);
		dialog.css('opacity', 1).css('margin-top', modal_y + 'px')
	}, 20);
}

QG.removeDialog = function()
{
	$('#qg_popup').remove();
}

})(jQuery, QG, window);