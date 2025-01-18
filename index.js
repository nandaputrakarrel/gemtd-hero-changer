/* eslint-disable new-cap */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const logger = require('morgan');

const app = express();

const logFormat = {
  remote: ':remote-addr',
  user: ':remote-user',
  method: ':method',
  path: ':url',
  code: ':status',
  size: ':res[content-length]',
  agent: ':user-agent',
  responseTime: ':response-time',
};

app.use(logger(JSON.stringify(logFormat)));

// const corsOptions = {
//   origin: ["http://localhost:3000"],
//   methods: ["GET,POST"],
// };

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// app.use(cors(corsOptions));
app.use(express.json({limit: '1mb'}));
app.use(express.urlencoded({limit: '1mb', extended: true}));
app.use(express.static(path.join(__dirname, '../public')));

app.get('/', (req, res) => {
  res.render('index');
});

fs.readdirSync(__dirname + '/api/routes').filter((file) => {
  return file.toLowerCase().endsWith('.js');
}).forEach((eachFile) => {
  app.use('/', require(__dirname + '/api/routes/' + eachFile));
});

const defaultPort = process.env.PORT || 3001;
// app.listen(defaultPort, () => {
//   console.log(`GemTD Updater started at port : ${defaultPort}`);
// });

// Error handler
app.use((err, req, res, next) => {
  if (typeof err.handle === 'function') {
    err.handle();
  }

  console.error(err);

  res.status(err.statusCode || 500).json({
    status: err.statusCode || 500,
    message: err.printMsg || 'Something went wrong!',
  });
});

module.exports = app;