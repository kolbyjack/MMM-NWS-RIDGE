// MMM-NWS-RIDGE.js

Module.register("MMM-NWS-RIDGE", {
  // Default module config
  defaults: {
    station: "MLB",
    mapLayers: ["county"],
    radarType: "NCR",
    updateInterval: 5 * 60 * 1000,
    maximumEntries: 20,
    filter: "brightness(0.5)",
  },

  getStyles: function() {
    return ["MMM-NWS-RIDGE.css"];
  },

  start: function() {
    var self = this;

    self.radarImages = null;
    self.currentRadarFrame = -1;

    self.getData();
    setInterval(function() { self.getData(); }, self.config.updateInterval);
  },

  notificationReceived: function(notification, payload, sender) {
    // Do nothing
  },

  socketNotificationReceived: function(notification, payload) {
    var self = this;

    if (notification === "NWS_RIDGE_UPDATE") {
      if (payload.station === self.config.station && payload.radarType === self.config.radarType) {
        if (self.radarImages === null) {
          setInterval(function() {
            var lastRadarFrame = document.getElementById("nws-ridge-radar-frame-" + self.currentRadarFrame);
            self.currentRadarFrame = (self.currentRadarFrame + 1) % self.radarImages.length;
            var nextRadarFrame = document.getElementById("nws-ridge-radar-frame-" + self.currentRadarFrame);

            if (lastRadarFrame !== null) {
              lastRadarFrame.style.display = "none";
            }

            if (nextRadarFrame !== null) {
              nextRadarFrame.style.display = "block";
            }
          }, 500);
        }

        self.radarImages = payload.images.slice(0, self.config.maximumEntries);
        self.currentRadarFrame = self.currentRadarFrame % (self.radarImages.length || 1);

        for (var i = 0; i < self.radarImages.length; ++i) {
          var radarFrame = document.getElementById("nws-ridge-radar-frame-" + i);
          if (radarFrame !== null) {
            radarFrame.src = self.radarImages[i];
          }
        }
      }
    }
  },

  getData: function() {
    var self = this;

    self.sendSocketNotification("FETCH_NWS_RIDGE", self.config);
  },

  getDom: function() {
    var self = this;
    var wrapper = document.createElement("div");

    wrapper.style.width = "300px";
    wrapper.style.height = "275px";
    for (var i in self.config.mapLayers) {
      wrapper.appendChild(self.createMapLayer(self.config.mapLayers[i]));
    }

    for (var i = 0; i < self.config.maximumEntries; ++i) {
      wrapper.appendChild(self.createRadarFrame(i));
    }

    return wrapper;
  },

  createMapLayer: function(name) {
    var self = this;
    var img = document.createElement("img");

    name = name[0].toUpperCase() + name.substr(1).toLowerCase();
    img.style.filter = self.config.filter;
    img.className = "layer";
    img.src = "https://radar.weather.gov/ridge/Overlays/" + name + "/Short/" + self.config.station + "_" + name + "_Short." + (name === "Topo" ? "jpg" : "gif");

    return img;
  },

  createRadarFrame: function(index) {
    var self = this;
    var img = document.createElement("img");

    img.id = "nws-ridge-radar-frame-" + index;
    img.style.display = (index === self.currentRadarFrame) ? "block" : "none";
    img.style.filter = self.config.filter;
    img.className = "layer";

    return img;
  },
});
