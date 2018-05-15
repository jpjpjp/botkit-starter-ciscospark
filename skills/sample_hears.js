/*

WHAT IS THIS?

This module demonstrates simple uses of Botkit's `hears` handler functions.

In these examples, Botkit is configured to listen for certain phrases, and then
respond immediately with a single line response.

*/

var wordfilter = require('wordfilter');

module.exports = function(controller) {

    /* Collect some very simple runtime stats for use in the uptime/debug command */
    var stats = {
        triggers: 0,
        convos: 0,
    };

    controller.on('heard_trigger', function() {
        stats.triggers++;
    });

    controller.on('conversationStarted', function() {
        stats.convos++;
    });


    controller.hears(['^uptime','^debug'], 'direct_message,direct_mention', function(bot, message) {

        bot.createConversation(message, function(err, convo) {
            if (!err) {
                convo.setVar('uptime', formatUptime(process.uptime()));
                convo.setVar('convos', stats.convos);
                convo.setVar('triggers', stats.triggers);

                convo.say('My main process has been online for {{vars.uptime}}. Since booting, I have heard {{vars.triggers}} triggers, and conducted {{vars.convos}} conversations.');
                convo.activate();
            }
        });

    });

    controller.hears(['^/hello (.*)','^/hello'], 'direct_message,direct_mention', function(bot, message) {
        // get users name out of bot object and build response
        controller.api.people.get(message.data.personId).then(function(identity) {
            let response = identity.displayName + ', you said hello to me!';
            bot.reply(message, response);
        }).catch(function(err) {
            console.error('Failed looking up details for user:'+message.data.id+
                ' Error: '+err.message);
            bot.reply(message, 'Sorry. Can\'t figure out who you are!');
        });
    });

    controller.hears(['^/echo (.*)','^/echo'], 'direct_message,direct_mention', function(bot, message) {
        // echo back what the user entered after the /echo command
        if (message.match[1]) {
            if (!wordfilter.blacklisted(message.match[1])) {
                let response = "Ok, I'll say it: \""+message.match[1]+"\"";
                bot.reply(message, response);
            } else {
                bot.reply(message, '_sigh_');
            }
        } else {
            bot.reply(message, 'I will repeat whatever you say.');
        }
    });

    controller.hears(['^/whoami (.*)','^/whoami'], 'direct_message,direct_mention', function(bot, message) {
        // get users info out of bot object and build response
        controller.api.people.get(message.data.personId).then(function(person) {
            controller.api.rooms.get(message.data.roomId).then(function(room) {
                let response = `${person.displayName} here is some of your information: \n\n\n **Room:** you are in "**${room.title}**" \n\n\n **Room id:** *${message.data.roomId}*`;
                bot.reply(message, response, function (err) {
                    if (err) {console.error('Failed replying to /whoami: '+err.message);}
                    response = ` **Email:** your email on file is *${person.emails[0]}*`;
                    bot.reply(message, response);  
                });
            });
        }).catch(function(err) {
            console.error('Failed looking up details for user:'+message.data.id+
                ' Error: '+err.message);
            bot.reply(message, 'Sorry. Can\'t figure out who you are!');
        });
    });

    controller.hears(['^/leave (.*)','^/leave'], 'direct_message,direct_mention', function(bot, message) {
        // figure out how to send a message and then leave a room
        bot.reply(message, "OK.  I know when I'm not wanted...");
        controller.api.memberships.list({roomId: message.data.roomId}).then(function(memberships) {
            let botId = message.createdBy; // Bot's user ID?
            let botMembership = '';
            for (i=0; i<memberships.items.length; i++) {
                if (memberships.items[i].personId == botId) {
                    botMembership = memberships.items[i].id;
                    break;
                }
            }
            if (botMembership) {
                controller.api.memberships.remove(botMembership);
            } else {
                bot.reply(message, "but I don't know how to leave!");
            }
        }).catch(function(err) {
            console.error('Failed looking up details for user:'+message.data.id+
                ' Error: '+err.message);
            bot.reply(message, 'Sorry. Can\'t figure out who how to leave!');
        });
    });


    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    /* ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ */
    /* Utility function to format uptime */
    function formatUptime(uptime) {
        var unit = 'second';
        if (uptime > 60) {
            uptime = uptime / 60;
            unit = 'minute';
        }
        if (uptime > 60) {
            uptime = uptime / 60;
            unit = 'hour';
        }
        if (uptime != 1) {
            unit = unit + 's';
        }

        uptime = parseInt(uptime) + ' ' + unit;
        return uptime;
    }

};
