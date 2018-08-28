document.getElementById('settings-btn').addEventListener('click', openSettings);

function openSettings() {
	browser.tabs.create({url: "../options.html"});
}