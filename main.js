var map, geojson, layer_name, layerSwitcher, featureOverlay; 
var container, content, closer;
var container = document.getElementById('popup');
var content = document.getElementById('popup-content');
var closer = document.getElementById('popup-closer');
var overlay = new ol.Overlay({
    element: container,
    autoPan: true,
    autoPanAnimation: {
    duration: 250 }
});

closer.onclick = function() {
    overlay.setPosition(undefined);
    closer.blur();
    return false;
};

var view = new ol.View({
    projection: 'EPSG:4326',
    center: [20.7,44.5],
    zoom: 7,

    });
    var view_ov = new ol.View({
    projection: 'EPSG:4326',
    center: [20.7,44.5],
    zoom: 7,
    });

var base = new ol.layer.Group({
    'title': 'Maps',
    layers: [
            new ol.layer.Tile({
            title: 'OSM',
            type: 'base',
            visible: true,
            source: new ol.source.OSM()
        })
    ]
});

var OSM = new ol.layer.Tile({
    source: new ol.source.OSM(),
    type: 'base',
    title: 'OSM',
});

var picnic_site_layer = new ol.layer.Vector({
    title: 'picnic_site',
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: function(extent) {
            return 'http://localhost:8085/geoserver/wfs?service=WFS&' +
                'version=1.1.0&request=GetFeature&typeName=Serbia:picnic_site&' +
                'outputFormat=application/json&srsname=EPSG:4326';
        },
        strategy: ol.loadingstrategy.bbox
    })
});

var cafes_restaurants_layer = new ol.layer.Vector({
    title: 'cafes_restaurants',
    source: new ol.source.Vector({
        format: new ol.format.GeoJSON(),
        url: function(extent) {
            return 'http://localhost:8085/geoserver/wfs?service=WFS&' +
                'version=1.1.0&request=GetFeature&typeName=Serbia:cafes_restaurants&' +
                'outputFormat=application/json&srsname=EPSG:4326';
        },
        strategy: ol.loadingstrategy.bbox
    })
});

var overlays = new ol.layer.Group({
    'title': 'Overlays',
    layers: [
    new ol.layer.Image({
    title: 'hotels_near_highway',
    source: new ol.source.ImageWMS({
            url: 'http://localhost:8085/geoserver/wms',
            params: {'LAYERS': 'Serbia:hotels_near_highway'},
            ratio: 1,
            serverType: 'geoserver'
        })
    }),
    new ol.layer.Image({
    title: 'highways',
    source: new ol.source.ImageWMS({
            url: 'http://localhost:8085/geoserver/wms',
            params: {'LAYERS': 'Serbia:highways'},
            ratio: 1,
            serverType: 'geoserver'
        })
    }),
    picnic_site_layer,
    cafes_restaurants_layer
]}); 

var map = new ol.Map({
    target: 'map',
    view: view,
    overlays: [overlay]
});

map.addLayer(base);
map.addLayer(overlays);

var new_layer = new ol.layer.Image({
    title: 'big-streets',
    source: new ol.source.ImageWMS({
            url: 'http://localhost:8080/geoserver/wms',
            params: {'LAYERS': 'serbia:planet_osm_street_mv_filter'},
            ratio: 1,
            serverType: 'geoserver'
        })
});
//	overlays.getLayers().push(new_layer);
//	map.addLayer(new_layer);

var mouse_position = new ol.control.MousePosition();
map.addControl(mouse_position);

var full_sc = new ol.control.FullScreen({label:'F'});
map.addControl(full_sc);

var zoom = new ol.control.Zoom({zoomInLabel:'+', zoomOutLabel:'-'});
map.addControl(zoom);

var slider = new ol.control.ZoomSlider();
map.addControl(slider);

var zoom_ex = new ol.control.ZoomToExtent({
extent:[13.97, 37.88, 27.24, 51.37]
});
map.addControl(zoom_ex);

var layerSwitcher = new ol.control.LayerSwitcher({
activationMode: 'click',
startActive: true,
tipLabel: 'Layers',
groupSelectStyle: 'children',
collapseTipLabel: 'Collapse layers',
});
map.addControl(layerSwitcher);

function legend () {
$('#legend').empty();
var no_layers = overlays.getLayers().get('length');
var head = document.createElement("h4");
var element = document.getElementById("legend");
element.appendChild(head);
var ar = [];
for (var i = 0; i < no_layers; i++) {
    ar.push("http://localhost:8085/geoserver/wms?REQUEST=GetLegendGraphic&VERSION=1.3.0&FORMAT=image/png&WIDTH=20&HEIGHT=20&LAYER="+overlays.getLayers().item(i).get('title'));
}
for (i = 0; i < no_layers; i++) {
    var head = document.createElement("p");
    var txt = document.createTextNode(overlays.getLayers().item(i).get('title'));
    head.appendChild(txt);
    var element = document.getElementById("legend");
    element.appendChild(head);
    var img = new Image();
    img.src = ar[i];
    var src = document.getElementById("legend");
    src.appendChild(img);
}
}

legend();

function getinfo(evt) {
var coordinate = evt.coordinate;
var viewResolution = /** @type {number} */ (view.getResolution());
$("#popup-content").empty();

document.getElementById('info').innerHTML = '';
var no_layers = overlays.getLayers().get('length');
var url = new Array();
var wmsSource = new Array();
var layer_title = new Array();

for (var i = 0; i < no_layers; i++) {
    var visibility = overlays.getLayers().item(i).getVisible();
    if (visibility == true){
        layer_title[i] = overlays.getLayers().item(i).get('title');
        wmsSource[i] = new ol.source.ImageWMS({
            url: 'http://localhost:8085/geoserver/wms',
            params: {'LAYERS': layer_title[i]},
            serverType: 'geoserver',
            crossOrigin: 'anonymous'
        });

        url[i] = wmsSource[i].getFeatureInfoUrl(
        evt.coordinate, viewResolution, 'EPSG:4326',
        {'INFO_FORMAT': 'text/html'});

        $.get(url[i], function (data) {
            $("#popup-content").append(data);
            overlay.setPosition(coordinate);
            layerSwitcher.renderPanel();
        });
    }
}
}

