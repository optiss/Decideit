var Client = require('mysql').Client,
	client = new Client(),
	bcrypt = require('bcrypt');
	
// MySQL
client.user = 'decideit';
client.password = 'decideit';
client.host = 'localhost';
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
					bcrypt.compare(password, user.password, function(err, res) {
						if(res) { return done(null, user); }
						return done(null, false, { message: 'Invalid password' });
					});
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
		bcrypt.genSalt(10, function(err, salt) {
			bcrypt.hash(password, salt, function(err, crypted) {			  
				if(err) return callback(err, false);
				client.query(
					'INSERT INTO users SET name = ?, password = ?',
					[username, crypted], function(error, status) {
						if(error) { return callback(error, false); }
						user = {id:status.insertId, name:username, password:password};
						return callback(null, user);
					}
				);
			});
		});		
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
			"SELECT topic.id, topic.title, topic.asset, topic.description, opinions.header, opinions.text, opinions.user AS user_id, users.name, opinions.pro \
			FROM opinions \
			RIGHT JOIN topic ON topic.id = opinions.topic \
			LEFT JOIN users ON opinions.user = users.id \
			WHERE topic.id = " + id,
			function select(error, results, fields) {
				callback(error, results)
			}
		);
	},
	insertOpinion: function(text, user_id, topic_id, pro) {
		client.query(
		  'INSERT INTO opinions \
		  SET text = ?, user = ?, topic = ?, pro = ?',
		  [text, user_id, topic_id, pro]
		);
	},
	insertTopic: function(title, text, user_id) {
		client.query(
		  'INSERT INTO topic \
		  SET title = ?, Description = ?, user = ?',
		  [title, text, user_id]
		);		
	}
}




module.exports = db;