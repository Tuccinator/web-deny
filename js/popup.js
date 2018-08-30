document.getElementById('settings-btn').addEventListener('click', openSettings);

// open the options page
function openSettings() {
	browser.tabs.create({url: "../options.html"});
}