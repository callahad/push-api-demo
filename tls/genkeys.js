#!/usr/bin/env node
/* eslint-env node */
/* eslint no-console: 0 */

"use strict";

var fs = require("fs");
var path = require("path");
var pem = require("pem");

var certOptions = {
  selfSigned: true,
  days: 3650,
  organization: "Push API Demo Certificate",
  commonName: "localhost",
  altNames: ["localhost", "127.0.0.1", "::1"]
};

pem.createCertificate(certOptions, function(err, keys) {
  if (err) { return; }

  try {
    fs.writeFileSync(path.join(__dirname, "generated-key.pem"), keys.serviceKey);
    fs.writeFileSync(path.join(__dirname, "generated-cert.pem"), keys.certificate);
  } catch (e) {
    return;
  }
});
