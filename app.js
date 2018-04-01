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
var AdmZip = require('adm-zip');
var jpeg = require('jpeg-js');
//var detect = require('detect-csv')
//var aud_Buff = require('audio-buffer');

const storage = multer.diskStorage({
  destination: './public/uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const storageCSV = multer.diskStorage({
  destination: './public/csv_image/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const storageAudio = multer.diskStorage({
  destination: './public/audio/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const storageVideo = multer.diskStorage({
  destination: './public/video/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 1000000 },
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}).single('myimage');

const upload_csv = multer({
  storage: storageCSV,
  fileFilter: function (req, file, cb) {
    checkCSV(file, cb);
  }
}).single('mycsv');

const upload_audio = multer({
  storage: storageAudio,
  fileFilter: function (req, file, cb) {
    checkAudio(file, cb);
  }
}).single('myAudio');

const upload_video = multer({
  storage: storageVideo,
  fileFilter: function (req, file, cb) {
    checkVideo(file, cb);
  }
}).single('myVideo');

function checkFileType(file, cb) {
  const filetype = /jpeg|jpg|png/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetype.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb('Только изображения!');
  }
}

function checkCSV(file, cb) {
  const filetype = /csv/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  //const mimetype = filetype.test(file.mimetype);

  if (/*mimetype && */extname) {
    return cb(null, true)
  } else {
    cb('Только CSV формат!');
  }
}

function checkAudio(file, cb) {
  const filetype = /wav|mp3/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetype.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb('Только аудио формат!');
  }
}

function checkVideo(file, cb) {
  const filetype = /zip/;
  const extname = filetype.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetype.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true)
  } else {
    cb('Только Zip архив!');
  }
}

const app = express();
app.engine('handlebars', hb({ defaultLayout: 'layout' }));
app.set('view engine', 'handlebars');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.get('/', (req, res) => res.render('index'));

app.get('/uploadimg', (req, res) => res.render('img'));

app.get('/uploadaudio', (req, res) => res.render('audio'));

app.get('/uploadvideo', (req, res) => res.render('video'));

app.post('/uploadvideo', (req, res) => {
  upload_video(req, res, (err) => {
    if (err) {
      res.render('video', {
        msg: err,
        class: 'alert-danger'
      });
    } else {
      if (req.file == undefined) {
        res.render('video', {
          msg: 'Выберите нужный архив!',
          class: 'alert-danger'
        });
      } else {
        var arr = [];
        var pth = path.normalize(`${__dirname}/public/video/${req.file.filename}`)
        const stats = fs.statSync(pth)
        const fileSizeInBytes = stats.size
        //Convert the file size to megabytes (optional)
        const fileSizeInMegabytes = fileSizeInBytes / 1000000.0
        //console.log(pth)
        var zip = new AdmZip(pth);
        zip.extractAllTo(`${__dirname}/public/video/${(req.file.filename).split(".")[0]}`, true);

        fs.readdir(`${__dirname}/public/video/${(req.file.filename).split(".")[0]}`, (err, files) => {
          files.forEach(file => {
            arr.push(`video/${req.file.filename.split(".")[0]}/${file}`)
            // jimp.read(`public/video/${req.file.filename.split(".")[0]}/${file}`, function (err, lenna) {
            //     if (err) {
            //       throw err;
            //     }
            //     lenna.write(`public/video/${req.file.filename.split(".")[0]}/${file}`);
            //   })
          });
        });
        res.render('video', {
          msg: 'Файлы добавлены! Просмотрите кадры видеофайла и подтвердите их конвертацию',
          class: 'alert-success',
          files: arr,
          ZipSize: fileSizeInMegabytes,
          folder: `video/${req.file.filename.split(".")[0]}`
        });
      }
    }
  })
})

