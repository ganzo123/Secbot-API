var express = require('express');
var bodyParser = require('body-parser');
var request = require("request");
var fs = require('fs');
var https = require('https');
const editJsonFile = require("edit-json-file");
var path = require('path');
var FormData = require('form-data');var FormData = require('form-data');
var events = require('events').EventEmitter;


var app = express();
var router = express.Router();
var jsonParser = bodyParser.json();
var port = 5001;
var hostname = '127.0.0.1';


app.use(bodyParser.json({
  limit: '20mb',
  extended: true
}))
app.use(bodyParser.urlencoded({
  limit: '20mb',
  extended: true
}))

app.set('trust_proxy', true);

const uploadImg_Profile = require("./uploadImg_Profile");

app.use(express.urlencoded({
  extended: false
}));

const {
  v4: uuidv4
} = require('uuid');

console.log(port);

//Local Folders 
var file_loc = path.resolve(__dirname + "/Videos");
var file_loc2 = path.resolve(__dirname + "/Image");


console.log(`current image path is ${file_loc2}`);
console.log(`current video path is ${file_loc}`);

var ImagesenderAgent = new events();

var VideoSenderAgent = new events();
// Gets functions
app.get("/webhook", (req, res) => {
  let challenge = req.query['hub.challenge'];
  res.send(challenge)

});
app.get("/api/images", (req, res) => {
  fs.readFile(("imageJ.json"), "utf8", (err, data) => {
    if (err) {
      throw err;
    }

    res.send(JSON.parse(data));
  });
  console.log("ping Image");

});



app.get("/api/videos", (req, res) => {
  fs.readFile(("VideoJ.json"), "utf8", (err, data) => {
    if (err) {
      throw err;
    }

    res.send(JSON.parse(data));
  });
  console.log("ping Video");

});


function sendTextMessage(sender, text) {
  messageData = {
    "attachment": {
      "type": "template",
      "payload": {
        "template_type": "button",
        "text": "Bonjoir, choisir entre :",
        "buttons": [{
            "type": "postback",
            "title": "Capture un image",
            "payload": "Photo"
          },
          {
            "type": "postback",
            "title": "Capture un séquence video",
            "payload": "Video"
          }
        ]
      }
    }
  }
  request({
    url: 'https://graph.facebook.com/v2.6/me/messages',
    qs: {
      access_token: token
    },
    method: 'POST',
    json: {

      recipient: {
        id: sender
      },
      message: messageData,
    }
  }, function (error, response, body) {
    if (error) {
      console.log('Error sending message: ', error);
    } else if (response.body.error) {
      console.log('Error: ', response.body.error);
    }
  });

}

const token = "EAAIfN8mv7BwBAEHje9Ggqbjnx3Y5KcpaU6KxW0ICXkKnWdE4tXo3CjyGnWacQidSjGzTHG1M8GeMhKWfj8BqGNQ97SFxIqZCOGM0gurZAffhIQhrSi4YDQQBoylRMwVmKGf7pugqewsZBjSXimaxFzwIoDtRdUdWVoWD6mudAZDZD";
app.post('/webhook/', jsonParser, function (req, res) {

  var messaging_events = req.body.entry[0].messaging;
  for (var i = 0; i < messaging_events.length; i++) {
    var event = req.body.entry[0].messaging[i];
    var sender = event.sender.id;
    if (event.message && event.message.text) {
      var text = event.message.text;
      sendTextMessage(sender, text + "!");
    } else if (event.postback && event.postback.payload) {
      payload = event.postback.payload;

      if (payload == 'Photo') {

        let jsonData = editJsonFile('./imageJ.json');
        jsonData.set('Photo.TakeP', true);
        jsonData.set('Photo.Upload', false);
        jsonData.save();
        ImagesenderAgent.on('GetImage', function () {
          let jsonfile = require('./imageJ.json');
          console.log("hello name " + jsonfile.Photo.nameP);

          sendImageMessage(sender, jsonfile.Photo.nameP);

        });


      } else if (payload == 'Video') {
        console.log("video");
        var jsondata = editJsonFile('./VideoJ.json');
        jsondata.set('Video.TakeV', true);
        jsondata.set('Video.Upload', false)
        jsondata.save();

        VideoSenderAgent.on('GetVideo', function () {
          let jsonfile = require('./VideoJ.json');

          sendVideoMessage(sender, jsonfile.Video.nameV)
        })
      }
    }
  }
  res.sendStatus(200);
});



