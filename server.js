#!/usr/bin/env node
/* eslint-env node */
/* eslint no-console: 0 */

"use strict";

var bodyParser = require("body-parser");
var express = require("express");
var fs = require("fs");
var http = require("http");
var https = require("https");
var url = require("url");
var path = require("path");

var app = express();

// Frontend

app.use("/static", express.static("static"));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Backend

// Server

http.createServer(app).listen(7000);
console.log("Server listening on http://127.0.0.1:7000");
