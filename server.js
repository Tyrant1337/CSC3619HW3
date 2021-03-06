var express = require('express');
var bodyParser = require('body-parser');
var passport = require('passport');
var authJwtController = require('./auth_jwt');
var User = require('./Users');
var jwt = require('jsonwebtoken');
var Movie = require('./Movie');

var app = express();
module.exports = app; // for testing
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use(passport.initialize());

var router = express.Router();

router.route('/postjwt')
    .post(authJwtController.isAuthenticated, function (req, res) {
            console.log(req.body);
            res = res.status(200);
            if (req.get('Content-Type')) {
                console.log("Content-Type: " + req.get('Content-Type'));
                res = res.type(req.get('Content-Type'));
            }
            res.send(req.body);
        }
    );

router.route('/users/:userId')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.userId;
        User.findById(id, function(err, user) {
            if (err) res.send(err);
            var userJson = JSON.stringify(user);
            res.json(user);
        });
    });


router.post('/signup', function(req, res) {
    if (!req.body.username || !req.body.password) {
        res.json({success: false, msg: 'Please enter username and password.'});
    }
    else {
        var user = new User();
        user.name = req.body.name;
        user.username = req.body.username;
        user.password = req.body.password;
        user.save(function(err) {
            if (err) {
                // duplicate entry
                if (err.code == 11000)
                    return res.json({ success: false, message: 'A account with that user name already exists please try a new one. '});
                else
                    return res.send(err);
            }

            res.json({ success: true, message: 'User has been created succesfully' });
        });
    }
});

router.route('/users')
    .get(authJwtController.isAuthenticated, function (req, res) {
        User.find(function (err, users) {
            if (err) res.send(err);
            res.json(users);
        });
    });

router.route('/Movie/:moviesid')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var id = req.params.moviesid;
        Movie.findById(id, function (err, movie) {
            if (err) res.send(err);
            var movieJson = JSON.stringify(movie);
            res.json(movieJson);
        })
    });

router.route('/Movie/:movietitle')
    .get(authJwtController.isAuthenticated, function (req, res) {
        var title = req.params.movietitle;
        Movie.findBytitle(title, function (err, movie) {
            if (err) res.send(err);
            var movieJson = JSON.stringify(movie);
            res.json(movieJson);
        })
    });

router.route('/Movie')
    .get(authJwtController.isAuthenticated, function (req, res) {
        Movie.find(function (err, movies) {
            if(err) res.send(err);
            res.json(movies);
        })
    });
router.route('/Movie/:id')
    .put(authJwtController.isAuthenticated, function (req, res) {
        var conditions = {_id: req.params.id};
        Movie.updateOne(conditions, req.body)
            .then(mov => {
                if (!mov) {
                    return res.status(404).end();
                }
                return res.status(200).json({msg: "Movie has been updated in the Database"})
            })
            .catch(err => next(err))
    });

router.route('/Movies')
    .delete(authJwtController.isAuthenticated, function (req, res){
        Movie.findOneAndDelete({title: req.body.title}, function (err, movie) {
            if (err)
            {
                res.status(400).json({msg: err})
            }
            else if(movie == null)
            {
                res.json({msg : "Movie was not found please try a new Movie"})
            }
            else
                res.json({msg :"The movie was deleted from the Database"})
        })
    });

router.route('/Movies')
    .post(authJwtController.isAuthenticated, function (req, res) {
        console.log(req.body);
        var movies = new Movie();
        movies.title = req.body.title;
        movies.YearRelease = req.body.YearRelease;
        movies.genre = req.body.genre;
        movies.Actors = req.body.Actors;
        movies.save(function (err) {
            if (err) {
                if (err.Code == 11000)
                    return res.JSON({success: false, message: 'A movie with that name already exists please try a new name. '});
                else
                    return res.send(err);
            }
            res.json({success: true, message: 'Movie has been saved.'})
        });
    });

router.post('/signin', function(req, res) {
    var userNew = new User();
    userNew.name = req.body.name;
    userNew.username = req.body.username;
    userNew.password = req.body.password;

    User.findOne({username: userNew.username}).select('name username password').exec(function (err, user) {
        if (err) res.send(err);

        user.comparePassword(userNew.password, function (isMatch) {
            if (isMatch) {
                var userToken = {id: user._id, username: user.username};
                var token = jwt.sign(userToken, process.env.SECRET_KEY);
                res.json({success: true, token: 'JWT ' + token});
            } else {
                res.status(401).send({success: false, msg: 'Authentication failed, Wrong password or username please try again.'});
            }
        });
    });
    router.all('*', function (res, req) {
        req.json({error: 'Does not support the HTTP method'});
    });
});
app.use('/', router);
app.listen(process.env.PORT || 8080);