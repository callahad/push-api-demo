#!/usr/bin/env node
/* eslint-env node */
/* eslint no-console: 0 */

"use strict";

var bodyParser = require("body-parser");
var express = require("express");
var fs = require("fs");
var https = require("https");
var url = require("url");
var path = require("path");

var app = express();

// Frontend

app.use("/static", express.static("static"));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.get("/serviceworker.js", function(req, res) {
  res.sendFile(path.join(__dirname, "static", "serviceworker.js"));
});

// Backend

// TODO: Persist this
var endpoints = {};

app.put("/", bodyParser.json(), function(req, res) {
  if (!req.body.user || !req.body.endpoint) {
    res.sendStatus(400);
    return;
  }

  endpoints[req.body.user] = req.body.endpoint;
  console.log(endpoints);
  res.sendStatus(204);
});

app.delete("/", bodyParser.json(), function(req, res) {
  if (!req.body.user) {
    res.sendStatus(400);
    return;
  }

  delete endpoints[req.body.user];
  console.log(endpoints);
  res.sendStatus(204);
});

// Server

var serverOptions;
try {
  serverOptions = {
    key: fs.readFileSync(path.join(__dirname, "tls", "generated-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "tls", "generated-cert.pem"))
  };
} catch (_) {
  serverOptions = {
    key: fs.readFileSync(path.join(__dirname, "tls", "bundled-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "tls", "bundled-cert.pem"))
  };
}

https.createServer(serverOptions, app).listen(7000);
console.log("Server listening securely on https://localhost:7000");
