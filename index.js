const ImagePool = require('@squoosh/lib');
const fs = require('fs');

const params = process.argv.slice(2);
const readFileName = params[0];
const imagePool = new ImagePool.ImagePool();
const newimages = 'newimages';
let successNum = 0;
let biggerThanOriginalNum = 0;
let map = {};
const encodeOptions = {
  mozjpeg: { quality: 75 }, //an empty object means 'use default settings'
  // jxl: {quality: 75},
};

const files = fs.readdirSync(readFileName);

if (!fs.existsSync(newimages)) {
  fs.mkdirSync(newimages);
} else {
  const newimagesfile = fs.readdirSync(newimages);
  newimagesfile.forEach(function (f) {
    map[f] = f;
  })
}

start(function () {
  imagePool.close();
});

async function start(callback) {
  for (i = 0; i < files.length; i++) {
    const file = files[i];
    if (map[file]) {
      continue;
    }
    let flag = false;
    let fd;
    try {
      fd = fs.readFileSync(readFileName + '/' + file);
    } catch (error) {
      console.log('[' + file + '] ' + error);//'is a directory, not a file.'
      continue;
    }
    const hexString = fd.toString('hex').substr(0, 8);
    console.log(i + 1 + '.' + file);
    flag = (hexString === '89504e47' || hexString === 'ffd8ffe0' || hexString === 'ffd8ffe1' || hexString === 'ffd8ffe2' || hexString === 'ffd8ffe3' || hexString === 'ffd8ffe8');
    if (flag) {
      const image = imagePool.ingestImage(readFileName + '/' + file);
      await compress(image, file);
    } else {
      console.log('[' + file + '] ' + 'not jpeg or png.');
    }
  }
  callback();
}

async function compress(image, name) {
  try {
    let oldimg = await image.decoded;
    await image.preprocess();
    await image.encode(encodeOptions);
    let newimg = await image.encodedWith.mozjpeg;
    const rawEncodedImage = (newimg).binary;
    if (oldimg.size < newimg.size) {
      biggerThanOriginalNum++;
      console.log('[' + name + '] ' + 'oldSize < newSize ' + biggerThanOriginalNum);
      fs.copyFileSync(image.file, `./newimages/${name}`);
      return;
    }

    fs.writeFileSync(`./newimages/${name}`, rawEncodedImage);
    successNum++;
    console.log('[' + name + '] ' + 'Write operation complete. ' + successNum);
  } catch (error) {
    console.error('[' + name + '] ' + error);
  }
}

