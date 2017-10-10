
var AuthInterfaces = (AuthInterfaces || {});
AuthInterfaces.activation = function (id, args) {
  return UI.createComponent((id || 'activation'), {
    name: 'activation',
    template: UI.template('div', 'ie abs hidden'),
    appearance: {
      style: {
        'height': '100%',
        'width': '100%',
      },
      classes: ['centred-vertically'],
    },
    children: [
      UI.createComponent('a-container', {
        name: 'container',
        template: UI.template('div', 'ie centred'),
        appearance: {
          style: {
            'height': '500px',
            'width': '500px',
          },
        },
        children: [
          // activation key
          Components.text('activation-key', {
            name: 'activationKey',
            title: 'Activation key',
            value: 'An email from signup.deposit@gmail.com was sent to ${to_email} with an activation key. The subject will contain the reference ${key}. Please enter the activation key within the email in the field below to activate your account. You will be redirected to login upon submission.',
          }),
          Components.search('activation-key-field', {
            name: 'activationKeyField',
            placeholder: 'Activation key',
            appearance: {
              style: {
                'top': '10px',
              },
            },
          }),
          Components.button('a-submit', {
            name: 'submit',
            value: 'Activate',
            appearance: {
              style: {
                'float': 'left',
                'width': '100px',
                'top': '20px',
              },
            },
          }),
        ],
      }),
    ],
  }).then(function (_activation) {

    var _key = _activation.cc.container.cc.activationKeyField;
    _activation.submit = function () {
      if (!_key.model().hasClass('error')) {
        return _key.getContent().then(function (content) {
          if (content !== '') {
            return Promise.all([
              Active.get('signup.data.username'),
              Active.get('signup.data.password'),
            ]).then(function (results) {
              var [_username, _password] = results;
              return Request('/login/', {
                username: _username,
                password: _password,
                activation_key: content,
              }).then(function (response) {
                if (response.success) {
                  window.location = '/account/';
                } else {
                  return _key.error('Incorrect key');
                }
              });
            });
          } else {
            return _key.error('Required');
          }
        });
      }
    }

    return Promise.all([
      // submit
      _activation.cc.container.cc.submit.setBindings({
        'click': function (_this) {
          return _activation.submit();
        },
      }),

      // states
      _activation.setState({
        defaultState: {
          preFn: UI.functions.hide(),
          fn: function (_this) {
            return _key.clear().then(function () {
              return _key.blur();
            });
          }
        },
        states: {
          'signup': 'default',
          'login': 'default',
          'activation': {
            preFn: function (_this) {
              return Promise.all([
                Active.get('signup.data.email'),
                Active.get('signup.key'),
              ]).then(function (data) {
                var [to_email, key] = data;
                return _activation.cc.container.cc.activationKey.cc.value.setAppearance({html: `An email from <strong>signup.deposit@gmail.com</strong> was sent to <strong>${to_email}</strong> with an activation key. The subject will contain the reference <strong>${key}</strong>. Please enter the activation key within the email in the field below to activate your account. You will be redirected to login upon submission.`});
              })
              return
            },
            fn: UI.functions.show()
          },
        },
      }),
    ]).then(function () {
      return _activation;
    });
  });
}
