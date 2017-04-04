var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var passport = require('passport');
var user = require('../../config/user');
router.use(csrfProtection);

/* GET Signup. */
router.get('/signup', isNotAuthed, function(req, res) {
    res.render('user/signup', {
        title: "Signup to awesome!",
        csrf: req.csrfToken(),
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null
    });
});

/* GET Login */
router.get('/signin', isNotAuthed, function(req, res) {
    res.render('user/signin', {
        title: "Signin to awesome! -- Shreddit",
        csrf: req.csrfToken(),
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null
    });
});

router.get('/edit', isAuthed, function(req, res, next) {
    res.render('user/edit', {
        title: "Edit User -- Shreddit",
        csrf: req.csrfToken(),
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null
    });
});

router.get('/isauthed', isAuthed, function(req, res) {
    res.redirect('/');
});

// POST Edit
router.post('/edit', isAuthed, function(req, res, next) {
    var usr = new user();
    return usr.findByUsername(req.user.username).then((user) => {
        if (!user) next("User not found to update");
        usr.username = req.body.username;
        usr.email = req.body.email;
        usr.bio = req.body.bio;
        usr.updateAll(req.user.username).then(() => {
            if (req.user.username !== req.body.username) { // Cookies cause a problem with username update
                req.flash('error', 'Logged out due to profile update');
                req.logout();
                res.redirect('/user/signin');
            } else {
                res.redirect('/user/edit');
            }
        });
    });
});

// POST Signup
router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/user/signup',
    failureFlash: true
}));

// POST Login
router.post('/signin', passport.authenticate('local-signin', {
    successRedirect: '/',
    failureRedirect: '/user/signin',
    failureFlash: true
}));

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