"use strict"

var _ = require('underscore'),
    util = require('util'),
    Promise = require('bluebird'),
    models = require('../models');

module.exports = {
  name: "monitor",
  description: "Monitors an alliance.",
  usage: "!monitor <world name> <alliance name>",
  callback: function (msg, command, args) {
    var bot = this.bot,
        config = this.config,
        chatLog = this.chatLog,
        world;

    if (!args.length || args.length < 2) {
      var msgArray = [];
      msgArray.push(module.exports.description);
      msgArray.push(util.format("Usage: %s", module.exports.usage));
      msgArray.push(util.format("Example: %s", module.exports.exampls));
      return bot.sendMessage(msg.channel, msgArray);
    }

    if (!msg.channel.server) {
      return bot.sendMessage(msg.author, "I can't do that in DM");
    }

    world = args.shift();

    var data = {
      msg: msg,
      world: world,
      server: msg.channel.server.id,
      channel: msg.channel.id,
      world: _.findWhere(config.serverList, { name: world }),
      alliance: args.join(' ')
    };

    models.Monitors
      .find({
        where: {
          server: data.server,
          channel: data.channel,
          world: world
        }
      })
      .then(function (monitor) {
        if (monitor) {
          data.monitor = monitor;
          var handler = updateMonitor;
        } else {
          var handler = addMonitor;
        }

        getAllianceId(data)
          .then(handler)
          .then(function (data) {
            var content = '';

            if (data.added) {
              content = util.format("Enabled monitor for %s (%s)", data.alliance, data.world.name)
            } else if (data.removed) {
              content = util.format("Disabled monitor for %s (%s)", data.alliance, data.world.name)
            }

            bot.sendMessage(msg.channel, content);
          });
      });
  }
};

function getAllianceId (data) {

  return new Promise(function (resolve) {
    models.Alliances
      .find({
        where: {
          server: data.world.server,
          name: {
            $ilike: data.alliance.replace(/'/g, "''")
          }
        },
        attributes: ['id']
      })
      .then(function (alliance) {
        data.allianceId = alliance.id;
        return resolve(data);
      });
  });
}

function addMonitor (data) {

  return new Promise(function (resolve) {
    models.Monitors
      .build({
        server: data.server,
        channel: data.channel,
        world: data.world.name,
        alliances: data.allianceId,
        last_check: 0
      })
      .save()
      .then(function () {
        return resolve(data);
      });
  });
}

function updateMonitor (data) {
  return new Promise(function (resolve) {
    var alliances = data.monitor.alliances.split(',');

    if (alliances.indexOf(data.allianceId) !== -1) {
      alliances = _.without(alliances, data.allianceId);
      data.removed = true;
    } else {
      alliances.push(data.allianceId);
      data.added = true;
    }

    data.monitor.updateAttributes({
      alliances: alliances.join(',')
    })
    .then(function () {
      return resolve(data);
    });
  });
}