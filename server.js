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

function broadcast(message) {
  endpoints.forEach(function(endpoint) {
    var parsed = url.parse(endpoint);
    var reqOptions = {
      hostname: parsed.hostname,
      path: parsed.pathname,
      method: "PUT",
      headers: {
        "Content-Type": "text/plain",
        "Authorization": "key=AIzaSyBN3u3TLPD-IMVB-GdE798tuinHWdQ3H1Y"
      }
    };

    var request = https.request(reqOptions, function(res) {
      console.log("Response from Push server:");
      console.log(res);
    });

    request.write(message);
    request.end();

    request.on("error", function(e) {
      console.error(e);
    });
  });
}

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
    broadcast("New subscriber: " + body.nickname);
  } else if (body.action === "unsubscribe") {
    console.log("Unsubscribe: ", body.nickname);
    endpoints.delete(body.endpoint);
    broadcast("Lost subscriber: " + body.nickname);
  }

  res.sendStatus(200);
});

var options = {
  pfx: fs.readFileSync("aa34f6b8-f1c5-4e32-afd7-7a5f9f0b659c.pfx"),
  passphrase: "password"
};

https.createServer(options, app).listen(7000);
console.log("Server listening on https://127.0.0.1:7000");
