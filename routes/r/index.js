var express = require('express');
var router = express.Router();
var sub = require('../../config/sub');

router.get('/*/*', function(req, res) {
    res.send(req.url);
});

router.get('/*', function(req, res) {
    var subName = req.url.substring(1); //t Get the sub name from url
    var nsub = new sub('a', 'a', 'a'); // create an "empty" sub
    nsub = nsub.get(subName).then((nsub) => { // Populate it
        res.json({ 'sub': nsub }); // Send it -> //TODO show the subreddit page
    });
});

module.exports = router;