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
    self.nextRadarFrame = -1;

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
            self.nextRadarFrame = (self.nextRadarFrame + 1) % (self.radarImages.length + 4);

            if (self.nextRadarFrame < self.radarImages.length && self.nextRadarFrame != self.currentRadarFrame) {
              var nextRadarFrame = self.getRadarFrame(self.nextRadarFrame);
              if (nextRadarFrame !== null && nextRadarFrame.naturalWidth !== 0) {
                var lastRadarFrame = self.getRadarFrame(self.currentRadarFrame);

                if (lastRadarFrame !== null) {
                  lastRadarFrame.style.display = "none";
                }

                nextRadarFrame.style.display = "block";
                self.currentRadarFrame = self.nextRadarFrame;
              }
            }
          }, 500);
        }

        self.radarImages = payload.images.slice(-self.config.maximumEntries);
        self.currentRadarFrame = self.currentRadarFrame % (self.radarImages.length || 1);
        self.nextRadarFrame = self.nextRadarFrame % (self.radarImages.length + 4);

        for (var i = 0; i < self.config.maximumEntries; ++i) {
          var radarFrame = self.getRadarFrame(i);

          if (i < self.radarImages.length) {
            radarFrame.src = self.radarImages[i];
            radarFrame.style.display = (self.currentRadarFrame === i) ? "block" : "none";
          } else {
            radarFrame.src = "";
            radarFrame.style.display = "none";
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

    wrapper.className = "wrapper";
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

  getRadarFrame: function(index) {
    return document.getElementById("nws-ridge-radar-frame-" + index);
  },
});
