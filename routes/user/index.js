var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var passport = require('passport');
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
        title: "Signin to awesome!",
        csrf: req.csrfToken(),
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null
    });
});

router.get('/isauthed', isAuthed, function(req, res) {
    res.redirect('/');
});

// POST Signup
router.post('/signup', passport.authenticate('local-signup', {
    successRedirect: '/',
    failureRedirect: '/user/signup',
    failureFlash: true
}));

// POST Login
router.post('/signin', passport.authenticate('local-signin', {
    successRedirect: '/user/isauthed',
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