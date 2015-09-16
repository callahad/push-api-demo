self.addEventListener("push", function(event) {
  self.registration.showNotification("Ping!", {
    body: "The Service Worker received a push notification",
    icon: "/static/icon.png",
    tag: "push-demo-notification"
  });
});
