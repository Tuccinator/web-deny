// load the blocked list DOM element
const $intermittentBlockedSites = document.getElementById('intermittent-blocked-sites');
const $intermittentAddSite = document.getElementById('intermittent-add-site');
const $permanentBlockedSites = document.getElementById('permanent-blocked-sites');
const $permanentAddSite = document.getElementById('permanent-add-site');
const $timer = document.getElementById('timer');

const background = browser.extension.getBackgroundPage();
const modal = new VanillaModal.default();

document.body.addEventListener('click', e => {
	let dataUrl = '';
	let move = false;

	// check if the clicked element was the removal button or the icon within
	if(e.target.classList.contains('fa-times')) {
		dataUrl = e.target.parentNode['data-url'];
	} else if(e.target.classList.contains('blocked-site-remove')) {
		dataUrl = e.target['data-url'];
	}

	// check if the blocked type switcher was clicked
	if(e.target.classList.contains('fa-exchange-alt')) {
		dataUrl = e.target.parentNode['data-url'];
		move = true;
	}

	// check if the click is from a blocked site to remove it
	if(dataUrl.length > 0 && !move) {
		removeBlockedSite(dataUrl);
		e.preventDefault();
	} else if(dataUrl.length > 0 && move) {
		moveBlockedSite(dataUrl);
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

		// automatically set the site type to permanent
		let type = 'permanent';

		// check if the site is only intermittently blocked
		if(e.target.id === 'intermittent-input') {
			type = 'intermittent';
		}

		background.addSite(e.target.value, type);

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

			console.log(sites);

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

				const siteTypeSwitcher = document.createElement('a');
				siteTypeSwitcher['data-url'] = site.url;
				siteTypeSwitcher.className = 'blocked-site-switcher';
				siteTypeSwitcher.innerHTML = '<i class="fa fa-exchange-alt"></i>';
				siteTypeSwitcher.href = '#';

				// create the url text
				const siteText = document.createTextNode(site.url);

				// add the favicon and text to the url
				siteElement.append(siteFavicon);
				siteElement.append(siteDeleter);
				siteElement.append(siteText);
				siteElement.append(siteTypeSwitcher);

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

function moveBlockedSite(site) {
	loadBlockedSites()
		.then(sites => {

			// transform the URL into an anchor tag to get the hostname
			const link = document.createElement('a');
			link.href = site;

			// make sure the URL exists in the first place
			if(sites[link.host] !== undefined) {
				let blockType = sites[link.host].type;
				let currentSite = {};

				// change the block type depending on the current setting
				if(blockType == 'intermittent') {
					sites[link.host].type = 'permanent';
				} else {
					sites[link.host].type = 'intermittent';
				}

				sites[link.host].added_at = Date.now();

				currentSite[link.host] = sites[link.host];

				// update the existing stored site
				browser.storage.local.set(currentSite);
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