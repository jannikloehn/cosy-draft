//import * as d3 from 'd3'
import {Backend} from "./event-manager.js";
import {addEdge, removeEdge} from "./actions-edges.js"

window.colors = [
    "#1f77b4", // blau
    "#ff7f0e", // orange
    "#2ca02c", // grün
    "#d62728", // rot
    "#9467bd", // violett
    "#8c564b", // braun
    "#e377c2", // rosa
    "#7f7f7f", // grau
    "#bcbd22", // oliv
    "#17becf", // cyan
    "#aec7e8", // blasses blau
    "#ffbb78", // blasses orange
    "#98df8a", // blasses grün
    "#ff9896", // blasses rot
    "#c5b0d5", // blasses violett
    "#c49c94", // blasses braun
    "#f7b6d2", // blasses rosa
    "#c7c7c7", // helles grau
    "#dbdb8d", // blasses oliv
    "#9edae5"  // blasses cyan
]

export function drawEdge(node, x, y, allNodes) {
    const svg = d3.select("#collapsible-tree")
    const gId = validID(node.data.name)
    const curvePath = d3.select('#node'+gId).append("path")
        .attr("class", "curve");
    const boundaries = window.editableTree.getAttribute('viewBox').split(',')
    const sourceNode = node.data.name
    // viewBox(min-x, min-y, width, height)
    // min-x and min-y define top left coordinates of the whole svg
    // so the offset factor of the central x-axis can change dynamically when open/close the nodes
    let halfHeight = +boundaries[3]/2
    let offsetFactor = Math.abs(+boundaries[1]) - halfHeight
    let zeroAxis = halfHeight + offsetFactor
    // Update the curve path on mousemove
    svg.on("mousemove", function (event) {
        let [x1, y1] = d3.pointer(event)
        if (!isNaN(x) && !isNaN(y)) {
            x1 = x1 - x - 70 - panningX;
            y1 = (zeroAxis + y - y1)*(-1) - panningY;
            updateCurvePath(0, 0, x1, y1);
            allNodes.on("mouseenter", function (event,d) {
                console.log(d.data.name)
                if(!d3.select(this).classed("entered")) {
                    d3.select(this)
                        .classed("entered", true)
                    console.log("Mouse entered:", d);
                    let targetNode = validID(d.data.name)
                    let targetG = d3.select("#node"+targetNode)
                    if(checkForCircle(sourceNode, targetNode, window.taxonomyData)) {
                        console.log('circle detected!')
                        d3.select(this)
                            .attr("fill", "red")
                    } else {
                        d3.select(this)
                            .attr("fill", "green")
                        targetG.on("click", (e, d) => {
                            addEdge(node, sourceNode, targetNode, e, d)
                            targetG.on('click', null)
                        })
                    }

                    targetG.on("mouseleave", function (event,d) {
                        d3.select(this)
                            .attr("fill", "blue")
                            // .attr("cursor", "default")
                            .classed("entered", false);

                        // Your mouseleave event handler code here
                        console.log("Mouse left:", d);
                    })
                }
            })

        }
        svg.on("contextmenu", function(ev) {
            ev.preventDefault()
            svg.on("mousemove", null)
            allNodes.on("mouseleave", null)
            allNodes.on("mouseenter", null)
            svg.on("contextmenu", null)
            curvePath.remove()
            d3.select(this).on('contextmenu', null)
         })
    });


    function updateCurvePath(x, y, x1, y1) {
        let pathData = `M ${x}, ${y} C ${Math.floor(x1/2)}, ${y} ${Math.floor(x1/2)}, ${y1} ${x1}, ${y1}`
        curvePath.attr("d", pathData);
    }

    // Initial update of the curve path
    updateCurvePath(x, y, x, y);

}

export function removeEditEdges() {
    let main = d3.select('#main').selectAll('g')
    main.selectAll('#editCircle').remove()
    main.selectAll('#action').remove()
    main.selectAll('g').remove()
    main.selectAll('text')
        .attr('x', d => !d._children ? alignmentNode : -alignmentNode)
        .attr('text-anchor', d => !d._children ? 'start' : 'end')
    d3.select('#edge-container').selectAll('path').remove()
}

