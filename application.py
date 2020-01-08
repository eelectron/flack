import os
from datetime import datetime

from flask import Flask, render_template, session, request, redirect, url_for
from flask_socketio import SocketIO, emit

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0
socketio = SocketIO(app)

#For heroku
if os.getenv("SECRET_KEY") is None:
    app.config["SECRET_KEY"] = "kuchbhi"
    
# store channels
channels = {}
MAX_NUM_OF_MSG = 100

# save all usernames
usernames = set()

@app.route("/")
def index():
	if 'username' in session:
		username = session["username"]
		return render_template("flack.html", username=username, channels=channels)
	else:
		return render_template("index.html")


@app.route("/isUserNameExist", methods=["POST"])
def isUserNameExist():
	username = request.form.get("username")
	if username in usernames:
		return "yes"
	else:
		return "no"

@app.route("/username", methods=["POST", "GET"])
def getusername():
	method = request.method
	if method == "POST":
		username = request.form.get("username")
		session["username"] = username
		usernames.add(username)
		return redirect(url_for("index"))
	else:
		return render_template("username.html")


@socketio.on("create channel")
def createChannel(data):
	cn = data["channel"]
	if cn not in channels:
		channels[cn] = []
		emit("show channel", {"channel": cn}, broadcast=True)

'''
Server receives a new message .
It saves the msg and broadcast to every client .
'''
@socketio.on("send message")
def sendMessage(data):
	channel = data["channel"]
	message = data["message"]
	date = datetime.now()
	localDate = date.strftime("%x") + " " + date.strftime("%X")
	channels[channel].append({"message":message, "user":session["username"], "time":localDate})
	if len(channels[channel]) > MAX_NUM_OF_MSG:
		channels[channel].pop(0)
	emit("show message", {"channel": channel, "message":message, "user":session["username"], "time":localDate}, broadcast=True)


'''
User can delete their message but not others
'''
@socketio.on("delete message")
def deleteMessage(data):
	cn = data["channelName"]
	un = data["username"]
	dt = data["datetime"]
	if un != session["username"]:
		return

	msgs = channels[cn]
	deleteMsg = None
	for msg in msgs:
		if msg["user"] == un and msg["time"] == dt:
			deleteMsg = msg
			break
	msgs.remove(deleteMsg)
	emit("delete message", data, broadcast=True)
