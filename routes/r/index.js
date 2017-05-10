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
    var sampleSub = new sub();
    sampleSub.get(subName).then((sub) => {
        var newPost = new post();
        newPost.subID = sub.id
        newPost.title = req.body.title;
        newPost.body = req.body.body;
        newPost.owner = req.user.username;
        newPost.contentType = req.body.contentType;
        newPost.content = req.body.content;
        newPost.genID();
        switch (req.body.contentType) {
            case "image":
                newPost.isCTypeURL().then((result) => {
                    if (result !== false) {
                        console.log("Found contentType ot be a URL");
                        newPost.content = result; // Set the result to the formatted URL
                        if (newPost.content.includes("imgur.com") && !newPost.content.includes("i.imgur.com")) {
                            ogs({
                                url: newPost.content
                            }, function (err, result) {
                                if (err) return next("Error getting open graph data from provided URL");
                                var test = result.data.ogImage.url;
                                test = test.replace(/\?fb/g, ''); // Fix 403 error
                                newPost.thumbnailEtag = test; // URL temporarly held in thumbnailEtag until the etag is found
                                newPost.content = test;
                                newPost.genThumbnail().then(() => {
                                    newPost.genURI().then((uri) => {
                                        newPost.uri = uri.toLowerCase();
                                        newPost.create().then(() => {
                                            res.redirect('/r/' + subName + '1/p/' + newPost.uri);
                                        })
                                    })
                                }).catch((reason) => {
                                    next(new Error(reason));
                                });

                            })
                        } else { // Try to get image from generic URL
                            console.log("Imgur not found, attempting generic URL");
                            newPost.genThumbnail().then(() => {
                                newPost.genURI().then((uri) => {
                                    newPost.uri = uri.toLowerCase();
                                    newPost.create().then(() => {
                                        res.redirect('/r/' + subName + '/p/' + newPost.uri);
                                    });
                                })
                            });
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
});

router.get('/*/p/*', function (req, res, next) { // GET POST FROM SUB
    var subName = req.url.match(/\/[a-z]{2,}\//g); // REGEX to transform /SUBNAME/p/create
    if (subName === null) next("Error, sub not found");
    subName = subName[0].replace(/[\/]/g, ''); //                  to SUBNAME
    subName = subName.toLowerCase(); // For the love of regex handle everything in lowercase ;_;
    var matches = getMatches(req.url, /\/[a-z]{2,}\/p\/([a-z,1-9-]*)/g, 1); // Custom function to loop through capture groups
    console.log(matches[0]); // Returns the first capture group
    var targetSub = new sub(); // create an "empty" sub
    targetSub = targetSub.get(subName).then((targetSub) => {
        var targetPost = new post();
        console.log("Target Sub: ", targetSub);
        targetPost.getByURI(matches[0], targetSub.id).then((foundPost) => {
            if (foundPost === false) next(new Error("Post not found"));
            console.log("Found Post:", foundPost);
            res.header("Authorization", "Client-ID c51c057e78c1a4e");
            res.render('r/p/', {
                title: foundPost.title + " -- /r/" + targetSub.name + " -- Shreddit",
                lI: req.isAuthenticated(),
                message: req.flash('error'),
                user: req.user || null, // The logged in user
                sub: targetSub, // The subreddit 
                post: foundPost, // The Post that was found
                imgur: foundPost.content.includes("imgur.com")
            });
        }).catch((reason) => {
            next(reason);
        });
    }).catch((reason) => {
        next(reason);
    });

});

router.get('/*', function (req, res) { // GET SUB
    var subName = req.url.substring(1); //t Get the sub name from url
    subName = subName.replace(" ", ""); // Remove white spaces
    var nsub = new sub('a', 'a', 'a'); // create an "empty" sub
    nsub = nsub.get(subName).then((nsub) => { // Populate it
        if (typeof nsub.name === "undefined") {
            return new Error("Sub not found");
        } else {
            var posts = new post();
            posts.getAllFromSub(nsub.id).then((allPosts) => {
                console.log(nsub.id);
                console.log("All Posts: ",allPosts);
                res.render('r/', {
                    title: "/r/" + nsub.name + " -- Shreddit",
                    lI: req.isAuthenticated(),
                    message: req.flash('error'),
                    user: req.user || null, // The logged in user
                    sub: nsub, // The subreddit 
                    posts: allPosts
                });
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

function getMatches(string, regex, index) {
    index || (index = 1); // default to the first capturing group
    var matches = [];
    var match;
    while (match = regex.exec(string)) {
        matches.push(match[index]);
    }
    return matches;
}
module.exports = router;