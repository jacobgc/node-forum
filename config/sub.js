var r = require("../db");

class sub {
    constructor(name, description, owner, needsMod) {
        this.name = name,
            this.description = description,
            this.owner = owner
    }

    update(a, b) { // DOES NOT WORK, NEEDS FIXING
        var update = {};
        update[a] = b;
        return r.table('subs').update(update).run()
            .then(() => {
                console.log("updated " + a + " changed value to " + b);
                return;
            });
    }

    static get(name) {
        return r.table("subs").getAll(name, { index: 'name' }).run()
            .then((result) => {
                if (typeof result[0] == "undefined") {
                    return false;
                } else {
                    var a = result[0];
                    var nsub = new sub(a.name, a.desciption, a.owner, a.needsMod);
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
                            needsMod: true
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