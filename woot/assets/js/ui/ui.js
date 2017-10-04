// UI: This is the UI definition. It is ignorant of the data passing through the app.
var UI = {
	// GLOBAL STATE
	// store current global state
	// This is a path like 'client.reload' -> later, James.
	globalState: undefined,
	previousState: undefined,

	// changeState
	changeState: function (stateName, trigger) {
		UI.previousState = UI.globalState;
		UI.globalState = stateName;
		return Promise.all(UI.states.filter(function (state) {
			return stateName.indexOf(state.name) === 0;
		}).map(function (state) {
			return state.change();
		}));
	},

	// COMPONENT
	// components
	components: {},

	// getComponent
	getComponent: function (id) {
		return new Promise(function(resolve, reject) {
			resolve(UI.components[id]);
		});
	},

	// component
	component: function (id) {
		// identity
		this.setId = function (id) {
			var currentId = this.id;
			id = id !== undefined ? id : currentId;

			if (id !== currentId) {
				var _this = this;
				// 1. remove the component while keeping a solid var present
				// 2. change the id of the var and change the model attr.
				// 3. Add the var.

				return UI.remove(_this).then(function (component) {
					return new Promise(function(resolve, reject) {
						if (component.isRendered) {
							component.model().attr('id', id);
						}
						component.id = id;
						resolve(component);
					});
				}).then(UI.add);
			} else {
				return this.id;
			}
		}
		this.setName = function (name) {
			var currentName = this.name;
			name = (name || currentName);

			if (name !== currentName) {
				var _this = this;
				_this.name = name;
				return _this.parent().then(function (parent) {
					if (parent) {
						parent.components[_this.name] = _this;
						delete parent.components[currentName];
					}
					return Util.ep();
				});
			}
		}
		this.setAfter = function (after) {
			var currentAfter = this.after;
			after = after !== undefined ? after : currentAfter;

			if (after !== currentAfter) {
				var _this = this;
				_this.after = after;
				// 1. Parent stays the same.
				// 2. Or does it...
				// 3. No other element has to change.

				if (_this.isRendered) {
					return (after !== '' ? function () {
						return UI.getComponent(_this.after).then(function (before) {
							return _this.setRoot(before.root).then(function (child) {
								return new Promise(function(resolve, reject) {
									_this.model().insertAfter(before.model());
									resolve();
								});
							});
						});
					} : function () {
						return _this.parent().then(function (parent) {
							return new Promise(function(resolve, reject) {
								_this.model().insertBefore(parent.model().children().first());
								resolve();
							});
						});
					})().then(function () {
						return _this.parent().then(function (parent) {
							return parent.setChildIndexes();
						})
					});
				} else {
					return Util.ep(_this.after);
				}
			} else {
				return Util.ep(this.after);
			}
		}
		this.setRoot = function (root) {
			var _this = this;
			var currentRoot = (_this.root || 'hook');
			newRoot = (root || currentRoot);

			if (newRoot !== currentRoot) {
				_this.root = newRoot;
				// 1. get the current parent.
				// 2.	remove the child from the current parent.
				// 3. append to new parent model.
				// 4. change the root value.
				// 5. get the new parent.
				// 6. add the child to new parent.
				if (_this.isAddedToParent) {
					return _this.parent().then(function (parent) {
						return parent.removeChild(_this.id);
					}).then(function () {
						return new Promise(function(resolve, reject) {
							_this.root = newRoot;
							if (_this.isRendered) {
								_this.model().appendTo('#{id}'.format({id: newRoot}));
							}
							resolve(newRoot);
						});
					}).then(UI.getComponent).then(function (newParent) {
						return newParent.addChild(_this);
					});
				} else {
					return Util.ep();
				}
			} else {
				_this.root = newRoot;
				return new Promise(function(resolve, reject) {
					resolve(_this.root);
				});
			}
		}
		this.setTemplate = function (template) {
			var currentTemplate = this.template !== undefined ? this.template : UI.templates.div;
			this.template = template !== undefined ? template : currentTemplate;

			if (this.template !== currentTemplate) {
				var _this = this;
				// 1. render empty template element to the DOM.
				// 2. Append all children to the new empty element
				// 3. Remove the old element.

				return _this.renderTemplate().then(function (renderedTemplate) {
					return new Promise(function(resolve, reject) {
						if (_this.isRendered) {
							var model = _this.model();
							model.after(renderedTemplate);
							model.attr('id', 'REMOVE-{id}'.format({id: _this.id}));
						}
						resolve();
					});
				}).then(function () {
					if (_this.isRendered) {
						return Promise.all(_this.children.map(function (child) {
							return new Promise(function(resolve, reject) {
								child.model().appendTo('#{id}'.format({id: _this.id}));
								resolve();
							});
						}));
					}
				}).then(function () {
					if (_this.isRendered) {
						return new Promise(function(resolve, reject) {
							$('#REMOVE-{id}'.format({id: _this.id})).remove();
							resolve();
						});
					}
				});
			} else {
				return this.template;
			}
		}
		this.renderTemplate = function () {
			var _this = this;
			return new Promise(function(resolve, reject) {
				var classes = _this.classes !== undefined ? _this.classes : [];
				var style = _this.style !== undefined ? _this.style : {};
				var properties = _this.properties != undefined ? _this.properties : {};
				var html = _this.html !== undefined ? _this.html : '';
				var renderedTemplate = _this.template.format({
					id: _this.id,
					classes: Util.format.classes(classes),
					style: Util.format.style(style),
					properties: Util.format.properties(properties),
					html: html,
				});
				resolve(renderedTemplate);
			});
		}
		this.setAppearance = function (appearance) {
			var currentClasses = (this.classes || []);

			if (appearance !== undefined) {
				this.properties = (appearance.properties || this.properties);
				this.html = appearance.html !== undefined ? appearance.html : this.html;

				// classes need to be a combination of ones removed and ones added. If "add" and "remove" are not present, defaults to using whole object.
				this.classes = currentClasses;
				var _classes = (appearance.classes || {});

				// _classes can be:
				// 1. 'class' -> implied add
				// 2. {add: 'class'}
				// 3. {remove: 'class'}
				// 4. {add: 'class', remove: 'class'}
				// 5. all of the above but with arrays instead of strings.

				// make defaults arrays
				// {add: undefined, remove: ""}
				_classes.add = _classes.add ? _classes.add : (_classes.remove ? [] : ($.isArray(_classes) ? _classes : []));
				_classes.remove = _classes.remove ? _classes.remove : [];

				// force arrays
				var addClasses = $.isArray(_classes.add) ? _classes.add : [_classes.add];
				var removeClasses = $.isArray(_classes.remove) ? _classes.remove : [_classes.remove];
				var _this = this;

				if (addClasses) {
					_this.classes = _this.classes.concat(addClasses.filter(function (cls) {
						return _this.classes.indexOf(cls) === -1;
					}));
				}

				_this.classes = _this.classes.filter(function (cls) {
					return removeClasses.indexOf(cls) === -1;
				});

				_this.style = (_this.style || {});
				appearance.style = (appearance.style || {});
				var animateable = {};
				var unAnimateable = {};
				var exclude = ['color', 'background-color', 'border-color', 'display', 'border', 'border-top', 'border-bottom', 'border-left', 'border-right'];
				Object.keys(appearance.style).forEach(function (styleKey) {
					let newStyle = appearance.style[styleKey];
					let currentStyle = _this.style[styleKey];

					if (newStyle !== currentStyle) {
						_this.style[styleKey] = newStyle;
						if (exclude.contains(styleKey)) {
							unAnimateable[styleKey] = newStyle;
						} else {
							animateable[styleKey] = newStyle;
						}
					}
				});

				if (_this.isRendered) {

					// model
					var model = _this.model();
					return Promise.all([
						new Promise(function(resolve, reject) {
							// html - this will erase children of the current model
							if (_this.html !== undefined) {
								model.html(_this.html);
							}
							resolve();
						}),
						new Promise(function(resolve, reject) {
							// properties
							if (appearance.properties) {
								Object.keys(_this.properties).forEach(function (property) {
									model.attr(property, _this.properties[property]);
								});
							}
							resolve();
						}),
						model.animate(animateable, 300).promise().then(function () {
							return model.css(unAnimateable).promise().then(function () {
								return Promise.all([
									Promise.all((removeClasses || []).map(function (cls) {
										return new Promise(function(resolve, reject) {
											model.removeClass(cls);
											resolve();
										});
									})),
									Promise.all((addClasses || []).map(function (cls) {
										return new Promise(function(resolve, reject) {
											model.addClass(cls);
											resolve();
										});
									})),
								])
							});
						}),
					]).then(function () {
						return appearance;
					});
				} else {
					return Util.ep(appearance);
				}
			} else {
				return Util.ep();
			}
		}

		// state
		this.setState = function (state) {
			if (state !== undefined) {
				var currentDefaultState = this.defaultState !== undefined ? this.defaultState : {};
				this.defaultState = state.defaultState !== undefined ? state.defaultState : currentDefaultState;
				var _this = this;

				return Promise.all([
					_this.addStates(state.states),
					_this.addStateMap(state.stateMap),
				]);
			}
		}
		this.addStates = function (states) {
			if (states !== undefined) {
				var _this = this;
				return Promise.all(Object.keys(states).map(function (stateName) {
					return _this.addState(stateName, states[stateName]);
				}));
			}
		}
		this.addState = function (stateName, state) {
			// add as new state
			return UI.createState(this, stateName, state);
		}
		this.addStateMap = function (stateMap) {
			var _this = this;
			return new Promise(function(resolve, reject) {
				_this.stateMap = _this.stateMap !== undefined ? _this.stateMap : '';
				_this.stateMap = stateMap !== undefined ? stateMap : _this.stateMap;
				resolve();
			});
		}
		this.mapState = function (stateName) {
			if (typeof this.stateMap === 'string') {
				return this.stateMap;
			} else {
				return this.stateMap[stateName] !== undefined ? this.stateMap[stateName] : '';
			}
		}
		this.triggerState = function () {
			this.state = this.mapState(this.state || UI.globalState);
			return UI.changeState(this.state, this.id);
		}

		// DOM
		this.setBindings = function (bindings) {
			// TODO: later change to accept single value as single function, with the need for 'fn' key.
			var _this = this;
			return new Promise(function(resolve, reject) {
				_this.bindings = _this.bindings !== undefined ? _this.bindings : {};
				if (bindings !== undefined) {
					Object.keys(bindings).forEach(function (name) {
						var binding = bindings[name];
						// if rendered, add to model
						if (_this.isRendered) {
							_this.model().off(name);
							_this.model().on(name, function (event) {
								binding(_this, event);
							});
						} else {
							_this.bindings[name] = binding;
						}
					}, this);
				}
				resolve();
			});
		}
		this.addChild = function (child) {
			var _this = this;
			var index = child.index;
			child.index = (child.index !== undefined ? child.index : _this.children.length);
			if (child.name) {
				_this.cc = _this.cc || {};
				_this.cc[child.name] = child;
			}
			child.isAddedToParent = true;
			_this.children.splice(child.index, 0, child);
			return Util.ep(child);
		}
		this.removeChild = function (id) {
			var _this = this;
			return UI.getComponent(id).then(function (child) {
				_this.children.splice(child.index, 1);
				if (_this.cc && id in _this.cc) {
					delete _this.cc[id];
				}
				return Util.ep(id);
			}).then(UI.removeComponent).then(function () {
				// renumber children
				return _this.setChildIndexes();
			});
		}
		this.removeChildren = function () {
			var _this = this;
			return Promise.ordered(_this.children.map(function (child) {
				return function () {
					return _this.removeChild(child.id);
				}
			}));
		}
		this.setChildren = function (children) {
			var _this = this;
			_this.children = (_this.children || []);
			_this.components = (_this.components || {});
			if (children !== undefined) {
				return Promise.ordered(children.map(function (child) {
					return function () {
						if (child.then !== undefined) { // is an unevaluated promise
							return child.then(function (component) {
								return component.childIndexFromAfter();
							}).then(function (component) {
								return _this.addChild(component);
							}).then(function (final) {
								if (_this.isRendered) {
									final.root = _this.id;
									return final.render();
								} else {
									return final;
								}
							});
						} else {
							return child.childIndexFromAfter().then(function (component) {
								return _this.addChild(component);
							}).then(function (final) {
								if (_this.isRendered) {
									final.root = _this.id;
									return final.render();
								}
							});
						}
					}
				})).then(function () {
					return _this.setChildIndexes();
				});
			} else {
				return _this.children;
			}
		}
		this.setChildIndexes = function () {
			// set index from position in children array
			var _this = this;
			return Promise.all(_this.children.map(function (child, index) {
				return new Promise(function(resolve, reject) {
					child.index = index;
					resolve();
				});
			}));
		}
		this.childIndexFromAfter = function (placementIndex) {
			// find index from after key
			var _this = this;
			if (_this.after) {
				return UI.getComponent(_this.after).then(function (component) {
					return new Promise(function(resolve, reject) {
						_this.index = component !== undefined ? component.index + 1 : 0;
						resolve(_this);
					});
				});
			} else {
				return new Promise(function(resolve, reject) {
					_this.index = (placementIndex || (_this.after === '' ? 0 : undefined));
					resolve(_this);
				});
			}
		}
		this.update = function (args) {
			args = args || {};
			var _this = this;
			return Promise.all([
				// id, root, after, template
				_this.setId(args.id),
				_this.setName(args.name),
				_this.setRoot(args.root),
				_this.setAfter(args.after),
				_this.setTemplate(args.template),
				_this.setAppearance(args.appearance),

				// state
				_this.setState(args.state),

				// bindings
				_this.setBindings(args.bindings),
			]).then(function (results) {
				return _this.setChildren(args.children);
			}).then(function (children) {
				return _this;
			});
		}
		this.removeModel = function () {
			var _this = this;
			_this.model().remove();
			return Util.ep();
		}
		this.model = function (single) {
			if (single) {
				return $(`#${this.id}`)[0];
			} else {
				return $(`#${this.id}`);
			}
		}
		this.element = function () {
			return document.getElementById(this.id);
		}
		this.render = function () {
			var _this = this;
			var root = $('#{id}'.format({id: _this.root}));
			return _this.renderTemplate().then(function (renderedTemplate) {
				return new Promise(function(resolve, reject) {
					if (root.children().length !== 0) {
						if (_this.after !== undefined) {
							if (_this.after) {
								root.children('#{id}'.format({id: _this.after})).after(renderedTemplate); // add as child after 'after'.
							} else {
								root.children().first().before(renderedTemplate); // add as child before first child.
							}
						} else {
							root.children().last().after(renderedTemplate); // add as child after last child.
						}
					} else {
						root.html(renderedTemplate);
					}
					_this.isRendered = true;
					resolve();
				});
			}).then(function () {
				return _this.setBindings(_this.bindings);
			}).then(function () {
				return Promise.ordered(_this.children.sort(function (first, second) {
					return first.index - second.index;
				}).map(function (child) {
					return function () {
						child.root = _this.id;
						return child.render();
					}
				}));
			}).then(function () {
				return _this;
			});
		}
		this.parent = function () {
			return UI.getComponent(this.root);
		}
		this.changeState = function (state) {
			var _this = this;
			_this.state = state.name;

			// run fn
			setTimeout(function () {
				(state.fn || Util.ep)(_this);
			}, 300);

			// 1. Run preFn
			return (state.preFn || Util.ep)(_this).then(function () {
				// 2. Run appearance
				return _this.setAppearance({
					classes: state.classes,
					style: state.style,
					html: state.html,
				});
			});
		}
		this.ccTree = function () {
			var _this = this;
			var tree = {cc_name: _this.name};
			if (_this.cc) {
				Object.keys(_this.cc).forEach(function (key) {
					tree[_this.cc[key].id] = _this.cc[key].cc ? _this.cc[key].ccTree() : _this.cc[key].id;
				});
			}
			return tree;
		}

		// initialise
		this.id = id;
		this.isRendered = false; // establish whether or not the component has been rendered to the DOM.
		this.state = undefined;
	},

	// createComponent
	add: function (component) {
		return new Promise(function(resolve, reject) {
			UI.components[component.id] = component;
			resolve(component);
		});
	},

	createComponent: function (id, args) {
		return new Promise(function(resolve, reject) {
			resolve(new UI.component(id));
		}).then(UI.add).then(function (component) {
			return component.update(args);
		});
	},

	// removeComponent
	remove: function (component) {
		return new Promise(function(resolve, reject) {
			delete UI.components[component.id];
			resolve(component);
		});
	},

	removeComponent: function (id) {
		return UI.getComponent(id).then(function (component) {
			return component.removeChildren().then(function () {
				return component.removeModel();
			}).then(function () {
				return UI.remove(component);
			});
		});
	},

	// app
	app: function (root, children) {
		var id = 'app';
		var args = {
			name: 'app',
			root: root,
			template: UI.template('div'),
			appearance: {
				style: {
					'position': 'absolute',
					'top': '0px',
					'left': '0px',
					'width': '100%',
					'height': '100%',
				},
			},
			children: children,
		};

		return UI.createComponent(id, args);
	},

	// STATES
	states: [],

	// Basic state definition
	state: function (component, name, args) {
		this.component = component;
		this.name = name;

		// args
		this.preFn = args.preFn;
		this.classes = args.classes;
		this.style = args.style;
		this.html = args.html;
		this.fn = args.fn;

		// change
		this.change = function () {
			return this.component.changeState(this);
		}
	},

	// state factory
	createState: function (component, name, args) {
		var _this = this;
		return new Promise(function(resolve, reject) {
			args = args === 'default' ? undefined : args;
			var state = new _this.state(component, name, (args || component.defaultState));
			state.index = _this.states.length - 1; // able to find state again
			_this.states.push(state);
			resolve(state);
		});
	},

	// TEMPLATES
	templates: {
		div: `
			<div id='{id}' class='{classes}' style='{style}' {properties}>
				{html}
			</div>
		`,
		loadingIcon: `
			<div id='{id}' class='ie loading-icon {classes}' style='{style}'>
				<img src='/static/img/loading-icon.gif' />
			</div>
		`,
	},

	template: function (type, initialClass) {
		return `<{type} id='{id}' class='{initialClass}{classes}' style='{style}' {properties}>{html}</{type}>`.format({
			type: type,
			id: '{id}',
			initialClass: initialClass !== undefined ? (initialClass + ' ') : '',
			classes: '{classes}',
			style: '{style}',
			properties: '{properties}',
			html: '{html}',
		});
	},

	// FUNCTIONS
	functions: {
		show: function (style) {
			style = (style || {});
			style['opacity'] = '1.0';
			return function (_this) {
				return _this.setAppearance({classes: {remove: ['hidden']}}).then(function () {
					return _this.setAppearance({style: style});
				});
			}
		},
		hide: function (style) {
			style = (style || {});
			style['opacity'] = '0.0';
			return function (_this) {
				return _this.setAppearance({style: style}).then(function () {
					return _this.setAppearance({classes: {add: ['hidden']}});
				});
			}
		}
	},
}

