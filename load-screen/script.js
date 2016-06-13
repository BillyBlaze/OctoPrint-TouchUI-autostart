!function() {
	
	var hasPostMessage = false;
	var content = document.getElementById("content");
	var progress = document.getElementById("progress");
	var error = document.getElementById("error");
	var port = ((window.navigator.userAgent.match(/P:([0-9]+)/g) || [""])[0].replace("P:", "")) || 5000;
	var prefix = "http://localhost:"+port+"/";
	var url = prefix + "plugin/touchui/echo";
	var pass = 0;
	var retry = 0;
	var checkTimeout;
	
	var version = 1;
	
	var setMsg = function(title, subtitle, className) {
		progress.innerHTML = title;
		error.innerHTML = subtitle;
		document.body.className = className;
	}
	
	if (localStorage["mainColor"] && localStorage["bgColor"]) {
		document.getElementById("styling").innerHTML = "" +
			"svg { fill: " + localStorage["mainColor"] + "; }" +
			"#progress { color: " + localStorage["mainColor"] + "; }" +
			"#error { color: " + localStorage["mainColor"] + "; }" +
			"body { background: " + localStorage["bgColor"] + "; }" +
			"#progress span { background: " + localStorage["mainColor"] + "; color: " + localStorage["bgColor"] + "; }";
	}

	content.onload = function() {
		setTimeout(function() {
			if (!hasPostMessage) {
				setMsg("OctoPrint loaded without TouchUI", "Tap to retry", "error");
			}
		}, 100);
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
		hasPostMessage = true;

		switch(event.data) {
			case 'loading':
				setMsg("Loading TouchUI", "", "");
				
				checkTimeout = setTimeout(function() {
					setMsg("Startup failed..", "Tap to retry", "error");
				}, 60000); // Wait 1 minutes, if failed give error
				break;
				
			default:
				// version check by number
				if(!isNaN(event.data)) {
					if (parseFloat(event.data) > version) {
						setMsg("Update your bootloader!", "Read the wiki &amp; Tap to proceed", "info");
						return;
						
					//TouchUI is ready and has same version
					} else { 
						clearTimeout(checkTimeout);
						setMsg("", "", "hide");
						return;
					}
				}
				
				if (typeof event.data === "object") {
					var msg = event.data[0];
					var file = event.data[1];
					
					if(msg !== true) { // if true this is not an error
						clearTimeout(checkTimeout);
						setMsg("Startup failed, tap to retry", ((retry > 0) ? msg : ""), "error");
					} else { // if true this is a customization

						localStorage["mainColor"] = event.data[1];
						localStorage["bgColor"] = event.data[2];

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
		//console.log("Pass: " + ++pass);

		if(pass >= 30) {
			setMsg("Connecting to TouchUI failed..", "", "error");
			return;
		}

		var oReq = new XMLHttpRequest();
		oReq.addEventListener('load', reqListener);
		oReq.addEventListener('error', doRequest);
		oReq.addEventListener('abort', doRequest);
		oReq.open("get", url, true);
		oReq.send();

		if(pass > 0) {
			progress.innerHTML = "<span id=\"badge\">" + pass + "</span> Connecting to TouchUI";
		}
	}

	function doRequest() {
		setTimeout(processRequest, 3000);
	};

	doRequest();
}();