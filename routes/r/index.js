var express = require('express');
var router = express.Router();

router.get('/', function(req, res) {
    res.send('welcome to /r');
});

router.get('/*', function(req, res) {
    res.send('you searching for someone?');
});

module.exports = router;