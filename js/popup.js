const $breakBtn = document.getElementById('break-btn');
const $settingsBtn = document.getElementById('settings-btn');
const background = browser.extension.getBackgroundPage();

let breakInterval = null;
let breaking = false;

$breakBtn.addEventListener('click', takeBreak);
$settingsBtn.addEventListener('click', openSettings);

// open the options page
function openSettings() {
	browser.tabs.create({url: "../options.html"});
	window.close();
}

// begin the break
function takeBreak() {

	// start the break timer
	background.startTimer();

	// retrieve the status to make sure it began and to set the initial state
	checkBreakStatus();

	// reset the blocked sites to remove the intermittent sites from the list
	background.resetBlockedSites();
}

// show the status of the break
function showTimerStatus(endTime) {

	// calculate the time remaining
	const timeRemaining = Math.round((endTime - Date.now()) / 1000);

	const minutes = Math.floor(timeRemaining / 60);

	const seconds = '' + Math.floor(timeRemaining - (minutes * 60));

	// when the time is up stop the timer and reset the break button
	if(timeRemaining <= 0) {
		clearInterval(breakInterval);
		resetBreakingButton();

		return;
	}

	// update the text within the break button to reflect the time remaining
	$breakBtn.innerHTML = `${minutes}:${seconds.padStart(2, '0')}`;

	return timeRemaining;
}

// reset the breaking button to the default style
function resetBreakingButton() {
	$breakBtn.classList.remove('is-breaking');
	$breakBtn.innerHTML = 'Take a Break';
}

// get the status from the background page and check to see if the timer should be started
function checkBreakStatus() {
	const status = background.getBreakStatus();

	if(status.status) {
		const timeRemaining = showTimerStatus(status.endTime);

		if(timeRemaining >= 0) {
			breakInterval = setInterval(() => {
				showTimerStatus(status.endTime);
			}, 1000);

			$breakBtn.classList.add('is-breaking');		
		}
	}
}

checkBreakStatus();