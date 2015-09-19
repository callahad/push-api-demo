/* eslint-env browser */
/* eslint no-console: 0 */

"use strict";

// UI Helpers

var ui = {};

ui.notificationPrompt = function() {
  return new Promise(function(resolve, reject) {
    console.debug("Displaying notification UI");
    Notification.requestPermission(function(permission) {
      console.debug("Hiding notification UI");
      return resolve(permission);
    });
  });
};

ui.pushPrompt = function(opts) {
  return navigator.serviceWorker.ready
    .then(function(reg) {
      console.debug("Displaying push UI");
      return reg;
    })
    .then(function(reg) {
      return Promise.all([reg, reg.pushManager.subscribe(opts)]);
    })
    .then(function(results) {
      console.debug("Hiding push UI on success");
    })
    .catch(function(err) {
      console.debug("Hiding push UI on error");

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

// App Logic

function verifySupport() {
  function assert(prop, message) {
    if (!prop) { throw new Error(message); }
    return true;
  }

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
      return fetch(window.location.origin, {
        mode: "same-origin",
        method: "PUT",
        headers: new Headers({ "Content-Type": "application/json" }),
        body: JSON.stringify({ user: "FIXME", endpoint: sub.endpoint }) // TODO: Generate unique ID
      });
    });
}

Promise.resolve()
  .then(verifySupport)
  .then(function() { console.info("Browser support OK"); })

  .then(function() { return navigator.serviceWorker.register("./serviceworker.js"); })
  .then(function() { console.info("ServiceWorker installation OK"); })

  .then(function() { return enableNotifications(ui.notificationPrompt); })
  .then(function() { console.info("Notifications OK"); })

  .then(function() { return enablePush(ui.pushPrompt); })
  .then(function() { console.info("Push OK"); })

  .then(subscribe)
  .then(function() { console.info("Subscribed OK"); })

  .catch(function(err) { console.error(err.message || err); });
