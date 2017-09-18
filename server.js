const express = require('express');
const path = require('path');
const http = require('http');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const expressValidator = require('express-validator');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const config = require('./config/database');

mongoose.connect(config.database);
let db = mongoose.connection;

// Check connection
db.once('open', () => {
  console.log('Connected to mongodb');
});

// Check for db errors
db.on('error', (err) => {
  console.log(err);
});

// Init server
const server = express();

// Bring in Models
let Scan = require('./models/scan');

// Set path and engine for view
server.set('views', path.join(__dirname, 'views'));
server.set('view engine', 'pug');

// Body parser
server.use(bodyParser.urlencoded({extend: false}));
server.use(bodyParser.json());

// Set Public Folder
server.use(express.static(path.join(__dirname, 'public')));

// Express Session Middleware
server.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUnitialized: true
}));

// Express Messages Middleware
server.use(require('connect-flash')());
server.use((req, res, next) => {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

// Express Validator Middleware
server.use(expressValidator({
  errorFormatter: (param, msg, value) => {
    let namespace = param.split('.'),
        root = namespace.shift(),
        formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param: formParam,
      msg: msg,
      value: value
    };
  },
  customValidators: {
    isXML: function(value, filename) {
      var extension = (path.extname(filename)).toLowerCase();
      return extension == '.xml';
    }
  }
}));

// Passport Configuration
require('./config/passport')(passport);
server.use(passport.initialize());
server.use(passport.session());

server.get('*', (req, res, next) => {
  res.locals.user = req.user || null;
  next();
});

// Home Route
server.get('/', (req, res) => {
  res.render('index', {
    title: 'Mapowanie topologii sieciowej.'
  });
});

// Route files
let topology = require('./routes/topology');
let users = require('./routes/users');
server.use('/topology', topology);
server.use('/users', users);

// Start Server
server.listen(3000, () => {
  console.log('server on 3000');
});
