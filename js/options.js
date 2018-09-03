// load the blocked list DOM element
const $intermittentBlockedSites = document.getElementById('intermittent-blocked-sites');
const $intermittentAddSite = document.getElementById('intermittent-add-site');
const $permanentBlockedSites = document.getElementById('permanent-blocked-sites');
const $permanentAddSite = document.getElementById('permanent-add-site');
const $timer = document.getElementById('timer');

const background = browser.extension.getBackgroundPage();
const modal = new VanillaModal.default();

document.body.addEventListener('click', e => {
	// check if the click is from a blocked site to remove it
	if(e.target.classList.contains('blocked-site-remove')) {
		removeBlockedSite(e.target['data-url']);
		e.preventDefault();
	}
})

$intermittentAddSite.addEventListener('click', e => {
	modal.open('#intermittent-modal');
});

$permanentAddSite.addEventListener('click', e => {
	modal.open('#permanent-modal');
});

// set the initial value of the timer to the user-defined setting
$timer.value = background.getTimerLimit();

// check for an "enter" key press to submit the new timer limit
$timer.addEventListener('keyup', e => {
	if(e.which == 13) {
		background.updateTimerLimit(parseInt(e.target.value));
	}
})

function onKeyup(e) {
	// when enter is pressed, add to the blocked site list
	if(e.which == 13) {
		let site = {};

		// automatically add the HTTP/S prefix
		const url = addHttpPrefix(e.target.value);

		// automatically set the site type to permanent
		let type = 'permanent';

		// check if the site is only intermittently blocked
		if(e.target.id === 'intermittent-input') {
			type = 'intermittent';
		}

		site[e.target.value] = {
			url: url,
			favicon: `https://s2.googleusercontent.com/s2/favicons?domain_url=${url}`,
			type: type,
			added_at: Date.now()
		};

		// persist the updated blocked site list to the local storage
		browser.storage.local.set(site);

		// create the new lists for each category
		createBlockedList();

		// reset the input
		e.target.value = '';
	}
}

// check the keystroke from the URL blockers
document.getElementById('intermittent-input').addEventListener('keyup', onKeyup);
document.getElementById('permanent-input').addEventListener('keyup', onKeyup);

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
		.then(unsortedSites => {
			// grab the keys from the storage object
			const unsortedKeys = Object.keys(unsortedSites);

			// create a new array to store the site objects
			const unsortedSitesTransformed = [];

			// go through each object key and get the site matching the key
			for (const unsortedKey of unsortedKeys) {
				const unsortedSite = unsortedSites[unsortedKey];

				// add the site to the array
				unsortedSitesTransformed.push(unsortedSite);
			}

			// sort the array by date descending
			return unsortedSitesTransformed.sort((a, b) => b.added_at - a.added_at);
		})
		.then(sites => {

			$intermittentBlockedSites.innerHTML = '';
			$permanentBlockedSites.innerHTML = '';

			for (const site of sites) {

				// create url element
				const siteElementContainer = document.createElement('div');
				siteElementContainer.className = 'blocked-site-container';

				const siteElement = document.createElement('div');
				siteElement.className = 'blocked-site';

				// create the favicon for the url element
				const siteFavicon = document.createElement('img');
				siteFavicon.src = site.favicon;

				const siteDeleter = document.createElement('a');
				siteDeleter['data-url'] = site.url;
				siteDeleter.className = 'blocked-site-remove';
				siteDeleter.innerHTML = '<i class="fa fa-times"></i>';
				siteDeleter.href = '#';

				// create the url text
				const siteText = document.createTextNode(site.url);

				// add the favicon and text to the url
				siteElement.append(siteFavicon);
				siteElement.append(siteDeleter);
				siteElement.append(siteText);

				siteElementContainer.append(siteElement);

				// add the url to the appropriate blocked sites list
				if(site.type === 'intermittent') {
					$intermittentBlockedSites.append(siteElementContainer);
				} else {
					$permanentBlockedSites.append(siteElementContainer);
				}
			}
		})
		.then(() => {
			background.resetBlockedSites();
		})
}

function removeBlockedSite(site) {
	loadBlockedSites()
		.then(sites => {

			// transform the URL into an anchor tag to get the hostname
			const link = document.createElement('a');
			link.href = site;

			// make sure the URL exists in the first place
			if(sites[link.host] !== undefined) {
				browser.storage.local.remove(link.host);
			}
		})
		.then(() => {
			createBlockedList();
		})
}

// when the options page is loaded, automatically add the blocked sites to the DOM
window.onload = () => {
	createBlockedList();
};