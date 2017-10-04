
// initialise
var Components = (Components || {});

// searchable list
Components.searchableList = function (id, args) {
	// SEARCHABLE LIST
	// A combination of the content panel and search input components with an option title.
	// A source can be defined along with a display method, insert/delete, and filter.
	// Optional filter panel

	// default appearance
	args.appearance = (args.appearance || {
		style: {
			'height': '100%',
		},
	})

	return UI.createComponent(id, {
		name: args.name,
		template: UI.template('div', 'ie'),
		appearance: args.appearance,
		children: [
			// title
			UI.createComponent('{id}-title'.format({id: id}), {
				name: 'title',
				template: UI.template('h4', 'ie title'),
				appearance: {
					style: {
						'width': '100%',
						'height': '32px',
						'font-size': '18px',
						'padding-top': '10px',
					},
				},
			}),
			// search filter bar
			UI.createComponent('{id}-search-filter-bar'.format({id: id}), {
				name: 'searchFilterBar',
				template: UI.template('div', 'ie'),
				appearance: {
					style: {
						'width': '100%',
						'height': '40px',
					},
				},
				children: [
					// search input
					Components.search('{id}-search'.format({id: id}), {name: 'search'}),

					// filter button

				],
			}),

			// list
			Components.contentPanel('{id}-list'.format({id: id}), {
				name: 'list',
				appearance: {
					style: {
						'width': '100%',
						'height': '100%',
					},
				},
				children: args.children,
			}),

			// filter
			Components.contentPanel('{id}-filter'.format({id: id}), {
				name: 'filter',
				appearance: {
					style: {
						'width': '100%',
						'height': '100%',
					},
					classes: ['hidden'],
				},
			}),
		],
	}).then(function (base) {

		// storage
		base.search = base.cc.searchFilterBar.cc.search;
		base.data = {
			// variables
			limit: undefined,
			previousQuery: '',
			query: '',
			filter: '',
			lock: false,
			reset: false,

			// actual datasets
			storage: {
				dataset: {},
				subset: {},
				virtual: {
					list: [],
					rendered: [],
				},
				queries: [],
				filters: {},
				defaultfilters: [],
			},

			// methods
			idgen: function (id) {
				return '{base}_{id}'.format({base: base.id, id: id});
			},
			defaultSort: function (d1, d2) {
				// sort by usage
				if (d1.usage && d2.usage) {
					if (d1.usage > d2.usage) {
						return 1;
					} else if (d1.usage < d2.usage) {
						return -1;
					}
				}

				// then alphabetically
				if (d1.main.toLowerCase() > d2.main.toLowerCase()) {
					return 1;
				} else {
					return -1;
				}
			},
			load: {
				source: function (path, options) {
					return Context.get(path, options);
				},
				kwargs: function (target, query) {
					var kwargs = target.filter ? (target.filter.request ? target.filter.kwargs(query) : {}) : {};
					return Util.ep(kwargs);
				},
				get: function () {
					// this looks at the Context.get and Context.get:force, separately.
					if (base.data.reset) {
						base.data.storage.dataset = {};
						base.data.storage.subset = {};
						base.data.storage.queries = [];
						base.data.reset = false;
					}

					// Load each target
					return Promise.all(base.targets.map(function (target) {
						target.queries = (target.queries || []);
						return base.data.load.kwargs(target, base.data.query).then(function (kwargs) {
							return Promise.all([
								base.data.load.source((target.resolvedPath || target.path), {options: {kwargs: kwargs}}).then(target.process).then(base.data.load.append).then(base.data.display.main),

								// add one second delay before searching the server. Only do if query is the same as it was 1 sec ago.
								// Also, only query if this query has never been queried before
								(!target.queries.contains(base.data.query) ? function () {
									target.queries.push(base.data.query);
									return new Promise(function(resolve, reject) {
										var queryAtStart = base.data.query;
										setTimeout(function () {
											resolve(queryAtStart === base.data.query && base.data.query !== '');
										}, 300);
									}).then(function (timeout) {
										if (timeout) {
											return base.data.load.source((target.resolvedPath || target.path), {options: {kwargs: kwargs}, force: true}).then(target.process).then(base.data.load.append).then(base.data.display.main);
										} else {
											return Util.ep();
										}
									});
								} : Util.ep)(),
							]);
						});
					}));
				},
				append: function (data) {
					// Add to dataset. Nothing is ever removed.
					return Promise.all(data.map(function (datum) {
						return new Promise(function(resolve, reject) {
							base.data.storage.dataset[datum.id] = datum;
							resolve();
						});
					}));
				},
			},
			display: {
				main: function () {
					// 1. filter the current dataset
					return base.data.display.filter.main().then(function () {
						// 2. render the current dataset
						return base.data.display.render.main();
					});
				},
				filter: {
					main: function () {
						// 1. remove non matching in subset
						return base.data.display.filter.out().then(function () {

							// 2. filter dataset to produce new subset
							return base.data.display.filter.in();
						});
					},
					condition: function (datum) {

						// Here, the lack of matching query and the global autocomplete mode can be overridden by base.data.autocompleteOverride.
						// For the null query, the override only diplays everything if the query is still null, then is more specific when something is typed.
						if (datum && datum.main) {
							var conditions = [
								(datum.rule === base.data.filter || base.data.filter === ''), // filter matches or no filter

								(
									(
										// lower case query match at beginning
										datum.main.toLowerCase().indexOf(base.data.query.toLowerCase()) !== -1
										&&
										base.data.query.toLowerCase() !== ''
									)
									||
									(
										// allow autocomplete mode to display everything
										(base.data.autocompleteOverride || !base.autocomplete || false)
										&&
										base.data.query === ''
									)
								),

								// TODO: THESE CONDITIONS NEED TO BE OVERHAULED

								(!base.autocomplete || (base.autocomplete && base.data.query !== '') || (base.data.autocompleteOverride || false)), // autocomplete mode or no query
								datum.id in base.data.storage.dataset, // datum is currently in dataset (prevent bleed over from change of dataset)
							];

							return Util.ep(conditions.reduce(function (a,b) {
								return a && b;
							}));
						} else {
							return Util.ep(false);
						}
					},
					out: function () {
						return Promise.all(base.data.storage.virtual.list.map(function (datum, index) {
							datum.index = index;
							return base.data.display.filter.condition(datum).then(function (condition) {
								if (!condition) {
									base.data.storage.virtual.list.splice(datum.index, 1);
									delete base.data.storage.subset[datum.id]; // remove from filtered data
								}
								return Util.ep();
							})
						}));
					},
					in: function () {
						return Promise.all(Object.keys(base.data.storage.dataset).map(function (key) {
							var datum = base.data.storage.dataset[key];
							return base.data.display.filter.condition(datum).then(function (condition) {
								if (condition) {
									base.data.storage.subset[key] = datum;
								}
								return Util.ep();
							});
						}));
					},
				},
				render: {
					main: function () {
						return base.data.display.render.virtual().then(function () {
							return base.data.display.render.sort();
						}).then(function () {
							// for each item in the list, generate a new list item and add to it using the setMetadata function.
							// Never remove a list item, simply make it display:none if the end of the list is reached.
							var virtualList = base.data.limit ? base.data.storage.virtual.list.slice(0, base.data.limit) : base.data.storage.virtual.list;
							return Promise.ordered(virtualList.map(function (datum, index) {
								return function () {
									if (index < base.data.storage.virtual.rendered.length) {
										// element already exists. Update using info in datum.
										// NO RETURN: releases promise immediately. No need to wait for order if one exists.
										UI.getComponent(base.data.storage.virtual.rendered[index]).then(function (existingListItem) {
											return existingListItem.updateMetadata(datum, base.data.query.toLowerCase());
										}).then(function () {
											if (base.currentIndex === undefined) {
												return base.control.setActive.main({index: 0});
											} else {
												return Util.ep();
											}
										});
									} else {
										if (!base.lock) {
											base.lock = true;
											// element does not exist. Create using info in datum.
											return base.unit(index).then(function (newListItem) {
												return newListItem.updateMetadata(datum, base.data.query.toLowerCase()).then(function () {
													base.data.storage.virtual.rendered.push(newListItem.id);
													return base.cc.list.cc.wrapper.setChildren([newListItem]);
												});
											}).then(function () {
												base.lock = false;
												return Util.ep();
											});
										} else {
											return Util.ep();
										}
									}
								}
							})).then(function () {
								// hide anything that does not contain something to display
								return Promise.all(base.data.storage.virtual.rendered.slice(virtualList.length).map(function (listItemId) {
									return UI.getComponent(listItemId).then(function (listItem) {
										return listItem.hide();
									});
								}));
							})
						}).then(function () {
							return base.data.display.render.setMetadata();
						});
					},
					virtual: function () {
						base.data.storage.virtual.list = Object.keys(base.data.storage.subset).map(function (key) {
							return base.data.storage.subset[key];
						});
						if (!base.data.preventIncomplete && base.data.query && !base.data.exactMatch) {
							base.data.storage.virtual.list.unshift({
								main: base.data.query.toLowerCase(),
								rule: 'word',
							});
						}
						return Util.ep();
					},
					sort: function () {
						base.data.storage.virtual.list.sort((base.sort || base.data.defaultSort));
						return Util.ep();
					},
					setMetadata: function () {
						var _this = base;
						var query = _this.data.query; // query is set no matter the status of virtual

						// reset previous query and check for change
						var changeQuery = false;
						if (query !== _this.data.previousQuery) {
							_this.data.previousQuery = query;
							changeQuery = true;
						}
						if (!_this.data.storage.virtual.list.length) {
							_this.currentIndex = undefined;
							return _this.cc.searchFilterBar.cc.search.setMetadata({query: query, complete: '', type: '', tokens: []});
						} else {
							var complete = (_this.data.storage.virtual.list[_this.currentIndex] || {}).main;
							var type = (_this.data.storage.virtual.list[_this.currentIndex] || {}).rule;
							var tokens = ((_this.data.storage.virtual.list[_this.currentIndex] || {}).tokens || []);
							if (_this.currentIndex >= _this.data.storage.virtual.list.length || changeQuery) {
								return _this.control.setActive.main({index: 0}).then(function () {
									return _this.cc.searchFilterBar.cc.search.setMetadata({query: query, complete: complete, type: type, tokens: tokens});
								});
							} else {
								return _this.cc.searchFilterBar.cc.search.setMetadata({query: query, complete: complete, type: type, tokens: tokens});
							}
						}
					},
				},
			},
		}

		// actions
		base.control = {
			// global control
			setup: {
				main: function () {
					return base.control.setup.resolvePaths().then(function () {
						if (!base.data.isSetup) {
							return Promise.all([
								base.control.setup.renderUntilDefaultLimit(),
								base.control.setup.extractFilters(),
							]).then(function () {
								base.data.isSetup = true;
								return base.control.start();
							});
						} else {
							return base.control.reset();
						}
					});
				},
				resolvePaths: function () {
					return Promise.all(base.targets.map(function (target) {
						return target.path().then(function (path) {
							target.resolvedPath = path; // this is recalculated every time
							target.queries = [];
						});
					}));
				},
				renderUntilDefaultLimit: function () {
					if (base.data.storage.virtual.rendered.length === 0) {
						return Promise.ordered(Array.range((base.data.limit || 10)).map(function (index) {
							return function () {
								return base.unit(index).then(function (newListItem) {
									base.data.storage.virtual.rendered.push(newListItem.id);
									return newListItem.hide().then(function () {
										return base.cc.list.cc.wrapper.setChildren([newListItem]);
									});
								});
							}
						}));
					} else {
						return Util.ep();
					}
				},
				extractFilters: function () {
					// filters
					if (Util.isEmptyObject(base.data.storage.filters)) {
						return Promise.ordered(base.targets.map(function (target) {

							return function () {
								// add to filters and default filters
								if (target.filter) {
									base.data.storage.filters[target.filter.rule] = target.filter;
									if (target.filter.default) {
										base.data.storage.defaultfilters.push(target.filter.rule);
									}

									// create filter unit and add to list
									return base.defaultFilterUnit('{filterid}-{rule}'.format({filterid: base.cc.filter.id, rule: target.filter.rule}), target.filter).then(function (filterUnit) {
										// bindings
										return filterUnit.setBindings({
											'click': function (_this) {
												if (base.data.filter === target.filter.rule) {
													base.control.setFilter();
												} else {
													base.control.setFilter(target.filter.rule);
												}
											},
										}).then(function () {
											base.cc.filter.cc.wrapper.setChildren([filterUnit]);
										});
									}).then(function () {
										Mousetrap.bind(target.filter.char, function (event) {
											event.preventDefault();
											if (base.isFocused) {
												if (base.data.filter === target.filter.rule) {
													base.control.setFilter();
												} else {
													base.control.setFilter(target.filter.rule);
												}
											}
										});
										return Util.ep();
									});
								} else {
									return Util.ep();
								}
							}
						}));
					} else {
						return Util.ep();
					}
				},
			},
			reset: function () {
				base.data.reset = true;
				return base.control.update({query: '', filter: ''}).then(function () {
					return base.search.clear();
				}).then(function () {
					return base.search.input();
				});
			},
			update: function (data, defaults) {
				// apply changes
				base.data.query = (((data || {}).query !== undefined ? (data || {}).query : base.data.query) || ((defaults || {}).query || ''));
				base.data.filter = (((data || {}).filter || base.data.filter) || ((defaults || {}).filter || ''));
				return Util.ep();
			},
			start: function () {
				return base.data.load.get();
			},

			// element control
			setFilter: function (rule) {
				// 0. update data filter
				base.data.filter = rule;
				if (rule in base.data.storage.filters) {
					base.data.limit = base.data.storage.filters[rule].limit !== 0 ? (base.data.storage.filters[rule].limit !== undefined ? base.data.storage.filters[rule].limit : base.data.limit) : undefined;
					base.data.autocompleteOverride = base.data.storage.filters[rule].autocompleteOverride;
					base.data.preventIncomplete = base.data.storage.filters[rule].preventIncomplete;
				} else {
					base.data.limit = base.defaultLimit;
					base.data.autocompleteOverride = undefined;
					base.data.preventIncomplete = false;
				}

				// 1. update search
				base.search.filterString = rule ? base.data.storage.filters[rule].input : undefined;
				return Promise.all([
					// 2. update data
					base.control.update({filter: (rule || '')}),

					// 3. update filter button
					base.cc.searchFilterBar.cc.filterButton.setContent(rule ? base.data.storage.filters[rule].char : undefined),

					// 4. search
					base.search.setMetadata(),
				]).then(function () {
					return base.control.start();
				}).then(function () {
					if (base.data.storage.filters[rule]) {
						return (base.data.storage.filters[rule].activate || Util.ep)();
					} else {
						return Util.ep();
					}
				}).then(function () {
					return base.control.setActive.main({index: 0});
				});
			},
			setActive: {
				main: function (options) {
					options = (options || {});

					// if there are any results
					if (base.data.storage.virtual.rendered.length && base.isFocused) {

						// changes
						var previousIndex = base.currentIndex;
						base.currentIndex = (options.index !== undefined ? options.index : undefined || ((base.currentIndex || 0) + (base.currentIndex !== undefined ? (options.increment || 0) : 0)));

						// boundary conditions
						var max = (base.data.limit !== undefined ? (base.data.limit > base.data.storage.virtual.list.length ? base.data.storage.virtual.list.length : base.data.limit) : base.data.storage.virtual.list.length) - 1;
						base.currentIndex = base.currentIndex > max ? max : (base.currentIndex < 0 ? 0 : base.currentIndex);

						if (base.currentIndex !== previousIndex) {
							return base.control.setActive.set();
						} else {
							return Util.ep();
						}
					} else {
						return Util.ep();
					}
				},
				set: function () {
					return base.control.deactivate().then(function () {
						return UI.getComponent(base.data.storage.virtual.rendered[base.currentIndex]).then(function (activeListItem) {
							base.active = activeListItem;
							if (base.active) {
								return base.active.activate().then(function () {
									return base.data.display.render.setMetadata();
								});
							} else {
								return Util.ep();
							}
						})
					});
				},
			},
			deactivate: function () {
				return ((base.active || {}).deactivate || Util.ep)().then(function () {
					return new Promise(function(resolve, reject) {
						base.active = undefined;
						resolve();
					});
				});
			},
		}

		// list item formatting
		base.unitStyle = {
			apply: function () {
				return base.unitStyle.base().then(function () {
					return Promise.all(base.targets.map(function (target) {
						return base.unitStyle.set(target);
					}));
				});
			},
			set: function (target) {
				return (target.setStyle || base.unitStyle.default(target))();
			},
			base: function () {
				// base class
				jss.set('#{id} .base'.format({id: base.id}), {
					'height': '30px',
					'width': '100%',
					'padding': '0px',
					'padding-left': '10px',
					'text-align': 'left',
				});
				jss.set('#{id} .base.active'.format({id: base.id}), {
					'background-color': 'rgba(255,255,255,0.1)'
				});
				return Util.ep();
			},
			default: function (target) {
				return function () {
					jss.set('#{id} .{type}'.format({id: base.id, type: target.name}), {
						'background-color': 'transparent',
					});
					jss.set('#{id} .base.{type}.active'.format({id: base.id, type: target.name}), {
						'background-color': '#eee',
					});
					return Util.ep();
				}
			},
		}
		base.defaultFilterUnit = function (id, filterArgs) {
			return UI.createComponent('{id}'.format({id: id}), {
				name: 'filter',
				template: UI.template('div', 'ie'),
				appearance: {
					style: {
						'height': '60px',
						'width': '100%',
						'border-bottom': '1px solid #ccc',
					},
				},
				children: [
					UI.createComponent('{id}-title-description-bar'.format({id: id}), {
						name: 'titleDescriptionBar',
						template: UI.template('div', 'ie'),
						appearance: {
							style: {
								'float': 'left',
								'height': '100%',
								'width': 'calc(100% - 30px)',
							},
						},
						children: [
							UI.createComponent('{id}-title'.format({id: id}), {
								name: 'title',
								template: UI.template('div', 'ie'),
								appearance: {
									style: {
										'float': 'left',
										'width': '100%',
									},
									html: filterArgs.input,
								},
							}),
							UI.createComponent('{id}-description'.format({id: id}), {
								name: 'description',
								template: UI.template('div', 'ie'),
								appearance: {
									style: {
										'float': 'left',
										'width': '100%',
									},
									html: filterArgs.blurb,
								},
							}),
						],
					}),
					UI.createComponent('{id}-button'.format({id: id}), {
						name: 'button',
						template: UI.template('div', 'ie button border border-radius'),
						appearance: {
							style: {
								'float': 'left',
								'width': '28px',
								'height': '28px',
								'padding-top': '4px',
								'top': '5px',
								'right': '5px',
							},
						},
						children: [
							UI.createComponent('{id}-button-content'.format({id: id}), {
								name: 'content',
								template: UI.template('span', 'ie'),
								appearance: {
									html: filterArgs.char,
								},
							}),
						],
					}),
				],
			});
		}

		// list methods
		base.next = function () {
			return base.control.setActive.main({increment: 1});
		}
		base.previous = function () {
			return base.control.setActive.main({increment: -1});
		}

		// search methods
		base.search.focus = function (position) {
			if (!base.search.isFocused) {
				base.search.isFocused = true;
				base.isFocused = true;
				return Promise.all([
					base.search.setCaretPosition(position),
					base.search.input(),
				]);
			} else {
				return Util.ep();
			}
		}
		base.search.blur = function () {
			base.search.isFocused = false;
			base.isFocused = true;
			return base.search.getContent().then(function (content) {
				return base.search.cc.tail.setAppearance({html: (content || base.search.placeholder)});
			});
		}
		base.search.input = function () {
			return base.search.getContent().then(function (content) {
				return base.control.update({query: content}).then(function () {
					return base.control.start();
				});
			});
		}
		base.setSearch = function (options) {
			options.mode = (options.mode || 'on');
			options.placeholder = (options.placeholder || 'search...');
			base.data.limit = options.limit;
			base.defaultLimit = base.data.limit;
			base.autocomplete = (options.autocomplete || false);

			base.search.placeholder = options.placeholder;
			return base.cc.searchFilterBar.setAppearance({classes: {add: (options.mode === 'off' ? ['hidden'] : [])}}).then(function () {
				return base.search.cc.tail.setAppearance({html: options.placeholder});
			}).then(function () {
				if (options.mode !== 'off') {
					return Promise.all([
						base.cc.list.setAppearance({style: {'height': 'calc(100% - 40px)'}}),
						base.cc.filter.setAppearance({style: {'height': 'calc(100% - 40px)'}}),
					]);
				} else {
					return Util.ep();
				}
			});
		}
		base.focus = function () {
			base.search.cc.input.model().focus();
			return Util.ep();
		}

		// title methods
		base.setTitle = function (options) {
			options = (options || {});
			if (options.text) {
				options.style = (options.style || {});
				if (options.center) {
					options.style['text-align'] = 'center';
				}
				return base.cc.title.setAppearance({
					html: options.text,
					style: options.style,
				});
			} else {
				return base.cc.title.setAppearance({
					style: {
						'display': 'none',
					}
				});
			}
		}

		// behaviours
		base.behaviours = {
			up: function () {
				return base.previous();
			},
			down: function () {
				return base.next();
			},
			left: function () {
				return base.search.behaviours.left();
			},
			right: function () {
				return base.search.behaviours.right();
			},
			number: function (char) {
				var index = parseInt(char);
				if (index < base.data.storage.virtual.rendered.length) {
					return base.control.setActive.main({index: index}).then(function () {
						// don't know what behaviour to have here
						return base.search.behaviours.right();

						// Maybe do this
						// return base.search.behaviours.enter();
					});
				}
			},
			enter: function () {
				return base.search.behaviours.enter();
			},
			backspace: function () {
				return base.search.behaviours.backspace();
			},
		}

		// complete promises.
		return Promise.all([

		]).then(function () {
			return base;
		});
	});
}
