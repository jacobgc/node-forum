var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
router.use(csrfProtection);
var sub = require('../../config/sub');
var user = require('../../config/user');

router.get('/create', isAuthed, function(req, res) {
    res.render('r/create', {
        title: "/r/new",
        csrf: req.csrfToken(),
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null, // The logged in user
    });
});

router.post('/create', isAuthed, function(req, res) {
    var nsub = new sub();
    var usr = new user();
    nsub.name = req.body.name;
    nsub.description = req.body.description;
    nsub.owner = req.user.username;
    if (typeof req.body.mature === "undefined") {
        nsub.mature = false;
    } else {
        nsub.mature = true;
    }
    nsub.errorCheck(nsub.name).then((result) => {
        if (result === false) {
            nsub.get(req.body.name).then((result) => {
                if (result === false) {
                    usr.findByUsername(req.user.username).then((result) => {
                        usr.populate(result);
                        result.subs.push(req.body.name);
                        usr.update('subs', result.subs).then(() => { //TOTO this does not work ;_;
                            nsub.create().then(() => {
                                res.redirect('/r/' + req.body.name);
                            });
                        });
                    });
                } else {
                    req.flash('error', "Subshreddit name in use");
                    res.redirect('/r/create');
                }
            });
        } else {
            req.flash('error', "Sub's name validation failed, does it contain a white space or contain special characters?");
            req.redirect('/r/create');
        }
    });

});

router.get('/all', function(req, res) {
    var a = new sub();
    a.getall().then((result) => {
        res.json({ result: result });
    });
});

router.get('/*/*', function(req, res) {
    res.send(req.url);
});

router.get('/*', function(req, res) {
    var subName = req.url.substring(1); //t Get the sub name from url
    subName = subName.replace(" ", ""); // Remove white spaces
    var nsub = new sub('a', 'a', 'a'); // create an "empty" sub
    nsub = nsub.get(subName).then((nsub) => { // Populate it

        res.render('r/', {
            title: "/r/" + nsub.name + " -- Shreddit",
            lI: req.isAuthenticated(),
            message: req.flash('error'),
            user: req.user || null, // The logged in user
            sub: nsub // The searched user 
        });
    });
});

function isAuthed(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    req.flash('error', 'You need to be logged in to do that');
    res.redirect('/login');
}

module.exports = router;