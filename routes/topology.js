const express = require('express');
const router = express.Router();
const parseString = require('xml2js').parseString;
const fs = require('fs');
const formidable = require('formidable');

// Bring in Models
let Scan = require('../models/scan');
let User = require('../models/user');

// Topolgies list Router
router.get('/list', ensureAuthenticated, (req, res) => {
  Scan.find({}, (err, scans) => {
    if(err) {
      console.log(err)
    }
    else {
      res.render('list', {
        title: 'Lista topologii:',
        topologies: scans
      });
    }
  });
});

// Add Topology Route
router.get('/add', ensureAuthenticated, (req, res) => {
  res.render('add_topology', {
    title: 'Dodaj plik skanu'
  });
});

// Add Topology Submit
router.post('/add', (req, res) => {
  let scan = new Scan();

  // Upload file from form
  let form = new formidable.IncomingForm();

  form.parse(req, (err, fields, files) => {
    if(err){
      console.log(err);
    }
    else{
      req.body = fields;
      req.assert('scanTitle', 'Tytuł jest wymagany!').notEmpty();
      req.assert('scan', 'Dodaj plik skanu w formacie XML!').isXML(files.scan.name);

      // Get errors
      let errors = req.validationErrors();
      if(errors){
        res.render('add_topology', {
          title: 'Dodaj plik skanu',
          errors: errors
        });
      }
      else{
        let scanTitle = fields.scanTitle;
        let oldpath = files.scan.path;
        let newpath = './public/upload/newscan.xml';
        fs.rename(oldpath, newpath, (err) => {
          if(err){
            console.log(err);
          }
          else{
            openFile(newpath, scanTitle);
          }
        });
      }
    }
  });

  // Get XML file and parse to JSON
  function openFile(path, scanTitle) {
    fs.readFile(path, 'utf8', (err, data) => {
      if(err){
        console.log(err);
      }
      else{
        parseString(data, (err, res) => {
          if(err){
            console.log(err);
          }
          else{
            saveData(res, scanTitle)
          }
        });
      }
    });
  }

  // Pick up interesting data (ips, mac, vendors...) and define localhost
  function saveData(data, scanTitle){
    let localhost = {}, hosts = {};

    for(let i in data.nmaprun.host){
      if(data.nmaprun.host[i].status[0].$.reason == 'localhost-response'){
        Object.defineProperties(localhost,{
          'ip': {
            writable: true,
            enumerable: true,
            value: data.nmaprun.host[i].address[0].$.addr
          },
          'hostname': {
            writable: true,
            enumerable: true,
            value: data.nmaprun.host[i].hostnames[0].hostname[0].$.name
          }
        });
      }
      else{
        // Iterate through port obj, build ports
        let ports = {};
        for(let j in data.nmaprun.host[i].ports[0].port){
          let portname = j;
          Object.defineProperties(ports,{
            [portname]: {
              writable: true,
              enumerable: true,
              value: {
                'service': data.nmaprun.host[i].ports[0].port[j].service[0].$.name,
                'portNum': data.nmaprun.host[i].ports[0].port[j].$.portid
              }
            }
          });
        }

        // Build hosts object
        let hostname = i;
        Object.defineProperties(hosts,{
          [hostname]: {
            writable: true,
            enumerable: true,
            value: {
              'ip': data.nmaprun.host[i].address[0].$.addr,
              'hostname': data.nmaprun.host[i].hostnames[0].hostname[0].$.name,
              'mac': data.nmaprun.host[i].address[1].$.addr,
              'vendor': data.nmaprun.host[i].address[1].$.vendor,
              'ports': ports
            }
          }
        });
      }
    }

    // Save data to db
    scan.scanTitle = scanTitle;
    scan.scanAuthor = req.user._id;
    scan.scanDate = data.nmaprun.$.startstr;
    scan.localhost = localhost;
    scan.hosts = hosts;

    scan.save((err) => {
      if(err){
        console.log(err);
      }
      else{
        req.flash('success', 'Dodano: '+scan.scanTitle);
        res.redirect('/topology/list');
      }
    });
  }
});

// Edit Topology Route
router.get('/edit/:id', ensureAuthenticated, (req, res) => {
  Scan.findById(req.params.id, (err, scan) => {
    if(scan.scanAuthor != req.user._id){
      req.flash('danger', 'Błąd autoryzacji!');
      res.redirect('/');
    }
    res.render('edit_topology', {
      title: 'Edytuj topologię',
      topology: scan
    });
  });
});

// Edit Topology Submit
router.post('/edit/:id', (req, res) => {
  let scan = req.body;

  let query = {_id:req.params.id};

  Scan.update(query, scan, (err) => {
    if(err){
      console.log(err);
    }
    else{
      req.flash('success', 'Zaktualizowano: '+scan.scanTitle);
      res.send('Success');
    }
  });
});

// Delete Topology
router.delete('/:id', (req, res) => {
  if(!req.user._id){
    res.status(500).send();
    req.flash('danger', 'Błąd autoryzacji!');
  }

  let query = {_id:req.params.id};

  Scan.findById(req.params.id, (err, scan) => {
    if(scan.scanAuthor != req.user._id){
      res.status(500).send();
    }
    else{
      Scan.remove(query, (err) => {
        if(err){
          console.log(err);
        }
        res.send('Success');
      });
    }
  });
});

// Get single Topology
router.get('/:id', ensureAuthenticated, (req, res) => {
  Scan.findById(req.params.id, (err, scan) => {
    User.findById(scan.scanAuthor, (err, user) => {
      res.render('topology', {
        author: user.username,
        topology: scan
      });
    });
  });
});

// Get request for topology obj from db
router.get('/:id/db', (req, res) => {
  Scan.findById(req.params.id, (err, scan) => {
    res.json(scan);
  });
});

// Access control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  else{
    req.flash('danger', 'Użytkownik niezalogowany!');
    res.redirect('/users/login');
  }
}

module.exports = router;
