#!/usr/bin/env node
/* eslint-env node */
/* eslint no-console: 0 */

"use strict";

var bodyParser = require("body-parser");
var express = require("express");
var path = require("path");
var request = require("request");

var app = express();

// Frontend

app.use("/static", express.static("static"));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/serviceworker.js", function(req, res) {
  res.sendFile(path.join(__dirname, "static", "serviceworker.js"));
});

// Temporarily required for Google Chrome
app.get("/manifest.json", function(req, res) {
  res.sendFile(path.join(__dirname, "manifest.json"));
});

// Backend

// TODO: Persist this
var endpoints = new Map();

app.put("/notifications", bodyParser.json(), function(req, res) {
  if (!req.body.user || !req.body.endpoint) {
    res.sendStatus(400);
    return;
  }

  console.log(req.body);
  endpoints.set(req.body.user, req.body.endpoint);
  res.sendStatus(204);
});

app.delete("/notifications", bodyParser.json(), function(req, res) {
  if (!req.body.user) {
    res.sendStatus(400);
    return;
  }

  console.log(req.body);
  endpoints.delete(req.body.user);
  res.sendStatus(204);
});

app.post("/notifications", function(req, res) {
  res.sendStatus(204);

  // Temporarily required for Google Chrome
  function gcmSend(endpoint, uuid, map) {
    var clientId = endpoint.split("/").pop();
    var options = {
      url: "https://android.googleapis.com/gcm/send",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "key=AIzaSyDTw1wXwKTX3DYZCMgEh4VLtomEboqrdgY"
      },
      body: JSON.stringify({ registration_ids: [ clientId ] })
    };

    request.post(options, function(err, response, body) {
      if (body.failure || (response.statusCode >= 400 && response.statusCode <= 499)) {
        console.error("FAILURE:", body);
        map.delete(uuid);
        return;
      }
      console.log("SUCCESS:", body);
    });
  }

  function standardSend(endpoint, uuid, map) {
    request.post(endpoint, function(err, response, body) {
      if ((response.statusCode >= 400 && response.statusCode <= 499)) {
        console.error("FAILURE:", body);
        map.delete(uuid);
        return;
      }
      console.log("SUCCESS:", body);
    });
  }

  endpoints.forEach(function(endpoint, uuid, map) {
    var isChrome = endpoint.indexOf("https://android.googleapis.com/gcm/send") === 0;
    var sendFn = isChrome ? gcmSend : standardSend;
    sendFn(endpoint, uuid, map);
  });
});

// Server
app.listen(7000);
console.log("Server listening on http://localhost:7000");
