const fs = require('fs');
const path = require('path');
const { HttpException } = require('./exception');
const securedMiddleware = require('../middleware/secured.middleware');

module.exports = {
  load,
};

const actionHandlerFactory = (app) => ({
  get: (route, roles, callback) => handler('get', app, route, roles, callback),
  post: (route, roles, callback) => handler('post', app, route, roles, callback),
});

function load(app) {
  fs.readdirSync(__dirname).forEach((fileName) => {
    if (fileName.lastIndexOf('.controller.js') < 0) {
      return;
    }
    require(path.join(__dirname, fileName))(actionHandlerFactory(app));
  });

  app.get('*', (req, res) => {
    res.status(404).send('Not found');
  });
}

function exceptionHandler(res, e) {
  if (e instanceof HttpException) {
    res.status(e.statusCode).send(e.message);
    return;
  }

  console.log(e);
  res.status(500).send('Oops, something bad happened');
}

function handler(method, app, route, roles, callback) {
  app[method](route, securedMiddleware.apply(roles), async (req, res) => {
    try {
      const sequelize = req.app.get('sequelize');
      const response = await sequelize.transaction(() => callback(req, res));
      res.json(response);
    } catch (e) {
      exceptionHandler(res, e);
    }
  });
}
