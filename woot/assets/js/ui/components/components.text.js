Components = (Components || {});
Components.text = function (id, args) {
	return UI.createComponent(id, {
		name: args.name,
		template: UI.template('div', 'ie'),
		appearance: args.appearance,
		children: [
			UI.createComponent(`${id}-title`, {
				name: 'title',
				template: UI.template('p'),
				appearance: {
					html: args.title,
					style: {
						'font-size': '16px',
						'display': (args.title ? 'block' : 'none'),
					},
				},
			}),
			UI.createComponent(`${id}-value`, {
				name: 'value',
				template: UI.template('p'),
				appearance: {
					html: args.value,
					style: {
						'display': (args.value ? 'block' : 'none'),
					},
				},
			}),
		],
	}).then(function (_text) {

		_text.title = args.title;
		_text.value = args.value;
		_text.update = function (_args) {
			return Promise.all([
				_text.cc.title.setAppearance({html: (_args.title || _text.title), style: {'display': (_args.title !== undefined ? 'block' : 'none')}}),
				_text.cc.value.setAppearance({html: (_args.value || _text.value), style: {'display': (_args.value !== undefined ? 'block' : 'none')}}),
			]);
		}

		return _text;
	})
}