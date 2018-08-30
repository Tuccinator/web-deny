// load the blocked list DOM element
const $blockedSites = document.getElementById('blocked-sites');

// check the keystroke from the URL blocker
document.querySelector('input').addEventListener('keyup', e => {

	// when enter is pressed, add to the blocked site list
	if(e.which == 13) {
		loadBlockedSites()
			.then(sites => {
				let site = {};

				// automatically add the HTTP/S prefix
				const url = addHttpPrefix(e.target.value);

				site[e.target.value] = {
					url: url,
					type: 1,
					favicon: url + 'favicon.ico'
				};

				// persist the updated blocked site list to the local storage
				browser.storage.local.set(site);
			})
			.then(() => createBlockedList())
			.then(() => e.target.value = '')
		return false;
	}
});

// load all of the blocked sites from the local storage
function loadBlockedSites() {
	return browser.storage.local.get();
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

// add the blocked sites to the DOM
function createBlockedList() {
	loadBlockedSites()
		.then(sites => {
			$blockedSites.innerHTML = '';

			const siteKeys = Object.keys(sites);
			for(const siteKey of siteKeys) {
				const site = sites[siteKey];

				// create url element
				const siteElement = document.createElement('div');
				siteElement.className = 'blocked-site';

				// create the favicon for the url element
				const siteFavicon = document.createElement('img');
				siteFavicon.src = site.favicon;

				// create the url text
				const siteText = document.createTextNode(site.url);

				// add the favicon and text to the url
				siteElement.append(siteFavicon);
				siteElement.append(siteText);

				// add the url to the blocked sites list
				$blockedSites.append(siteElement);
			}
		})
		.then(() => {
			let backgroundPage = browser.extension.getBackgroundPage();
			backgroundPage.resetBlockedSites();
		})
}

// when the options page is loaded, automatically add the blocked sites to the DOM
window.onload = () => {
	createBlockedList();
};