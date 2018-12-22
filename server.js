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
  date: {type: Date, required: false}
})

const userSchema = mongoose.Schema({
  userId: {type: String, required: true},
  exercises: {type: []}
})

const USER = mongoose.model('USER', userSchema);
const EXERCISE = mongoose.model('EXERCISE', exerciseSchema);

app.route('/api/exercise/new-user/')
  .post(function(req, res){
  let u = new USER;
  u.userId = req.body.username;
  console.log(u)
  u.save(function (err,user){
    if (err){return res.json({"error": err})}
    return res.json(user)
  })
})

app.post('/api/exercise/add/',function(req,res){
  USER.find({userId: req.body.userId}, function(err, user){
    if(err){return res.json({"error": err})}
    user.exercises.push(new EXERCISE({userId: req.body.userId, description: req.body.description, duration: req.body.duration, date: new Date(req.body.date)}))
    res.send("Exercise added for " + user.userId);
  })
})
  
app.get('/api/exercise/log/',function(req,res){
  EXERCISE.find({userId: req.query.userId}, {date: {$gte: new Date(req.query.from), $lt: new Date(req.query.to)}}).limit(req.query.limit)
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
