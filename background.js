// listener for intercepting HTTP request 
function listener(details) {
	return {redirectUrl: browser.extension.getURL('blocked.html')};
}

// when a new site is added from the options page, remove the current listener and add a new one with the new site
function resetBlockedSites() {
	browser.webRequest.onBeforeRequest.removeListener(listener);

	getBlockedSitesFormatted();
}

// turn all the blocked sites into wildcards to intercept
async function getBlockedSitesFormatted() {
	const result = await new Promise((resolve, reject) => {
		loadBlockedSites()
			.then(sites => {
				let sitesFormatted = [];

				const siteKeys = Object.keys(sites);

				for(const siteKey of siteKeys) {
					const site = sites[siteKey];

					let a = document.createElement('a');
					a.href = site.url;

					sitesFormatted.push(`*://*.${a.host}/*`);
				}

				resolve(sitesFormatted);
			})
	})
	
	// when a request is made, add all of the blocked sites to blocked URLS
	browser.webRequest.onBeforeRequest.addListener(listener, {urls: result, types: ["main_frame"]}, ["blocking"])

	return result;
}

// when the background page loads, automatically load the blocked sites
getBlockedSitesFormatted();

// get all the blocked sites from the local storage
function loadBlockedSites() {
	return browser.storage.local.get();
}