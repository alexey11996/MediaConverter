var myImage = document.getElementById('pht_edit');
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
console.log(typedarray)
var n = [];
var i = 0;
for (l = length + 1; (i + width) < l; i += width) {
    n.push(typedarray.slice(i, i + width));
}

exportToCsv("ImageData.csv", n)

let csvContent = "data:text/csv;charset=utf-8,";
n.forEach(function(rowArray){
   let row = rowArray.join(",");
   csvContent += row + "\r\n";
}); 
var encodedUri = encodeURI(csvContent);
var link = document.createElement("a");
link.setAttribute("href", encodedUri);
link.setAttribute("download", "imageData.csv");
document.body.appendChild(link); // Required for FF
link.click(); 
