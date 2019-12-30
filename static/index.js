document.addEventListener("DOMContentLoaded", function(){
	document.querySelector("#username").onkeyup = usernameExist;
});

function usernameExist(){
	// show info here
	let span = document.querySelector('span');
	//submit button
	let submit = document.querySelector("#submit");

	// text value
	let textbox = document.querySelector("#username");

	const request = new XMLHttpRequest();
	
	request.open('POST', '/isUserNameExist');
	request.onload = function(){
		const data = request.responseText;
		if(data == "yes"){
			span.innerHTML = "username already exist";
			span.style.border = "2px solid red";
			submit.disabled = true;
		}
		else{
			span.innerHTML = "username available";
			submit.disabled = false;
			span.style.border = "2px solid green";
		}
	}

	const data = new FormData();
	data.append("username", textbox.value);

	//send request
	request.send(data);
}