"use strict";

(function() {
	var url = "getListOfPlayers";
	var xmlhttp;
	var text;
	var parseJSON;
	var table;
	var i;

	xmlhttp=new XMLHttpRequest();
	xmlhttp.open("GET",url,true);
	xmlhttp.send();

	xmlhttp.onreadystatechange=function()
	  {
	  var state = xmlhttp.readyState;
	  var status = xmlhttp.status;
	  if (xmlhttp.readyState==4 && xmlhttp.status == 200)
	    {
			text = xmlhttp.responseText;
	    document.getElementById("table_body").innerHTML=text;
		}
	 }
})();
