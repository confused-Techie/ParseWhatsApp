const fs = require('fs');

function readConfig() {
  try {
    const data = fs.readFileSync('./config.json', {encoding: 'utf8'});
    var returnObj = JSON.parse(data);
    return returnObj;
  } catch(err) {
    console.log(`Error reading or parsing config data: ${err}`);
    process.exit(1);
  }
}

module.exports = { readConfig };
