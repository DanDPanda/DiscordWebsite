"use strict";

(function() {
	var xmlhttp;
	var text;

	xmlhttp=new XMLHttpRequest();
	xmlhttp.open("GET","getLogs",true);
	xmlhttp.send();

	xmlhttp.onreadystatechange=function() {
		var state = xmlhttp.readyState;
		var status = xmlhttp.status;
		if (xmlhttp.readyState==4 && xmlhttp.status == 200) {
			text = xmlhttp.responseText;
			document.getElementById("table_body").innerHTML=text;
		}
	}
})();
