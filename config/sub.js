var r = require("../db");
var validator = require('validator');

var blacklistedSubs = [
    "delete",
    "create",
];

class sub {
    constructor(name, description,ldescription, owner) {
        this.name = name,
            this.description = description,
            this.ldescription = ldescription,
            this.owner = owner
    }

    errorCheck(name) {
        return new Promise(function(resolve, reject) {
            if (validator.contains(name, " ") || validator.isAlpha(name, ['en-GB'])) {
                console.log(false);
                resolve(false);
            } else {
                console.log(true);
                resolve(true);
            }
        });
    }

    update(a, b) {
        var update = {};
        update[a] = b;
        return r.table('subs').getAll(this.id, { index: 'id' }).update(update).run().then(() => {
            return;
        });
    }

    getall() {
        return r.table('subs').run()
            .then((result) => {
                return result;
            });
    }

    get(name) {
        name = name.toLowerCase();
        return r.table("subs").getAll(name, { index: 'name' }).run()
            .then((result) => {
                if (typeof result[0] == "undefined") {
                    return false;
                } else {
                    var a = result[0];
                    var nsub = new sub(a.name, a.desciption, a.ldescription, a.owner);
                    return nsub;
                }
            });
    }

    create() {
        this.name = this.name.toLowerCase();
        var subExists = false;
        return r.table('subs').getAll(this.name, { index: 'name' }).run()
            .then((result) => {
                if (typeof result[0] !== "undefined") {
                    subExists = true;
                }
            }).then(() => {
                if (!subExists) {
                    r.table('subs').insert({
                            name: this.name,
                            owner: this.owner,
                            description: this.description,
                            ldescription: this.ldescription
                        }).run()
                        .then(() => {
                            return true;
                        });
                } else {
                    return false;
                }

            });
    }
}

module.exports = sub;