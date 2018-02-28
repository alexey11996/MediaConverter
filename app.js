const express = require('express');
const multer = require('multer');
const hb = require('express-handlebars');
const path = require('path');
const jimp = require('jimp');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const PP = require('papaparse');
//const fetch = require('node-fetch');

const storage = multer.diskStorage({
  destination : './public/uploads/',
  filename : function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const storageCSV = multer.diskStorage({
  destination : './public/csv/',
  filename : function(req, file, cb){
    cb(null, file.originalname);
  }
});

const upload = multer({
  storage : storage,
  limits : {fileSize : 1000000},
  fileFilter : function (req, file, cb){
    checkFileType(file, cb);
  }
}).single('myimage');

const upload_csv = multer({
  storage : storageCSV,
  fileFilter : function (req, file, cb){
    checkCSV(file, cb);
  }
}).single('mycsv');

function checkFileType(file, cb){
  //Allowed ext
  const filetype = /jpeg|jpg|png|/;
  //Check ext
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  //Check mime
  const mimetype = filetype.test(file.mimetype);
  
  if (mimetype && extname){
    return cb(null, true)
  } else {
    cb('Только изображения!');
  }
}

function checkCSV(file, cb){
  //Allowed ext
  const filetype = /|csv|/;
  //Check ext
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  //Check mime
  const mimetype = filetype.test(file.mimetype);
  
  if (mimetype && extname){
    return cb(null, true)
  } else {
    cb('Только CSV формат!');
  }
}

const app = express();
app.engine('handlebars', hb({defaultLayout:'layout'}));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => res.render('index'));

app.get('/uploadimg', (req, res) => res.render('img'));

app.post('/uploadimg', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.render('img', {
        msg : err,
        class : 'alert-danger'
      });
    } else {
      if (req.file == undefined){
        res.render('img', {
          msg : 'Выберите файл!',
          class : 'alert-danger'
        });
      } else {
        // Здесь добавить путь в БД (в будущем)
        res.render('img', {
          msg : 'Файл добавлен! Выделите необходимую область и подтвердите выделение',
          class : 'alert-success',
          file : `uploads/${req.file.filename}`
        });
      }
    }
  })
})

app.post('/imgprocess', (req, res) =>{
  mydate = Date.now()
  var imgName = req.body.name;
  var x1 = Number(req.body.x1);
  var y1 = Number(req.body.y1);
  var w = Number(req.body.w);
  var h = Number(req.body.h);
  jimp.read('public/'+imgName, (err, image) => {
    if (err) {
      res.render('img', {
        msg : err,
        class : 'alert-danger'
      });
    } else {
      image.crop(x1, y1, w, h)
      .quality(100)
      .write('public/uploads/edited-'+ mydate + '-.jpeg')
      res.render('img', {
        pth: `uploads/edited-${mydate}-.jpeg`
      })
    }
  })
});

app.get('/uploadcsv', (req, res) => res.render('img_csv'))

app.post('/uploadcsv', (req, res) => {
  upload_csv(req, res, (err) => {
    if (err) {
      res.render('img_csv', {
        msg : err,
        class : 'alert-danger'
      });
    } else {
      if (req.file == undefined){
        res.render('img_csv', {
          msg : 'Выберите файл!',
          class : 'alert-danger'
        });
      } else {
        // Здесь добавить путь в БД (в будущем)
        
        res.render('img_csv', {
          msg : 'Файл добавлен!',
          class : 'alert-success'
        });
      }
    }
  })
})

app.listen(process.env.PORT || 3000, function () {
  console.log("Server listening on port %d in %s mode", this.address().port, app.settings.env);
});