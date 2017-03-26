var express = require('express');
var path = require('path');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var passport = require('passport');
var flash = require('connect-flash');
var RDBStore = require('express-session-rethinkdb')(session);

var app = express();
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
var rdbStore = new RDBStore({
    connectOptions: {
        servers: [
            { host: '127.0.0.1', port: 28015 }
        ],
        db: 'shreddit',
        discovery: false,
        pool: true,
        buffer: 50,
        max: 1000,
        timeout: 20,
        timeoutError: 1000
    },
    table: 'sessionStore',
    sessionTimeout: 86400000,
    flushInterval: 60000,
    debug: false
});

app.use(session({
    key: 'sid',
    cookie: { maxAge: 860000 },
    secret: 'DANK£%$%^&@~',
    resave: false,
    saveUninitialized: false,
    store: rdbStore
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));


var routes = require('./routes/');
var user = require('./routes/user/');
var u = require('./routes/u/');
var sr = require('./routes/r/');

app.use('/', routes);
app.use('/user', user);
app.use('/u', u);
app.use('/r', sr);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});
require('./config/passport.js');

// error handlers
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err,
            title: "Whoops, that should't have happened",
            lI: req.isAuthenticated(),
            user: req.user || null
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        title: "Whoops, that should't have happened",
        lI: req.isAuthenticated(),
        user: req.user || null,
        error: {}
    });
});


module.exports = app;