const $blockedSites = document.getElementById('blocked-sites');

document.querySelector('input').addEventListener('keyup', e => {
	if(e.which == 13) {
		loadBlockedSites()
			.then(sites => {
				let site = {};
				const url = addHttpPrefix(e.target.value);

				site[e.target.value] = {
					url: url,
					type: 1,
					favicon: url + 'favicon.ico'
				};

				browser.storage.local.set(site);
			})
			.then(() => createBlockedList())
		return false;
	}
});

function loadBlockedSites() {
	return browser.storage.local.get();
}

function addHttpPrefix(s) {
	var prefix = 'http://';
	if (s.substr(0, prefix.length) !== prefix) {
	    s = prefix + s;
	}

	if(s.substr(-1, 1) !== '/') {
		s += '/';
	}

	return s;
}

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
		});
}

window.onload = () => {
	createBlockedList();
};