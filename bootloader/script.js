!function() {

	var content = document.getElementById("content");
	var progress = document.getElementById("progress");
	var error = document.getElementById("error");
	var port = ((window.navigator.userAgent.match(/P:([0-9]+)/g) || [""])[0].replace("P:", "")) || 5000;

	var url = (window.navigator.userAgent.indexOf("IPv6") !== -1) ? "http://[::1]" : "http://localhost";
	var prefix = (port == "80") ? url + "/" : url + ":"+port+"/";

	var pingUrl = prefix + "plugin/touchui/ping";
	var pass = 0;
	var checkTimeout;
	var removeTimeout;
	
	var version = 3;
	
	var setMsg = function(title, subtitle, className) {
		progress.innerHTML = title;
		error.innerHTML = subtitle;
		document.body.className = className;
	}

	document.getElementById("info").innerHTML = "Connecting to " + prefix;
	
	if (localStorage["mainColor"] && localStorage["bgColor"]) {
		document.getElementById("styling").innerHTML = "" +
			"svg { fill: " + localStorage["mainColor"] + "; }" +
			"#progress { color: " + localStorage["mainColor"] + "; }" +
			"#error { color: " + localStorage["mainColor"] + "; }" +
			"body { background: " + localStorage["bgColor"] + "; }" +
			"#info { color: " + localStorage["mainColor"] + "; }" +
			"#progress span { background: " + localStorage["mainColor"] + "; color: " + localStorage["bgColor"] + "; }";
	}

	content.onload = function() {
		// wait 30 seconds before hidding bootloader
		// normally TouchUI will indicate it has been loaded
		// however if TouchUI fails to load this will continue to OctoPrint
		removeTimeout = setTimeout(function() {
			setMsg("", "", "hide");
		}, 30000); 
	}

	document.addEventListener("click", function() {
		if (document.body.className.indexOf("error") !== -1) {
			setMsg("Connecting to TouchUI", "", "");
			
			pass = 0;
			++retry;
			doRequest();
		}
		if (document.body.className.indexOf("info")!== -1) {
			setMsg("", "", "hide");
		}
	}, false);

	window.addEventListener("message", function(event) {
		switch(event.data) {
			case 'reset':
				setMsg("Loading OctoPrint", "", "");
				break;

			case 'loading':
				setMsg("Loading TouchUI", "", "");
				
				if (!checkTimeout) {
					checkTimeout = setTimeout(function() {
						setMsg("Startup failed..", "Tap to retry", "error");
					}, 60000); // Wait 1 minutes, if failed give error
				}
				break;
				
			default:
				clearTimeout(checkTimeout);
				checkTimeout = false;

				// version check by number
				if(!isNaN(event.data)) {
					if (parseFloat(event.data) > version) {
						setMsg("Update your bootloader!", "Read the wiki how, tap to proceed", "info");
						return;
						
					//TouchUI is ready and has same version
					} else { 
						setMsg("", "", "hide");
						clearTimeout(removeTimeout);
						return;
					}
				}
				
				if (typeof event.data === "object") {
					// if not true this is an error
					if(event.data[0] !== true) {
						setMsg("Startup failed, tap to retry", event.data[0].replace(/(?:\r\n|\r|\n)/g, '<br>'), "error");
					} else { // if true this is a customization
						localStorage["mainColor"] = event.data[1];
						localStorage["bgColor"] = event.data[2];

						document.getElementById("styling").innerHTML = "" +
							"svg { fill: " + localStorage["mainColor"] + "; }" +
							"#progress { color: " + localStorage["mainColor"] + "; }" +
							"#error { color: " + localStorage["mainColor"] + "; }" +
							"body { background: " + localStorage["bgColor"] + "; }" +
							"#info { color: " + localStorage["mainColor"] + "; }" +
							"#progress span { background: " + localStorage["mainColor"] + "; color: " + localStorage["bgColor"] + "; }";
					}
				}
				break;
		}
	}, false);

	function reqListener () {
		setMsg("Loading OctoPrint", "", "");
		content.setAttribute("src", prefix);
	}

	function processRequest() {
		++pass;
		//console.log("Pass: " + pass);

		if(pass >= 30) {
			setMsg("Connecting to TouchUI failed..", "", "error");
			return;
		}

		var oReq = new XMLHttpRequest();
		oReq.addEventListener('load', reqListener);
		oReq.addEventListener('error', doRequest);
		oReq.addEventListener('abort', doRequest);
		oReq.open("get", pingUrl, true);
		oReq.send();
	}

	function doRequest() {
		setTimeout(processRequest, 3000);
		
		if(pass > 0) {
			progress.innerHTML = "<span id=\"badge\">" + pass + "</span> Connecting to TouchUI";
		}
	};

	doRequest();
}();