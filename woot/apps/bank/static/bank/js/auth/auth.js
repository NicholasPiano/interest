UI.app('hook', [
  AuthApplication({
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
  ]).then(function () {
    return UI.changeState('signup');
  });
}).catch(function (error) {
  console.log(error);
});
