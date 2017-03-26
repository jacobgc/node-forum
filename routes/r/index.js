var express = require('express');
var router = express.Router();
var sub = require('../../config/sub');

router.get('/*', function(req, res) {
    var subName = req.url.substring(1);
    var nsub = new sub('a', 'a', 'a');
    nsub = nsub.get(subName).then((nsub) => {
        res.json({ 'sub': nsub });
    });
});

router.get('/*', function(req, res) {
    res.send('you searching for someone?');
});

module.exports = router;