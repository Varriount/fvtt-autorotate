var fs = require('fs');
console.log(JSON.parse(fs.readFileSync('./build/module.json', 'utf8')).version);
