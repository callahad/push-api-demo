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

  endpoints.forEach(function(endpoint, uuid, map) {
    if (endpoint.indexOf("https://android.googleapis.com/gcm/send") === 0) {
      request.post({
        url: "https://android.googleapis.com/gcm/send",
        headers: { "Authorization": "key=AIzaSyDTw1wXwKTX3DYZCMgEh4VLtomEboqrdgY" },
        json: true,
        body: {registration_ids: [ endpoint.split("/").pop() ]}
      }, function(err, response, body) {
        if (body.failure || (response.statusCode >= 400 && response.statusCode <= 499)) {
          console.error("FAILURE:", body, endpoint);
          map.delete(uuid);
          return;
        }
        console.log("SUCCESS:", body, endpoint);
      });
    } else {
      request.post(endpoint, function(error, response, body) {
        if (response.statusCode >= 400 && response.statusCode <= 499) {
          console.error("FAILURE:", body, endpoint);
          map.delete(uuid);
          return;
        }
        console.log("SUCCESS:", body, endpoint);
      });
    }
  });
});

// Server
app.listen(7000);
console.log("Server listening on http://localhost:7000");
