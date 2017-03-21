var passport = require('passport');
var user = require('./user');
var localStrategy = require('passport-local').Strategy;
var r = require("../db");



passport.serializeUser(function(user, done) {
    done(null, user.username);
    console.log('serializing user');
});

passport.deserializeUser(function(username, done) {
    return r.table('users').getAll(username, { index: 'username' }).run()
        .then((result) => {
            if (typeof result[0] !== "undefined") {
                return done(null, result[0]);
            }
            console.log("Failed to deserializeUser; Could not find them in the database");
            return done(false);
        });
});


passport.use('local-signup', new localStrategy({
    usernameField: 'username',
    passwordField: 'password',
    passReqToCallback: true // send intial request to the callback
}, function(req, username, password, done) { // callback
    username = username.toLowerCase();
    req.body.email = req.body.email.toLowerCase();
    var usrError = false;
    return r.table('users').getAll(username, { index: 'username' }).run()
        .then((result) => {
            if (typeof result[0] !== "undefined") {
                req.flash('error', "Oh dear, that username is already in use!");
                usrError = true;
            }
        })
        .then(() => {
            r.table('users').getAll(req.body.email, { index: 'email' }).run()
                .then((result) => {
                    if (typeof result[0] !== "undefined") {
                        req.flash('error', "Oh dear, that email is already in use!");
                        usrError = true;
                    }
                });
        })
        .then(() => {
            if (usrError) {
                return done(null, false);
            }
            var newUser = new user();
            newUser.email = req.body.email;
            newUser.username = username;
            newUser.password = newUser.createPassword(password);
            newUser.save()
                .then(() => {
                    return done(null, newUser);
                });
        });
}));

passport.use('local-signin', new localStrategy({
        usernamefield: 'username',
        passwordField: 'password',
        passReqToCallback: true,
    },
    function(req, username, password, done) {
        username = username.toLowerCase();
        var newUser = new user();
        return r.table('users').getAll(username, { index: 'username' }).run()
            .then((result) => {
                if (typeof result[0] !== "undefined") {
                    newUser = new user(result[0].username, result[0].email, result[0].password);
                }
            })
            .then(() => {
                r.table('users').getAll(username, { index: 'email' }).run()
                    .then((result) => {
                        if (typeof result[0] !== "undefined") {
                            newUser = new user(result[0].username, result[0].email, result[0].password);
                        }
                    });
            }).then(() => {
                if (typeof newUser.email == "undefined") {
                    req.flash('error', "No account found with the username/email provided");
                    return done(null, false);
                } else {
                    if (newUser.comparePassword(password)) {
                        console.log(newUser.username + "; Successfully logged in");
                        return done(null, newUser);
                    } else {
                        req.flash('error', "Invalid password");
                        return done(null, false);
                    }
                }
            });
    }));