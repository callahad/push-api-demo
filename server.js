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

var endpoints = new Set();

app.post("/", bodyParser.text({type: "*/*"}), function(req, res) {
  var bodyParts = req.body.split(",");
  var body = {
    action: bodyParts[0],
    nickname: bodyParts[1],
    endpoint: bodyParts[2]
  };

  if (body.action === "subscribe") {
    console.log("Subscribe: ", body.nickname);
    endpoints.add(body.endpoint);
    // send request to each push endpoint telling them the new subscriber
    // has subscribed, along with subscribe token so SW knows how to deal with it.
    endpoints.forEach(function(endpoint) {
      var urlParts = url.parse(endpoint);
      var options = {
        hostname: urlParts.hostname,
        path: urlParts.pathname,
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

      pushRequest.write(body.nickname);
      pushRequest.end();

      pushRequest.on("error", function(e) {
        console.error(e);
      });
    });
  } else if (body.action === "unsubscribe") {
    console.log("Unsubscribe: ", body.nickname);
    endpoints.delete(body.endpoint);

    endpoints.forEach(function(endpoint) {
      var urlParts = url.parse(endpoint);
      var options = {
        hostname: urlParts.hostname,
        path: urlParts.pathname,
        method: "PUT",
        headers: {
          "Content-Type": "plain/text"
        }
      }

      var unsubscribeRequest = https.request(options, function(unsubscribeResponse) {
        console.log("Unsubscribe statusCode: ", unsubscribeResponse.statusCode);
        console.log("Unsubscribe headers: ", unsubscribeResponse.headers);

        unsubscribeResponse.on("data", function(d) {
          console.log("I got an unsubscribe response");
        });
      });

      unsubscribeRequest.write(body.nickname);
      unsubscribeRequest.end();

      unsubscribeRequest.on("error", function(e) {
        console.error(e);
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
