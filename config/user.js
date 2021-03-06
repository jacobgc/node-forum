var r = require("../db");
var bcrypt = require('bcrypt-nodejs');
var md5 = require('md5');

class newUser {
    constructor(username, email, password, bio) {
        this.username = username,
            this.email = email,
            this.password = password,
            this.bio = bio;
    }
    populate(input) {
        this.username = input.username;
        this.email = input.username;
        this.password = input.password;
        this.bio = input.bio;
        this.subs = input.subs;
        this.threads = input.threads;
        this.posts = input.posts;
    }

    update(a, b) {
        var update = {};
        update[a] = b;
        return r.table('users').getAll(this.username, {
            index: 'id'
        }).update(update).run().then(() => {
            return;
        });
    }

    updateAll(username) {
        return r.table('users').getAll(username, {
                index: 'username'
            }).update({
                email: this.email,
                username: this.username,
                bio: this.bio
            }).run()
            .then(() => {
                return;
            }).catch((err) => {
                console.log('Problem updating user');
            });
    }

    // Returns a hashed string (for the password)
    createPassword(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null);
    }

    // Requires user; checks given string against the users password
    comparePassword(password) {
        var passCheck = bcrypt.compareSync(password, this.password);
        return passCheck;
    }

    findByUsername(username) {
        return r.table('users').getAll(username, {
                index: 'username'
            }).run()
            .then((result) => {
                if (typeof result[0] == "undefined") {
                    return false;
                }
                return result[0];
            });
    }


    // Finds and returns a user by their username
    findByEmail(email) {
        return r.table('users').getAll(email, {
                index: 'email'
            }).run()
            .then((result) => {
                if (typeof result[0] == "undefined") {
                    return true;
                }
                return result[0];
            });
    }

    save() {
        return r.table('users').insert({
                username: this.username,
                email: this.email,
                password: this.password,
                avatarURL: "https://www.gravatar.com/avatar/" + md5(this.email) + "?d=retro",
                subs: [],
                threads: [],
                posts: []
            }).run()
            .then(() => {
                return;
            });
    }
}

module.exports = newUser;