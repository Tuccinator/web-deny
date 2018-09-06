// initial timer limit is 20 minutes
let timerLimit = 20;

let breaking = false;
let endTime = null;
let breakTimeout = null;

// add a site to the blocked sites list
function addSite(urlToAdd, type) {
	let site = {};

	// automatically add the HTTP/S prefix
	const url = addHttpPrefix(urlToAdd);

	site[urlToAdd] = {
		url: url,
		favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${url}`,
		type: type,
		added_at: Date.now()
	};

	// persist the updated blocked site list to the local storage
	browser.storage.local.set(site);

	// reset the blocked sites
	resetBlockedSites();
}

// add an HTTP/S prefix if non-existant
function addHttpPrefix(s) {
	var prefix = 'http';

	if (s.substr(0, prefix.length) !== prefix) {
	    s = prefix + '://' + s;
	}

	if(s.substr(-1, 1) !== '/') {
		s += '/';
	}

	return s;
}

// listener for intercepting HTTP request 
function listener(details) {
	return {redirectUrl: browser.extension.getURL('blocked.html')};
}

// when a new site is added from the options page, remove the current listener and add a new one with the new site
function resetBlockedSites() {
	browser.webRequest.onBeforeRequest.removeListener(listener);

	getBlockedSitesFormatted();
}

// start the timer for taking a break, only if it hasn't beens started yet
function startTimer() {
	if(!breaking) {	
		breaking = true;
		endTime = Date.now() + (timerLimit * 1000 * 60);

		setTimeout(() => {
			breaking = false;
			endTime = null;

			resetBlockedSites();
			
			clearTimeout(breakTimeout);
		}, timerLimit * 1000 * 60);
	}
}

// retrieve the current timer status for the break
function getBreakStatus() {
	return { status: breaking, endTime: endTime };
}

// update the amount of time a break will be allowed for
function updateTimerLimit(limit) {
	timerLimit = limit;
}

// get the timer limit
function getTimerLimit() {
	return timerLimit;
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

					// if the user is on a break, don't add the intermittent sites to the blocked sites
					if(site.type === 'intermittent' && breaking) {
						continue;
					}

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