function sendImageMessage(sender, name1) {
  console.log(name1);
  var readStream = fs.createReadStream(file_loc2 + "/" + name1 + ".jpg");
  var messageData1 = new FormData();

  messageData1.append('recipient', '{id:' + sender + '}');
  messageData1.append('message', '{attachment :{type:"image", payload:{}}}');
  messageData1.append('filedata', readStream);
  callSendAPI1(messageData1);


};


function sendVideoMessage(sender, name2) {
  var readStream = fs.createReadStream(file_loc + "/" + name2 + ".mp4");
  var messageData2 = new FormData();

  messageData2.append('recipient', '{id:' + sender + '}');
  messageData2.append('message', '{attachment :{type:"video", payload:{}}}');
  messageData2.append('filedata', readStream);
  callSendAPI(messageData2);
}
function callSendAPI(messageData1) {
  var options = {
    method: 'post',

    host: 'graph.facebook.com',
    path: '/v2.6/me/messages?access_token=' + token,
    headers: messageData1.getHeaders(),
    timeout: 500,
  };
  var request = https.request(options);
  messageData1.pipe(request);

  request.on('error', function (error) {
    console.log("Unable to send message to recipient ");
    return;
  });

  request.on('response', function (res) {
    if (res.statusMessage == "OK") {

      console.log("Successfully sent message to recipient ");

    } else {

      console.log("Unable to send message to recipient ");
    }

    return;
  });
}

function callSendAPI1(messageData1) {
  var options = {
    method: 'post',

    host: 'graph.facebook.com',
    path: '/v2.6/me/messages?access_token=' + token,
    headers: messageData1.getHeaders(),
    timeout: 500,
  };
  var request = https.request(options);
  messageData1.pipe(request);

  request.on('error', function (error) {
    console.log("Unable to send message to recipient ");
    return;
  });

  request.on('response', function (res) {
    if (res.statusMessage == "OK") {

      console.log("Successfully sent message to recipient ");

    } else {

      console.log("Unable to send message to recipient ");
    }

    return;
  });


}

app.post('/upload/video/', function (req, res) {
  var base64Data = req.body.data;
  var name = uuidv4();
  var jsonData = editJsonFile("./VideoJ.json");
  jsonData.set('Video.TakeV', false);
  jsonData.set('Video.Upload', true);
  jsonData.set('Video.nameV', name);
  jsonData.save();

  var base64Datac = new Buffer.from(base64Data, 'base64');
  console.log(base64Datac);

  console.log(base64Data.length, base64Datac.length);
  try {
    console.log('trying to write file');
    console.log('YES');
    fs.writeFile(`${file_loc}/${name}.mp4`, base64Datac, function (err) {
      if (err) {
        throw err;
      } else {
        console.log("file saved");
        VideoSenderAgent.emit('GetVideo');

      }
    });

    console.log('end of trying to write a file');

  } catch (error) {
    console.log(error);

  }



});




app.post('/upload/image/', function (req, res) {
  var a = uuidv4();
  let jsonData = editJsonFile('./imageJ.json');
  jsonData.set('Photo.TakeP', false);
  jsonData.set('Photo.Upload', true);
  jsonData.set('Photo.nameP', a);

  jsonData.save();

  var base64Data = req.body.data;


  var base64Datac = new Buffer.from(base64Data, 'base64');
  console.log(base64Datac);

  console.log(base64Data.length, base64Datac.length);
  try {
    console.log('trying to write file');
    console.log('YES');
    fs.writeFile(`${file_loc2}/${a}.jpg`, base64Datac, function (err) {
      if (err) {
        throw err;
      } else {
        console.log("file saved");
      }
    });
    // fs.closeSync(fd);
    console.log('end of trying to write a file');

  } catch (error) {
    console.log(error);

  }
  setTimeout(function () {
    ImagesenderAgent.emit('GetImage');
  }, 3000)

  
});
app.get("/", function (req, res) {
  res.send("Hi.");
});

app.listen(process.env.PORT || port, hostname, function () {
  console.log(`Server running at ${hostname}:${port}`);

});