app.post('/videorun', (req, res) => {
  var pth = req.body.pth;
  var ZipSize = req.body.ZipSize;
  var ImageCount, ImageExtension;
  //console.log(pth);

  function scanDir(folder, files = []) {

    var me = this,
      stats,
      fileContents = fs.readdirSync(folder);

    fileContents.forEach(function (filename) {
      var absFilename = folder + '/' + filename;
      stats = fs.lstatSync(absFilename);
      if (stats.isDirectory(absFilename)) {
        me.scanDir(absFilename, files);
      } else {
        files.push(absFilename);
      }
    });
    ImageCount = files.length;
    return files;
  }

  function getImageInfos(filename) {
    return new Promise((resolve, reject) => {
      jimp.read(filename, (err, image) => {
        if (err) {
          reject(err);
        } else {
          resolve({
            name: filename,
            width: image.bitmap.width,
            height: image.bitmap.height
          });
        }
      });
    });
  }

  function getUInt8Array(file) {

    let typed,
      filename = file.name,
      width = file.width;

    file.uint = [];

    return new Promise((resolve, reject) => {
      fs.readFile(filename, (err, data) => {
        if (err) {
          reject(err);
        } else {

          typed = jpeg.decode(data, true).data;

          for (let c = 0; c < typed.length; c += width) {
            file.uint.push(typed.slice(c, c + width).join(';'));
          }

          file.uint = file.uint.join('\n');
          resolve(file);
        }
      });
    });
  }

  function saveIntoCsvFile(file) {

    let filename = file.name.split('.').slice(0, -1).join('.') + '.csv',
      content = [
        file.uint
      ].join('\n');

    return new Promise((resolve, reject) => {
      fs.writeFile(filename, content, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  }

  let validExtensions = [
    'jpg',
    'jpeg'
  ];

  // scan images and filter files if not images
  let files = scanDir(`public/${pth}`).filter((file) => {
    let extension = file.split('.').pop();
    ImageExtension = extension;
    return (validExtensions.indexOf(extension) >= 0);
  });

  let promises = [];

  // for each filename get size info and 
  // get uint8arr data and finally
  // convert data un csv row line
  for (let file of files) {
    promises.push(
      getImageInfos(file)
        .then(getUInt8Array)
        .then(saveIntoCsvFile)
    );
  }

  // resolve all promises
  Promise.all(promises)
    .then(() => {
      console.log('end');
      res.render('video', {
        msg: 'Конвертация завершена',
        class: 'alert-success',
        imgCount: ImageCount,
        Mypth: pth,
        imgExt: ImageExtension,
        zSize: ZipSize
      });
    })
    .catch((err) => {
      console.error(err);
    });
})

app.post('/videocsv', (req, res) => {
  var DirName = req.body.DirName;
  //console.log(DirName.split('/')[1]);

  function scanDir(folder, files = []) {
    var me = this,
      stats,
      fileContents = fs.readdirSync(folder);
    fileContents.forEach(function (filename) {
      var absFilename = folder + '/' + filename;
      stats = fs.lstatSync(absFilename);
      if (stats.isDirectory(absFilename)) {
        me.scanDir(absFilename, files);
      } else {
        files.push(absFilename);
      }
    });
    return files;
  }

  let validExtensions = [ 'csv' ];

  // scan images and filter files if not images
  let files = scanDir(`public/${DirName}`).filter((file) => {
    let extension = file.split('.').pop();
    ImageExtension = extension;
    return (validExtensions.indexOf(extension) >= 0);
  });
  var zip = new AdmZip();
  for (let file of files){
    zip.addFile(`${file.split('/')[3]}`, fs.readFileSync(file), '', 0644);
    //console.log(file);
  }
  zip.writeZip(`${__dirname}/public/video/${DirName.split('/')[1]}-Converted.zip`);
  //console.log(files);

  res.render('video', {
    msg: 'Скачивание начнется через несколько секунд',
    class: 'alert-success',
    ZipPath: `video/${DirName.split('/')[1]}-Converted.zip`,
    FName: `${DirName.split('/')[1]}-Converted.zip`
  });
})

app.post('/uploadaudio', (req, res) => {
  upload_audio(req, res, (err) => {
    if (err) {
      res.render('audio', {
        msg: err,
        class: 'alert-danger'
      });
    } else {
      if (req.file == undefined) {
        res.render('audio', {
          msg: 'Выберите файл!',
          class: 'alert-danger'
        });
      } else {
        res.render('audio', {
          msg: 'Файл добавлен! Прослушайте запись и выберете интервал',
          class: 'alert-success',
          file: `audio/${req.file.filename}`
        });
      }
    }
  })
})

app.post('/audioDiagram', (req, res) => {
  var sec;
  var audioName = req.body.audioName;
  var duration = req.body.dur;
  var folder = (audioName.split("/")[1]).split(".")[0];
  var StartTime = Math.floor(req.body.StartTime);
  var EndTime = Math.floor(req.body.EndTime);
  var diff = EndTime - StartTime;
  if (diff < 10) {
    sec = 5000;
  } else {
    sec = 7000;
  }
  if (StartTime <= 0 || EndTime > duration) {
    res.render('audio', {
      msg: 'Некорректный интервал! Попробуйте снова',
      class: 'alert-danger'
    });
  } else {
    var file_path = path.normalize(`${__dirname}/public/${audioName}`);
    var par_path = path.normalize(`${__dirname}/public/csv_audio`);
    //console.log(file_path)
    const stats = fs.statSync(file_path)
    const fileSizeInMegabytes = stats.size / 1000000.0
    const DurationSize = (diff * fileSizeInMegabytes) / duration;
    cp.exec(`ConsoleApp1 ${file_path} ${par_path} ${StartTime} ${EndTime}`, function (e, stdout, stderr) { })

    res.render('audio', {
      msg: `Выполняется обработка выбранного отрезка`,
      class: 'alert-success',
      folderName: `${folder}`,
      seconds: `${sec}`,
      difference: diff,
      Start: StartTime,
      End: EndTime,
      Size: fileSizeInMegabytes,
      durS: DurationSize
    });
  }
})

app.post('/uploadimg', (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      res.render('img', {
        msg: err,
        class: 'alert-danger'
      });
    } else {
      if (req.file == undefined) {
        res.render('img', {
          msg: 'Выберите файл!',
          class: 'alert-danger'
        });
      } else {
        // Здесь добавить путь в БД (в будущем)
        res.render('img', {
          msg: 'Файл добавлен! Выделите необходимую область и подтвердите выделение',
          class: 'alert-success',
          file: `uploads/${req.file.filename}`
        });
      }
    }
  })
})

