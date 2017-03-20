var express = require('express');
var router = express.Router();
var user = require('../../config/user');

router.get('/', function(req, res) {
    res.send('welcome to /u');
});

router.get('/*', function(req, res, next) {
    var username = req.url.substring(1);
    var usr = new user();

    usr.findByUsername(username)
        .then((user) => {
            console.log(user);
            if (user === true) {
                user = {
                    username: "Error user not found",
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

module.exports = router;