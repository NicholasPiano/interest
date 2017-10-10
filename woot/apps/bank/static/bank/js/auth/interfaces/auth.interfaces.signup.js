
var AuthInterfaces = (AuthInterfaces || {});
AuthInterfaces.signup = function (id, args) {
  return UI.createComponent((id || 'signup'), {
    name: 'signup',
    template: UI.template('div', 'ie abs hidden'),
    appearance: {
      style: {
        'height': '100%',
        'width': '100%',
      },
      classes: ['centred-vertically'],
    },
    children: [
      UI.createComponent('s-container', {
        name: 'container',
        template: UI.template('div', 'ie centred'),
        appearance: {
          style: {
            'height': '600px',
            'width': '450px',
          },
        },
        children: [
          // user details
          Components.text('s-user-details', {
            name: 'userDetails',
            title: 'User details',
            value: 'This information will be used to contact you and identify you to other users with which you share data.',
          }),
          Components.search('s-first-name-field', {
            name: 'firstNameField',
            placeholder: 'First name',
            appearance: {
              style: {
                'float': 'left',
                'width': '220px',
              },
            },
          }),
          Components.search('s-last-name-field', {
            name: 'lastNameField',
            placeholder: 'Last name',
            appearance: {
              style: {
                'float': 'left',
                'width': '220px',
                'left': '10px',
              },
            },
          }),
          Components.search('s-email-field', {
            name: 'emailField',
            placeholder: 'Email',
            appearance: {
              style: {
                'margin-top': '50px',
              },
            },
          }),
          AuthComponents.roles.main(),

          // authentication
          Components.text('s-authentication', {
            name: 'authentication',
            title: 'Authentication',
            value: 'This information is used to identify you on the system and allows you to track your activity',
          }),
          Components.search('s-username-field', {
            name: 'usernameField',
            placeholder: 'Username',
          }),
          Components.search('s-password-field', {
            name: 'passwordField',
            placeholder: 'Password',
            password: true,
            appearance: {
              style: {
                'margin-top': '10px',
              },
            },
          }),
          Components.search('s-reenter-password-field', {
            name: 'reenterPasswordField',
            placeholder: 'Re-enter password',
            password: true,
            appearance: {
              style: {
                'margin-top': '10px',
              },
            },
          }),

          // submit
          Components.button('s-submit', {
            name: 'submit',
            value: 'Sign up',
            appearance: {
              style: {
                'float': 'left',
                'width': '90px',
                'top': '10px',
              },
            },
          }),

          // login link
          Components.button('s-login', {
            name: 'login',
            value: 'or login',
            appearance: {
              style: {
                'float': 'left',
                'width': '100px',
                'top': '10px',
                'border': '0px',
              },
            },
            state: {
              stateMap: 'login',
            },
          }),

          // progress
          UI.createComponent('s-progress', {
            name: 'progress',
            template: UI.template('div', 'ie border border-radius hidden'),
            appearance: {
              style: {
                'top': '10px',
                'height': '40px',
                'width': '100px',
              },
            },
          }),
        ],
      }),
    ],
  }).then(function (_signup) {

    var _firstNameField = _signup.cc.container.cc.firstNameField;
    var _lastNameField = _signup.cc.container.cc.lastNameField;
    var _emailField = _signup.cc.container.cc.emailField;
    var _rolesField = _signup.cc.container.cc.roles;
    var _usernameField = _signup.cc.container.cc.usernameField;
    var _passwordField = _signup.cc.container.cc.passwordField;
    var _reenterPasswordField = _signup.cc.container.cc.reenterPasswordField;

    _signup.clearAll = function () {
      return Promise.all([_firstNameField, _lastNameField, _emailField, _usernameField, _passwordField, _reenterPasswordField].map(function (field) {
        return field.clear().then(function () {
          return field.blur();
        }).then(function () {
          return field.removeError();
        });
      })).then(function () {
        return _rolesField.clear();
      });
    }
    _signup.submit = function () {
      return Promise.all([_emailField, _usernameField, _reenterPasswordField].map(function (field) {
        return field.model().hasClass('error');
      })).then(function (results) {
        var noErrors = results.reduce(function (whole, part) {
          return whole && !part;
        }, true);
        if (noErrors) {
          return Promise.all([_firstNameField, _lastNameField, _emailField, _rolesField, _usernameField, _passwordField].map(function (field) {
            return field.getContent();
          })).then(function (results) {
            var [_first, _last, _email, _roles, _username, _password] = results;
            var noBlank = results.reduce(function (whole, part) {
              return whole && part !== '';
            }, true);

            if (noBlank) {
              _signup.data = {
                first: _first,
                last: _last,
                email: _email,
                is_manager: _roles.is_manager,
                is_admin: _roles.is_admin,
                username: _username,
                password: _password,
              }
              return Promise.all([
                Active.set('signup.data', _signup.data).then(function () {
                  return UI.changeState('signup.pending');
                }),
                Context.get('user', {options: {data: {create: _signup.data}}}).then(function (user) {
                  var key = Object.keys(user)[0];
                  return Active.set('signup.key', user[key].activation_email_key);
                }),
              ]).then(function () {
                return UI.changeState('activation');
              });
            } else {
              return Promise.all([_firstNameField, _lastNameField, _emailField, _usernameField, _passwordField, _reenterPasswordField].map(function (field) {
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

    // emailField
    _emailField.blur = function () {
      _emailField.isFocused = false;
      return _emailField.getContent().then(function (content) {
        return _emailField.cc.tail.setAppearance({html: (content || _emailField.placeholder)}).then(function () {
          return Context.count('user', {options: {data: {kwargs: {'email': content}}}}).then(function (count) {
              if (count > 0) {
                // clearly mark username field
                return _emailField.error('Email exists');
              } else {
                // remove error
                return _emailField.removeError();
              }
          });
        });
      });
    }

    // usernameField
    _usernameField.blur = function () {
      _usernameField.isFocused = false;
      return _usernameField.getContent().then(function (content) {
        return _usernameField.cc.tail.setAppearance({html: (content || _usernameField.placeholder)}).then(function () {
          return Context.count('user', {options: {data: {kwargs: {'username': content}}}}).then(function (count) {
              if (count > 0) {
                // clearly mark username field
                return _usernameField.error('Username exists');
              } else {
                // remove error
                return _usernameField.removeError();
              }
          });
        });
      });
    }

    // reenterPasswordField
    _passwordField.blur = function () {
      _passwordField.isFocused = false;
      return _passwordField.getContent().then(function (content) {
        var display = _passwordField.password ? content.replace(/\w/gi, '*') : content;
        return _passwordField.cc.tail.setAppearance({html: (display || _passwordField.placeholder)}).then(function () {
          return _reenterPasswordField.getContent().then(function (passwordValue) {
            if (passwordValue !== content && content !== '' && passwordValue !== '') {
              // clearly mark username field
              return _reenterPasswordField.error('Password does not match');
            } else {
              // remove error
              return _reenterPasswordField.removeError();
            }
          });
        });
      });
    }
    _reenterPasswordField.blur = function () {
      _reenterPasswordField.isFocused = false;
      return _reenterPasswordField.getContent().then(function (content) {
        var display = _reenterPasswordField.password ? content.replace(/\w/gi, '*') : content;
        return _reenterPasswordField.cc.tail.setAppearance({html: (display || _reenterPasswordField.placeholder)}).then(function () {
          return _passwordField.getContent().then(function (passwordValue) {
            if (passwordValue !== content && content !== '' && passwordValue !== '') {
              // clearly mark username field
              return _reenterPasswordField.error('Password does not match');
            } else {
              // remove error
              return _reenterPasswordField.removeError();
            }
          });
        });
      });
    }

    return Promise.all([
      _signup.cc.container.cc.progress.setState({
        defaultState: {

        },
        states: {

        }
      }),

      _signup.cc.container.cc.login.setBindings({
        'click': function (_this) {
          return Promise.all([
            _this.triggerState(),
          ]);
        },
      }),

      _signup.cc.container.cc.submit.setBindings({
        'click': function () {
          return _signup.submit();
        },
      }),

      _signup.setState({
        defaultState: {
          preFn: UI.functions.hide(),
          fn: function (_this) {
            return _signup.clearAll();
          }
        },
        states: {
          'signup': {fn: UI.functions.show()},
          'login': 'default',
          'activation': 'default',
        },
      }),
    ]).then(function () {
      return _signup;
    });
  });
}
