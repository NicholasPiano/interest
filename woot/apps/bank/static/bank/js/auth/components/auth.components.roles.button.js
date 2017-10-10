
var AuthComponents = (AuthComponents || {});
AuthComponents.roles = (AuthComponents.roles || {});
AuthComponents.roles.button = function (args) {
  var _id = `roles-${args.type}`;
  return Components.button(_id, {
    name: args.type,
    value: args.display,
    appearance: $.extend(true, {
      style: {
        'float': 'left',
      },
    }, args.appearance),
  }).then(function (_button) {

    _button.isActive = false;
    _button.toggle = function () {
      _button.isActive = !_button.isActive;
      var classes = _button.isActive ? {add: ['active']} : {remove: ['active']};
      return _button.setAppearance({classes: classes});
    }

    return Promise.all([
      _button.setBindings({
        'click': function (_this) {
          return _this.toggle();
        },
      }),
    ]).then(function () {
      return _button;
    });
  });
}
