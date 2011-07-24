var UPDATE_CLASS = '.a-b-f-i.a-f-i';
var PLUSSES_CLASS = '.a-b-f-i-sb-nd.a-f-i-sb-nd.d-s-r.a-b-f-i-ha-pe';
var PROFILE_LINK_CLASS = '.cs2K7c.a-f-i-Zb.a-f-i-Zb-U';
var STREAM_NAME = '.a-b-f-U-R';

var SOCIAL_GRAPH = [];
var THAC0 = [];

function googleToJson(responseText) {
	// This function is based on the PHP CleanGoogleJSON function in 
	// https://github.com/jmstriegel/php.googleplusapi/blob/master/lib/GooglePlus/GoogleUtil.php

	// the response starts with ")]}'\n\n", so we need to strip that out to get a valid json structure.
	responseText = responseText.substring(6);

	var instring = false;
	var inescape = false;
	var lastCharacter = '';
	var json = '';
	for (var i = 0; i <= responseText.length; i++) {
		// getting strange behavior where if I don't reset currentCharacter the substring is being appended.
		var currentCharacter = responseText.substr(i, 1);

		// skip unnecessary whitespace
		if (instring || !currentCharacter.match(/\s/)) {
			// handle strings
			if (instring) {
				if (inescape) {
					json += currentCharacter;
					inescape = false;
				} else if (currentCharacter == '\\') {
					json += currentCharacter;
					inescape = true;
				} else if (currentCharacter == '"') {
					json += currentCharacter;
					instring = false;
				} else {
					json += currentCharacter;
				}
			} else {
				switch (currentCharacter) {
					case '"':
						json += currentCharacter;
						instring = true;
						break;
					case ',':
						if ((lastCharacter == ',') || (lastCharacter == '[') || (lastCharacter == '{')) {
							json += 'null';
						}
						json += currentCharacter;
						break;
					case ']':
					case '}':
						if (lastCharacter == ',') {
							json += 'null';
						}
						json += currentCharacter;
						break;
					default:
						json += currentCharacter;
						break;
				}
			}

			lastCharacter = currentCharacter;
		}
	}
	return JSON.parse(json);
}

function getSocialGraph() {
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open('GET', '/_/socialgraph/lookup/circles/?ct=2&m=1', false);
	xmlHttp.send(null);
	return googleToJson(xmlHttp.responseText);
}

function getThac0(circles) {
	var thac0 = [];
	for (var i = 0; i < circles.length; i++) {
		var name = circles[i][1][0];
		if (name.match(/\+\d+/)) {
			// Assign the modifier value (stripped of the + symbol) to the circle's id.
			thac0[circles[i][0][0]] = name.substr(1);
		}
	}
	return thac0;
}

function getProfileCircles(profile) {
	var oid = profile.getAttribute('oid');
	// For some reason when simply calling SOCIAL_GRAPH[2].length frequently it'd return
	// some very strange results (in dev tools SOCIAL_GRAPH[2] would show it contained 60
	// items, however SOCIAL_GRAPH[2].length would return 2. By adding the circledContacts
	// variable everything appears to be returning correctly consistently.
	var circledContacts = SOCIAL_GRAPH[2];
	for (var i = 0; i < circledContacts.length; i++) {
		if (oid == circledContacts[i][0][2]) {
			var circles = [];
			for (var j = 0; j < circledContacts[i][3].length; j++) {
				circles.push(circledContacts[i][3][j][2][0]);
			}
			return circles;
		}
	}
	// When your posts show in your stream you'll fall out here.
	return null;
}

function hideUpdate(profile, plusses) {
	var plusMinimum = 0;
	var circles = getProfileCircles(profile);
	// Circles will be null for your updates.
	if (circles != null) {
		for(var i = 0; i < circles.length; i++) {
			var thac0Circle = THAC0[circles[i]];
			if(thac0Circle != undefined) {
				if (plusMinimum < thac0Circle) {
					plusMinimum = thac0Circle;
				}
			}
		}
	}
	return (plusMinimum != 0) && (plusses < plusMinimum);
}

function filterStream() {
	var stream = document.querySelector(STREAM_NAME).innerText;
	// If we're looking at the stream for a filter circle, don't filter it.
	if (!stream.match(/\+\d+/)) {
		SOCIAL_GRAPH = getSocialGraph();
		// TODO: Can I add a key to a value?
		THAC0 = getThac0(SOCIAL_GRAPH[1]);

		var updates = document.querySelectorAll(UPDATE_CLASS);
		for (var i = 0; i < updates.length; i++) {
			var profile = updates[i].querySelector(PROFILE_LINK_CLASS);
			var plusses = updates[i].querySelector(PLUSSES_CLASS);
			if (plusses != null) {
				plusses = plusses.innerText.substr(1);
			} else {
				plusses = 0;
			}
			if (hideUpdate(profile, plusses)) {
				updates[i].style.display = 'none';
			}
		}
	}
}

(function(){
	filterStream();
	document.body.addEventListener(
		'DOMNodeInserted', function(e) {
			setTimeout(function() {
				filterStream()
			}, 0);
		}
	);
})();
