#!/usr/bin/env node
/* eslint-env node */
"use strict";

var bodyParser = require("body-parser");
var express = require("express");
var fs = require("fs");
var https = require("https");
var url = require("url");

var app = express();

// JSON POST ["subscribe"/"unsubscribe", "Bob", "https://endpoint.example.com"]
app.options("/", function(req, res) {
  res.header("Content-Type", "application/json");
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Access-Control-Allow-Origin, Access-Control-Allow-Headers");
  res.sendStatus(200);
});

app.post("/", bodyParser.text({type: "*/*"}), function(req, res) {
  var bodyArray = req.body.split(",");
  console.log("POSTed: " + bodyArray[0]);

  if(bodyArray[0] === "subscribe") {
    fs.appendFile("endpoint.txt", bodyArray + "\n", function (err) {
      if (err) { throw err; }
      fs.readFile("endpoint.txt", function (err, buffer) {
        var string = buffer.toString();
        var array = string.split("\n");
        for(var i = 0; i < (array.length - 1); i++) {
          var subscriber = array[i].split(",");
          console.log(subscriber[2]);
          var URLParts = url.parse(subscriber[2]);

          // send request to each push endpoint telling them the new subscriber
          // has subscribed, along with subscribe token so SW knows how to deal with it.
          var options = {
            hostname: URLParts.hostname,
            path: URLParts.pathname,
            method: "PUT",
            headers: {
              "Content-Type": "plain/text",
              "Authorization": "key=AIzaSyBN3u3TLPD-IMVB-GdE798tuinHWdQ3H1Y"
            }
          };

          var pushRequest = https.request(options, function(pushResponse) {
            console.log("statusCode: ", pushResponse.statusCode);
            console.log("headers: ", pushResponse.headers);

            pushResponse.on("data", function(d) {
              console.log("I got a response");
            });
          });

          pushRequest.write(subscriber[1]);
          pushRequest.end();

          pushRequest.on("error", function(e) {
            console.error(e);
          });
        }
      });

    });
  } else if(bodyArray[0] === "unsubscribe") {
      fs.readFile("endpoint.txt", function (err, buffer) {
        var newString = "";
        var string = buffer.toString();
        var array = string.split("\n");
        for(var i = 0; i < (array.length - 1); i++) {
          var subscriber = array[i].split(",");

          console.log("Unsubscribe: " + subscriber[1]);
          var URLParts = url.parse(subscriber[2]);

          // send request to each push endpoint telling them the subscriber
          // has unsubscribed.
          var options = {
            hostname: URLParts.hostname,
            path: URLParts.pathname,
            method: "PUT",
            headers: {
              "Content-Type": "plain/text"
            }
          };

          var unsubscribeRequest = https.request(options, function(unsubscribeResponse) {
            console.log("Unsubscribe statusCode: ", unsubscribeResponse.statusCode);
            console.log("Unsubscribe headers: ", unsubscribeResponse.headers);

            unsubscribeResponse.on("data", function(d) {
              console.log("I got an unsubscribe response");
            });
          });

          unsubscribeRequest.write(subscriber[1]);
          unsubscribeRequest.end();

          unsubscribeRequest.on("error", function(e) {
            console.error(e);
          });

          if(bodyArray[2] === subscriber[2]) {
            console.log("subscriber found.");
          } else {
            newString += array[i] + "\n";
          }
        }


        fs.writeFile("endpoint.txt", newString, function (err) {
          if (err) { throw err; }
          console.log("Subscriber unsubscribed");
        });
      });
  }
});

var options = {
  pfx: fs.readFileSync("aa34f6b8-f1c5-4e32-afd7-7a5f9f0b659c.pfx"),
  passphrase: "password"
};

https.createServer(options, app).listen(7000);
console.log("Server listening on https://127.0.0.1:7000");
