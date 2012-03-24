var express = require('express'),	
	handlebars = require('handlebars'),	
	passport = require('passport'),
	auth = require('./lib/auth'),
	db = require('./lib/db.js'),
	app = express.createServer();

app.configure(function() {
	app.register('.html', require('handlebars'));
	app.set('views', __dirname + '/views');
	app.set('view engine', 'handlebars');
	app.use(express.bodyParser());
	app.use(express.cookieParser());
	app.use(express.methodOverride());
	app.use(express.session({ secret: 'your secret here' }));
	app.use(passport.initialize());
	app.use(passport.session());
	app.use(app.router);
	app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
	app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
	app.use(express.errorHandler()); 
});

// Routes
app.get('/', function(req, res) {
	db.getLast(function(error, results) {
		var topics = [];
		console.log(results);
		results.map(function(res, next) {
			console.log(res.id, next);
		});
		res.render('index.html', {
			title: 'Decide it!',
			locals: {name: 'Tomaz'}
		});
	});
});

app.get('/login', function(req, res) {
	res.render('login.html', {
		title: 'Decide it! :: Login',
	});
});

app.get('/inside', auth.ensureAuthenticated, function(req,res) {
	res.render('inside.html', {
		title: 'Decide it! :: Inside',
		locals: {user: req.user}
	});
});

app.post('/login', function(req, res, next) {
	auth.authenticate(req, res, next);
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
