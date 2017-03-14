var bcrypt = require('bcrypt-nodejs');
var r = require('rethinkdb');

var connection = null;
r.connect({ host: 'localhost', port: 28015 }, function(err, conn) {
    if (err) throw err;
    connection = conn;
})


class newUser { // WARNING: MAY CONTAIN RAW PASSWORD
    constructor(username, email, password, firstName, lastname) {
        this.username = username,
            this.email = email,
            this.password = password,
            this.firstName = firstName,
            this.lastname = lastname
    }

    createPassword(password) {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10), null)
    }

    comparePassword(password) {
        var passCheck = bcrypt.compareSync(password, this.password);
        return passCheck;
    }

    save() {
        r.db('shreddit').table('users').insert({
            username: this.username,
            email: this.email,
            password: this.password,
            firstName: this.firstName,
            lastname: this.lastName
        }).run(connection, function(err, result) {
            if (err) return err;
            console.log('User inserted into database.')
        });
    }
}

module.exports = newUser;