const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Bring in User Model
let User = require('../models/user');

// Register Form
router.get('/register', (req, res) => {
  res.render('register', {
    title: 'Rejestracja użytkownika'
  });
});

// Register
router.post('/register', (req, res) => {
  let username = req.body.username;
  let email = req.body.email;
  let password = req.body.password;
  let password2 = req.body.password2;

  req.checkBody('username', 'Podaj nazwę użytkowanika.').notEmpty();
  req.checkBody('email', 'Podaj adres email.').notEmpty();
  req.checkBody('email', 'Nieodpowiedni adres email.').isEmail();
  req.checkBody('password', 'Podaj hasło.').notEmpty();
  req.checkBody('password2', 'Błąd potwierdzenia hasła.').equals(req.body.password);

  let errors = req.validationErrors();
  if(errors){
    res.render('register', {
      title: 'Rejestracja użytkownika',
      errors: errors
    });
  }
  else{
    let newUser = new User({
      username: username,
      email: email,
      password: password
    });

    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(newUser.password, salt, (err, hash) => {
        if(err){
          console.log(err);
        }
        else{
          newUser.password = hash;
          newUser.save((err) => {
            if(err){
              console.log(err);
              return;
            }
            else{
              req.flash('success', 'Zarejestrowano poprawnie!');
              res.redirect('/users/login');
            }
          });
        }
      });
    });
  }
});

// Login Form
router.get('/login', (req, res) => {
  res.render('login', {
    title: 'Logowanie użytkownika'
  });
});

// Login
router.post('/login', (req, res, next) => {
  passport.authenticate('local', {
    successRedirect: '/',
    successFlash: 'Zalogowano poprawnie!',
    failureRedirect: '/users/login',
    failureFlash: 'Błędny login lub hasło.'
  })(req, res, next);
});

// logout
router.get('/logout', (req, res) => {
  req.logout();
  req.flash('success', 'Wylogowano poprawnie!');
  res.redirect('/users/login');
});

module.exports = router;
