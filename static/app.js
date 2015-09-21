/* eslint-env browser */
/* eslint no-console: 0 */

"use strict";

// UI Helpers

var ui = {};

ui.showNotification = function(fn) {
  return new Promise(function(resolve, reject) {
    console.debug("Displaying notification UI");

    var old = document.getElementById("notification-prompt-btn");
    if (old) { old.remove(); }

    var btn = document.createElement("button");
    btn.id = "notification-prompt-btn";
    btn.textContent = "Enable Notifications";
    btn.addEventListener("click", function() {
      fn().then(resolve, reject);
    });

    var parent = document.getElementById("notification-prompt");
    parent.appendChild(btn);
    parent.classList.remove("hidden");
  });
};

ui.hideNotification = function() {
  console.debug("Hiding notification UI");
  document.getElementById("notification-prompt").classList.add("hidden");
};

ui.notificationPrompt = function() {
  return new Promise(function(resolve, reject) {
    ui.showNotification(Notification.requestPermission.bind(Notification, function(permission) {
      resolve(permission);
    }));
  })
  .then(ui.hideNotification);
};

ui.showPush = function(fn) {
  return new Promise(function(resolve, reject) {
    console.debug("Displaying push UI");

    var old = document.getElementById("push-prompt-btn");
    if (old) { old.remove(); }

    var btn = document.createElement("button");
    btn.id = "push-prompt-btn";
    btn.textContent = "Enable Push";
    btn.addEventListener("click", function() {
      fn().then(resolve, reject);
    });

    var parent = document.getElementById("push-prompt");
    parent.appendChild(btn);
    parent.classList.remove("hidden");
  });
};

ui.hidePush = function() {
  console.debug("Hiding push UI");
  document.getElementById("push-prompt").classList.add("hidden");
};

ui.pushPrompt = function(opts) {
  return navigator.serviceWorker.ready
    .then(function(reg) {
      return ui.showPush(reg.pushManager.subscribe.bind(reg.pushManager, opts));
    })
    .then(function() {
      ui.hidePush();
    })
    .catch(function(err) {
      ui.hidePush();

      // Bug 1206302: Firefox rejects with a string instead of DOMException
      var DENIED = "PermissionDeniedError";
      if (err.message === DENIED || err === DENIED) {
        return "denied";
      }

      // Something unexpected failed. Panic.
      // e.g., Chrome currently throws if the app isn't registered in GCM
      throw err;
    });
};

ui.log = function(message) {
  var elem = document.createElement("li");
  elem.textContent = message;
  document.getElementById("log").appendChild(elem);
  console.info(message);
};

ui.applyLog = function(message) {
  return ui.log.bind(null, message);
};

ui.error = function(err) {
  var message = err.message || err;

  var elem = document.createElement("li");
  elem.textContent = message;
  elem.classList.add("error");
  document.getElementById("log").appendChild(elem);
  console.error(message);
};

// App Logic

function getUUID() {
  function generateUUID() {
    // See RFC 4122
    var buf = new Uint8Array(16);
    crypto.getRandomValues(buf);
    buf[6] = buf[6] & 0x0f | 0x40;
    buf[8] = buf[8] & 0x3f | 0x80;

    var hex = Array.prototype.map.call(buf, function(x) {
      return (0x100 + x).toString(16).slice(1);
    });

    var result = [];
    hex.forEach(function(x, i) {
      if ( i === 4 || i === 6 || i === 8 || i === 10 ) { result.push("-"); }
      result.push(x);
    });

    return result.join("");
  }

  var key = "push-demo-uuid";
  var uuid = localStorage.getItem(key);
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem(key, uuid);
  }

  return uuid;
}

function verifySupport() {
  function assert(prop, message) {
    if (!prop) { throw new Error(message); }
    return true;
  }

  assert(self.crypto.getRandomValues, "crypto.getRandomValues() is not supported");
  assert(self.fetch, "Fetch is not supported");
  assert(navigator.serviceWorker, "Service Worker is not supported");
  assert(self.ServiceWorkerRegistration.prototype.showNotification, "ServiceWorker Notifications are not supported");
  assert(self.Notification, "Notifications are not supported");
  assert(self.PushManager, "Push is not supported");

  return true;
}

function enableNotifications(promptFn, permission) {
  if (!permission) { return enableNotifications(promptFn, Notification.permission); }

  switch (permission) {
    case "granted":
      return Promise.resolve(true);
    case "denied":
      return Promise.reject(new Error("Notifications blocked"));
    case "default":
      return promptFn().then(enableNotifications.bind(null, promptFn));
    default:
      return Promise.reject(new Error("Unrecognized Notification permission: " + permission));
  }
}

function enablePush(promptFn, permission) {
  var opts = { userVisibleOnly: true };

  if (!permission) {
    return navigator.serviceWorker.ready
      .then(function(reg) { return reg.pushManager.permissionState(opts); })
      .then(function(state) { return enablePush(promptFn, state); });
  }

  switch (permission) {
    case "granted":
      return Promise.resolve(true);
    case "denied":
      return Promise.reject(new Error("Push blocked"));
    case "prompt":
      return promptFn(opts).then(enablePush.bind(null, promptFn));
    default:
      return Promise.reject(new Error("Unrecognized Push permission: " + permission));
  }
}

function subscribe() {
  return navigator.serviceWorker.ready
    .then(function(reg) {
      return reg.pushManager.subscribe();
    })
    .then(function(sub) {
      return fetch(window.location.origin + "/notifications", {
        mode: "same-origin",
        method: "PUT",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ user: getUUID(), endpoint: sub.endpoint })
      });
    });
}

Promise.resolve()
  .then(verifySupport)
  .then(ui.applyLog("Browser support OK"))

  .then(function() { return navigator.serviceWorker.register("./serviceworker.js"); })
  .then(ui.applyLog("ServiceWorker installation OK"))

  .then(function() { return enableNotifications(ui.notificationPrompt); })
  .then(ui.applyLog("Notifications OK"))

  .then(function() { return enablePush(ui.pushPrompt); })
  .then(ui.applyLog("Push OK"))

  .then(subscribe)
  .then(ui.applyLog("Subscribed OK"))

  .catch(ui.error);
