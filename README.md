# push-api-demo

This is an attempt to create a simple chatroom example to demonstrate the [Push API][mdn-push]. It also illustrates some uses of [Service Workers][mdn-serviceworkers].

## Supported Browsers

At the moment this demo only works on [Firefox Nightly](https://nightly.mozilla.org/) and Google Chrome.

## Running

1. Install [node.js](https://nodejs.org/) on your computer
2. [Clone](https://help.github.com/articles/cloning-a-repository/) this repository
3. Open a terminal, navigate to your local clone's directory, and run `npm install`
4. Start the server with `npm start`
5. View the app at http://localhost:7000

## Resources

* Mozilla's Push Server ([docs][autopush-docs], [code][autopush-code])
* WebPush Protocol ([spec][webpush-spec])
* Push API ([spec][push-spec], [repo][push-repo])
* HTTP Encrypted Content Encoding ([spec][crypto-spec], [repo][crypto-repo])
* Mozilla Developer Network ([Push API][mdn-push], [Service Workers][mdn-serviceworkers], [Notifications][mdn-notifications])
* Google Developers: Push Notifications on the Open Web ([article][google-push])

[autopush-docs]: https://autopush.readthedocs.org/en/latest/
[autopush-code]: https://github.com/mozilla-services/autopush
[webpush-spec]: https://webpush-wg.github.io/webpush-protocol/#send
[push-spec]: https://w3c.github.io/push-api/
[push-repo]: https://github.com/w3c/push-api
[crypto-spec]: https://martinthomson.github.io/http-encryption/
[crypto-repo]: https://github.com/martinthomson/http-encryption/
[google-push]: https://developers.google.com/web/updates/2015/03/push-notificatons-on-the-open-web
[mdn-push]: https://developer.mozilla.org/docs/Web/API/Push_API
[mdn-serviceworkers]: https://developer.mozilla.org/docs/Web/API/ServiceWorker
[mdn-notifications]: https://developer.mozilla.org/docs/Web/API/notification
