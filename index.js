const Discord = require('discord.js');
const axios = require('axios');
const bot = new Discord.Client();
const Jimp = require('jimp')
const map = require('./newmap')
const mapping = map.mapping;


bot.login('token');
bot.on('message', msg => {
    var msgContent = msg.content;
    var usrCmd;
    if (msgContent.startsWith('!')) {
        usrCmd = msgContent.substring(1);
    } else if (msgContent.toLowerCase().startsWith("pls ")) {
        usrCmd = msgContent.substring(4);
    } else {
        return;
    }

    var cmd = mapping[usrCmd.split(" ")[0]];
    if (cmd == null) {
        return;
    }

    if (cmd.command == null || cmd.command == "sendFile") {
        sendFile(msg, cmd);
    } else if (cmd.command == 'protest') {
        protest(msg, usrCmd);
    } else if (cmd.command == "help") {
        help(msg, usrCmd);
    } else if (cmd.command == "faq") {
        faq(msg);
    } else if (cmd.command == "gulag") {
        if (adminCheck(msg)) {
            gulag(msg);
        }
    } else if (cmd.command == "ungulag") {
        if (adminCheck(msg)) {
            ungulag(msg);
        }
    } else if (cmd.command == "poll") {
        if (adminCheck(msg)) {
            poll(msg, usrCmd)
        }
    } else if (cmd.command == "rr") {
        rr(msg);
    }
})

function rr(msg) {
    var i = getRandomInt(3);
    if (i == 1) {
        msg.reply("Bang! You will respawn from the gulag in 10 minutes");
        doGulag(msg, msg.author);
        setTimeout(() => {
            doUngulag(msg, msg.author)
        }, 600000);
    } else {
        msg.reply("Click! You live to shitpost another day");
    }
}

function poll(msg, usrCmd) {
    var split = usrCmd.split(", ");
    var time = split[0].replace("poll ", "");
    var title = split[1];
    var i;
    var answers = []
    for (i = 2; i < split.length; i++) {
        answers.push(split[i])
    }

    axios.post('https://strawpoll.com/api/poll', {
        "poll": {
            "title": title,
            // "description": "GMD Poll",
            "answers": answers,
            "priv": true,
            "ma": 0,
            "mip": 0,
            "co": 1,
            "vpn": 0,
            "enter_name": 0,
            "has_deadline": false,
            // "deadline": "2020-02-27T07:00:00.000Z",
            "only_reg": 0,
            "has_image": 0,
            "image": null
        }
    })
        .then(response => {
            msg.channel.send("Poll created! Vote here: https://strawpoll.com/" + response.data.content_id);
            setTimeout(() => {
                axios.get("https://strawpoll.com/api/poll/" + response.data.content_id).then(res => {
                    const exampleEmbed = {
                        color: 0x0099ff,
                        title: 'Poll Results',
                        description: title,
                        fields: [
                        ]
                    };
                    res.data.content.poll.poll_answers.forEach(element => {
                        exampleEmbed.fields.push({
                            name: element.answer,
                            value: element.votes + " votes"
                        })
                    });
                    msg.reply({ embed: exampleEmbed });
                }).catch(error => {
                    console.log(error);
                });
            }, parseInt(time) * 60000)
        })
        .catch(error => {
            console.log(error);
        });
}

function gulag(msg) {
    const user = msg.mentions.users.first();
    // If we have a user mentioned
    if (user) {
        doGulag(msg, user)
        msg.reply(user + " has been sent to the gulag!");
    }
}

function ungulag(msg) {
    const user = msg.mentions.users.first();
    // If we have a user mentioned
    if (user) {
        doUngulag(msg, user);
        msg.reply(user + " has been released from the gulag!");
    }
}

function doUngulag(msg, user) {
    // Now we get the member from the user
    const member = msg.guild.member(user);
    // If the member is in the guild
    if (member) {
        // Add the role!
        let bad = msg.guild.roles.find(role => role.name === "Doad");
        member.addRole(bad).catch(console.error);

        // Remove a role!
        let doad = msg.guild.roles.find(role => role.name === "Bad Dog");
        member.removeRole(doad).catch(console.error);
    }
}

function doGulag(msg, user) {
    // Now we get the member from the user
    const member = msg.guild.member(user);
    // If the member is in the guild
    if (member) {
        // Add the role!
        let bad = msg.guild.roles.find(role => role.name === "Bad Dog");
        member.addRole(bad).catch(console.error);

        // Remove a role!
        let doad = msg.guild.roles.find(role => role.name === "Doad");
        member.removeRole(doad).catch(console.error);
    }
}

function adminCheck(msg) {
    // get role by name
    let myRole = msg.guild.roles.find(role => role.name === "Admin");
    let isAdmin = msg.member.roles.has(myRole.id) || msg.author.id == '108309473692483584';
    if (!isAdmin) {
        msg.reply("Sorry, I can't do that for plebs!")
    }

    return isAdmin;
}

function faq(msg) {
    const exampleEmbed = {
        color: 0x0099ff,
        title: 'GMD Bot FAQ',
        description: "If you were based, you would know this stuff",
        fields: [
            {
                name: "Why did my favorite channel disappear?",
                value: "[Expand the Lounge dropdown](https://cdn.discordapp.com/attachments/674064859184365589/720574941325557810/image0.png)"
            }
        ],
    };
    msg.channel.send({ embed: exampleEmbed });
}

function help(msg, usrCmd) {
    var i;
    var k = 1;
    var keys = Object.keys(mapping);

    var split = usrCmd.split(" ");
    if (split.length > 1) {
        k = parseInt(split[1]);
    }

    const exampleEmbed = {
        color: 0x0099ff,
        title: 'GMD Bot Help',
        description: "Type !command or pls command with any of the following:",
        fields: [
        ],
        footer: {
            text: 'Page ' + k + " of " + Math.ceil(keys.length / 24)
        }
    };

    for (i = 0 + (24 * (k - 1)); i < 24 + (24 * (k - 1)); i++) {
        if (keys[i] != null) {
            exampleEmbed.fields.push({
                name: keys[i],
                value: mapping[keys[i]].desc,
                inline: true
            })
        }
    }

    msg.channel.send({ embed: exampleEmbed });
}

function sendFile(msg, arr) {
    if (arr != null) {
        var file = arr.files[getRandomInt(arr.files.length)]
        msg.channel.send("", {
            files: [
                "./files/" + file
            ]
        })
    }
}

function protest(msg, name) {
    name = name.replace('protest', "");
    Jimp.read('img.png', (err, img) => {
        var font;
        if (err) throw err;
        if (name.length > 110) {
            msg.channel.send("Sorry " + msg.author + ", that's too long!");
            return;
        } else if (name.length > 40) {
            font = Jimp.FONT_SANS_8_BLACK;
        } else if (name.length > 25) {
            font = Jimp.FONT_SANS_10_BLACK;
        } else {
            font = Jimp.FONT_SANS_16_BLACK;
        }

        Jimp.loadFont(font).then(font => {
            img.print(font, 0, 5, {
                text: name,
                alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER
            }, 100, 20)
                .write('test.png');
            msg.channel.send("", {
                files: [
                    "./test.png"
                ]
            })
        }).catch(err => console.log(err))


    });
}

function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}