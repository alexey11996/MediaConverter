var myImage = document.getElementById('pht_edit')
myImage.crossOrigin = "Anonymous";
var ImageName = (((document.getElementById('pht_edit').src).replace(/^.*[\\\/]/, '')).split('.'))[0];
var w = myImage.width, h = myImage.height;
var canvas = document.createElement('canvas');
canvas.width = w;
canvas.height = h;
var ctx = canvas.getContext('2d');
ctx.drawImage(myImage, 0, 0);
var typedarray = ctx.getImageData(0, 0, w, h).data
var width = ctx.getImageData(0, 0, w, h).width; //ширина
var height = ctx.getImageData(0, 0, w, h).height; // высота
var length = typedarray.length;
//console.log(typedarray)
var n = [];
var i = 0;
for (l = length + 1; (i + width) < l; i += width) {
    n.push(typedarray.slice(i, i + width));
}

exportToCsv(`${ImageName}-${width}x${height}x8bit.csv`, n)

function exportToCsv(filename, rows) {
    var processRow = function (row) {
        var finalVal = '';
        for (var j = 0; j < row.length; j++) {
            var innerValue = row[j] === null ? '' : row[j].toString();
            if (row[j] instanceof Date) {
                innerValue = row[j].toLocaleString();
            };
            var result = innerValue.replace(/"/g, '""');
            if (result.search(/("|;|\n)/g) >= 0)
                result = '"' + result + '"';
            if (j > 0)
                finalVal += ';';
            finalVal += result;
        }
        return finalVal + '\n';
    };

    var csvFile = '';
    for (var i = 0; i < rows.length; i++) {
        csvFile += processRow(rows[i]);
    }

    var blob = new Blob([csvFile], { type: 'text/csv;charset=utf-8;' });
    if (navigator.msSaveBlob) { // IE 10+
        navigator.msSaveBlob(blob, filename);
    } else {
        var link = document.createElement("a");
        if (link.download !== undefined) { // feature detection
            // Browsers that support HTML5 download attribute
            var url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            //console.log(url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            //console.log(link);
            document.body.removeChild(link);
        }
    }
}