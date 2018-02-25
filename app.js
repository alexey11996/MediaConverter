const express = require('express');
const multer = require('multer');
const hb = require('express-handlebars');
const path = require('path');
const jimp = require('jimp');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const storage = multer.diskStorage({
  destination : './public/uploads/',
  filename : function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage : storage,
  limits : {fileSize : 1000000},
  fileFilter : function (req, file, cb){
    checkFileType(file, cb);
  }
}).single('myimage');

function checkFileType(file, cb){
  //Allowed ext
  const filetype = /jpeg|jpg|png/;
  //Check ext
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  //Check mime
  const mimetype = filetype.test(file.mimetype);
  
  if (mimetype && extname){
    return cb(null, true)
  } else {
    cb('Error: Images Only!');
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
        class : 'alert_danger'
      });
    } else {
      if (req.file == undefined){
        res.render('img', {
          msg : 'Выберите файл!',
          class : 'alert-danger'
        });
      } else {
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

app.listen(process.env.PORT || 3000, function () {
  console.log("Server listening on port %d in %s mode", this.address().port, app.settings.env);
});