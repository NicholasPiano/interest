
// var SourceComponents = (SourceComponents || {});
// SourceComponents.context = (SourceComponents.context || {});
// SourceComponents.context.view = (SourceComponents.context.view || {});
blank = function (id, args) {
  return UI.createComponent(id, {
    name: args.name,
    template: UI.template('div', 'ie'),
    appearance: {
      style: {

      },
    },
  }).then(function (_blank) {
    return Promise.all([
      _blank.setState({
        states: {
          
        },
      })
    ]).then(function () {
      return _blank;
    });
  });
}