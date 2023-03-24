import './style.css'
import {setupCounter} from './counter.js'
import VectorSource from './node_modules/ol/source/Vector.js';
import VectorLayer from './node_modules/ol/layer/Vector.js';
import ImageLayer from './node_modules/ol/layer/Image.js';
import ImageStatic from './node_modules/ol/source/ImageStatic.js';

import WKT from './node_modules/ol/format/WKT.js';
import ImageWMS from './node_modules/ol/source/ImageWMS.js';
// import GeoTIFFSource from './node_modules/ol/source/GeoTIFF.js';
import {toSize} from './node_modules/ol/size.js';
import DragAndDrop from './node_modules/ol/interaction/DragAndDrop.js';
import Map from './node_modules/ol/Map.js';
import View from './node_modules/ol/View.js';
import * as olProj from 'ol/proj';
import GPX from './node_modules/ol/format/GPX.js';
import GeoJSON from './node_modules/ol/format/GeoJSON.js';
import IGC from './node_modules/ol/format/IGC.js';
import KML from './node_modules/ol/format/KML.js';
import TopoJSON from './node_modules/ol/format/TopoJSON.js';
import TileLayer from './node_modules/ol/layer/Tile.js';
import XYZ from './node_modules/ol/source/XYZ.js';
import OSM from './node_modules/ol/source/OSM.js';
import {Draw, Modify, Snap, Select} from './node_modules/ol/interaction.js';
import {ScaleLine, defaults as defaultControls} from './node_modules/ol/control.js';
import {createBox} from './node_modules/ol/interaction/Draw.js';
import {
    getPointResolution,
    get as getProjection,
    transform,
} from './node_modules/ol/proj.js';
import MousePosition from './node_modules/ol/control/MousePosition.js';
import {createStringXY} from './node_modules/ol/coordinate.js';
import {
    Circle as CircleStyle,
    Fill,
    RegularShape,
    Stroke,
    Style,
    Text,
} from './node_modules/ol/style.js';
import UnaryUnionOp from "./node_modules/jsts/org/locationtech/jts/operation/union/UnaryUnionOp.js";
import Geometry from "./node_modules/jsts/org/locationtech/jts/geom/Geometry.js";
import GeometryFactory from "./node_modules/jsts/org/locationtech/jts/geom/GeometryFactory.js";
// import Bounds, Size

const key = '4Z4vZj5CICocrdP4mCFb';
const attributions =
    '<a href="https://www.maptiler.com/copyright/" target="_blank">&copy; MapTiler</a> ' +
    '<a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap contributors</a>';
const viewProjSelect = document.getElementById('projection');
const projection = getProjection(viewProjSelect);
const scaleControl = new ScaleLine({
    units: 'metric',
    bar: true,
    dpi: 150,
    steps: 4,
    text: true,
    minWidth: 100,
    maxWidth: 150,
});
const shapeSelect = document.getElementById('shapeType');

const source = new VectorSource({wrapX: false});
const vector = new VectorLayer({
    source: source,
    style: {
        'fill-color': 'rgba(0, 0, 0, 0.2)',
        'stroke-color': '#ffcc33',
        'stroke-width': 2,
        'circle-radius': 5,
        'circle-fill-color': '#ffcc33',
    },
});

const layer_sat = new TileLayer({
    source: new XYZ({
        // attributions: attributions,
        url:
            'https://api.maptiler.com/tiles/satellite/{z}/{x}/{y}.jpg?key=' + key,
        maxZoom: 20,
    }),
})
const layer_schema = new TileLayer({
    source: new OSM({
        attributions: ''
    }),
});

const mousePositionControl = new MousePosition({
    coordinateFormat: createStringXY(4),
    projection: 'EPSG:4326',
    // comment the following two lines to have the mouse position
    // be placed within the map.
    className: 'custom-mouse-position',
    target: document.getElementById('mouse-position'),
});

let map = new Map({
    controls: defaultControls().extend([mousePositionControl, scaleControl]),
    layers: [layer_schema, vector],
    target: 'map',
    view: new View({
        center: [0, 0],
        zoom: 0,
    }),
});

const extent = getProjection('EPSG:3857').getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const projectionSelect = document.getElementById('projection');
projectionSelect.addEventListener('change', function (event) {
    mousePositionControl.setProjection(event.target.value);
});
const precisionInput = document.getElementById('precision');
precisionInput.addEventListener('change', function (event) {
    const format = createStringXY(event.target.valueAsNumber);
    mousePositionControl.setCoordinateFormat(format);
});

const extractStyles = document.getElementById('extract_styles');
let dragAndDropInteraction;
var lst = [];

