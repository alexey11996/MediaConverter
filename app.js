const express = require('express');
const multer = require('multer');
const hb = require('express-handlebars');
const path = require('path');
const jimp = require('jimp');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
var fs = require('fs'); 
var parse = require('csv-parse');
var matem = require('mathjs');
var cp = require('child_process');
var zipFolder = require("zip-folder");

const storage = multer.diskStorage({
  destination : './public/uploads/',
  filename : function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const storageCSV = multer.diskStorage({
  destination : './public/csv_image/',
  filename : function(req, file, cb){
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const storageAudio = multer.diskStorage({
  destination : './public/audio/',
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

const upload_csv = multer({
  storage : storageCSV,
  fileFilter : function (req, file, cb){
    checkCSV(file, cb);
  }
}).single('mycsv');

const upload_audio = multer({
  storage : storageAudio,
  fileFilter : function (req, file, cb){
    checkAudio(file, cb);
  }
}).single('myAudio');

function checkFileType(file, cb){
  const filetype = /jpeg|jpg|png|/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetype.test(file.mimetype);
  
  if (mimetype && extname){
    return cb(null, true)
  } else {
    cb('Только изображения!');
  }
}

function checkCSV(file, cb){
  const filetype = /csv|xlsx|/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetype.test(file.mimetype);
  
  if (mimetype && extname){
    return cb(null, true)
  } else {
    cb('Только CSV формат!');
  }
}

function checkAudio(file, cb){
  const filetype = /wav|mp3|/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetype.test(file.mimetype);
  
  if (mimetype && extname){
    return cb(null, true)
  } else {
    cb('Только аудио формат!');
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

app.get('/uploadaudio', (req, res) => res.render('audio'));

app.post('/uploadaudio', (req, res) => {
  upload_audio(req, res, (err) => {
    if (err) {
      res.render('audio', {
        msg : err,
        class : 'alert-danger'
      });
    } else {
      if (req.file == undefined){
        res.render('audio', {
          msg : 'Выберите файл!',
          class : 'alert-danger'
        });
      } else {        
        res.render('audio', {
          msg : 'Файл добавлен! Прослушайте запись и выберете интервал',
          class : 'alert-success',
          file : `audio/${req.file.filename}`
        });
      }
    }
  })
})

app.post('/audioDiagram', (req, res) => {
  var sec;
  var messg;
  var audioName = req.body.audioName;
  var folder = (audioName.split("/")[1]).split(".")[0];
  //console.log(folder);
  var StartTime = Math.floor(req.body.StartTime);
  var EndTime = Math.floor(req.body.EndTime);
  var diff = EndTime - StartTime;
  console.log(diff);
  if (diff < 10) {
    sec = 3000; 
    messg = `Скачивание начнется через 3 секунды`;
  } else {
    sec = 5000; 
    messg = `Скачивание начнется через 5 секунд`;
  }
  if (StartTime <= 0 ){
    res.render('audio', {
      msg : 'Некорректный интервал! Попробуйте снова',
      class : 'alert-danger'
    });
  } else {
    var file_path = `D:/imgselect/public/${audioName}`;
    var par_path = `D:/imgselect/public/csv_audio`;    

    cp.exec(`ConsoleApp1 ${file_path} ${par_path} ${StartTime} ${EndTime}`, function(e, stdout, stderr) { })

    res.render('audio', {
      msg : `${messg}`,
      class : 'alert-success',
      folderName : `${folder}`,
      seconds : `${sec}`
    });
  }
})

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
        var vector = [];
        var csvData=[];
        //var maximum;
        var row = fs.createReadStream(`public/csv_image/${req.file.filename}`)
            .pipe(parse({delimiter: ','}))
            .on('data', function(csvrow) {
                csvData.push(csvrow);        
            })
            .on('end', function() {
            for(var i = 0; i < csvData.length; i++) vector = vector.concat(csvData[i]);
            //maximum = max(vector)
            res.render('img_csv', {
              msg : 'Файл добавлен! Характеристики файла представлены ниже',
              class : 'alert-success',
              result: {
                "Максимальное значение" : `${max(vector)}`,
                "Минимальное значение" : `${min(vector)}`,
                "Максимальная амплитуда значений" : `${range(vector)}`,
                "Сумма элементов" : `${sum(vector)}`,
                "Дисперсия" : `${variance(vector)}`,
                "Среднеквадратическое отклонение" : `${standardDeviation(vector)}`,
                "Среднее значение" : `${mean(vector)}`,
                "Медиана" : `${median(vector)}`,
                "Мода" : `${modes(vector)}`
              }
            });
          });
          // row.on('error', function(err) {
          //   res.render('img_csv', {
          //     msg : 'Некорректный файл!',
          //     class : 'alert-danger'
          //   });
          // });
        }
      }
    })
})

app.listen(process.env.PORT || 3000, function () {
  console.log("Server listening on port %d in %s mode", this.address().port, app.settings.env);
});

function max (array) {
  return Math.max.apply(null, array);
}

function min (array) {
  return Math.min.apply(null, array);
  }
  
function range (array) {
  return max(array) - min(array);
  }
  
  function sum (array) {
  var num = 0;
  for (var i = 0; i < array.length; i++) num += Number(array[i]);
  return num;
  }
  
function variance (array) {
  var mean = matem.mean(array);
  return matem.mean(array.map(function(num) {
    return Math.pow(num - mean, 2);
  }));
}

  function standardDeviation (array) {
  return Math.sqrt(variance(array));
  }

  function mean (array) {
  return sum(array) / array.length;
}

function median (array) {
  array.sort(function(a, b) {
    return a - b;
  });
  var mid = Number(array.length) / 2;
  return mid % 1 ? Number(array[mid - 0.5]) : (Number(array[mid - 1]) + Number(array[mid])) / 2;
  }
  
  function modes (array) {
  if (!array.length) return [];
  var modeMap = {},
    maxCount = 0,
    modes = [];

  array.forEach(function(val) {
    if (!modeMap[val]) modeMap[val] = 1;
    else modeMap[val]++;

    if (modeMap[val] > maxCount) {
      modes = [val];
      maxCount = modeMap[val];
    }
    else if (modeMap[val] === maxCount) {
      modes.push(val);
      maxCount = modeMap[val];
    }
  });
  return modes;
}