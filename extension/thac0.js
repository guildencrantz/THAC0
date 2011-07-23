var UPDATE_CLASS = '.a-b-f-i.a-f-i';
var PLUSSES_CLASS = '.a-b-f-i-sb-nd.a-f-i-sb-nd.d-s-r.a-b-f-i-ha-pe';
var PROFILE_LINK_CLASS = '.cs2K7c.a-f-i-Zb.a-f-i-Zb-U';

var RELATIONSHIPS = [];
var THAC0 = [];

function googleToJson(responseText) {
	// This function is based on the PHP CleanGoogleJSON function in https://github.com/jmstriegel/php.googleplusapi/blob/master/lib/GooglePlus/GoogleUtil.php

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

function getRelationships() {
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
	for (var i = 0; i < RELATIONSHIPS[2].length; i++) {
		if (oid == RELATIONSHIPS[2][i][0][2]) {
			var circles = [];
			for (var j = 0; j < RELATIONSHIPS[2][i][3].length; j++) {
				circles.push(RELATIONSHIPS[2][i][3][j][2][0]);
			}
			return circles;
		}
	}
	return null;
}

function hideUpdate(profile, plusses) {
	var plusMinimum = 0;
	var circles = getProfileCircles(profile);
	for(var i = 0; i < circles.length; i++) {
		var thac0Circle = THAC0[circles[i]];
		if(thac0Circle != undefined) {
			if (plusMinimum < thac0Circle) {
				plusMinimum = thac0Circle;
			}
		}
	}
	return (plusMinimum != 0) && (plusses < plusMinimum);
}

function filterStream() {
	RELATIONSHIPS = getRelationships();
	// TODO: Can I add a key to a value?
	THAC0 = getThac0(RELATIONSHIPS[1]);

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
