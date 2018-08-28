browser.runtime.onMessage.addListener(message => {
	message = JSON.parse(message);
	if(message.action == 'check-url') {
		let tabId = null;
		let url = message.url;

		browser.tabs.query({active: true})
			.then(tabs => {
				tabId = tabs[0].id;
			})
			.then(() => {
				return loadBlockedSites();
			})
			.then(sites => {
				const siteKeys = Object.keys(sites);

				for(const siteKey of siteKeys) {
					const site = sites[siteKey];

					var a = document.createElement('a');
					a.href = site.url;

					var b = document.createElement('a');
					b.href = url;

					let ahost = String(a.host).replace(/^www\./,'');
					let bhost = String(b.host).replace(/^www\./,'');
					
					if(ahost == bhost) {
						browser.tabs.sendMessage(tabId, 'block');
					}
				}
			})
	}
})

function loadBlockedSites() {
	return browser.storage.local.get();
}