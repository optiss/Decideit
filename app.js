var express = require('express'),	
	handlebars = require('handlebars'),	
	passport = require('passport'),
	querystring = require("querystring"),
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


app.all('*', function(req, res, next) {
	next();
});

app.dynamicHelpers({	
	user: function(req, res) {
		return req.user;
	},
	session: function(req, res){
		return req.session;
	},
	flash: function(req, res){
		return req.flash();
	}
});

// Routes
app.get('/', function(req, res) {
	db.getLast(function(error, results) {
		function slugify(text) {
			text = text.replace(/[^-a-zA-Z0-9,&\s]+/ig, '').toLowerCase();
			text = text.replace(/-/gi, "_");
			text = text.replace(/\s/gi, "-");
			return text;
		}
		var topics = [];
		var id = null;
		results.forEach(function(item) {
			var obj = {
				id: item.topicid,
				title: item.title,
				slug: item.topicid + '-' + slugify(item.title)
			}
			if(item.topicid !== id) {
				topics.push(obj);
				id = item.topicid;
			}			
		});		
		res.render('index.html', {
			title: 'Decide it!',
			locals: {topics: topics}
		});		
	});
});

app.get('/topic/:title', function(req, res) {
	var id = req.params.title.substr(0,req.params.title.indexOf('-')) || 0;
	if (id === 0) { return res.redirect('/'); }
	db.getSingle(id, function(error, results) {
		if (results.length === 0) { return res.redirect('/'); }
		var topic = results[0];
		var pros = [];
		var cons = [];
		var count = 0;
		var pro_percent = 0;
		var con_percent = 0;
		results.forEach(function(result){
			if(result.pro !== null) {
				if(result.pro === 1) {
					pros.push(result);
				} else {
					cons.push(result);
				}
			}
			count++;
		});
		if(pros.length === 0 && cons.length === 0) {
			pro_percent = 0;
			con_percent = 0;
		} else {
			pro_percent = parseInt(pros.length / count  * 100);	
			con_percent = 100 - pro_percent
		}
		res.render('topic.html', {
			title: 'Decide it! :: ' + topic['title'],
			topic: topic,
			pros: pros,
			cons: cons,
			pro_percent: pro_percent,
			con_percent: con_percent
		});		
	});
});

app.post('/topic/:title', auth.ensureAuthenticated, function(req, res) {
	var id = req.params.title.substr(0,req.params.title.indexOf('-'));
	if(req.body.opinion_pro != undefined) {
		if(req.body.opinion_pro.length > 2) {
			db.insertOpinion(req.body.opinion_pro, req.user.id, id, '1');
		}
	}
	if(req.body.opinion_con != undefined) {
		if(req.body.opinion_con.length > 2) {
			db.insertOpinion(req.body.opinion_con, req.user.id, id, '0');
		}
	}
	res.redirect('/topic/' + req.params.title);
});

app.get('/topic', function(req, res, next) {
	res.redirect('/');
});

/* SUBMIT */
app.get('/submit', auth.ensureAuthenticated, function(req, res) {
	res.render('submit.html', {
		title: 'Decide it! :: Submit a topic',
	});
});
app.post('/submit', auth.ensureAuthenticated, function(req, res) {
	if(req.body.title.length < 20 || req.body.text.length < 20) {
		return res.render('submit.html', {
			title: 'Decide it! :: Submit a topic',
			topic: req.body.title,
			text: req.body.text,
			error: true
		});
	}
	
	db.insertTopic(req.body.title, req.body.text, req.user.id);
	return res.redirect('/');
});
/* /SUBMIT */

/* LOGIN */
app.get('/login', function(req, res) {
	res.render('login.html', {
		title: 'Decide it! :: Login',
	});
});

app.post('/login', function(req, res, next) {
	auth.authenticate(req, res, next);
});

app.get('/logout', function(req, res){
	req.logout();
	res.redirect('/');
});
/* /LOGIN */

app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);