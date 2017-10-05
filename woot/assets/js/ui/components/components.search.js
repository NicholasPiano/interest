// initialise
var Components = (Components || {});

// search
Components.search = function (id, args) {
  // SEARCH INPUT
  // Formatted input field with events for input and key presses.

  // BUGS:
  // 1. Head does not match input when there is whitespace.

  // config
  args.appearance = (args.appearance || {
    style: {
      'width': '100%',
      'height': '40px',
    },
  });

  return UI.createComponent('{id}'.format({id: id}), {
    name: args.name,
    template: UI.template('div', 'ie input border border-radius'),
    appearance: args.appearance,
    children: [

      // input
      UI.createComponent('{id}-input'.format({id: id}), {
        name: 'input',
        template: UI.template('div', 'ie head mousetrap'),
        appearance: {
          properties: {
            'contenteditable': 'true',
            'spellcheck': 'false',
          },
          style: {
            '-webkit-text-fill-color': 'transparent',
          },
        },
      }),

      // head
      UI.createComponent('{id}-head'.format({id: id}), {
        name: 'head',
        template: UI.template('div', 'ie head'),
      }),

      // tail
      UI.createComponent('{id}-tail'.format({id: id}), {
        name: 'tail',
        template: UI.template('div', 'ie tail'),
        appearance: {
          html: args.placeholder,
        },
      }),

      // space
      UI.createComponent('{id}-space'.format({id: id}), {
        name: 'space',
        template: UI.template('div', 'ie tail'),
        appearance: {
          html: '&nbsp;',
        },
      }),

      // error
      UI.createComponent('{id}-error'.format({id: id}), {
        name: 'error',
        template: UI.template('div', 'ie hidden abs border border-radius centred-vertically'),
        appearance: {
          style: {
            'right': '5px',
            'height': 'calc(100% - 10px)',
            'width': 'auto',
            'font-size': '12px',
            'padding': '5px',
            'background-color': 'palevioletred',
            'border-color': 'red',
            'color': '#fff',
          },
        },
      }),
    ],
  }).then(function (base) {
    // variables
    base.password = args.password;
    base.placeholder = args.placeholder;
    base.isFocused = false;

    // logic, bindings, etc.
    base.setMetadata = function (metadata) {
      metadata = (metadata || {});
      base.metadata = (base.metadata || {});
      base.metadata.query = metadata.query !== undefined ? metadata.query : (base.metadata.query || '');
      base.metadata.complete = metadata.complete !== undefined ? metadata.complete : base.metadata.query;
      base.metadata.combined = base.metadata.query + base.metadata.complete.substring(base.metadata.query.length);

      var query = base.password ? base.metadata.query.replace(/\w/gi, '*') : base.metadata.query;
      var complete = base.password ? base.metadata.complete.replace(/\w/gi, '*') : base.metadata.complete;
      var combined = base.password ? base.metadata.combined.replace(/\w/gi, '*') : base.metadata.combined;

      return Promise.all([
        base.cc.tail.setAppearance({html: ((base.isComplete ? complete : '') || combined || query || base.filterString || base.placeholder || '')}).then(function () {
          base.isComplete = false;
          return Util.ep();
        }),
        base.cc.head.setAppearance({html: query}),
      ]);
    }
    base.isCaretInPosition = function (mode) {
      mode = (mode || 'end');
      // determine caret position after an action. Only important thing is whether or not it is at the end.
      var selection = window.getSelection();
      var caretInPosition = false;
      if (base.isFocused && base.cc.input.element() === selection.focusNode.parentNode) { // is the selection inside
        var range = selection.getRangeAt(0); // get the only range
        if (mode === 'end') {
          caretInPosition = range.endOffset === selection.focusNode.length; // check the offset == the node value length
        } else if (mode === 'start') {
          caretInPosition = range.endOffset === 0; // or 0
        }
      } else if (base.cc.input.element() === selection.focusNode) {
        caretInPosition = true;
      }
      return caretInPosition;
    }
    base.setCaretPosition = function (position) {
      position = (position || 'end');

      // set position
      var maxLength = base.cc.input.model().text().length;
      var limits = {'start': 0, 'end': maxLength};
      position = position in limits ? limits[position] : position;

      // boundary conditions
      position = position > maxLength ? maxLength : (position < 0 ? 0 : position);

      // set the caret position to the end or the beginning
      if (position !== undefined) {
        var range = document.createRange(); // Create a range (a range is a like the selection but invisible)
        var lm = base.cc.input.element();
        range.setStart(lm.childNodes.length ? lm.firstChild : lm, position);
        var selection = window.getSelection(); // get the selection object (allows you to change selection)
        selection.removeAllRanges(); // remove any selections already made
        selection.addRange(range); // make the range you have just created the visible selection
      }

      return Util.ep();
    }
    base.complete = function () {
      base.completeQuery = ((base.metadata || {}).complete || '');
      if (base.completeQuery !== base.metadata.query) {
        base.isComplete = true;
        base.metadata.query = base.completeQuery;
        return base.cc.tail.setAppearance({html: base.completeQuery}).then(function () {
          return base.cc.head.setAppearance({html: base.completeQuery});
        }).then(function () {
          return base.setCaretPosition('end');
        });
      } else {
        return Util.ep();
      }
    }
    base.focus = function (position) {
      if (!base.isFocused) {
        base.isFocused = true;
        return base.setCaretPosition(position);
      } else {
        return Util.ep();
      }
    }
    base.blur = function () {
      base.isFocused = false;
      return base.getContent().then(function (content) {
        content = base.password ? content.replace(/\w/gi, '*') : content;
        return base.cc.tail.setAppearance({html: (content || base.placeholder)});
      });
    }
    base.clear = function () {
      return Promise.all([
        base.cc.input.setAppearance({html: ''}),
        base.cc.head.setAppearance({html: ''}),
        base.cc.tail.setAppearance({html: base.placeholder})
      ])
    }
    base.getContent = function () {
      // also replaces generic whitespace, including char160/&nbsp;, with a space character.
      return Util.ep(base.cc.input.model().text().replace(/\s+/gi, ' '));
    }
    base.setContent = function (metadata) {
      return base.cc.input.setAppearance({html: (metadata.query || '').replace(/\s+/gi, ' ')}).then(function () {
        if (metadata.trigger) {
          return base.input();
        } else {
          return base.setMetadata(metadata);
        }
      });
    }
    base.input = function () {
      return base.getContent().then(function (content) {
        return base.setMetadata({query: content});
      });
    }
    base.error = function (text) {
      return Promise.all([
        base.setAppearance({classes: {add: 'error'}}),
        base.cc.error.setAppearance({classes: {remove: 'hidden'}, html: text}),
      ]);
    }
    base.removeError = function () {
      return Promise.all([
        base.setAppearance({classes: {remove: 'error'}}),
        base.cc.error.setAppearance({classes: {add: 'hidden'}, html: ''}),
      ]);
    }

    // behaviours
    base.behaviours = {
      right: function () {
        if (!base.isComplete && base.isCaretInPosition('end')) {
          return base.complete().then(function () {
            return base.input();
          });
        } else {
          return Util.ep();
        }
      },
      left: function () {

      },
      enter: function () {

      },
      backspace: function () {

      },
      click: function () {

      }
    }

    // complete promises.
    return Promise.all([
      base.setBindings({
        'click': function (_this) {
          event.stopPropagation();
          return base.focus('end');
        }
      }),
      base.cc.input.setBindings({
        'paste': function (_this, event) {
          // cancel paste
          event.preventDefault();

          // get text representation of clipboard
          var text = (event.originalEvent || event).clipboardData.getData('text/plain');

          // insert text manually
          document.execCommand('insertHTML', false, text);
        },
        'input': function (_this) {
          return Promise.all([
            base.input(),
            base.removeError(),
          ]);
        },
        'focus': function (_this) {
          return base.focus();
        },
        'blur': function (_this) {
          return base.blur();
        },
        'click': function (_this, event) {
          event.stopPropagation();
          return base.focus();
        },
      }),
    ]).then(function () {
      return base;
    });
  });
}
