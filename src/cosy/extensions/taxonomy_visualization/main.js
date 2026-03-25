//import './style.css'
import {DataStructures} from "./scripts/data-structures.js";
import {collapsibleTree, expandAll, collapseAll, update} from './scripts/collapsible-tree.js'

// import * as d3 from "d3";
import {editNodes, removeEditNodes} from "./scripts/edit-nodes.js";
import {removeEditEdges} from "./scripts/edit-edges.js";

window.validID = function(input) {
    // Replace invalid characters with valid ones
    const transformedId = input.replace(/[^\w\-:]/g, '-').replace(/\./g, '-')

    // Ensure it starts with a letter
    return transformedId.replace(/^[^A-Za-z]+|^[0-9]+/g, 'id-');
};

// Get the radio buttons
document.querySelector('#app').innerHTML = `
    <form id="sticky-header" class="sticky-header">
      <div class="radio-buttons">
        <label>
          <input type="radio" name="option" value="editNodes"> Edit Nodes
        </label>
        <label>
          <input type="radio" name="option" value="editEdges"> Edit Edges
        </label>
      </div>
      <div id="markedComponents" class="marked-components"></div>
      <div>
        <button id="expandButton" type="button" value="expand">Expand all</button>
        <button id="collapseButton" type="button" value="collapse">Collapse all</button>
      </div>
    </form>
  <div id="collapsible-tree" class="collapsible-tree">
    
  </div>
`

let timeout = false
let delay = 250

window.addEventListener('resize', function() {
        recreateTree()
});
export function recreateTree() {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
        d3.select('#collapsible-tree svg').remove()
        window.d3data = DataStructures.convertTaxonomyToD3(window.taxonomyData)
        window.editableTree = collapsibleTree(window.d3data)
        d3.select('#collapsible-tree').append(() => editableTree)
    }, delay);
}

// jQuery getAllEventListeners and call a function, that removes unused events when switching modes!
// known bug: switching from nodes to edges still has the remove() menu function, that deletes arrows
window.edit = undefined
const radioButtons = document.querySelectorAll('input[type="radio"]');
radioButtons.forEach(function(radioButton) {
    radioButton.addEventListener('click', function() {
        if (this.checked) {
            if (window.edit && this.value === window.edit) {
                this.checked = false
                window.edgeMode = false
                removeEditEdges()
                removeEditNodes()
                window.edit = undefined
                update(root)
            } else {
                window.edit = this.value
                window.edgeMode = this.value === "editEdges"
                this.value === "editNodes" ? editNodes() : removeEditNodes()
                update(root)
            }

        }

    });
});

document.querySelector("#expandButton").addEventListener('click', expandAll)
document.querySelector("#collapseButton").addEventListener('click', collapseAll)

console.log("TaxonomyData arrived.");
var old_data = {
    "Format2": [
        "Flat",
        "Extrusion",
        "Round",
        "Hexagonal",
        "Slot"
    ],
    "Flat": [
        "22w_M2.5_Flat",
        "M2_16Dia_x8_Flat",
        "22w_40l_M2.5_Flat",
        "20w_M3_x3_Flat"
    ],
    "Extrusion": [
        "10w_30l_x3_Extrusion",
        "30w_30l_x5_Extrusion"
    ],
    "Round": [
        "150mm_Round",
        "M2.5_Round",
        "M2_Round",
        "M3_Round"
    ],
    "Hexagonal": [
        "M3_Hexagonal"
    ],
    "Slot": [
        "10mm_MakerBeam_Slot"
    ],
    "22w_M2.5_Flat": [],
    "M2_16Dia_x8_Flat": [
        "M2_16Dia_x4_Flat"
    ],
    "22w_40l_M2.5_Flat": [],
    "20w_M3_x3_Flat": [],
    "10w_30l_x3_Extrusion": [
        "10w_30l_x2_Extrusion"
    ],
    "30w_30l_x5_Extrusion": [
        "30w_30l_x4_Extrusion"
    ],
    "150mm_Round": [],
    "M2.5_Round": [],
    "M2_Round": [],
    "M3_Round": [],
    "M3_Hexagonal": [],
    "10mm_MakerBeam_Slot": [],
    "M2_16Dia_x4_Flat": [],
    "10w_30l_x2_Extrusion": [],
    "30w_30l_x4_Extrusion": []
}
//console.log("old_data", old_data)
fetch('./taxonomy.json')
  .then(response => response.json())
  .then(data => {
    console.log("data", data)
    window.taxonomyRoot = Object.keys(data)[0].toString()
    window.taxonomyData = data;
    console.log('taxonomy: ', window.taxonomyData)
    console.log(Object.keys(data))
    console.log(window.taxonomyRoot)
    window.d3data = DataStructures.convertTaxonomyToD3(window.taxonomyData)
    window.selectedElements = []
    window.edgeMode = false
    window.editableTree = collapsibleTree(window.d3data)
    d3.select('#collapsible-tree').append(() => editableTree)
  })
  .catch(error => console.log(error));


export function saveTaxonomy() {
    adsk
      .fusionSendData('updateDataNotification', JSON.stringify(taxonomyData))
      .then((result) => console.log(result))
}

export function sendSelections() {
    let selections = {selections: window.selectedElements}
    adsk
        .fusionSendData("selectionNotification", JSON.stringify(selections))
        .then(
            (result) => () => {}
            // Potentially do stuff
        );
}

export function renameNode (oldName, newName) {
    let returnData = [oldName, newName];
    let returnDataString = JSON.stringify(returnData);
    adsk
        .fusionSendData("renameDataNotification", returnDataString)
        .then((result) => console.log(result))
}
