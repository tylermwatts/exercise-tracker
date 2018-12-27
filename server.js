const express = require('express')
const app = express()
const bodyParser = require('body-parser')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MLAB_URI)

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const exerciseSchema = mongoose.Schema({
  userId: {type: String},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: Date.now }
})

const userSchema = mongoose.Schema({
  userId: {type: String, required: true}
})

const EXERCISE = mongoose.model('EXERCISE', exerciseSchema);
const USER = mongoose.model('USER', userSchema);

app.route('/api/exercise/new-user/')
  .post(function(req, res, next){
    var u = new USER;
    u.userId = req.body.username;
    console.log(u)
    u.save(function (err,user){
      if (err){return next({error: err})}
      res.json(user)
    })
  })

app.get('api/exercise/users/', function(req,res,next){
  USER.find({userId: !null},function(err,users){
    if (err) return {error: err}
    res.json(users)
  })
})

app.post('/api/exercise/add/',function(req,res,next){
  USER.findOne({userId: req.body.userId}, function(err, user){
    if (err) return next({error: err})            
    var exerciseToAdd = new EXERCISE({userId: user.userId, description: req.body.description, duration: req.body.duration, date: new Date()})
    if (req.body.date){exerciseToAdd.date = new Date(req.body.date)}
    exerciseToAdd.save(function (err,data){
      if (err) return next({error: err})
      res.json(data)
    })
  })
})
  
app.get('/api/exercise/log/', (req,res,next) => {
  var logQuery = {userId: req.query.userId}
  if (req.query.from && req.query.to){logQuery.date = {$gte: new Date(req.query.from), $lt: new Date(req.query.to)}}
  if (req.query.limit){
    EXERCISE.find(logQuery,(err,data)=>{
      if (err) return next({error: err})
      res.json(data);
    }).limit(req.query.limit)
  } else {
    EXERCISE.find(logQuery,(err,data)=>{
      if (err) return next({error: err})
      res.json(data);
    })
  }
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage

  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
