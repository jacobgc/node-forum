var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var passport = require('passport');
router.use(csrfProtection);

/* GET Signup. */
router.get('/signup', function(req, res, next) {
    res.render('user/signup', { title: "Signup to awesome!", csrf: req.csrfToken(), message: req.flash('error') || "no errors" });
});

/* GET Login */
router.get('/signin', function(req, res, next) {
    res.render('user/signin', { title: "Signin to awesome!", csrf: req.csrfToken(), message: req.flash('error') || "no errors" });
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
module.exports = router;