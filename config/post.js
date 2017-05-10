var r = require("../db");
var uuid = require('uuid');
var request = require('request');
var sharp = require('sharp');
var s3 = require('aws-sdk');

var AWS = require('aws-sdk'); // Amazon <3
// Create an S3 client
var s3 = new AWS.S3({
    signatureVersion: 'v4',
});

class post {
    constructor(title, body, owner, contentType, content, id, thumbnailEtag, uri) {
        this.title = title,
            this.body = body,
            this.owner = owner,
            this.contentType = contentType,
            this.content = content,
            this.id = id,
            this.thumbnailEtag = thumbnailEtag,
            this.uri = uri
    }

    getAll() {
        return r.table('posts').run();
    }
    getAllFromSub(subID) {
        return r.table('posts').getAll(subID, {
            index: 'subID'
        }).run()
    }

    getByURI(uri, subID) { // Looks for the post with a given subID
        console.log("Looking for URI:", uri);
        console.log("In sub:", subID);
        uri = uri.toLowerCase();
        return r.table("posts").getAll(uri, { // Get all posts with the same title
                index: 'uri'
            }).run()
            .then((result) => {
                if (typeof result[0] == "undefined") {
                    console.log("DB lookup returned null");
                    return false;
                } else {
                    for (var index = 0; index < result.length; index++) {
                        var element = result[index];
                        if (element.subID === subID) {
                            return element;
                        }
                    }
                    return false;
                }
            });
    }

    update(row, data) { // works
        var update = {};
        update[row] = data;
        return r.table('posts').getAll(this.id, {
                index: 'id'
            }), update(update).run()
            .then(() => {
                return;
            });
    }
    genID() {
        this.id = uuid.v4();
    }

    genURI() {
        var this1 = this;
        return new Promise(function (resolve, reject) {
            this1.title = this1.title.replace(/[ ]/g, '-'); // Replace any dashes
            this1.title = this1.title.replace(/[^a-zA-Z- ]/g, ''); // Remove any special chracters            resolve(this1.title);
            resolve(this1.title);
        });
    }

    isCTypeURL() {
        var this1 = this;
        return new Promise(function (resolve, reject) {
            var pattern = new RegExp('((http|https)\:\/\/)?[a-zA-Z0-9\.\/\?\:@\-_=#]+\.([a-zA-Z0-9\&\.\/\?\:@\-_=#])*', 'i');
            if (pattern.test(this1.content)) {
                if (!this1.content.includes("http://") && !this1.content.includes("https://")) {
                    this1.content = "https://" + this1.content;
                }
                resolve(this1.content);
            } else {
                resolve(false);
            }
        });
    }

    genThumbnail() { // The most cancerous code I've ever worked on
        var url = this.thumbnailEtag;
        return new Promise(function (resolve, reject) {
            resolve("Sample ETAG"); // BYPASSING THUMBNAIL STUFF UNTIL COMPLETE, REMOVE ONCE DONE!
            var etag;
            request
                .get(url)
                .on('response', function (response) {
                    etag = response.headers.etag.replace(/(?:")+/g, ""); // Remove quotes from the etag
                })
                .pipe(
                    sharp() // use sharp to resize the image to a thumbnail
                    .resize(200, 200)
                    .toBuffer(function (err, buffer) {
                        if (err) reject(err);
                        var bucketName = 'shreddit'; // send it over to S3
                        var keyName = url.replace(/^(http|https):\/\//, ""); // give it a name (url without http(s)://)
                        s3.createBucket({
                            Bucket: bucketName
                        }, function () {
                            var params = {
                                Bucket: bucketName,
                                Key: keyName,
                                Body: buffer,
                                ContentType: 'image/jpeg', // Set files content type
                                ACL: 'public-read' // Allow anyone to read
                            };
                            s3.putObject(params, function (err) { // Put the file on S3
                                if (err)
                                    reject(err);
                                else
                                    r.table('imageStore').insert([{ // Add some meta data do the DB of where the image is
                                        url: url, // Original URL of the file
                                        etag: etag, // Etag key
                                        s3Location: "https://s3.eu-west-2.amazonaws.com/shreddit/" + keyName // Location on S3
                                    }]).run().resolve(this);
                            });
                        });
                    }));
        });
    }

    create() {
        return r.table('posts').insert({
            title: this.title,
            body: this.body,
            owner: this.owner,
            contentType: this.contentType,
            content: this.content,
            id: this.id,
            thumbnailEtag: this.thumbnailEtag,
            uri: this.uri,
            subID: this.subID
        }).run()
    }
}

module.exports = post;