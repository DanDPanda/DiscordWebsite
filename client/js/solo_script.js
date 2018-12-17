"use strict";

(function() {
var url = "getPlayerStats?id=" + window.location.href.split("?")[1].split("=")[1];
var xmlhttp;
var owned;
var notOwned;
var nickname;

xmlhttp=new XMLHttpRequest();
xmlhttp.open("GET",url,true);
xmlhttp.send();

xmlhttp.onreadystatechange=function() {
	var state = xmlhttp.readyState;
	var status = xmlhttp.status;
	if (xmlhttp.readyState==4 && xmlhttp.status == 200) {
		nickname = xmlhttp.responseText.split("~!@")[0];
		owned = xmlhttp.responseText.split("~!@")[1];
		notOwned = xmlhttp.responseText.split("~!@")[2];
		document.getElementById("table_body").innerHTML=owned;
		document.getElementById("table_bod").innerHTML=notOwned;
		document.getElementById("title_text").innerHTML="<font size='100'><b>" + nickname + "</b></font>";
	}
}
})();
