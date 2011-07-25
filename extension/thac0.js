var UPDATE_CLASS = '.a-b-f-i.a-f-i';
var PLUSSES_CLASS = '.a-b-f-i-sb-nd.a-f-i-sb-nd.d-s-r.a-b-f-i-ha-pe';
var PROFILE_LINK_CLASS = '.cs2K7c.a-f-i-Zb.a-f-i-Zb-U';
var STREAM_NAME = '.a-b-f-U-R';

var THAC0 = [];
var CIRCLED_CONTACTS = [];
var ARMOR_CACHE = [];

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

function loadSocialGraph() {
	xmlHttp = new XMLHttpRequest();
	xmlHttp.open('GET', '/_/socialgraph/lookup/circles/?ct=2&m=1', false);
	xmlHttp.send(null);
	var socialGraph = googleToJson(xmlHttp.responseText);
	THAC0 = getThac0(socialGraph[1]);
	CIRCLED_CONTACTS = socialGraph[2];
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
	for (var i = 0; i < CIRCLED_CONTACTS.length; i++) {
		if (oid == CIRCLED_CONTACTS[i][0][2]) {
			var circles = [];
			for (var j = 0; j < CIRCLED_CONTACTS[i][3].length; j++) {
				circles.push(CIRCLED_CONTACTS[i][3][j][2][0]);
			}
			return circles;
		}
	}
	// When your posts show in your stream you'll fall out here.
	// TODO: There needs to be a check somewhere to see if the
	// update is from the user or not, if it's not then we need to
	// redownload the socialgraph and update everything.
	return null;
}

function cacheArmorModifier(profile) {
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
	ARMOR_CACHE[profile] = plusMinimum;
}

function hideUpdate(profile, plusses) {
	if (ARMOR_CACHE[profile] == undefined) {
		cacheArmorModifier(profile);
	} 

	return (ARMOR_CACHE[profile] != 0) && (plusses < ARMOR_CACHE[profile]);
}

function filterStream() {
	var stream = document.querySelector(STREAM_NAME).innerText;
	// If we're looking at the stream for a filter circle, don't filter it.
	if (!stream.match(/\+\d+/)) {
		if (CIRCLED_CONTACTS.length == 0) {
			loadSocialGraph();
		}

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
			} else {
				// TODO: Need to add a class to updates I've hidden, then
				// only redisplay those updates here.
				updates[i].style.display = 'inline';
			}
		}
	}
}

(function(){
	filterStream();
	// TODO: Tighten up the trigger.
	document.body.addEventListener(
		'DOMNodeInserted', function(e) {
			setTimeout(function() {
				filterStream()
			}, 0);
		}
	);
})();
