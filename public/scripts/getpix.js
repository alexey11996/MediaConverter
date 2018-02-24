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
console.log(n[0])
console.log(n[1])
console.log(n[2])

