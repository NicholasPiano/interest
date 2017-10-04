$(document).ready(function() {
	// general shortcut responds to a keyboard combination by submitting a request to DJANGO
	function shortcutCall (command, action) {
		$.ajax({
			type: 'get',
			timeout: 0,
			url:'http://localhost:' + settings['port'] + '/expt/shortcuts/' + command,
			success: function (data, textStatus, XMLHttpRequest) {
				action(data);
			},
			error:function (xhr, ajaxOptions, thrownError) {
				if (xhr.status === 404 || xhr.status === 0) {
					shortcutCall(command, action);
				}
			}
		});
	}

	///////////// SHORTCUTS
	Mousetrap.bind('command+k', function () {
		shortcutCall('shortcut-test', function (data) {

		});
	});
});
