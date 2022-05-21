const fs = require('fs');
const readline = require('readline');

var config = require("./config.js");
var configData = config.readConfig();

var db = {
  senders: {

  },
  contents: [

  ]
};

var days = [
  {
    "when": "1/1/70",
    "what": 0,
    "who": "system"
  }
];

(async () => {
  // set up the db object.

  for (var i = 0; i < configData.users.length; i++) {
    db.senders[configData.users[i].reference] = {
      total: 0,
      picturesSent: 0,
    };
    for (var y = 0; y < configData.specials.length; y++) {
      db.senders[configData.users[i].reference][configData.specials[y].title] = 0;
    }
  }

  const fileStream = fs.createReadStream(configData.input);

  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });
  // Note: we use the crlfDelay option to recognize all instances of CR LF
  // ('\r\n') in the input as a single line break.

  for await (const line of rl) {
    // here is a single line available
    parseLine(line);
  }

  await finalize();

  fs.writeFileSync(configData.output, JSON.stringify(db, null, 4), "utf8");
  fs.writeFileSync(configData.summary_output, JSON.stringify(db.senders, null, 4), "utf8");

  console.log("Done...");
})();

function parseLine(line) {
  var regOLD = /^(\d{1,2}\/\d{1,2}\/\d{1,2},) (\d{1,2}:\d{1,2} (AM|PM) \-) ([^:]*)\: ([^]*)/;
  var reg = /^([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{1,2}),\s([0-9]{1,2}:[0-9]{1,2})\s(AM|PM)\s-\s(.*?):\s(.*)$/;
  // 0: Full
  // 1: date
  // 2: time
  // 3: nightDay
  // 4: sender
  // 5: msg
  var regSystem = /^([0-9]{1,2}\/[0-9]{1,2}\/[0-9]{1,2}),\s([0-9]{1,2}:[0-9]{1,2})\s(AM|PM)\s-\s(.*)/;
  // 0 Full
  // 1: date
  // 2: time
  // 3: nightDay
  // 4: msg
  var found = line.match(reg);

  var obj = {
    date: "",
    time: "",
    nightDay: "",
    sender: "",
    msg: ""
  };

  if (!found) {
    // now if a msg isn't found, this could be for a few reasons.
    // could be a system message, or could be the continuation of a previous message. So we will test for that.
    var foundSystem = line.match(regSystem);

    if (!foundSystem) {
      // not a system message, so likely a continuation of previous messages. and we can append it as such,
      addToMsg(line);
    } else {
      // system message
      obj.date = foundSystem[1];
      obj.time = foundSystem[2];
      obj.nightDay = foundSystem[3];
      obj.sender = "system";
      obj.msg = foundSystem[4];
      processNewMsg(obj);
    }
  } else {
    // handled just fine.
    obj.date = found[1];
    obj.time = found[2];
    obj.nightDay = found[3];
    obj.sender = found[4];
    obj.msg = found[5];
    processNewMsg(obj);
  }
}

function processNewMsg(obj) {
  // to reduce the huge size of this file, we can ignore messages of only media, since those are in the summary.
  if (obj.msg != "<Media omitted>") {
    db.contents.push(obj);
  }


  for (var i = 0; i < configData.users.length; i++) {
    if (configData.users[i].name == obj.sender) {
      db.senders[configData.users[i].reference].total++;

      // now to grab stats of the message we care about

      // compute days
      addDay(obj.date, configData.users[i].reference);

      // media
      if (obj.msg == "<Media omitted>") {
        db.senders[configData.users[i].reference].picturesSent++;
      }

      for (var y = 0; y < configData.specials.length; y++) {
        var regexp = new RegExp(configData.specials[y].match, "gi");

        if ( (configData.specials[y].excludes == "missed_call" && obj.msg != "Missed video call") || !configData.specials[y].excludes) {
          db.senders[configData.users[i].reference][configData.specials[y].title] += (obj.msg.match(regexp) || []).length;
        }
      }

    }
  }
}

function addToMsg(text) {
  db.contents[db.contents.length-1].msg += text;
}

function addDay(day, sender) {
  for (var i = days.length -1; i >= 0; i--) {
    if (days[i].when == day) {
      if (days[i].who == sender) {
        days[i].what++;
        break;
      }
    } else {
      days.push({ when: day, who: sender, what: 1 });
      break;
    }
  }
}

function findBiggestDay(who) {
  var returnObj = {
    day: "",
    many: 0,
  };

  for (var i = 0; i < days.length; i ++) {
    if (days[i].who == who) {
      if (days[i].what > returnObj.many) {
        returnObj.day = days[i].when;
        returnObj.many = days[i].what;
      }
    }
  }

  return returnObj;
}

async function finalize() {
  for (var i = 0; i < configData.users.length; i++) {
    var bigDay = await findBiggestDay(configData.users[i].reference);
    db.senders[configData.users[i].reference].biggestDay = bigDay;
  }
}
