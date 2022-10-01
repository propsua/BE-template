const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./model');

const app = express();
app.use(bodyParser.json());

app.set('sequelize', sequelize);
app.set('models', sequelize.models);

require('./controller/common').load(app);

module.exports = app;
