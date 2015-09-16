/* eslint-env browser */
/* eslint no-console: 0 */

"use strict";

function updateStatus(what, label, okOrAction) {
  var ok;
  var action;

  if (typeof okOrAction === "function") {
    ok = undefined;
    action = okOrAction;
  } else {
    ok = okOrAction;
    action = undefined;
  }

  var target = document.querySelector(".status[data-what='" + what + "']");

  var elem;
  if (action) {
    elem = document.createElement("button");
    elem.appendChild(document.createTextNode(label));
    elem.addEventListener("click", function(e) {
      e.preventDefault();
      action();
    });
  } else {
    elem = document.createTextNode(label);
  }

  while (target.firstChild) { target.removeChild(target.firstChild); }

  target.dataset.disposition = ok;
  target.appendChild(elem);
}

function checkCapabilities() {
  return new Promise(function(resolve, reject) {
    var errors = [];

    // Service Worker
    if (!("serviceWorker" in navigator)) {
      updateStatus("serviceworker", "unsupported", false);
      errors.push(new Error("Service Workers not supported"));
    } else {
      updateStatus("serviceworker", "supported");
    }

    // Service Worker Notifications
    if (!("showNotification" in ServiceWorkerRegistration.prototype)) {
      updateStatus("swnotifications", "unsupported", false);
      errors.push(new Error("Notifications not supported in Service Workers"));
    } else {
      updateStatus("swnotifications", "supported", true);
    }

    // Desktop Notifications
    if (Notification.permission === "denied") {
      updateStatus("notifications", "blocked", false);
      errors.push(new Error("Notifications blocked"));
    } else if (Notification.permission === "granted") {
      updateStatus("notifications", "enabled", true);
    } else {
      updateStatus("notifications", "enable", function() {
        enableNotifications()
        .then(function() { updateStatus("notifications", "enabled", true); })
        .catch(function() { updateStatus("notifications", "blocked", false); });
      });
    }

    // Push API
    if (!("PushManager" in window)) {
      updateStatus("push", "unsupported", false);
      errors.push(new Error("Push messages not supported"));
    } else {
      updateStatus("push", "supported");
      navigator.serviceWorker.ready
      .then(function(reg) {
        return reg.pushManager.permissionState();
      })
      .then(function(permission) {
        switch (permission) {
          case "granted":
            return subscribe();
          case "prompt":
            return false;
          case "denied":
            throw new Error("Push notifications are blocked");
          default:
            throw new Error("Unexpected error checking Push permission");
        }
      })
      .then(function(subscribed) {
        if (subscribed) {
          updateStatus("push", "subscribed", true);
        } else {
          updateStatus("push", "subscribe", function() {
            subscribe()
            .then(function() { updateStatus("push", "subscribed", true); })
            .catch(function() { updateStatus("push", "subscription failed", false); });
          });
        }
      })
      .catch(function(e) {
        updateStatus("push", "error", false);
        console.error(e);
      });
    }

    if (errors.length) {
      errors.forEach(function (error) { console.error(error); });
      return reject("Missing required APIs, see console for details.");
    }

    return resolve(true);
  });
}

function registerWorker() {
  return navigator.serviceWorker.register("./serviceworker.js")
  .then(function() { updateStatus("serviceworker", "active", true); })
  .catch(function(e) { updateStatus("serviceworker", "failed", false) ; console.error(e); });
}

function enableNotifications() {
  return new Promise(function(resolve, reject) {
    Notification.requestPermission(function(result) {
      switch (result) {
        case "granted":
          return resolve(result);
        case "denied":
          return reject(new Error("Notification request denied"));
        case "default":
          return reject(new Error("Notification request dismissed"));
        default:
          return reject(new Error("Unexpected error enabling notifications"));
      }
    });
  });
}

function subscribe() {
  return navigator.serviceWorker.ready
  .then(function(reg) {
    return Promise.all([reg, reg.pushManager.getSubscription()]);
  })
  .then(function(results) {
    var reg = results[0];
    var sub = results[1];
    return sub || reg.pushManager.subscribe({ userVisibleOnly: true });
  })
  .then(function(sub) {
    return fetch(window.location.origin, {
      method: "PUT",
      body: JSON.stringify({ user: "Bob", endpoint: sub.endpoint }),
      headers: new Headers({ "Content-Type": "application/json" }),
      mode: "same-origin"
    });
  })
  .then(function(res) {
    if (!res.ok) { throw new Error("Unable to subscribe"); }

    console.log("Subscribed!");
    return true;
  })
  .catch(function(err) {
    console.error(err);
  });
}

function unsubChat() {
  return fetch(window.location.origin, {
    method: "DELETE",
    body: JSON.stringify({ user: "Bob" }),
    headers: new Headers({ "Content-Type": "application/json" }),
    mode: "same-origin"
  })
  .then(function(res) {
    if (!res.ok) { throw new Error("Unable to unsubscribe from chat"); }

    console.log("Unsubscribed from chat!");
  });
}

function unsubPush() {
  return navigator.serviceWorker.ready
  .then(function(reg) {
    return reg.pushManager.getSubscription();
  }).then(function(sub) {
    return sub ? sub.unsubscribe() : true;
  }).then(function(success) {
    if (!success) { throw new Error("Unable to unsubscribe from push service"); }

    console.log("Unsubscribed from push service!");
  });
}

function unsubscribe() {
  return Promise.all([unsubChat(), unsubPush()])
  .then(function() {
    console.log("Fully unsubscribed!");
  }).catch(function(err) {
    console.error(err);
  });
}

checkCapabilities()
.then(registerWorker)
.catch(function (err) {
  console.log(err);
});
