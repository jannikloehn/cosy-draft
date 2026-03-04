//import * as d3 from 'd3'
import {editNodes, removeEditNodes} from "./edit-nodes.js";
import {Backend} from './event-manager.js'
import {generateEdgeLinks, generateLinks} from "./animations-edges.js";
import {DataStructures} from "./data-structures.js";
import {recreateTree} from "../main.js";

// Copyright 2022 Takanori Fujiwara.
// Released under the BSD 3-Clause 'New' or 'Revised' License
// code here based on ~/scripts/just-tree.js

// Copyright 2018 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/collapsible-tree

// Converting the Tree-Layout into a fake-tree-graph with multiple parents
// https://vizhub.com/saikarthikreddyginni/2ffbf70308884d1a815a99899b18870c?edit=files&file=index.js

window.alignmentNode = 6;
const marginLeft = 70;

export const collapsibleTree = (data, {
    svgId = 'collapsible-tree',
    width = window.innerWidth,
    height = window.innerHeight,
    marginLeft = 70,
    // dx controls y-margin of the nodes
    dx = 25,
    // dy controls x-margin of the nodes
    dy = width / 5
} = {}) => {
    window.root = d3.hierarchy(data)
    window.treeLayout = d3.tree().nodeSize([dx, dy]);
    window.marginTop = document.getElementById('sticky-header').offsetHeight;
    window.globalCoordinates = {}
    window.globalY = dy
    window.globalX = dx
    window.collapseExpandFlag = false
    root.y0 = (dy / 2) >> 0;
    root.x0 = 0;

    root.descendants().forEach(d => {
        d.data.parents = [d.parent]
    })

    root.descendants().forEach((d, i) => {
        d.id = i;
        d._children = d.children;
    });
    window.missingLinks = true
    window.panningX = 0
    window.panningY = 0
    window.zoom = d3.zoom()
        .scaleExtent([1,1])
        .on('zoom', function(e) {
            d3.select('#wrapper')
            .attr('transform', `translate(${e.transform.x},${e.transform.y})`)
            panningX = e.transform.x
            panningY = e.transform.y
        })

    window.svg = d3.create('svg')
        .attr('id', svgId)
        .attr('width', width)
        .attr('viewBox', [-marginLeft, -marginTop, width, height])
        .style('user-select', 'none')
        .call(zoom);

    window.wrapper = svg.append('g')
        .attr('id', 'wrapper')

    window.gNode = wrapper.append('g')
        .attr('cursor', 'pointer')
        .attr('id', 'main')

    window.gLink = wrapper.append('g')
        .attr('id', 'edge-container')
        .attr('fill', 'none')
        .attr('stroke', '#555')
        .attr('stroke-opacity', 0.4)
        .attr('stroke-width', 1.5);
    update(root);
    return svg.node();
}