getinfotype.onchange = function() {
map.removeInteraction(draw);
if (vectorLayer) {
    vectorLayer.getSource().clear();
}
map.removeOverlay(helpTooltip);

if (getinfotype.value == 'activate_getinfo') {
    map.on('singleclick', getinfo);
} else if (getinfotype.value == 'deactivate_getinfo') {
    map.un('singleclick', getinfo);
    overlay.setPosition(undefined);
    closer.blur();
}
};

var source = new ol.source.Vector();
var vectorLayer = new ol.layer.Vector({
source: source,
style: new ol.style.Style({
    fill: new ol.style.Fill({
        color: 'rgba(255, 255, 255, 0.2)'
    }),
    stroke: new ol.style.Stroke({
        color: '#ffcc33',
        width: 2
    }),
    image: new ol.style.Circle({
        radius: 7,
        fill: new ol.style.Fill({
            color: '#ffcc33'
        })
    })
})
});
map.addLayer(vectorLayer);

var helpTooltip;
var draw; 

function layers() {
$(function() { $( "#wms_layers_window" ).dialog({
        height: 400,
        width: 800,
        modal: true
    });
    $( "#wms_layers_window" ).show();
});

$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "http://localhost:8085/geoserver/wms?request=getCapabilities",
        dataType: "xml",
        success: function(xml){
            $('#table_wms_layers').empty();
                console.log("here");
                $('<tr></tr>').html('<th>Name</th><th>Title</th><th>Abstract</th>').appendTo('#table_wms_layers');
                $(xml).find('Layer').find('Layer').each(function() {
                    var name = $(this).children('Name').text();
                    var title = $(this).children('Title').text();  
                    var abst = $(this).children('Abstract').text();
                    $('<tr></tr>').html('<td>' +name+ '</td><td>' +title+ '</td><td>' +abst+ '</td>').appendTo('#table_wms_layers');
                });
                addRowHandlers();
        }
    });
});

var divContainer = document.getElementById("wms_layers_window");
var table_layers = document.getElementById("table_wms_layers");
divContainer.innerHTML = "";
divContainer.appendChild(table_layers);
$( "#wms_layers_window" ).show();
var add_map_btn = document.createElement("BUTTON");
add_map_btn.setAttribute("id", "add_map_btn");
add_map_btn.innerHTML = "Add Layer";
add_map_btn.setAttribute("onclick", "add_layer()");
divContainer.appendChild(add_map_btn);    

function addRowHandlers() {
    var rows = document.getElementById("table_wms_layers").rows;
    var table = document.getElementById('table_wms_layers');
    var heads = table.getElementsByTagName('th');
    var col_no;
    for (var i = 0; i < heads.length; i++) {
        var head = heads[i];
        if (head.innerHTML == 'Name') {
            col_no = i+1; 
        }
    }
    for (i = 0; i < rows.length; i++) {
        $("#table_wms_layers td").each(function() {
            $(this).parent("tr").css("cursor", "pointer");
        });
        rows[i].onclick = function(){ return function() {
            $(function() {
                $("#table_wms_layers td").each(function() {
                    $(this).parent("tr").css("background-color", "white");
                });
            });
            var cell = this.cells[col_no-1];
            layer_name = cell.innerHTML;
            $(document).ready(function () {
                $("#table_wms_layers td:nth-child("+col_no+")").each(function () {
                    if ($(this).text() == layer_name) {
                        $(this).parent("tr").css("background-color", "grey"); 
                    }
                });
            });
        };}
        (rows[i]);
    }
}
}

function add_layer() {

var name = layer_name.split(":");			
var layer_wms = new ol.layer.Image({
    title: name[1],
    source: new ol.source.ImageWMS({
        url: 'http://localhost:8085/geoserver/wms',
        params: {'LAYERS': layer_name},
        ratio: 1,
        serverType: 'geoserver'
    })
});
overlays.getLayers().push(layer_wms);

var url = 'http://localhost:8085/geoserver/wms?request=getCapabilities';
var parser = new ol.format.WMSCapabilities();

$.ajax(url).then(function (response) {
    var result = parser.read(response);
    var Layers = result.Capability.Layer.Layer;
    var extent;
    for (var i = 0, len = Layers.length; i < len; i++) {
        var layerobj = Layers[i];
        if (layerobj.Name == layer_name) {
            extent = layerobj.BoundingBox[0].extent;
            map.getView().fit(extent,
                { duration: 1590, size: map.getSize() }
            );
        }
    }
});
layerSwitcher.renderPanel();
legend()
}

$(document).ready(function(){ $.ajax({
type: "GET",
url: "http://localhost:8085/geoserver/wfs?request=getCapabilities",
dataType: "xml",
success: function(xml) {
    var select = $('#layer');
    $(xml).find('FeatureType').each(function(){
        var name = $(this).find('Name').text();
        $(this).find('Name').each(function(){
            var value = $(this).text();
            select.append("<option class='ddindent' value='"+ value +"'>"+value+"</option>");
        });
    });
}
});});

featureOverlay = new ol.layer.Vector({
    source: new ol.source.Vector(),
    map: map,
    style: highlightStyle
});