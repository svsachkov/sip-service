import './style.css'
import {setupCounter} from './counter.js'
import VectorSource from './node_modules/ol/source/Vector.js';
import VectorLayer from './node_modules/ol/layer/Vector.js';
import ImageLayer from './node_modules/ol/layer/Image.js';
import ImageStatic from './node_modules/ol/source/ImageStatic.js';
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

// TODO
var img_ext = olProj.transformExtent([3238005, 5039853, 3244050, 5045897],
    'EPSG:3857', 'EPSG:3857') // EPSG:4326
var imageLayer = new ImageLayer({
    source: new ImageStatic({
        url: 'https://services.sentinel-hub.com/ogc/wms/cbe156b7-660c-4640-a5a1-ea774aecf9ce?REQUEST=GetMap&BBOX=3238005,5039853,3244050,5045897&LAYERS=NATURAL-COLOR&MAXCC=20&WIDTH=320&HEIGHT=320&FORMAT=image/jpeg&TIME=2018-03-29/2018-05-29',
        imageExtent: img_ext // east, north, west, south
    })
});
map.addLayer(imageLayer);

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
    download(json, 'export.json', 'application/json');
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
        draw = new Draw({
            source: source,
            type: shapeSelect.value,
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

