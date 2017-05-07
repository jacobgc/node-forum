var r = require("../db");
var uuid = require('uuid');
var request = require('request');
var sharp = require('sharp');

class post {
    constructor(name, body, owner, contentType, content, id) {
        this.title = name,
            this.body = body,
            this.owner = owner,
            this.contentType = contentType,
            this.content = content,
            this.id = id
    }

    update(row, data) { // works
        var update = {};
        update[row] = data;
        return r.table('posts').getAll(this.id, {
                index: 'id'
            }), update(update).run()
            .then(() => {
                console.log("updated " + row + " changed value to " + data);
                return;
            });
    }
    genID() {
        this.id = uuid.v4();
    }

    isCTypeURL() {
        var this1 = this;
        return new Promise(function (resolve, reject) {
            var pattern = new RegExp('((http|https)\:\/\/)?[a-zA-Z0-9\.\/\?\:@\-_=#]+\.([a-zA-Z0-9\&\.\/\?\:@\-_=#])*', 'i');
            if (pattern.test(this1.content)) {
                console.log(this1.content);
                if(!this1.content.includes("http://") && !this1.content.includes("https://")){
                this1.content = "https://" + this1.content;
            }
                resolve(this1.content);
            } else {
                resolve(false);
            }
        });
    }

    genThumbnail(){ // WILL NOT WORK. NEEDS MODIFYING!!!
        var url = req.query.url; // get the URL from the query
    url = decodeURI(url); // decode the URL
    if (!url.match(/^(http|https):\//)) { // if the url does not start with http://
        url = "http://" + url; // add http:// to it
    }
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
                    s3.putObject(params, function(err) { // Put the file on S3
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
    }

    create() {

    }
}

module.exports = post;