var titles = require('./titles.js');

//check if comment has any of the titles.
keys = [];
for (var key in titles) {
    if (titles.hasOwnProperty(key)) {
        keys.push(key.toLowerCase());
    }
}

//loop over the keys

console.log(keys.length);
console.log(keys);