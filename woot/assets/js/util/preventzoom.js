$(document).ready(function() {
	// prevent ctrl+(+, -)
	var keyCodes = [61, 107, 173, 109, 187, 189];

	$(document).keydown(function(event) {
		if (event.ctrlKey==true && (keyCodes.indexOf(event.which) != -1)) {
			event.preventDefault();
		}
	});

	$(window).bind('mousewheel DOMMouseScroll', function (event) {
		if (event.ctrlKey == true) {
			event.preventDefault();
		}
	});
});
