var express = require('express');
var router = express.Router();


// /* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', {
        title: 'Shreddt -- The home of awesome!',
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null
    });
});

// Log out the user
router.get('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
});

// DEBUG to see if user is authed
router.get('/isauthed', function(req, res, next) {
    var jsonVar = { 'Authed': req.isAuthenticated(), "User": req.user };
    var jsonStr = JSON.stringify(jsonVar);
    res.send(jsonStr);
});

// redirect /login to /user/signin
router.get('/login', function(req, res, next) {
    res.redirect('/user/signin');
});


function isAuthed(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/login');
}

function isNotAuthed(req, res, next) {
    if (req.isAuthenticated()) {
        req.flash('error', "You must be signed out to access that page!");
        res.redirect('/');
    }
    return next();
}

module.exports = router;