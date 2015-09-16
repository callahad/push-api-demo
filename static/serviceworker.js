console.log("Hello from the serviceworker!");

self.addEventListener("push", function(event) {
  self.registration.showNotification("Ping!");
});