// CONTEXT
// The Context stores a sample of data from the server. It can be accessed using a path. The same path can access the same data on the server.
var Context = {
	token: undefined,
	// STORE
	// This object stores the entire context and can be set and reset by the Context methods.
	// This contains only data from the server. Any locally created content such as temporary objects
	// is stored in Active.
	context: {},
	progress: {},

	getToken: function () {
		if (Context.token === undefined) {
			return Request('/account/token/').then(function (result) {
				Context.token = result.token;
				return Context.token;
			});
		} else {
			return Util.ep(Context.token);
		}
	},

	permit: function (data) {
		return Context.getToken().then(function (token) {
			data['token'] = token;
			return data;
		});
	},

	// GET
	// This will get from the current store. If it does not exist, a request will be made for it.
	get: function (path, args) {
		// force load from the server?
		var force = ((args || {}).force || false);
		// l(force, (((args || {}).options || {}).data || {}).kwargs);
		var options = ((args || {}).options || {});
		var overwrite = ((args || {}).overwrite || false);
		if (path !== null) {
			return (typeof path !== 'string' ? path : Util.ep)(path).then(function (calculatedPath) {
				calculatedPath = (calculatedPath || '');
				return new Promise(function(resolve, reject) {
					// proceed to get from context object
					context_path = calculatedPath.split('.');
					sub = Context.context;
					if (context_path[0] !== '') {
						for (i=0; i<context_path.length; i++) {
							sub = sub[context_path[i]];
							if (sub === undefined) {
								break;
							}
						}
					} else {
						sub = Object.keys(sub).length !== 0 ? sub : undefined; // empty context
					}
					resolve(sub);
				});
			}).then(function (data) {
				if (data === undefined || force) {
					return Context.load(path, options.data).then(function (data) {
						return Context.set(path, data, overwrite);
					});
				} else {
					return data;
				}
			});
		} else {
			return Util.ep({});
		}
	},

	// Count
	// submits a count request using a similar path to get
	// Does not update context object
	count: function (path, args) {
		// force load from the server?
		var force = ((args || {}).force || false);
		var options = ((args || {}).options || {});
		var overwrite = ((args || {}).overwrite || false);
		return (typeof path !== 'string' ? path : Util.ep)(path).then(function (calculatedPath) {
			calculatedPath = (calculatedPath || '');
			return new Promise(function(resolve, reject) {
				// proceed to get from context object
				context_path = calculatedPath.split('.');
				sub = Context.context;
				if (context_path[0] !== '') {
					for (i=0; i<context_path.length; i++) {
						sub = sub[context_path[i]];
						if (sub === undefined) {
							break;
						}
					}
				} else {
					sub = Object.keys(sub).length !== 0 ? sub : undefined; // empty context
				}
				resolve(sub !== undefined ? Object.keys(sub).length : 0);
			});
		}).then(function (count) {
			if (count === 0 || force) {
				options.data = (options.data || {});
				options.data.count = true;
				return Context.load(path, options.data).then(function (result) {
					return result.count;
				});
			} else {
				return count;
			}
		});
	},

	// The load method gets the requested path from the server if it does not exist locally.
	// This operation can be forced from the get method.
	load: function (path, data) {
		data = (data || {});
		return Context.permit({
			path: path,
			kwargs: (data.kwargs || {}),
			permissions: (data.permissions || {}),
			query: data.query,
			methods: (data.methods || {}),
			limit: data.limit,
			count: (data.count || false),
		}).then(function (request) {
			if (typeof path !== 'string') {
				return path().then(function (calculatedPath) {
					request.path = calculatedPath;
					return Request('/a/', request);
				});
			} else {
				return Request('/a/', request);
			}
		});
	},

	// SET
	// Sets the value of a path in the store. If the value changes, a request is sent to change this piece of data.
	set: function (path, value, overwrite) {
		overwrite = (overwrite || false);
		return (typeof path !== 'string' ? path : Util.ep)(path).then(function (calculatedPath) {
			return new Promise(function (resolve, reject) {
				calculatedPath = (calculatedPath || '');
				context_path = calculatedPath.split('.');
				sub = Context.context;
				if (context_path[0] !== '') {
					for (i=0; i<context_path.length; i++) {
						if (context_path[i] in value) {
							// Follow single path down through object
							value = value[context_path[i]]
						}
						if (i+1 === context_path.length) {
							if (sub[context_path[i]] !== undefined && !overwrite) {
								$.extend(sub[context_path[i]], value);
							} else {
								sub[context_path[i]] = value;
							}
						} else {
							if (sub[context_path[i]] === undefined) {
								sub[context_path[i]] = {};
							}
						}
						sub = sub[context_path[i]];
					}
					resolve(sub);
				} else {
					Context.context = value;
					resolve(Context.context);
				}
			});
		});
	},
}

// ACTIVE
// Active stores temporary variables that need to be synthesized using a series of temporally disconnected events, such as upload.
var Active = {
	active: {},

	// get
	get: function (path) {
		return new Promise(function(resolve, reject) {
			context_path = path.split('.');
			sub = Active.active;
			for (i=0; i<context_path.length; i++) {
				sub = sub[context_path[i]];
				if (sub === undefined) {
					break;
				}
			}

			resolve(sub);
		});
	},

	// set
	set: function (path, value) {
		return new Promise(function(resolve, reject) {
			context_path = path.split('.');
			sub = Active.active;
			for (i=0; i<context_path.length; i++) {
				if (i+1 === context_path.length) {
					sub[context_path[i]] = value;
					break;
				} else {
					if (sub[context_path[i]] === undefined) {
						sub[context_path[i]] = {};
					}
				}
				sub = sub[context_path[i]];
			}
			resolve(sub);
		});
	},
}