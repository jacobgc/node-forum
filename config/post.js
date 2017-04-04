var r = require("../db");
var uuid = require('uuid');

class post {
    constructor(name, body, owner, img, id) {
        this.title = name,
            this.body = body,
            this.owner = owner,
            this.img = img,
            this.id = id
    }

    update(row, data) { // works
        var update = {};
        update[row] = data;
        return r.table('posts').getAll(this.id, { index: 'id' }), update(update).run()
            .then(() => {
                console.log("updated " + row + " changed value to " + data);
                return;
            });
    }
    genID() {
        this.id = uuid.v4();
    }

    static get(id) {

    }

    create() {

    }
}

module.exports = post;