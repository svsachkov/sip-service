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
import Feature from "./node_modules/ol/Feature.js";
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
        maxZoom: 15,
    }),
})
const layer_schema = new TileLayer({
    source: new OSM({
        attributions: '',
        maxZoom: 15,
    }),
});

// document.querySelector('#app').innerHTML = `
// <div></div>
// `
const mousePositionControl = new MousePosition({
    coordinateFormat: createStringXY(4),
    projection: 'EPSG:4326',//
    // comment the following two lines to have the mouse position
    // be placed within the map.
    className: 'custom-mouse-position',
    target: document.getElementById('mouse-position'),
});
const mousePositionControl2 = new MousePosition({
    coordinateFormat: createStringXY(4),
    projection: 'EPSG:3857',// projection.value
    // comment the following two lines to have the mouse position
    // be placed within the map.
    className: 'custom-mouse-position2',
    target: document.getElementById('mouse-position2'),
});

let map = new Map({
    controls: defaultControls().extend([mousePositionControl, mousePositionControl2, scaleControl]),
    layers: [layer_schema, vector],
    target: 'map',
    view: new View({
        center: [0, 0],
        zoom: 0,
    }),
});

// const extent = getProjection('EPSG:3857').getExtent().slice();
const extent = getProjection(projection.value).getExtent().slice();
extent[0] += extent[0];
extent[2] += extent[2];
const projectionSelect = document.getElementById('projection');
projectionSelect.addEventListener('change', function (event) {
    mousePositionControl.setProjection(event.target.value);
    mousePositionControl2.setProjection(event.target.value);
});
const precisionInput = document.getElementById('precision');
precisionInput.addEventListener('change', function (event) {
    const format = createStringXY(event.target.valueAsNumber);
    mousePositionControl.setCoordinateFormat(format);
    mousePositionControl2.setCoordinateFormat(format);
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

function update() { // TODO 24.03
    var remember = [];
    for (let i = 0, ii = map.getLayers().array_.length; i < ii; ++i) {
        if (map.getLayers().array_[i].values_['zIndex'] === 0) {
            remember.push(map.getLayers().array_[i])
        }
    }

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
    map.addLayer(remember[0]);

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
        dataProjection: projection.value, featureProjection: 'EPSG:3857'
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
    // console.log(feat);
    var json = new GeoJSON().writeFeatures(feat, {
        dataProjection: projection.value, featureProjection: 'EPSG:3857'
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
let my_str;
const key_ogc = 'cbe156b7-660c-4640-a5a1-ea774aecf9ce';

document.getElementById("imgSearchBtn").addEventListener('click', function () {
    var lst = [];
    for (let i = 0, ii = map.getLayers().array_.length; i < ii; ++i) {
        if (map.getLayers().array_[i].values_['zIndex'] !== 0) {
            lst.push(map.getLayers().array_[i])
        }
    }
    // console.log(lst);
    // var f_lst = []
    // var feat = []
    // for (let i = 0; i < lst.length; i++) {
    //     f_lst.push(lst[i].getSource().getFeatures());
    // }
    // for (let i = 0; i < f_lst.length; i++) {
    //     for (let j = 0; j < f_lst[i].length; j++) {
    //         feat.push(f_lst[i][j]);
    //     }
    // }
    map.setLayers(lst)


    var features = source.getFeatures();
    var wktRepresenation;
    var Bound;
    // console.log(features);
    if (features.length === 0) {
        console.log('no shapes');
    } else {
        var format = new WKT();
        var geom = [];
        if (features.length === 1) {
            wktRepresenation = format.writeGeometry(features[0].getGeometry().clone().transform(projection.value, 'EPSG:3857'));
            Bound = features[0].getGeometry().getExtent();
        } else {
            // TODO: сделать не только для двух полигонов
            var olGeom = new UnaryUnionOp(features[0].getGeometry(), features[1].getGeometry());
            wktRepresenation = format.writeGeometry(olGeom._geomFact);
            Bound = olGeom._geomFact.getExtent();
        }
        // console.log(Bound);
        // console.log(wktRepresenation);
    }

    // TODO
    // const my_str = `http://services.sentinel-hub.com/ogc/wms/${key_ogc}?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/jpeg&TIME=2018-03-29/2018-05-29&GEOMETRY=${wktRepresenation}`
    my_str = `http://services.sentinel-hub.com/ogc/wms/${key_ogc}?SERVICE=WMS&REQUEST=GetMap&CRS=${projection.value}&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/jpeg&TIME=2018-03-29/2018-05-29&GEOMETRY=${wktRepresenation}`
    console.log(my_str)
    localStorage.setItem('url', my_str)
    var img_ext = olProj.transformExtent(Bound, projection.value, projection.value) // EPSG:4326 3857
    var imageLayer = new ImageLayer({
        source: new ImageStatic({
            url: my_str,
            imageExtent: img_ext // east, north, west, south
        }),
        zIndex: 0
    });
    map.addLayer(imageLayer);
    source.clear();
});

document.getElementById("regSubmit").addEventListener('click', function () {
    console.log("reg")
    const username = document.getElementById("regLogin").value.toString();
    const password = document.getElementById("regPwd").value.toString();
    const confirmed = document.getElementById("pereatPwd").value.toString();
    const surname = document.getElementById("surname").value.toString();
    const name = document.getElementById("name").value.toString();
    const patronymic = document.getElementById("patronymic").value.toString();

    const url_ = 'http://localhost:8000/register'
    fetch(url_, {
        method: "POST",
        headers: {"Accept": 'application/json', "Content-type": 'application/json'},
        body: JSON.stringify({
            "username": username,
            "password": password,
            "name": name,
            "surname": surname,
            "patronymic": patronymic
        })
    }).then(response => response.json()).then(console.log)
});

document.getElementById("logSubmit").addEventListener('click', function () {
    const username = document.getElementById("logLogin").value.toString();
    const password = document.getElementById("logPwd").value.toString();

    const url_ = 'http://localhost:8000/login'
    fetch(url_, {
        method: "POST",
        headers: {"Accept": 'application/json', "Content-type": 'application/json'},
        body: JSON.stringify({
            "username": username,
            "password": password
        })
    }).then(response => response.json()).then(
        function (response) {
            localStorage.setItem('Token', "Bearer " + response["token"])
            console.log(response)
        }
    )
});

const interval = setInterval(function() {
    const url_ = 'http://localhost:8000/v1/order'
    const token = localStorage.getItem("Token")

    console.log(token)
    fetch(url_, {
        method: "GET",
        headers: {"Accept": 'application/json', "Content-type": 'application/json', "Authorization": token}
    }).then(response => response.json()).then(console.log)
}, 5000);

document.getElementById("StepaBtn").addEventListener('click', function () {
    const url = localStorage.getItem("url")
    const token = localStorage.getItem("Token")

    const url_ = 'http://localhost:8000/v1/order'
    fetch(url_, {
        method: "POST",
        headers: {"Accept": 'application/json', "Content-type": 'application/json', "Authorization": token},
        body: JSON.stringify({
            "url": url,
            "model_name": "model"
        })
    }).then(response => response.json()).then(
        function (response) {
            console.log(response)
        }
    )
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
    let val = shapeSelect.value;
    if (val !== 'None') {
        let geometryFunction;
        if (val === 'Box') {
            val = 'Circle';
            geometryFunction = createBox();
        }
        draw = new Draw({
            source: source,
            type: val,
            // type: shapeSelect.value,
            geometryFunction: geometryFunction,
        });
        draw.on('drawstart', function (evt) {
            //... unset sketch
            source.clear();
        }, this);
        // draw.on('drawend', function (evt) {
        //     //... unset sketch
        //     map.removeInteraction(draw);
        // }, this);
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

function onChangeProjection() { // TODO 24.03
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

    var remember = [];
    for (let i = 0, ii = map.getLayers().array_.length; i < ii; ++i) {
        if (map.getLayers().array_[i].values_['zIndex'] === 0) {
            // remember.push(new Feature(map.getLayers().array_[i].getGeometry().clone().transform(currentView.getProjection(), viewProjSelect.value)))
            remember.push(map.getLayers().array_[i])
        }
    }
    map.setView(newView);
    map.setLayers([styles[styleSelector.value]]);
    // map.addLayer(remember[0]);
    // console.log(remember);
    // for (let i = 0, ii = remember.length; i < ii; ++i) {
    //     map.addLayer(remember[i]);
    // }

    var features = source.getFeatures();
    var wktRepresenation;
    var Bound;
    // console.log(features);
    if (features.length === 0) {
        console.log('no shapes');
    } else {
        var format = new WKT();
        var geom;
        if (features.length === 1) {
            // console.log(currentProjection.code_)
            geom = features[0].getGeometry().clone().transform(currentProjection.code_, viewProjSelect.value)
            wktRepresenation = format.writeGeometry(geom);
            // wktRepresenation = format.writeGeometry(features[0].getGeometry().clone().transform(currentProjection.code_, viewProjSelect.value));
            Bound = geom.getExtent();
            console.log(geom)
            console.log(features[0])
        }
        // console.log(Bound);
        // console.log(wktRepresenation);
    }

    // TODO
    // const my_str = `http://services.sentinel-hub.com/ogc/wms/${key_ogc}?SERVICE=WMS&REQUEST=GetMap&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/jpeg&TIME=2018-03-29/2018-05-29&GEOMETRY=${wktRepresenation}`
    if (remember.length > 0) {
        my_str = `http://services.sentinel-hub.com/ogc/wms/${key_ogc}?SERVICE=WMS&REQUEST=GetMap&CRS=${viewProjSelect.value}&SHOWLOGO=false&VERSION=1.3.0&LAYERS=NATURAL-COLOR&MAXCC=1&WIDTH=256&HEIGHT=256&CRS=EPSG:3857&FORMAT=image/jpeg&TIME=2018-03-29/2018-05-29&GEOMETRY=${wktRepresenation}`
        console.log(my_str)
        var img_ext = olProj.transformExtent(Bound, projection.value, projection.value) // EPSG:4326 3857
        var imageLayer = new ImageLayer({
            source: new ImageStatic({
                url: my_str,
                imageExtent: img_ext // east, north, west, south
            }),
            zIndex: 0
        });
        map.addLayer(imageLayer);
        console.log(map.getLayers())
    }
}

viewProjSelect.addEventListener('change', onChangeProjection);

// document.querySelector('#app').innerHTML = `
// <div></div>
// `
