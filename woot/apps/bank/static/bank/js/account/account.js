UI.app('hook', [
  AccountApplication({
    interface: {
      size: 50,
      margin: 10,
      corner: 5,
    },
  }),
]).then (function (app) {
  // render
  return app.render();
}).then(function () {
  return Promise.all([
    // load user
    Context.getUser(),
  ]).then(function () {
    // return UI.changeState('main');
  });
}).catch(function (error) {
  console.log(error);
});
