var passport = require('passport');
var user = require('./user');
var localStrategy = require('passport-local').Strategy;
var r = require("../db");



passport.serializeUser(function(user, done) {
    console.log('serializing user');
    done(null, user.username);
});

passport.deserializeUser(function(username, done) {
    var usr = new user(); // Create a user instance 
    return usr.findByUsername(username).then((result) => { // Search for the user 
        if (!result) return done(false); // Could not find user (cookie/db change)
        return done(null, result); // Return the user
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
        var tmpUser = new user();
        return tmpUser.findByUsername(username).then((result) => {
                if (!result) return;
                newUser.populate(result);
            })
            .then(() => {
                tmpUser.findByEmail(username).then((result) => {
                    if (!result) return;
                    newUser.populate(result);
                });
            })
            .then(() => {
                if (typeof newUser.email == "undefined") {
                    req.flash('error', "No account found with the username/email provided");
                    return done(null, false);
                } else {
                    if (newUser.comparePassword(password)) {
                        return done(null, newUser);
                    } else {
                        req.flash('error', "Invalid password");
                        return done(null, false);
                    }
                }
            });
    }));