var AuthInterfaces = (AuthInterfaces || {});
AuthInterfaces.login = function (id, args) {
  return UI.createComponent((id || 'login'), {
    name: 'login',
    template: UI.template('div', 'ie abs'),
    appearance: {
      style: {
        'height': '100%',
        'width': '100%',
      },
      classes: ['centred-vertically'],
    },
    children: [
      UI.createComponent('l-container', {
        name: 'container',
        template: UI.template('div', 'ie centred'),
        appearance: {
          style: {
            'height': '300px',
            'width': '300px',
          },
        },
        children: [
          Components.search('l-username-field', {
            name: 'username',
            placeholder: 'Username',
            appearance: {
              style: {
                'border-bottom': '0px',
                'border-bottom-right-radius': '0px',
                'border-bottom-left-radius': '0px',
              },
            },
          }),
          Components.search('l-password-field', {
            name: 'password',
            placeholder: 'Password',
            password: true,
            appearance: {
              style: {
                'border-top': '0px',
                'border-top-right-radius': '0px',
                'border-top-left-radius': '0px',
              },
            },
          }),

          // submit
          Components.button('l-submit', {
            name: 'submit',
            value: 'Login',
            appearance: {
              style: {
                'float': 'left',
                'width': '70px',
                'top': '10px',
              },
            },
          }),

          // login link
          Components.button('l-signup', {
            name: 'signup',
            value: 'or sign up',
            appearance: {
              style: {
                'float': 'left',
                'width': '120px',
                'top': '10px',
                'border': '0px',
              },
            },
            state: {
              stateMap: 'signup',
            },
          }),
        ],
      }),
    ],
  }).then(function (_login) {

    var _usernameField = _login.cc.container.cc.username;
    var _passwordField = _login.cc.container.cc.password;

    _login.clearAll = function () {
      return Promise.all([_usernameField, _passwordField].map(function (field) {
        return field.clear().then(function () {
          return field.blur();
        }).then(function () {
          return field.removeError();
        });
      }));
    }
    _login.submit = function () {
      return Promise.all([_usernameField, _passwordField].map(function (field) {
        return field.model().hasClass('error');
      })).then(function (results) {
        var noErrors = results.reduce(function (whole, part) {
          return whole && !part;
        }, true);
        if (noErrors) {
          return Promise.all([_usernameField, _passwordField].map(function (field) {
            return field.getContent();
          })).then(function (results) {
            var [_username, _password] = results;
            var noBlank = results.reduce(function (whole, part) {
              return whole && part !== '';
            }, true);

            if (noBlank) {
              return Request('/login/', {
                username: _username,
                password: _password,
              }).then(function (response) {
                if (response.success) {
                  window.location = '/account/';
                } else {
                  return Promise.all([_usernameField, _passwordField].map(function (field) {
                    return field.error('Invalid');
                  }));
                }
              });
            } else {
              return Promise.all([_usernameField, _passwordField].map(function (field) {
                return field.getContent().then(function (content) {
                  if (content === '') {
                    return field.error('Required');
                  }
                });
              }));
            }
          });
        }
      })
    }

    return Promise.all([
      _login.cc.container.cc.submit.setBindings({
        'click': function (_this) {
          return _login.submit();
        },
      }),

      _login.cc.container.cc.signup.setBindings({
        'click': function (_this) {
          return _this.triggerState();
        },
      }),

      _login.setState({
        defaultState: {
          preFn: UI.functions.hide(),
          fn: function (_this) {
            return _login.clearAll();
          }
        },
        states: {
          'signup': 'default',
          'login': {fn: UI.functions.show()},
          'activation': 'default',
        },
      }),
    ]).then(function () {
      return _login;
    });
  });
}
