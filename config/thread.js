var r = require("../db");

class sub {
    constructor(name, description, owner, needsMod) {
        this.name = name,
            this.description = description,
            this.owner = owner,
            this.needsMod = needsMod
    }

    update(row, data) { // works
        var update = {};
        update[row] = data;
        return r.table('subs').update(update).run()
            .then(() => {
                console.log("updated " + row + " changed value to " + data);
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