app.post('/imgprocess', (req, res) => {
  mydate = Date.now()
  var imgName = req.body.name;
  var x1 = Number(req.body.x1);
  var y1 = Number(req.body.y1);
  var w = Number(req.body.w);
  var h = Number(req.body.h);
  jimp.read('public/' + imgName, (err, image) => {
    if (err) {
      res.render('img', {
        msg: err,
        class: 'alert-danger'
      });
    } else {
      image.crop(x1, y1, w, h)
        .quality(100)
        .write('public/uploads/edited-' + mydate + '-.jpeg')
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
        msg: err,
        class: 'alert-danger'
      });
    } else {
      if (req.file == undefined) {
        res.render('img_csv', {
          msg: 'Выберите файл!',
          class: 'alert-danger'
        });
      } else {
        var vector = [];
        var csvData = [];
        //var maximum;
        var row = fs.createReadStream(`public/csv_image/${req.file.filename}`)
          .pipe(parse({ delimiter: ';' }))
          .on('error', function(err) {
            res.render('img_csv', {
              msg : 'Некорректный файл!',
              class : 'alert-danger'
            })
          })
          .on('data', function (csvrow) {
            csvData.push(csvrow);
          })
          .on('end', function () {
            var lnth = csvData[0].length;
            //console.log(lnth);
            for (var i = 0; i < csvData.length; i++) vector = vector.concat(csvData[i]);
            var arr = JSON.stringify(vector.slice(0, 3000));
            if (lnth <= 1){
              res.render('img_csv', {
                msg: `Значения CSV файла должны быть разделены символом ;`,
                class: 'alert-danger'
              })
            } else {
            res.render('img_csv', {
              msg: 'Файл добавлен! Характеристики файла представлены ниже',
              class: 'alert-success',
              result: {
                /*"Максимальное значение": `${max(vector)}`,
                "Минимальное значение": `${min(vector)}`,
                "Максимальная амплитуда значений": `${range(vector)}`,*/
                "Сумма элементов": `${sum(vector)}`,
                "Дисперсия": `${variance(vector)}`,
                "Среднеквадратическое отклонение": `${standardDeviation(vector)}`,
                "Среднее значение": `${mean(vector)}`,
                "Медиана": `${median(vector)}`,
                "Мода": `${modes(vector)}`
              },
              res_array: arr
            });
          }
        })
      }
    }
  })
})

app.listen(process.env.PORT || 3000, function () {
  console.log("Server listening on port %d in %s mode", this.address().port, app.settings.env);
});

function max(array) {
  return Math.max.apply(null, array);
}

function min(array) {
  return Math.min.apply(null, array);
}

function range(array) {
  return max(array) - min(array);
}

function sum(array) {
  var num = 0;
  for (var i = 0; i < array.length; i++) num += Number(array[i]);
  return num;
}

function variance(array) {
  var mean = matem.mean(array);
  return matem.mean(array.map(function (num) {
    return Math.pow(num - mean, 2);
  }));
}

function standardDeviation(array) {
  return Math.sqrt(variance(array));
}

function mean(array) {
  return sum(array) / array.length;
}

function median(array) {
  array.sort(function (a, b) {
    return a - b;
  });
  var mid = Number(array.length) / 2;
  return mid % 1 ? Number(array[mid - 0.5]) : (Number(array[mid - 1]) + Number(array[mid])) / 2;
}

function modes(array) {
  if (!array.length) return [];
  var modeMap = {},
    maxCount = 0,
    modes = [];

  array.forEach(function (val) {
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