(function() {
	if(window.hasRun) return;

	window.hasRun = true;

	browser.runtime.sendMessage(JSON.stringify({action: "check-url", url: window.location.href}));

	browser.runtime.onMessage.addListener(message => {
		if(message == 'block') {
			document.body.innerHTML = 'blocked';
		}
	})
})();