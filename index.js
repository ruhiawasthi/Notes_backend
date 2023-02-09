const bodyParser = require('body-parser');
const express = require('express')
const noteModel = require('./note')
const MongoDB = require('./services/databaseService');
const async = require('async')
const cors = require('cors');
const usermodel = require('./usermodel');
const JWT = require('jsonwebtoken')
const secretKey = process.env.JWT_SECRET
const cookieParser = require('cookie-parser');
const verify = require('./services/authService');
const bcrypt = require('bcrypt');

const app = express()
const port = 4000

const corsOptions ={
  origin: 'http://localhost:3000',
  credentials:true,
  optionSuccessStatus:200
}
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

MongoDB.start()

// signup
app.post('/api/v1/signup', (req, res) => { 
  async.auto({
      users: function (cb) {
        var userData = { email: req.body.email, password: req.body.password }
        userData.authToken = JWT.sign(userData, secretKey)

        usermodel.create(userData, (err, user) => {
          if (err) {
            return cb("Unable to signup.");
          }
          console.log(user)
          return cb(null, user);
        });
      },
    },
    function (err, results) {
      if (err) {
        return res.status(403).json({ error: err });
      }
      return res.json({ results: results.users });

    });
});

//login
app.post('/api/v1/login', (req, res) => {
  async.auto({
      users: function (cb) {
        usermodel.findOne({ email: req.body.email, password: req.body.password }, (err, user) => {

          if (err) {
            return cb("Unable to login.");
          }
          try {
            var token = JWT.sign({ email: user.email, password: user.password }, secretKey)
            return cb(null, token)
          }
          catch (err) {
            return cb(null, false)
          }
        });
      },
    },
    function (err, results) {
      if (err) {
        return res.status(403).json({ error: err });
      }
      if (!results.users) { return res.status(403).json({ results: "unable to login" }) }
      res.cookie("authToken", results.users, { httpOnly: true, expires: new Date(Date.now() + 60 * 1000 * 60 * 24) }).send(" succesfully logged in")
    }
  );
});

//logout
app.get('/api/v1/logout', (req, res) => {
  res.cookie("authToken", "", { httpOnly: true }).send("Logged out!");
});

//fetching from cloud
app.get('/api/v1/newnote', (req, res) => {
  async.auto({
    notes: function (cb) {
      noteModel.find().exec(function (err, notes) {
        if (err) {
          return cb("Unable to fetch notes.");
        }
        console.log(notes)
        return cb(null, notes);
      });
    }}, 
   function (err, results) {
    if (err) {
      return res.status(403).json({ error: err });
    }
    return res.json({ results: results.notes });
  });
});

//post api for mongodb ->inserting data
app.post("/newnotePost", async (req, res) => {
  const data = new noteModel({
    description: req.body.description,
    title: req.body.title,
  });
  const val = await data.save();
  res.send("Note Sucessfully Created");
}),

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})













