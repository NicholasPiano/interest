var AccountApplication = function (args) {
  return UI.createComponent('account', {
    name: 'account',
    template: UI.template('div', 'ie'),
    appearance: {
      style: {
        'height': '100%',
      },
    },
    children: [
      // users

    ],
  }).then(function (_account) {

    // complete promises
    return Promise.all([

    ]).then(function () {
      return _account;
    });
  });
}
