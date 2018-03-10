$(document).on('change', '#customFile', function(event) {
    var reader = new FileReader();
    
    reader.onload = function(event) {
	var jsonObj = JSON.parse(event.target.result);
	parse_ichat(jsonObj);
    }
    
    reader.readAsText(event.target.files[0]);
});

function parse_ichat(jsonObj) {
    // Clear containers
    $("#info").text("");
    $("#viewer").empty();

    // Init System
    console.log('Protocol: ' + jsonObj['NS.objects'][0]);
    var sysUser = jsonObj['NS.objects'][3][0]['ServiceLoginID'];
    var numUsers = jsonObj['NS.objects'][3].length;

    // Map color classes & get chat name
    var color = {};
    var status = "Chat with "
    color[sysUser] = "host-message";
    _.each(jsonObj['NS.objects'][3], function(usr, index) {
	color[usr['ID']] = "guest-message color-" + (index % 15);
	status = status + usr['ID'];
	if (index != (numUsers - 1)) {
	    status = status + ', ';
	}
    });

    $("#info").text(status);

    // Group messages by user
    gmsgs = group_message(jsonObj['NS.objects'][2]);
        
    // Create message blocks for each message group
    _.each(gmsgs, function(msgs, index) {
	var container = $('<div id="message-block-' + index + '" class="message-block d-flex flex-column"></div>');
	if (numUsers > 2 && msgs[0]['Sender'] !== null && msgs[0]['Sender']['ID'] != msgs[0]['Sender']['ServiceLoginID']) {
	    $("#viewer").append('<span class="username">' + msgs[0]['Sender']['ID'] + '</span>');
	}

	// Create message for each message
	_.each(msgs, function(msg, index) {
	    // Handle system messages
	    if (msg['Sender'] === null) {
		var sysmsg = msg['OriginalMessage'].split('%@').join(sysUser);
		container = $('<span class="system-message">' + sysmsg + '</span>')
	    }
	    else {
		// Handle /me messages
		var usrmsg = msg['OriginalMessage']
		if (usrmsg.startsWith('/me')) {
		    container = $('<span class="system-message user-message">' + usrmsg.split('/me').join('<b>' + msg['Sender']['ID'] + '</b>') + '</span>')
		}
		else {
		    var elem = $('<span class="message" data-toggle="tooltip" data-placement="top" title="' + msg['Time'] + '">' + usrmsg + '</span>')
		    elem.addClass(color[msg['Sender']['ID']])
		}
	    }
	    container.append(elem);
	});
	$("#viewer").append(container);
    });
}

// Group messages if they are from the same user, and are not system messages
function group_message(msgs) {
    var output = []
    _.each(msgs, function(msg, index, list) {
	if ( _.last(output) === undefined ||
	     _.last(_.last(output)) === undefined ||
	     is_sysmsg(_.last(_.last(output))) ||
	     is_sysmsg(msg) ||
	     msg['Sender']['ID'] != _.last(_.last(output))['Sender']['ID']
	   ) {
	    output.push([msg]);
	}
	else {
	    _.last(output).push(msg);
	}
    });
    return output;
}

// Check if message is a system message
function is_sysmsg(msg) {
    if (msg['Sender'] === null) {
	return true;
    }
    if (msg['OriginalMessage'].startsWith('/me')) {
	return true;
    }
    return false;
}
