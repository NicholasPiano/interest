Components = (Components || {});
Components.button = function (id, args) {
	return UI.createComponent(id, {
		name: args.name,
		template: UI.template('div', 'ie button border border-radius'),
		appearance: args.appearance,
		state: args.state,
		children: [
			UI.createComponent(`${id}-value`, {
				appearance: {
					html: args.value,
				},
			}),
		],
	}).then(function (_button) {
		return _button;
	})
}