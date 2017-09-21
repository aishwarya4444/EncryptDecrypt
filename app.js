const express = require('express');
const exphbs = require('express-handlebars');
const path = require('path');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const redis = require('redis');
const crypto = require('crypto');
const secret = "cow2water";
const algorithm = "aes-256-ctr";

// create redis client
var redisClient = redis.createClient();
redisClient.on('connect', function(){
  console.log('Connected to Redis...');
});

// set port
const port = 3000;

// init app
const app = express();

// view engine
app.engine('handlebars',exphbs({defaultLayout:'main'}));
app.set('view engine','handlebars');

// body-parser
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended:false}));

// methodOverride
app.use(methodOverride('_method'));

// home page
app.get('/', function (req, res, next){
  res.render('homepage');
});

// encrypt a URL
app.get('/url/crypto-encrypt', function (req, res, next){
  res.render('crypto-encrypt');
});
app.post('/url/crypto-encrypt', function (req, res, next){
  var url = req.body.url,
    cipher = crypto.createCipher(algorithm,secret),
    shortURL = cipher.update(url, 'utf8', 'hex') + cipher.final('hex');
    redisClient.HMSET(shortURL, [
      'long_URL', url
    ], function(err, reply){
      if(err){
        console.log(err);
      }
      res.render('details', {
        url: shortURL
      });
    });    
});

// decrypt a URL using redis
app.get('/url/redis-decrypt', function (req, res, next){
  res.render('redis-decrypt');
});
app.post('/url/redis-decrypt', function (req, res, next){
  redisClient.HGETALL(req.body.url, function(err, obj){
    if(!obj){
      res.render('details', {
        error: 'URL does not exist'
      });
    } else {
      res.render('details', {
        url: obj.long_URL
      });
    }
  });
});

// decrypt a URL using crypto
app.get('/url/crypto-decrypt', function (req, res, next){
  res.render('crypto-decrypt');
});
app.post('/url/crypto-decrypt', function (req, res, next){
  var url = req.body.url,
    decipher = crypto.createDecipher(algorithm,secret),
    longURL = decipher.update(url, 'hex', 'utf8') + decipher.final('utf-8');
    res.render('details', {
      url: longURL
    });
});

app.listen(port, function(){
  console.log('Server started on port '+port);
});