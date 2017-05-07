var express = require('express');
var router = express.Router();
var csrf = require('csurf');
var csrfProtection = csrf();
var ogs = require('open-graph-scraper');
router.use(csrfProtection);
var sub = require('../../config/sub');
var user = require('../../config/user');
var post = require('../../config/post');

router.get('/create', isAuthed, function (req, res) {
    res.render('r/create', {
        title: "/r/new",
        csrf: req.csrfToken(),
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null, // The logged in user
    });
});

router.post('/create', isAuthed, function (req, res) {
    var nsub = new sub();
    var usr = new user();
    nsub.name = req.body.name;
    nsub.description = req.body.description;
    nsub.ldescription = req.body.ldescription;
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
            res.redirect('/r/create');
        }
    });

});

router.get('/*/p/create', isAuthed, function (req, res) {
    var subName = req.url.match(/\/[a-z]*\//g); // REGEX to transform /SUBNAME/p/create
    subName = subName[0].replace(/[\/]/g, ''); //                  to SUBNAME
    res.render('r/p/create', {
        title: subName + " -> Create a new post -- Shreddit",
        csrf: req.csrfToken(),
        lI: req.isAuthenticated(),
        message: req.flash('error'),
        user: req.user || null,
        subName: subName,
    });
});

router.post('/*/p/create', function (req, res, next) {
    var subName = req.url.match(/\/[a-z]*\//g); // REGEX to transform /SUBNAME/p/create
    subName = subName[0].replace(/[\/]/g, ''); //                  to SUBNAME
    var newPost = new post();
    newPost.title = req.body.title;
    newPost.body = req.body.body;
    newPost.owner = req.user.username;
    newPost.contentType = req.body.contentType;
    newPost.content = req.body.content;
    newPost.id = newPost.genID();
    switch (req.body.contentType) {
        case "image":
            newPost.isCTypeURL().then((result) => {
                if (result !== false) {
                    newPost.content = result; // Set the result to the formatted URL
                    if (newPost.content.includes("imgur.com") && !newPost.content.includes("i.imgur.com")) {
                        console.log(newPost.content);
                        ogs({
                            url: newPost.content
                        }, function (err, result) {
                            if (err) return next("Error getting open graph data from provided URL");
                            console.log( result.data.ogImage.url); // T
                        })
                    }
                } else {
                    next(new Error("No valid URL provided, please try again"));
                }
            }).catch((reason) => {
                next(new Error(reason));
            });
        case "video":
            break;
        case "url":
            break;
        case "text":
            break;
        default:
            next(new Error("Content type not detected. We got: " + newPost.contentType));
            break;
    }
});

router.get('/all', function (req, res) {
    var a = new sub();
    a.getall().then((result) => {
        res.json({
            result: result
        });
    });
});


router.get('/*', function (req, res) {
    var subName = req.url.substring(1); //t Get the sub name from url
    subName = subName.replace(" ", ""); // Remove white spaces
    var nsub = new sub('a', 'a', 'a'); // create an "empty" sub
    nsub = nsub.get(subName).then((nsub) => { // Populate it
        if (typeof nsub.name === "undefined") {
            res.redirect('/404');
        } else {
            res.render('r/', {
                title: "/r/" + nsub.name + " -- Shreddit",
                lI: req.isAuthenticated(),
                message: req.flash('error'),
                user: req.user || null, // The logged in user
                sub: nsub // The subreddit 
            });
        }
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