function checkForCircle(source, target, taxonomyData) {
    console.log('source: ', source, ' target: ', target)
    let taxonomyDataCopy = Object.assign(
        ...Object.keys(taxonomyData).map((node) => ({
            [node]: taxonomyData[node].map(String),
        }))
    )
    taxonomyDataCopy[source].push(target)
    let queue = Object.keys(taxonomyDataCopy).map((node) => [node])
    while (queue.length) {
        const batch = []
        for (const path of queue) {
            const children = taxonomyDataCopy[path[0]] || []
            for (const node of children) {
                if (node === path[path.length - 1]) return true
                batch.push([node, ...path])
            }
        }
        queue = batch
    }
    return false
}

export async function generateCircles(nodes) {
    let newGroup = nodes.append('g')
        .attr('id', d => validID(d.data.name) + '-group')

    nodes.selectAll('text')
        .attr('x', alignmentNode)
        .attr('text-anchor', 'start')

    newGroup.each(function(d, i){
        // the root node has a parent of null
        if(d.data.parents[0] !== null) {
            let colorIndex = i % 20
            let name = validID(d.data.name)
            // distinguish between even and odd # of parents
            let a = d.data.parents.length % 2 === 0 ? 1 : 0

            let maxCy = -Infinity;
            let minCy = Infinity;

            for (let i = a; i < d.data.parents.length + a; i++) {
                let yOffset = i % 2 === 0 ? 1 : -1
                let position = i % 2 === 0 ? i/2 : (i+1)/2
                let currentCy = position*yOffset*7
                d3.select(this)
                    .append('circle')
                    .attr('r', 3)
                    .attr('cx', -10)
                    .attr('cy', currentCy)
                    .style('fill', colors[colorIndex])
                    .on('click', function (event, d) {
                        console.log('clicked on edge circle!')
                        const match = d3.select(this).attr('id').match(/\d+$/)
                        const index = Number(match[0])
                        removeEdge(d.data.parents[index], d)
                    })
                maxCy = Math.max(maxCy, currentCy);
                minCy = Math.min(minCy, currentCy);
            }
            // assign indices from top to bottom
            let circleSelection = d3.select(this).selectAll('circle').nodes()
            circleSelection = circleSelection.sort((a,b) => {
                return d3.select(a).attr('cy') - d3.select(b).attr('cy')
            })
            circleSelection.forEach((d, i) => {
                let circle = d3.select(d)
                circle.attr('id', name + '-' + i)
            })
            if(Math.abs(minCy) + Math.abs(maxCy) > globalX) {
                window.globalX = Math.abs(minCy) + Math.abs(maxCy)
            }
        }
    })
}

export function generateArrows(nodes) {
    d3.selectAll('#action').remove()
    nodes.append("svg:image")
        .attr('id', 'action')
        .attr("xlink:href", "assets/icons/icons8-arrow-24.png")
        .attr('x', d => d.data.name.length * 7.5)
        .attr('y', -8)
        .attr('width', 16)
        .attr("height", 16)
        .on("click", (event, d) => {
            Backend.prototype.deactivateMarking()
            const gId = validID(d.data.name)
            console.log('name: ', gId)
            const node = d3.select('#node'+gId).datum()
            console.log('node as svg ', node)
            let onlyOtherNodes = d3.select('#main').selectAll('g').filter((d) => {
                return validID(d.data.name) !== gId
            })
            console.log('nodes without initial: ', onlyOtherNodes)
            if (node.id === 0) {
                drawEdge(node, 0, 0, onlyOtherNodes)
            } else {
                let someParent = ""
                let offsetX, offsetY = 0
                for(let p = 0; p < d.data.parents.length; p++) {
                    if(!d3.select('#link-'+validID(d.data.parents[p].data.name)+'-'+gId).empty()) {
                        someParent = validID(d.data.parents[p].data.name)
                        offsetX = Number(d3.select('#'+validID(d.data.name)+'-'+p).attr('cx'))
                        offsetY = Number(d3.select('#'+validID(d.data.name)+'-'+p).attr('cy'))
                    }
                }
                const link = d3.select('#link-'+someParent+'-'+gId)
                const coords = link.attr('d').split(',')
                drawEdge(node, Number(coords[coords.length-2]) - offsetX, Number(coords[coords.length-1]) - offsetY, onlyOtherNodes)
            }
            d3.select(this).on("click", null);
        })
}
