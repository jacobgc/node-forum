var r = require("../db");
var bcrypt = require('bcrypt-nodejs');
var md5 = require('md5');

class newUser {
    constructor(username, email, password) {
        this.username = username,
            this.email = email,
            this.password = password;
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
        console.log(username);
        return r.table('users').getAll(username, { index: 'username' }).run()
            .then((result) => {
                console.log(result);
                if (typeof result[0] == "undefined") {
                    return true;
                }
                result[0].password = null;
                return result[0];
            });
    }

    // Finds and returns a user by their username
    findByEmail(email) {
        return r.table('users').getAll(email, { index: 'email' }).run()
            .then((result) => {
                if (typeof result[0] == "undefined") {
                    return true;
                }
                result[0].password = null;
                return result[0];
            });
    }

    save() {
        return r.table('users').insert({
                username: this.username,
                email: this.email,
                password: this.password,
                avatarURL: "https://www.gravatar.com/avatar/" + md5(this.email) + "?d=retro"
            }).run()
            .then(() => {
                console.log("User:" + this.username + ", inserted into the database");
                return;
            });
    }
}

module.exports = newUser;