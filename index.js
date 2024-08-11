const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

let bodyParser = require('body-parser');
let mongoose = require('mongoose');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });

const Schema = mongoose.Schema;

//User Schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true
  }
})
let userModel = mongoose.model('user', userSchema);

//Exercise
const exerciseSchema = new Schema({
  userId: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  duration: {
    type: Number,
    required: true
  },
  date: {
    type: Date,
    default: new Date()
  }
})
let exerciseModel = mongoose.model('exercise', exerciseSchema);

app.use(cors())
app.use(express.static('public'))
app.use("/", bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', (req, res) => {
  let username = req.body.username;
  let newUser = new userModel({ username: username });
  newUser.save();
  res.json(newUser);
})

app.get('/api/users', (req, res) => {
  userModel.find({}).then((users) => {
    res.json(users);
  })
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  let userId = req.params._id;

  exerciseObj = {
    userId: userId,
    description: req.body.description,
    duration: req.body.duration
  }

  if (req.body.date != '') {
    exerciseObj.date = req.body.date;
  }

  let newExercise = new exerciseModel(exerciseObj);

  try {
    const userFound = await userModel.findById(userId);
    await newExercise.save();
    res.json({
      _id: userFound._id,
      username: userFound.username,
      description: newExercise.description,
      duration: newExercise.duration,
      date: new Date(newExercise.date).toDateString()
    });
  } catch (err) {
    console.log(err);
    res.status(500).send('Error processing the request');
  }
});

app.get('/api/users/:_id/logs', async (req, res) => {
  let fromParam = req.query.from;
  let toParam = req.query.to;
  let limitParam = req.query.limit;
  let userId = req.params._id;

  limitParam = limitParam ? parseInt(limitParam) : undefined;

  try {
    const userFound = await userModel.findById(userId);

    let queryObj = { userId: userId };

    if (fromParam || toParam) {
      queryObj.date = {};
      if (fromParam) {
        queryObj.date['$gte'] = new Date(fromParam);
      }
      if (toParam) {
        queryObj.date['$lte'] = new Date(toParam);
      }
    }

    const exercises = await exerciseModel.find(queryObj).limit(limitParam).exec();

    let resObj = {
      _id: userFound._id,
      username: userFound.username,
      count: exercises.length,
      log: exercises.map((x) => ({
        description: x.description,
        duration: x.duration,
        date: new Date(x.date).toDateString() // Ensure the date is in dateString format
      }))
    };

    res.json(resObj);
  } catch (err) {
    console.log(err);
    res.status(500).send('Error processing the request');
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
