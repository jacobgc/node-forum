var passport = require('passport');
var user = require('./user');
var localStrategy = require('passport-local').Strategy;
var r = require('rethinkdb');
var connection;
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if (err) throw err;
    connection = conn;
});



passport.serializeUser(function(user, done) {
    console.log('serializing user');
    done(null, user.username);
});

passport.deserializeUser(function(username, done) {
    r.db('shreddit').table('users').filter(r.row('username').eq(username))
        .run(connection, function(err, cursor) {
            if (err) throw err;
            cursor.toArray(function(err, result) {
                if (err) throw err;
                if (typeof result[0] !== 'undefined') {
                    console.log('deserializing user');
                    return done(null, result[0]);
                }
            });
        });
});


passport.use('local-signup', new localStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true // send intial request to the callback
}, function(req, username, password, done) { // callback
    r.db('shreddit').table('users').filter(r.row('username').eq(username))
        .run(connection, function(err, cursor) {
            if (err) throw err;
            cursor.toArray(function(err, result) {
                if (err) throw err;
                if (typeof result[0] !== 'undefined') {
                    console.log("Username IN use");
                    return done(null, false, { message: 'Oh dear, that username is already in use :(' });
                } else {
                    console.log('Username NOT in use');
                    r.db('shreddit').table('users').filter(r.row('email').eq(req.body.email))
                        .run(connection, function(err, cursor) {
                            if (err) throw err;
                            cursor.toArray(function(err, result) {
                                if (err) throw err;
                                if (typeof result[0] !== 'undefined') {
                                    return done(null, false, { message: 'Oh dear, that email is alreadyy in use :(' });
                                } else {
                                    var newUser = new user();
                                    newUser.email = req.body.email;
                                    newUser.username = username;
                                    newUser.password = newUser.createPassword(password);
                                    newUser.save();
                                    return done(null, newUser);
                                }
                            });
                        });
                }
            });
        });
}));

passport.use('local-signin', new localStrategy({
        usernamefield: 'username',
        passwordField: 'password',
        passReqToCallback: true,

    },
    function(req, username, password, done) {

        var newUser = new user();
        r.db('shreddit').table('users').filter(r.row('username').eq(username))
            .run(connection, function(err, cursor) {
                if (err) throw err;
                cursor.toArray(function(err, result) {
                    if (err) throw err;
                    if (typeof result[0] !== "undefined") {
                        var returnedUser = result[0];
                        newUser.username = returnedUser.username;
                        newUser.email = returnedUser.email;
                        newUser.password = returnedUser.password;
                        var passCheck = newUser.comparePassword(password);
                        if (passCheck) {
                            newUser.password = null;
                            done(null, newUser);
                        } else {
                            return done(null, false, { message: 'Invalid password' });
                        }
                    } else {
                        r.db('shreddit').table('users').filter(r.row('email').eq(username))
                            .run(connection, function(err, cursor) {
                                if (err) throw err;
                                cursor.toArray(function(err, result) {
                                    if (err) throw err;
                                    if (typeof result[0] !== "undefined") {
                                        var returnedUser = result[0];
                                        newUser.username = returnedUser.username;
                                        newUser.email = returnedUser.email;
                                        newUser.password = returnedUser.password;
                                        var passCheck = newUser.comparePassword(password);
                                        if (passCheck) {
                                            newUser.password = null;
                                            return done(null, newUser);
                                        } else {
                                            return done(null, false, { message: 'Invalid password' });
                                        }
                                    } else {
                                        return done(null, false, { message: 'A user with the given username/email could not be found' });
                                    }
                                });
                            });
                    }
                });
            });
    }));