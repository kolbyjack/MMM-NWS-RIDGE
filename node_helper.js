"use strict";

const NodeHelper = require("node_helper");
const request = require("request");
const htmlparser = require("htmlparser2");
const domutils = require("domutils");

function fmt(f) {
    var parts = f.split("{}");
    var result = parts[0];
    var i;

    for (i = 1; i < parts.length; ++i) {
        result += arguments[i] + parts[i];
    }

    return result;
}

module.exports = NodeHelper.create({
  start: function() {
    var self = this;

    console.log(fmt("Starting node helper for: {}", self.name));
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "FETCH_NWS_RIDGE") {
      self.fetchRidgeData(payload);
    }
  },

  fetchRidgeData: function(config) {
    var self = this;
    var url;
    var method = "GET";
    var body = undefined;

    self.request(config, {
      url: fmt("https://radar.weather.gov/ridge/RadarImg/{}/{}/", config.radarType, config.station),
      headers: {
        "user-agent": "MagicMirror:MMM-NWS-RIDGE:v1.0"
      },
    });
  },

  request: function(config, params) {
    var self = this;

    if (!("headers" in params)) {
      params.headers = {};
    }

    if (!("cache-control" in params.headers)) {
      params.headers["cache-control"] = "no-cache";
    }

    request(params,
      function(error, response, body) {
        if (error) {
          self.sendSocketNotification("NWS_RIDGE_FETCH_ERROR", { error: error });
          return console.error(fmt(" ERROR - MMM-NWS-RIDGE: {}", error));
        }

        if (response.statusCode < 400 && body.length > 0) {
          self.processResponse(response, body, config);
        } else {
          console.error(fmt(" ERROR - MMM-NWS-RIDGE: HTTP {}", response.statusCode));
        }
      }
    );
  },

  sendRidgeUpdate: function(config, images) {
    var self = this;

    self.sendSocketNotification("NWS_RIDGE_UPDATE", {
      "station": config.station,
      "radarType": config.radarType,
      "images": images,
    });
  },

  processResponse: function(response, body, config) {
    var self = this;
    var images = [];

    var dom = htmlparser.parseDOM(body);
    domutils.filter(e => e.type === "tag" && e.name === "a", dom).map(function(a) {
      if (a.attribs.href.startsWith(config.station)) {
        images.push(response.request.href + a.attribs.href);
      }
    });

    if (images.length === 0) {
      return;
    }

    self.sendRidgeUpdate(config, images);
  },
});
