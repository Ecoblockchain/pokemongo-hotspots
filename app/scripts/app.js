/**
 *  Proj 5 : Neighborhood Map Project
 *  Author: Noble Ackerson
 *  map.js Manages Canvas items & Google Maps data
 */
var app = app || {};
var POKEMON_ICON = 'images/pokeball_50.png';
//var firebase = new Firebase("https://lit-pokestops.firebaseio.com/");

// Default DC region hotspots (pokeHotStops)for Pokemon Users
app.pokestops = [{
    title: 'Old Town, Alexandria',
    position: {
        lat: 38.8067193,
        lng: -77.0420541
    },
    icon: POKEMON_ICON
}, {
    title: 'Mount Vernon Area',
    position: {
        lat: 38.707982,
        lng: -77.0861753
    },
    icon: POKEMON_ICON
}, {
    title: 'National Harbor',
    position: {
        lat: 38.7890853,
        lng: -77.0213807
    },
    icon: POKEMON_ICON
}, {
    title: 'The White House',
    position: {
        lat: 38.8983312,
        lng: -77.0380863
    },
    icon: POKEMON_ICON
}, {
    title: 'Arlington Area',
    position: {
        lat: 38.8809263,
        lng: -77.1723677
    },
    icon: POKEMON_ICON
}];

// Customize look of canvas (https://goo.gl/NPzjqn)
app.styleArray = [{
    "featureType": "all",
    "elementType": "labels.text.fill",
    "stylers": [{
        "saturation": 36
    }, {
        "color": "#000000"
    }, {
        "lightness": 40
    }]
}, {
    "featureType": "all",
    "elementType": "labels.text.stroke",
    "stylers": [{
        "visibility": "on"
    }, {
        "color": "#000000"
    }, {
        "lightness": 16
    }]
}, {
    "featureType": "all",
    "elementType": "labels.icon",
    "stylers": [{
        "visibility": "off"
    }]
}, {
    "featureType": "administrative",
    "elementType": "geometry.fill",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 20
    }]
}, {
    "featureType": "administrative",
    "elementType": "geometry.stroke",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 17
    }, {
        "weight": 1.2
    }]
}, {
    "featureType": "administrative.locality",
    "elementType": "all",
    "stylers": [{
        "visibility": "off"
    }, {
        "invert_lightness": true
    }]
}, {
    "featureType": "landscape",
    "elementType": "geometry",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 20
    }]
}, {
    "featureType": "poi",
    "elementType": "geometry",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 21
    }]
}, {
    "featureType": "road.highway",
    "elementType": "geometry.fill",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 17
    }]
}, {
    "featureType": "road.highway",
    "elementType": "geometry.stroke",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 29
    }, {
        "weight": 0.2
    }]
}, {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 18
    }]
}, {
    "featureType": "road.local",
    "elementType": "geometry",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 16
    }]
}, {
    "featureType": "transit",
    "elementType": "geometry",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 19
    }]
}, {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{
        "color": "#000000"
    }, {
        "lightness": 17
    }]
}];

// Initialize the map
function initMap() {
    'use strict';

    app.center = new google.maps.LatLng(38.8067193, -77.0420541); // Map data in the DC/VA/MD metro area
    app.map = app.getGMapData(document.getElementById('map')); // Setup and bind map to View
    app.addPokeHotStopsToMap();
    ko.applyBindings(app.viewModel); // Apply KnockoutJS model binding.

    // Create a heatmap (BUG)
    // app.heatmap = new google.maps.visualization.HeatmapLayer({
    //     data: [],
    //     map: map,
    //     radius: 25
    // });

    // app.firebase.on("child_added", function(snapshot, prevChildKey) {
        // Get latitude and longitude from Firebase.
    //     var newPosition = snapshot.val();
    //     var latLng = new google.maps.LatLng(newPosition.lat, newPosition.lng);

    //     heatmap.getData().push(latLng);
    // });

}

// Main viewModel
app.viewModel = new (function() {
    var self = this;
    // self.heatMapCluster = ko.observableArray();
    // List of hotspots to bind in HTML
    self.pokestops = ko.observableArray();
    // Number of foursquare results to bind to input-group-addon.
    self.foursquareCount = ko.observable(0);
    // Moves & centers map to marker position within .map div
    self.zoomTo = function(poke) {
        document.getElementById("map").focus();
        app.map.zoomTo(poke.marker.getPosition());
    };
    self.query = ko.observable('');
})();

// Process locations from 4SQ responses
app.processResponse = function(json) {
    // Delete previous search results markers
    for (var i = app.viewModel.pokestops().length - 1; i >= 0; i++) {
        if (app.viewModel.pokestops()[i].marker.icon === 'images/4sq_logo.png') {
            app.viewModel.pokestops()[i].marker.setMap(null);
            app.viewModel.pokestops.splice(i, 1);
        }
    }
    // Add new search results.
    var spots = json.response.groups['0'].spots;
    // Update observable for number of foursquare locations near a pokestop.
    app.viewModel.foursquareCount(spots.length);
    if (spots.length == 0) {
        alert('No results found for "' + app.viewModel.query() + '"');
    } else {
        for (var i = 0; i < spots.length; i = i+1) {
            var poke = {
                title: spots[i].venue.name,
                icon: 'images/4sq_logo.png',
                position: {
                    lat: spots[i].venue.location.lat,
                    lon: spots[i].venue.location.lng
                },
            };
            app.addMapMarker(poke, 0);
        }
    }
};

// Add markers from the list above
app.addPokeHotStopsToMap = function() {
    for (var i = 0; i < app.pokestops.length; i++) {
        app.manageMarker(app.pokestops[i]);
    };
};

// Get Google Map
app.getGMapData = function(mapDiv) {
    // Configure and add map to map div.
    var mapFeatures = {
        center: app.center,
        zoom: 11,
        mapTypeControl: false,
        styles: app.styleArray,
        disableDoubleClickZoom: true
    };
    return new google.maps.Map(mapDiv, mapFeatures);
};

// Capture marker, save in FB/show more info
app.marker = null;
app.manageMarker = function(poke, index) {
    // Drop default markers
    var p = poke.position;
    poke.marker = new google.maps.Marker({
        position: new google.maps.LatLng(p.lat, p.lng),
        map: app.map,
        title: poke.title,
        icon: poke.icon,
        animation: google.maps.Animation.DROP
    });

    // Add result with marker to the knockoutjs observable list.
    if (index !== undefined && index / 1 == index) {
        app.viewModel.pokestops.splice(0, 0, poke);
    } else {
        app.viewModel.pokestops.push(poke);
    }
    // shows a infoWindow with restaurants/bars in the area
    app.infoWindow(poke);

    // Add "marker" (heatmap) on user click & push to database
    //google.maps.event.addListener(poke.marker, 'click', function(e) {
        // places a heatmap at stores that lat/lng to FB
    //    firebase.push({
    //        lat: e.latLng.lat(),
    //        lng: e.latLng.lng()
    //    });
    //});
};

app.infoWindow = function() {
    //TODO: show info for user onClick events
    // Should return Title, Rating, Picture
    console.log('Triggered an info window')
};