var passport = require('passport'),
	LocalStrategy = require('passport-local').Strategy,
	db = require('./db.js')

passport.serializeUser(function(user, done) {
	done(null, user);
});

passport.deserializeUser(function(id, done) {
	done(null, id);
});

passport.use(new LocalStrategy(
	function(username, password, done) {
		process.nextTick(function () {
			db.fetchUser(username, password, done)						
		});
	}
));

var auth = {
	authenticate: function(req, res, next) {
		passport.authenticate('local', function(err, user, info) {
			if (err) { return next(err) }
			if (!user) {
				return res.render('login.html', {
					title: 'Decide it! :: Login',
					locals: { 
						login_error: 'Password incorrect',
						username: req.body.username
					}
				});
			}
			req.logIn(user, function(err) {
				if (err) { return next(err); }
				return res.redirect('/inside');
			});
		})(req, res, next);
	},
	ensureAuthenticated: function(req, res, next) {
		if (req.isAuthenticated()) { return next(); }
		res.redirect('/login')
	}
};


module.exports = auth;