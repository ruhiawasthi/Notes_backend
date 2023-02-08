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


// JWT
//New user registration
app.post('api/v1/addNewUser', async (req, res) => {
  const data = new usermodel({
    user: req.body.user,
    password: req.body.password,
    CREATEDAT: req.body.CREATEDAT,
    // authToken:req.JWT.authToken
  });
  const val = await data.save();
  res.send("User created")

})


app.get('api/v1/newUser', (req, res) => {
  async.auto(
    {
      notes: function (cb) {
        noteModel.find().exec(function (err, noteDocs) {
          if (err) {
            // console.log("not getting noteDocs")
            return cb("Unable to fetch notes.");
          }
          return cb(null, noteDocs);
        });
      },

      user: function (cb) {
        usermodel.find().exec(function (err, userDocs) {
          if (err) {
            // console.log("unable to  get userDoc")
            return cb("Unable to fetch notes.");
          }
          return cb(null, userDocs);
        });
      },
    },

    function (err, results) {
      if (err) {
        return res.status(403).json({ error: err });
      }
      console.log(results);
      return res.send(results.notes.concat(results.user));
      // return res.json({results:results.user});

    }
  );
});

// signup
app.post('api/v1/signup', (req, res) => {
  
  async.auto(
    {
      users: function (cb) {
        var userData = { email: req.body.email, password: req.body.password }
        userData.authToken = JWT.sign(userData, secretKey)

        usermodel.create(userData, (err, user) => {
          if (err) {
            return cb("Unable to signup.");
          }
          console.log(user)
          return cb(null, user);
        }

        );
      },
    },
    function (err, results) {
      if (err) {
        return res.status(403).json({ error: err });
      }
      return res.json({ results: results.users });

    }
  );
});


//login
app.post('api/v1/login', (req, res) => {
  async.auto(
    {
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
        }

        );
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
app.get('api/v1/logout', (req, res) => {
  res.cookie("authToken", "", { httpOnly: true }).send("Logged out!");
});


//fetching from cloud
app.get('/newnote', verify,(req, res) => {
  async.auto({
    notes: function (cb) {
      noteModel.find().exec(function (err, notes) {
        if (err) {
          return cb("Unable to fetch notes.");
        }
        console.log(notes)
        return cb(null, notes);
      });
    }
  }, function (err, results) {
    if (err) {
      return res.status(403).json({ error: err });
    }
    return res.json({ results: results.notes });
  });
});

// testing login
/*
app.post('/login', (req, res) => {
  const password = req.body.password;
  async.auto(
    {     
      users: function (cb) {
        usermodel.findOne({ email: req.body.email}, (err, user) => {

          if (err) {
            return cb(err);
          }
          if (!user || !user.authToken) {
            return cb("Unable to find user token.");
          }

          return(null, user);
        });
      },
      checkPassword:['users',function(results, cb){
        bcrypt.compare(password, results.users.password).then((result) =>{
          
            if(result){
              try {
                   var token = JWT.sign({ email: results.users.email, password: results.users.password }, secretKey)
                   return cb(null, token)
              }
              catch (err) {
                   return cb(null, false)
              }
               return cb("Invalid credentials");
            }
            return cb("Invalid credentials");         
      });

      }],
    },
    function (err, results) {
      if (err) {
        return res.status(403).json({ error: err });
      }
      if (!results.users) { 
        return res.status(403).json({ results: "unable to login" }) 
      }

      res.cookie("authToken", results.checkPassword, { httpOnly: true, expires: new Date(Date.now() + 60 * 1000 * 60 * 24) }).send(" Succesfully logged in.");
    });
});

//Testing hash in signup

app.post('/signup', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;


  async.auto({
    hashedPassword: function (cb) {
       bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(password, salt, function (err, hash) {
             if (err) {
               return cb(err);
              }
              console.log("hash", hash);
              return cb(null, hash);       
            });
        })

    },
    users: ['hashedPassword', function (results, cb) {
      var userData = { email: req.body.email, password: results.hashedPassword }
      userData.authToken = JWT.sign(userData, secretKey)

      usermodel.create(userData, (err, user) => {
        if (err) {
          return cb("Unable to signup.");
        }
        console.log(user)
        return cb(null, user);
      }

      );
    }],
  },
    function (err, results) {
      if (err) {
        return res.status(403).json({ error: err });
      }
      return res.json({ results: results.users });

    }
  );
});

*/

//post api for mongodb ->inserting data
app.post("/newnotePost", async (req, res) => {
  const data = new noteModel({
    description: req.body.description,
    title: req.body.title,
  });

  const val = await data.save();

  res.send("Note Sucessfully Created");
}),

  //post api for local database
  app.post('/new', (req, res) => {
    var note = req.body && req.body.note || {};
    console.log("note: ", note)
    console.log("check: ", (!note))
    var description = note.description || false;
    var title = note.title || false;
    var error = {};

    if (!(!!note)) {
      console.log("val", note)
      error.note = "Note is not provided";
      res.status(403).json(error);
    }

    if (!description) {
      error.description = "Please add descp";
    }

    if (!title) {
      error.title = "Please add title";
    }

    if (error) {
      res.status(403).json(error);
    }
    var notes = db.notes
    var note = req.body.note

    notes.push(note)
    fs.writeFile("db.json", JSON.stringify({ notes: notes }), () => { })

    res.send({
      "result": "created successfully",
    })
  })

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})













