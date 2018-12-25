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
  userId: {type: String, required: true},
  exercises: [{type: exerciseSchema}]
})

const EXERCISE = mongoose.model('EXERCISE', exerciseSchema);
const USER = mongoose.model('USER', userSchema);

app.route('/api/exercise/new-user/')
  .get(function (req, res){
    USER.find(function(err,users){
      if (err){return {"error": err}}
      res.send(users)
    })
  })
  .post(function(req, res){
    USER.find
    var u = new USER;
    u.userId = req.body.username;
    console.log(u)
    u.save(function (err,user){
      if (err){return res.json({"error": err})}
      res.json(user)
    })
  })

app.post('/api/exercise/add/',function(req,res){
  USER.findOne({userId: req.body.userId}, function(err, user){
    if(err){return res.json({"error": err})}
    var exerciseToAdd = new EXERCISE({userId: req.body.userId, description: req.body.description, duration: req.body.duration, date: new Date(req.body.date)})
    user.exercises.push(exerciseToAdd)
    user.save(function (err,user){
      if (err){return {"error": err}}
      res.send(req.body.description + " added for " + req.body.userId)
    })
  })
})
  
app.get('/api/exercise/log/',function(req,res){
  var logQuery = {userId: req.query.userId}
  if (req.query.from && req.query.to){logQuery.date = {$gte: req.query.from, $lt: req.query.to}}
  EXERCISE.find(logQuery,function(err,exercises){
    if (err) return {error: err}
    var userObj = {userId: req.query.userId}
    if (req.query.limit){
      userObj.exercises = exercises.map(d => {
        return ({description: d.description, duration: d.duration, date: d.date}).slice(0, req.query.limit+1)
      })
    } else {
      userObj.exercises = exercises.map(d => {
        return ({description: d.description, duration: d.duration, date: d.date})
      })
    }
    userObj.logLength = userObj.exercises.length;
    res.json(userObj);
  })
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
