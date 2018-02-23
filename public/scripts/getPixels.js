function getPixels(){
  // Get a reference to the image you want the pixels of and its dimensions
var myImage = document.getElementById('theImageToWorkWith');
var w = myImage.width, h = myImage.height;

// Create a Canvas element
var canvas = document.createElement('canvas');

// Size the canvas to the element
canvas.width = w;
canvas.height = h;

// Draw image onto the canvas
var ctx = canvas.getContext('2d');
ctx.drawImage(myImage, 0, 0);

// Finally, get the image data
// ('data' is an array of RGBA pixel values for each pixel)
return ctx.getImageData(0, 0, w, h);
}