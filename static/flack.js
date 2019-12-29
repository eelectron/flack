let menu = null;

document.addEventListener('DOMContentLoaded', function (){
	menu = document.querySelector(".menu");

	//connect to websocket
	var socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);

	//on connected, save channel on server
	socket.on("connect", function(){
		document.querySelector("#createChannel").onclick = function(){
			let newChannel 		= document.querySelector("#channelName");
			channelName 		= newChannel.value;

			//clear the text box
			newChannel.value 	= "";

			// save and broadcast the new channel
			socket.emit("create channel", {"channel": channelName});
		}

		// send message without reload
		let send = document.querySelector("#send");
		
		send.onclick = function(){
			let message = document.querySelector("textarea").value;
			let channel = document.querySelector(".active").innerHTML;
			document.querySelector("textarea").value = "";
			document.querySelector("textarea").focus();
			socket.emit("send message", {"channel": channel, "message": message});	
		}
	});

	//show channel on web page , when any client creates a channel
	socket.on("show channel", function(data){
		const div 		= document.createElement("div");
		div.className 	+= " channel";
		div.innerHTML 	= data["channel"];
		div.setAttribute("data-channel", data["channel"]);

		//run when user clicks a channel
		div.addEventListener("click", function(){
			let channelName = this.getAttribute("data-channel");
			showChannelMessage(channelName);
			//update url
			history.pushState({"channelName": data["channel"]}, data["channel"], data["channel"]);
		});
		document.querySelector("#channelList").append(div);

		//create channel message store for this new channel
		let channelRepo = document.createElement("div");
		channelRepo.setAttribute("id", data["channel"]);
		channelRepo.setAttribute("class", "channelRepo");
		document.querySelector(".main").append(channelRepo);
		channelRepo.style.display = "none";
	});

	//add event listener for every channel
	document.querySelectorAll(".channel").forEach(function(channel){
		channel.addEventListener("click", function(){
			let channelName = channel.getAttribute("data-channel");
			showChannelMessage(channelName);
			history.pushState({"channelName": channelName}, channelName, channelName)
		});
	});

	//show message
	socket.on("show message", function(data){
		// creats post to show on web page
		let div = document.createElement("div");
		div.className = "messageInfo";


		let mUser = document.createElement("div");
		mUser.className = "mUser";

		let mTime = document.createElement("div");
		mTime.className = "mTime";

		let mContent = document.createElement("div");
		mContent.className = "mContent";

		mUser.innerHTML = data["user"];
		mTime.innerHTML = data["time"];
		mContent.innerHTML = data["message"];


		div.append(mUser);
		div.append(mTime);
		div.append(mContent);

		//add right click event listener
		div.addEventListener("contextmenu", showmenu);

		let channelRepo = "#" + data["channel"];
		console.log(channelRepo);
		document.querySelector(channelRepo).append(div);
	});

	// user clicks back button on browser
	window.onpopstate = function(event){
		const data 		= event.state;
		let channelName = data["channelName"];

		showChannelMessage(channelName);
	}	
});

//Ask for username if not already set
function getUserName(){
	// Initialize new request
    const request = new XMLHttpRequest();

    request.open("GET", "/username");
    request.onload = function(){
    	let un = request.responseText;
    	if(un == ""){
    		un = prompt("Enter a name for display .");
    	}
    }
    request.send();
}

// input: channel's name
function showChannelMessage(channelName){
	// deactivate previous channel
	let curActive = document.querySelector(".active");
	if(curActive){
		curActive.className = curActive.className.replace("active", "");
	}

	//make this channel active
	document.querySelector("div[data-channel=" + channelName + "]").className += " active";

	//hide message from other channel
	document.querySelectorAll(".channelRepo").forEach(function(channelRepo){
		channelRepo.style.display = "none";
	});

	// show message from this channel
	document.querySelector("#" + channelName).style.display = "block";
}

// show menu
function showmenu(event){
	event.preventDefault();
	console.log("showmenu");
	console.log(event.clientX, event.clientY);
	menu.style.top = event.clientY;
	menu.style.left = event.clientX;
	menu.style.display = "block";
}