function setInteraction() {
    if (dragAndDropInteraction) {
        map.removeInteraction(dragAndDropInteraction);
    }
    dragAndDropInteraction = new DragAndDrop({
        formatConstructors: [
            // GPX,
            GeoJSON,
            // IGC,
            // use constructed format to set options
            // new KML({extractStyles: extractStyles.checked}),
            // TopoJSON,
        ],
    });
    dragAndDropInteraction.on('addfeatures', function (event) {
        const vectorSource = new VectorSource({
            features: event.features,
        });
        lst.push(vectorSource)
        map.addLayer(
            new VectorLayer({
                source: vectorSource,
                zIndex: 1
            })
        );
        map.getView().fit(vectorSource.getExtent());
    });
    map.addInteraction(dragAndDropInteraction);
}

setInteraction();
// extractStyles.addEventListener('change', setInteraction);

const displayFeatureInfo = function (pixel) {
    const features = [];
    map.forEachFeatureAtPixel(pixel, function (feature) {
        features.push(feature);
    });
    if (features.length > 0) {
        const info = [];
        let i, ii;
        for (i = 0, ii = features.length; i < ii; ++i) {
            info.push(features[i].get('name'));
        }
        document.getElementById('info').innerHTML = info.join(', ') || '&nbsp';
    } else {
        document.getElementById('info').innerHTML = '&nbsp;';
    }
};

map.on('pointermove', function (evt) {
    if (evt.dragging) {
        return;
    }
    const pixel = map.getEventPixel(evt.originalEvent);
    displayFeatureInfo(pixel);
});
map.on('click', function (evt) {
    displayFeatureInfo(evt.pixel);
});

const styleSelector = document.getElementById('style');
const styles = {layer_schema, layer_sat};

function update() {
    map.setLayers([styles[styleSelector.value]]);
    for (let i = 0; i < lst.length; i++) {
        map.addLayer(
            new VectorLayer({
                source: lst[i],
            })
        );
        map.getView().fit(lst[i].getExtent());
    }
    map.addLayer(vector);
}

styleSelector.addEventListener('change', update);

document.getElementById('undo').addEventListener('click', function () {
    draw.removeLastPoint();
});
document.getElementById('abort').addEventListener('click', function () {
    draw.abortDrawing();
});
document.getElementById('clear').addEventListener('click', function () {
    source.clear();
});
document.getElementById("exportBtn").addEventListener('click', function () {
    var features = source.getFeatures();
    var json = new GeoJSON().writeFeatures(features, {
        dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'
        // dataProjection: map.getView().getProjection().getCode(), featureProjection: 'EPSG:3857'
    });
    console.log(json);

    function download(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        a.remove();
    }

    // json = JSON.stringify(json, null, 4);
    download(json, 'feature_export.json', 'application/json');
});
document.getElementById("exportBtnL").addEventListener('click', function () {
    var lst = [];
    for (let i = 0, ii = map.getLayers().array_.length; i < ii; ++i) {
        if (map.getLayers().array_[i].values_['zIndex'] === 1) {
            lst.push(map.getLayers().array_[i])
        }
    }
    var f_lst = []
    var feat = []
    for (let i = 0; i < lst.length; i++) {
        f_lst.push(lst[i].getSource().getFeatures());
    }
    for (let i = 0; i < f_lst.length; i++) {
        for (let j = 0; j < f_lst[i].length; j++) {
            feat.push(f_lst[i][j]);
        }
    }
    console.log(feat);
    var json = new GeoJSON().writeFeatures(feat, {
        dataProjection: 'EPSG:4326', featureProjection: 'EPSG:3857'
    });

    // console.log(json);

    function download_l(content, fileName, contentType) {
        var a = document.createElement("a");
        var file = new Blob([content], {type: contentType});
        a.href = URL.createObjectURL(file);
        a.download = fileName;
        a.click();
        a.remove();
    }

    download_l(json, 'layer_export.json', 'application/json');
});
document.getElementById("clearBtnL").addEventListener('click', function () {
    var lst = [];
    for (let i = 0, ii = map.getLayers().array_.length; i < ii; ++i) {
        if (map.getLayers().array_[i].values_['zIndex'] !== 1) {
            lst.push(map.getLayers().array_[i])
        }
    }

    map.setLayers([styles[styleSelector.value]]);
    for (let i = 1; i < lst.length; i++) {
        map.addLayer(lst[i]);
    }
    // console.log(lst);
});
document.getElementById("imgSearchBtn").addEventListener('click', function () {
    var features = source.getFeatures();
    var wktRepresenation;
    var Bound;
    // console.log(features);
    if (features.length === 0) {
        console.log('no shapes');
    } else {
        var format = new WKT();
        if (features.length === 1) {
            wktRepresenation = format.writeGeometry(features[0].getGeometry());
            Bound = features[0].getGeometry().getExtent();
        } else {
            // TODO: сделать не только для двух полигонов
            var olGeom = new UnaryUnionOp(features[0].getGeometry(), features[1].getGeometry());
            wktRepresenation = format.writeGeometry(olGeom._geomFact);
            Bound = olGeom._geomFact.getExtent();
        }
        console.log(Bound);
        console.log(wktRepresenation);
    }

    // TODO
    const key_ogc = 'cbe156b7-660c-4640-a5a1-ea774aecf9ce'
    const my_str = `http://services.sentinel-hub.com/ogc/wms/${key_ogc}?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/jpeg&TIME=2018-03-29/2018-05-29&GEOMETRY=${wktRepresenation}`
    console.log(my_str)
    var img_ext = olProj.transformExtent(Bound,
        'EPSG:3857', 'EPSG:3857') // EPSG:4326 3857
    var imageLayer = new ImageLayer({
        source: new ImageStatic({
            url: my_str,
            imageExtent: img_ext // east, north, west, south
        }),
        zIndex: 0
    });
    map.addLayer(imageLayer);
});

