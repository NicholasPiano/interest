// initialise
var Components = (Components || {});

// content panel
Components.contentPanel = function (id, args) {
	// CONTENT PANEL
	// Nested panel components meant to hide scroll bar.

	// config
	args.appearance = (args.appearance || {
		style: {
			'width': '100%',
		},
	});

	// set up components
	return UI.createComponent('{id}'.format({id: id}), {
		name: args.name,
		template: UI.template('div', 'ie'),
		appearance: args.appearance,
		children: [
			// wrapper
			UI.createComponent('{id}-wrapper'.format({id: id}), {
				name: 'wrapper',
				template: UI.template('div', 'ie'),
				appearance: {
					style: {
						'height': '100%',
						'width': 'calc(100% + 20px)',
						'padding-right': '20px',
						'overflow-y': 'scroll',
					}
				},
				children: args.children,
			}),
		],
	}).then(function (base) {
		// logic, bindings, etc.

		// behaviours
		base.behaviours = {
			up: function () {

			},
			down: function () {

			},
			left: function () {

			},
			right: function () {

			},
			enter: function () {

			},
		}

		// complete promises.
		return Promise.all([

		]).then(function () {
			return base;
		});
	});
}
