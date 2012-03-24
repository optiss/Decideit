var Client = require('mysql').Client,
	client = new Client();
	
// MySQL
client.user = 'decideit';
client.password = 'decideit';
client.host = 'carmivore.com';
client.query('USE decideit', function(error, results) {
	if(error) {
		console.log('Database selection error: ' + error.message);
		return;
	}
});

var db = {
	// User Stuff
	fetchUser: function(username, password, done) {
		client.query(
			"SELECT * FROM users WHERE name ='" + username + "'",
			function select(error, results, fields) {
				if (error) { return done(error); }
				if(results.length == 1) {
					// We have a user, let's check password
					user = results[0];
					if (user.password != password) { return done(null, false, { message: 'Invalid password' }); }
					return done(null, user);
				}
				if(results.length == 0) {
					// No user, make a registration
					db.createUser(username, password, function(error, user) {
						return done(error, user);
					});											
				}
			}
		);
	},
	createUser: function(username, password, callback) {
		client.query(
		  'INSERT INTO users SET name = ?, password = ?',
		  [username, password], function(error, status) {
			// console.log(status.insertId);
			if(error) { return callback(error, false); }
			user = {id:status.insertId, name:username, password:password};
			return callback(null, user);
		}
		);
	},
	// Opinion Stuff
	
	getLast: function(callback) {
		client.query(
			"SELECT * FROM topic LEFT OUTER JOIN opinions ON topic.id = opinions.topic ORDER BY topic.id DESC",
			function select(error, results, fields) {
				callback(error, results);
			}
		);
	}
}




module.exports = db;