// TODO: вот тут можно метод менять

import SockJS from "sockjs-client"
import Stomp from "@stomp/stompjs"

let stompClient = null;

document.getElementById("StepaBtn").addEventListener('click', function () {
    console.log('Connected: ' + 'yoh');
    const socket = new SockJS('/stomp-endpoint');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        console.log('Connected: ' + frame);
        stompClient.subscribe('/topic/greetings', function (greeting) {
            console.log(JSON.parse(greeting.body));
        });
    });

    stompClient.send("/app/hello", {}, JSON.stringify({'name': "Stepan"}));

    // const url_ = 'https://jsonplaceholder.typicode.com/todos/1'
    // // fetch(url_, {
    // //     method: "GET",
    // //     headers: {"Accept": 'application/json', "Content-type": 'application/json'}
    // // }).then(response => response.json()).then(console.log)
    // // если метод GET, то тела нет
    // // если метод POST, то можно тело
    // fetch(url_, {
    //     method: "POST",
    //     headers: {"Accept": 'application/json', "Content-type": 'application/json', "Authorization": `Bearer ${tocken}`},
    //     body: JSON.stringify({"model_name": "water", "sat": "sent-2"})
    // }).then(response => response.json()).then(console.log)
    // localStorage.setItem('Stepa', Math.random())
    // // TODO
    // // fetch(url_, {
    // //     method: "GET",
    // //     headers: {"Accept": 'application/json', "Content-type": 'application/json'}
    // // }).then(response => response.json()).then(data => {
    // //
    // // })
});

const modifyStyle = new Style({
    image: new CircleStyle({
        radius: 5,
        stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
        }),
        fill: new Fill({
            color: 'rgba(0, 0, 0, 0.4)',
        }),
    }),
    text: new Text({
        text: 'Drag to modify',
        font: '12px Calibri,sans-serif',
        fill: new Fill({
            color: 'rgba(255, 255, 255, 1)',
        }),
        backgroundFill: new Fill({
            color: 'rgba(0, 0, 0, 0.5)',
        }),
        padding: [2, 2, 2, 2],
        textAlign: 'left',
        offsetX: 15,
    }),
});
// const modify = new Modify({source: source});
const modify = new Modify({source: source, style: modifyStyle});

map.addInteraction(modify);

let draw, snap; // global so we can remove them later

function addInteractions() {
    let value = shapeSelect.value;
    if (value !== 'None') {
        let geometryFunction;
        if (value === 'Box') {
            value = 'Circle';
            geometryFunction = createBox();
        }
        draw = new Draw({
            source: source,
            type: value,
            // type: shapeSelect.value,
            geometryFunction: geometryFunction,
        });
        map.addInteraction(draw);
        snap = new Snap({source: source});
        map.addInteraction(snap);
    }
}

/**
 * Handle change event.
 */
shapeSelect.onchange = function () {
    map.removeInteraction(draw);
    map.removeInteraction(snap);
    addInteractions();
};
addInteractions();

function onChangeProjection() {
    const currentView = map.getView();
    const currentProjection = currentView.getProjection();
    const newProjection = getProjection(viewProjSelect.value);
    const currentResolution = currentView.getResolution();
    const currentCenter = currentView.getCenter();
    const currentRotation = currentView.getRotation();
    const newCenter = transform(currentCenter, currentProjection, newProjection);
    const currentMPU = currentProjection.getMetersPerUnit();
    const newMPU = newProjection.getMetersPerUnit();
    const currentPointResolution =
        getPointResolution(currentProjection, 1 / currentMPU, currentCenter, 'm') *
        currentMPU;
    const newPointResolution =
        getPointResolution(newProjection, 1 / newMPU, newCenter, 'm') * newMPU;
    const newResolution =
        (currentResolution * currentPointResolution) / newPointResolution;
    const newView = new View({
        center: newCenter,
        resolution: newResolution,
        rotation: currentRotation,
        projection: newProjection,
    });
    map.setView(newView);
}

viewProjSelect.addEventListener('change', onChangeProjection);

document.querySelector('#app').innerHTML = `
<div></div>
`
