let menu = null;

// currently selected message
let msg = null;

let socket;
document.addEventListener('DOMContentLoaded', function (){
	menu = document.querySelector(".menu");

	//connect to websocket
	socket = io.connect(location.protocol + "//" + document.domain + ":" + location.port);

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
			//select a channel before sending
			let ch = document.querySelector(".active")
			if(ch == null){
				alert("Please select a channel .");
			}
			else{
				let message = document.querySelector("textarea").value;
				let channel = document.querySelector(".active").innerHTML;
				document.querySelector("textarea").value = "";
				document.querySelector("textarea").focus();
				socket.emit("send message", {"channel": channel, "message": message});	
			}	
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

		// hide this channel
		channelRepo.style.display = "none";
	});

	//delete mesage from every one browser
	socket.on("delete message", function(data){
		let cn = data["channelName"];
		let un = data["username"];
		let dt = data["datetime"];

		//iterate over every message of this channel
		let messages = document.querySelector("#" + cn).children;
		
		for(let i = 0; i < messages.length; i++){
			//delete msg if user and time matches
			if(messages[i].querySelector(".mUser").innerHTML == un && messages[i].querySelector(".mTime").innerHTML == dt){
				messages[i].style.animationPlayState = "running";
				messages[i].onanimationend = function(event){
					messages[i].remove();
				}
				break;
			}
		}
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
		div.oncontextmenu = showmenu;

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

	//add a listener for leaving the menu and hiding it
    menu.addEventListener('mouseleave', hidemenu);	

    // add context menu to already created post
    document.querySelectorAll(".messageInfo").forEach(function(msgDiv){
    	msgDiv.oncontextmenu = showmenu;
    });

    // make message backgroud to green 
    document.querySelector("#green").onclick = changeToColor;

    //delete msg
    document.querySelector("#delete").onclick = deleteMsg;
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

// show context menu when right click on a post
function showmenu(event){
	event.preventDefault();
	msg = this;
	menu.style.top = `${event.clientY}px`;
	menu.style.left = `${event.clientX}px`;
	menu.style.display = "block";
}

// hide menu when remove mouse from menu
function hidemenu(e){
	menu.style.display = "none";
}

// change post to green color
function changeToColor(){
	msg.style.backgroundColor = "#ccffcc";
}

// delete the message
function deleteMsg(){
	let channelName = document.querySelector(".active").dataset.channel;
	let un = msg.querySelector(".mUser").innerHTML;
	let dt = msg.querySelector(".mTime").innerHTML;
	socket.emit("delete message", {"channelName": channelName, "username": un, "datetime": dt});
}