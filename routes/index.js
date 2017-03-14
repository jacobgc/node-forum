var express = require('express');
var router = express.Router();
var request = require('request');
var fs = require('fs');
var bcrypt = require('bcrypt-nodejs');
var sharp = require('sharp');
var r = require('rethinkdb');
var csrf = require('csurf');

var csrfProtection = csrf();

var AWS = require('aws-sdk'); // Amazon <3
// Create an S3 client
var s3 = new AWS.S3({ signatureVersion: 'v4' });


// /* GET home page. */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Shreddt -- The home of awesome!' });
});

// /* Redirect /login. */
router.get('/login', function(req, res, next) {
    res.redirect('/user/signin');
});

var connection = null;
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if (err) throw err;
    connection = conn;
});

// THUMBNAIL STUFF (For use later)
router.get('/thumbnail', function(req, res, next) { // if someone goes to /thumbnail
    var url = req.query.url; // get the URL from the query
    url = decodeURI(url); // decode the URL
    if (!url.match(/^(http|https):\//)) { // if the url does not start with http://
        url = "http://" + url; // add http:// to it
    }
    var fType = url.match(/\.[0-9a-z]+$/i); // Get the URLs filetype
    var etag;
    request
        .get(url)
        .on('response', function(response) {
            console.log(response);
            etag = response.headers.etag.replace(/(?:")+/g, ""); // Remove quotes from the etag
        })
        .pipe(
            sharp() // use sharp to resize the image to a thumbnail
            .resize(200, 200)
            .toBuffer(function(err, buffer) {
                var bucketName = 'shreddit'; // send it over to S3
                var keyName = url.replace(/^(http|https):\/\//, ""); // give it a name (url without http(s)://)
                s3.createBucket({ Bucket: bucketName }, function() {
                    var params = {
                        Bucket: bucketName,
                        Key: keyName,
                        Body: buffer,
                        ContentType: 'image/jpeg', // Set files content type
                        ACL: 'public-read' // Allow anyone to read
                    };
                    s3.putObject(params, function(err, data) { // Put the file on S3
                        if (err)
                            throw err;
                        else
                            r.db('shreddit').table('imageStore').insert([{ // Add some meta data do the DB of where the image is
                                url: url, // Original URL of the file
                                etag: etag, // Etag cache key
                                s3Loc: "https://s3.eu-west-2.amazonaws.com/shreddit/" + keyName // Location on S3
                            }]).run(connection, function(err, result) {
                                if (err) throw err;
                            });
                        res.end();
                    });
                });
            }));
});

module.exports = router;