export function update(source) {
    const duration = 250;
    let nodes = root.descendants().reverse();

    let duplicateScanner = []
    nodes = nodes.filter(node => {
        if(!duplicateScanner.includes(node.data.name)) {
            duplicateScanner.push(node.data.name)
            return node
        }
    })
    let preLinks = root.links();
    let links = []
    let preventDouble = []
    let taxonomyEntry = Object.values(taxonomyData[source.data.name])

    // missing links for source node (node clicked)
    if(source.children){
        preLinks.forEach(pair => {
            if(pair.source.data.name === source.data.name) {
                let index = taxonomyEntry.indexOf(pair.target.data.name)
                taxonomyEntry.splice(index, 1)
                if(!preventDouble.includes(pair.target.data.name)) {
                    preventDouble.push(pair.target.data.name)
                    links.push(pair)
                }
            }
        })

        taxonomyEntry.forEach(missingNode => {
            let findNode = nodes.find(node => node.data.name === missingNode)
            links.push({source: source, target: findNode})
        })
    }

    nodes.forEach(node => {
        // add node.children to links
        if(node.children && node.data.name !== source.data.name) {
            node.children.forEach(child => {
                links.push({source: node, target: child})
            })
        }
    })

    // Compute the new tree layout.
    try {
        treeLayout(root);
    } catch (e) {
        recreateTree()
    }

    let left = root;
    let right = root;

    root.descendants().forEach(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
    });

    root.each(d => {
        if(globalCoordinates[d.data.name]) {
            d.x = Number(globalCoordinates[d.data.name].x), d.x0 = Number(globalCoordinates[d.data.name].x)
            d.y = Number(globalCoordinates[d.data.name].y), d.y0 = Number(globalCoordinates[d.data.name].y)
        }else {
            d.x0 = d.x;
            d.y0 = d.y;
        }
    });

    window.transition = svg.transition()
        .duration(duration)
        .attr('viewBox', [-marginLeft, left.x - marginTop, window.innerWidth, window.innerHeight])
        .tween('resize', window.ResizeObserver ? null : () => () => svg.dispatch('toggle'));

    // Update the nodes…
    const node = gNode.selectAll('g')
        .data(nodes, d => d.id);

    window.nodeEnter = node.enter().append('g')
        .attr('id', d => 'node'+ validID(d.data.name))
        .attr('transform', () => `translate(${Math.floor(source.y0)},${Math.floor(source.x0)})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0)

    nodeEnter.append('circle')
        .attr('r', 5)
        .attr('fill',  d => d._children ? '#555' : '#999')
        .attr('stroke-width', 10)
        .on('click', function (event, d) {
            d.children = d.children ? null : d._children;
            update(d);
        });

    nodeEnter.append('text')
        .attr('dy', '0.31em')
        .attr('x', d => (!d._children || window.edit === 'editEdges') ? alignmentNode : -alignmentNode)
        .attr('text-anchor', d => (!d._children || window.edit === 'editEdges') ? 'start' : 'end')
        .attr('font-size', '12px')
        .attr('fill', d => selectedElements.includes(d.data.name) ? 'green' : 'black')
        .attr('font-weight', d => selectedElements.includes(d.data.name) ? 'bold' : null)
        .style('margin-left', '100px')
        .text(d => d.data.name);

    Backend.prototype.activateMarking()

    // Transition nodes to their new position.
    node.merge(nodeEnter).transition(transition)
        .attr('transform', d => {
            return `translate(${d.y},${d.x})`
        })
        .attr('fill-opacity', 1)
        .attr('stroke-opacity', 1);

    // Transition exiting nodes to the parent's new position.
    node.exit().transition(transition).remove()
        .attr('transform', () => `translate(${source.y},${source.x})`)
        .attr('fill-opacity', 0)
        .attr('stroke-opacity', 0);

    // Transition nodes apart, when having multiple edges
    let treeDepth = d3.max(nodes, d => d.depth)
    for(let x = 1; x < 5; x++) {
        for (let i = 1; i <= treeDepth; i++) {
            let seperateNodes = nodes.filter(d => d.depth === i)
            let yCoords = []
            seperateNodes.forEach(d => {
                if(!yCoords.some(item => item.name === d.data.name)) {
                    yCoords.push({name: d.data.name, x: d.x})
                }
            })
            yCoords.sort((a,b) => a.x - b.x)
            for (let j = 0; j < yCoords.length-1; j++) {
                let cond = Math.abs(yCoords[j].x - yCoords[j+1].x)
                if(cond < globalX) {
                    let screwdriver = 1
                    let nodeToPush = d3.select('#node' + validID(yCoords[j].name))
                    while (cond < globalX) {
                        nodeToPush
                            .transition(transition)
                            .attr('transform', d => `translate(${d.y},${d.x - 5*screwdriver})`)
                        yCoords[j].x -= 5
                        cond = Math.abs(yCoords[j].x - yCoords[j+1].x)
                        screwdriver++
                    }
                    nodes.forEach(node => {
                        if(node.data.name === yCoords[j].name) {
                            node.x = yCoords[j].x
                            globalCoordinates[node.data.name].x = yCoords[j].x
                        }
                    })
                }
            }
        }
    }

    if(edit) {
        if(edit === "editNodes") {
            // normal call of link transition
            removeEditNodes()
            generateLinks(links, source, transition).then(() => editNodes())
        } else if (edit === "editEdges" && !collapseExpandFlag) {
            generateEdgeLinks(links, source, transition)
        } else {
            generateLinks(links, source, transition).then(() => {})
        }
    } else {
        //normal call of link transition
        generateLinks(links, source, transition).then(() => {})
    }

    // Stash the old positions for transition.
    root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
    // if(!missingLinks) {
    //     if(source.children) {
    //         updateView(source)
    //     }
    // }

    // The d3-tree structure allows only one parent, so all missing parents are added before the first update() call
    if(missingLinks) {
        missingLinks = false
        root.descendants().forEach((d) => {
            globalCoordinates[d.data.name] = {x: d.x.toFixed(2), y: d.y.toFixed(2)}
            if(taxonomyData[d.data.name].length > 0) {
                d._children = d._children ? d._children : []
                if(d._children.length < taxonomyData[d.data.name].length) {
                    taxonomyData[d.data.name].forEach(entry => {
                        let test = d._children.find(node => node.data.name === entry)
                        if(!test) {
                            root.each(missingChild => {
                                if (missingChild.data.name === entry) {
                                    if(!missingChild.data.parents.some(parent => parent.data.name === d.data.name)) {
                                        d._children.push(missingChild)
                                        d.data.children.push(missingChild)
                                        missingChild.data.parents.push(d)
                                    }
                                }
                            })
                        }
                    })
                }
            }
        })

        let globalDepth = DataStructures.getNodesWithDepth(taxonomyData, taxonomyRoot)
        root.descendants().forEach(node => {
            globalCoordinates[node.data.name].y = (globalDepth[node.data.name] * globalY).toFixed(0)
        })

        nodeEnter.selectAll('circle')
            .attr('fill',  d => d._children ? '#555' : '#999')

        nodeEnter.select('text')
            .attr('x', d => (!d._children || window.edit === 'editEdges') ? alignmentNode : -alignmentNode)
            .attr('text-anchor', d => (!d._children || window.edit === 'editEdges') ? 'start' : 'end')

        root.descendants().forEach(d => {
            if(d.depth >= 1) d.children = null
        })
        update(root)
    }
}

export function collapseAll() {
    if(edgeMode) {
        collapseExpandFlag = true
    }
    collapseNodes(root)
    if(edgeMode) {
        collapseExpandFlag = false
        update(root)
    }
}

function collapseNodes(node) {
    update(node)
    if(node._children) {
        node._children.forEach((child) => {
            if (node.children) {
                node.children = null
            }
            collapseNodes(child)
        })
    }
}

export function expandAll() {
    if(edgeMode) {
        collapseExpandFlag = true
    }
    expandNodes(root)
    if(edgeMode) {
        collapseExpandFlag = false
        update(root)
    }
}

function expandNodes(node) {
    update(node)
    if(node._children) {
        node._children.forEach((child) => {
            if (!node.children) {
                node.children = node._children
            }
            expandNodes(child)
        })
    }
}

// function updateView(source) {
//     // Get the current viewBox dimensions
//     const viewBox = svg.attr("viewBox").split(",").map(Number);
//     const viewBoxWidth = viewBox[2];
//     const viewBoxHeight = viewBox[3];
//     //panningX
//     source.children.sort((a,b) => a.y - b.y)
//     let nodeX = Number(globalCoordinates[source.children[0].data.name].y) + 60 + (7*source.children[0].data.name.length)
//     let translateX = 0
//     let currX = viewBoxWidth - panningX
//     if(currX - nodeX < 0) {
//         translateX = currX - nodeX
//     }
//     //panningY
//     source.children.sort((a,b) => a.x - b.x)
//     let nodeY = Number(globalCoordinates[source.children[0].data.name].x)
//     let translateY = 0
//     let currY = viewBoxHeight - panningY
//     console.log('NODE:', source.children[0].data.name)
//     console.log('Y: The Viewbox width (with panning) is', currY)
//     console.log('Y: node', nodeY)
//     if(currY - nodeY < 0) {
//         translateY = currY - nodeY
//     }
//
//     // Apply the transformation to the SVG container
//     d3.select('#wrapper').transition().duration(500)
//         .attr("transform", `translate(${translateX},${-translateY})`);
// }

// Function to calculate the center position based on the number of children
export function calculateCenterPosition(parent, children) {
    let centerX, centerY
    if (!children) {
        console.log('enter')
        return { x: parent.x >> 0, y: (parent.y) >> 0}; // No children, center on parent
    } else if (children.length % 2 === 0) {
        // Even count of children
        const l = children.length / 2
        children.forEach(c => {
            console.log(c.data.name, ' ', c.x,' ', c.y)
            console.log('----------')
        })
        centerX = parent.x;
        centerY = ((children[l-1].y + children[l].y) / 2 + parent.y)/2;
    } else {
        // Odd count of children
        const l = Math.floor(children.length/2)
        centerX = parent.x;
        centerY = (children[l].y + parent.y)/2;
    }
    return { x: centerX >> 0, y: centerY >> 0};
}

