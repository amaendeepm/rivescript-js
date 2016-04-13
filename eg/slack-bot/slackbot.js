"use strict";

// Example Slack bot for RiveScript-JS.
//
// To run this bot, edit config.js to fill in your Slack Auth token and other
// settings for the bot.

var config = require("./config"),
	RiveScript = require("../../lib/rivescript"),
	Slack = require("slack-client");

var slack = new Slack(config.token, true, true);
var rs = new RiveScript();

rs.loadDirectory("../brain", function() {
	rs.sortReplies();
	slack.login();

	slack.on("webhook", function(msg) {
			console.error("Message came on webhook: ", msg);
	});

	slack.on("error", function(err) {
		console.error("Slack error:", err);
	});

	slack.on("open", function() {
		console.log("Welcome to Slack. You are %s of %s",
			slack.self.name, slack.team.name);
	});

	slack.on("close", function() {
		console.warn("Disconnected from Slack.");
	});

	slack.on("message", function(data) {
		console.log("registered incoming " + data);
		var user = data._client.users[data.user];
		var messageData = data.toJSON();
		var message = "";
		var reply = "";
		var channel;

		if (messageData && messageData.text) {
			message = "" + messageData.text.trim();
		}

		var matchAt = message.match(/<@(.*?)>/);
		var matchName = message.toLowerCase().indexOf(config.name) == 0;
		if ((matchAt && matchAt[1] === slack.self.id) || matchName) {
			message = message.replace(/<@(.*?)>:?/, "").trim();
			message = message.replace(
				new RegExp("^" + config.name.toLowerCase(), "i"), ""
			).trim();

			// Fetch rivescript reply.
			reply = rs.reply(user.name, message);


			// Send it to the channel.
			channel = slack.getChannelGroupOrDMByID(messageData.channel);
			if (reply.length > 0) {
				channel.send(reply);
			}
		} else if (messageData.channel[0] === "D") {
			// Direct message.
			console.log("Message came: " + message);
			if(user === undefined) {
				console.log("Message came from webhook only");
				reply = rs.reply("webhookbot", message);
				channel = slack.getChannelGroupOrDMByName("webhookbot");
				console.log("channel identified for webhook response: " + channel);
			} else {
			console.log("Message User object : " + user);
			console.log("Message came from " + user.name + ":: " + message);

			reply = rs.reply(user.name, message);

			console.log("Reply sent to " + user.name + ":: " + reply);

			channel = slack.getChannelGroupOrDMByName(user.name);
			console.log("channel identified for direct response: ", channel);
			if (reply.length > 0) {
				channel.send(reply);
			}
		}
		}
	});
})
