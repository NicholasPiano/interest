Components = (Components || {});
Components.timer = function (id, args) {
	return UI.createComponent(id, {

	}).then(function (_timer) {
		return _timer;
	})
}