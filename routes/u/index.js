var express = require('express');
var router = express.Router();
var user = require('../../config/user');

router.get('/', function(req, res, next) {
    next("User Not Found");
});

router.get('/*', function(req, res, next) {
    var username = req.url.substring(1);
    username = username.toLowerCase();
    var usr = new user();

    usr.findByUsername(username)
        .then((user) => {
            //console.log(user);
            if (user === false) {
                user = {
                    title: "User Not Found -- Shreddit",
                    suser: "Error user not found",
                };
            }
            res.render('u/', {
                title: user.username + "'s Profile -- Shreddit",
                lI: req.isAuthenticated(),
                message: req.flash('error'),
                user: req.user || null, // The logged in user
                suser: user // The searched user 
            });
        })
        .catch(next);
});

function isAuthed(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You need to be logged in to do that');
    res.redirect('/login');
}

module.exports = router;