var uuid = require('uuid');
var r = require('../db');
class comment {
    constructor(id, comment, author, upvotes, downvotes, thread) {
        this.id = id;
        this.comment = comment;
        this.author = author;
        this.upvotes = upvotes;
        this.downvotes = downvotes;
        this.thread = thread;
    }
    genID() {
        this.id = uuid.v4();
    }
    save() {
        return r.table('threads').insert({
            id: this.id,
            comment: this.comment,
            author: this.author,
            upvotes: this.upvotes,
            downvotes: this.downvotes,
            thread: this.thread
        }).run();
    }
}

module.exports = comment;