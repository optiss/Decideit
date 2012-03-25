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
			"select topic.id as topicid, topic.title, topic.description, topic.asset, topic.user as topicuser, \
			opinions.id as opinionsid, header , text, opinions.user as opinionsuser, topic,pro from topic left outer join opinions \
			on topic.id = opinions.topic \
			order by topic.id desc",
			function select(error, results, fields) {
				callback(error, results);
			}
		);
	},
	getSingle: function(id, callback) {
		client.query(
			"select * from topic, opinions \
			where opinions.topic = topic.id and topic.id = " + id,
			function select(error, results, fields) {
				callback(error, results)
			}
		);
	}
}




module.exports = db;