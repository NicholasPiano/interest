
var AuthComponents = (AuthComponents || {});
AuthComponents.roles = (AuthComponents.roles || {});
AuthComponents.roles.main = function () {
  var _id = 'roles';
  return UI.createComponent(_id, {
    name: 'roles',
    template: UI.template('div', 'ie'),
    appearance: {
      style: {
        'width': '200px',
        'margin-top': '10px',
      },
    },
    children: [
      // admin
      AuthComponents.roles.button({
        type: 'admin',
        display: 'Admin',
      }),

      // manager
      AuthComponents.roles.button({
        type: 'manager',
        display: 'Manager',
        appearance: {
          style: {
            'margin-left': '10px',
          },
        },
      }),
    ],
  }).then(function (_roles) {

    Util.css.create(`#${_roles.id} .active`, `background-color: ${Color.green.lightest};`);

    _roles.getContent = function () {
      return Util.ep({
        'is_admin': _roles.cc.admin.isActive,
        'is_manager': _roles.cc.manager.isActive,
      });
    }
    _roles.clear = function () {
      _roles.cc.admin.isActive = true;
      _roles.cc.manager.isActive = true;
      return Promise.all([
        _roles.cc.admin.toggle(),
        _roles.cc.manager.toggle(),
      ]);
    }

    return Promise.all([

    ]).then(function () {
      return _roles;
    });
  });
}
