//import * as d3 from 'd3'
import {add, edit, killMenu, remove} from "./actions-nodes.js";

export function editNodes () {
// coordinate source is in the middle of the circle (translated from parent -> child)
    d3.select('#main').selectAll('g')
        .on("mouseleave", function (event, d) {
            console.log('mouseleave')
            const node = d3.select('#node' + validID(d.data.name))
            const rectBoundingBox = node.node().getBoundingClientRect()
            const mousePos = d3.pointer(event, svg);
            // Get the mouse position relative to the SVG element
            if (mousePos[0] >= rectBoundingBox.left && mousePos[0] <= rectBoundingBox.right && mousePos[1] >= rectBoundingBox.top && mousePos[1]  <= rectBoundingBox.bottom) {
                return;
            } else {
                node.selectAll('#menu').remove()
                node.selectAll('image').remove()
                node.selectAll('svg').remove()
            }
        })
        .insert('rect', ':first-child')
        .attr('id', d => 'hitbox'+ validID(d.data.name))
        .attr('x', d => d._children ? -d.data.name.length*7.2 -25 : -15)
        .attr('y', -8.5)
        .attr('width', d => d.data.name.length*7.2 + 50)
        .attr('height', 18)
        .attr("rx", 6)
        .attr("ry", 6)
        .attr('opacity', 0)
        .style("stroke", "black")
        .style("stroke-width", "1.5px")
        .on("mouseover", function (event, d) {
            handleMouseOver(d)
            d3.select('#hitbox'+validID(d.data.name))
        });
}

function handleMouseOver(d) {

    const gId = validID(d.data.name)
    const node = d3.select('#node'+gId);

    const hitBox = d3.select('#hitbox'+gId)
    const hitBoxBBox = hitBox.node().getBBox()
    const textElement = node.select('text')
    const alignmentText = textElement.attr('x') >= 0 ? 1 : -1 // -6 / 6

    const bbox = {
        x: hitBoxBBox.x,
        y: hitBoxBBox.y,
        width: hitBoxBBox.width,
        height: hitBoxBBox.height
    }

    if(node.node().childNodes.length === 3) {
        const rect = node.insert("rect", ":first-child")
            .attr('id', 'menu')
            .attr("x", alignmentText === 1 ? bbox.x : bbox.x + d.data.name.length*7.2)
            .attr("y", bbox.y)
            .attr("width", bbox.width)
            .attr("height", bbox.height)
            .attr("style", "fill: lightgray;")
            .attr("rx", 2)
            .attr("ry", 2)
            .attr('opacity', 0.5)
            .style("stroke", "black")
            .style("transition", "width 400ms ease-in-out" )
            .style("transform-origin", alignmentText === 1 ? "right" : "left")
            .style("transform", alignmentText === 1 ? "scaleX(1)" : "scaleX(-1)")
            .style("stroke-width", "0.5px");


        const alignX = alignmentText >= 0 ?  bbox.x + bbox.width - 15 : bbox.x
        const iconSize = 14

        const centerY = bbox.y + bbox.height / 2

        const sourceSVG = node.append('svg')
            .attr("x", alignX)
            .attr("y", centerY - (iconSize/2))
            .attr("width", iconSize)
            .attr("height", iconSize)

        const menu = sourceSVG.append("svg:image")
            .attr("id", "dots")
            .attr("xlink:href", "assets/icons/3-vertical-dots-icon.svg")
            .attr('width', iconSize)
            .attr("height", iconSize);
        let open = false
        menu.on("click", () => {
            if(!open){
                // adapt new width to hitbox, when icons are shown
                rect.attr("width",bbox.width + 70)
                menu.transition().duration(400)
                    .attr("transform-origin", "center center")
                    .attr("transform", `rotate(90)`);

                const iconBar = node.append('svg')
                    .attr('id', 'iconbar')
                    .attr("x", alignmentText >= 0 ? alignX : alignX - 100)
                    .attr("y", centerY - (iconSize/2))
                    .attr("width", 100)
                    .attr("height", iconSize)

                iconBar.append("svg:image")
                    .attr('id', 'action')
                    .attr("xlink:href", "assets/icons/icons8-plus.svg")
                    .attr('x', alignmentText >= 0 ? 20 : 80)
                    .attr('y', 0)
                    .attr('width', iconSize)
                    .attr("height", iconSize)
                    .attr('opacity', 0)
                    .on("click", (event, node) => {
                        console.log('add')
                        add(event, node)
                    })

                iconBar.append("svg:image")
                    .attr('id', 'action')
                    .attr("xlink:href", "assets/icons/icons8-edit.svg")
                    .attr('x', alignmentText >= 0 ? 40 : 60)
                    .attr('y', 0)
                    .attr('width', iconSize)
                    .attr("height", iconSize)
                    .attr('opacity', 0)
                    .on("click", (event, node) => {
                        console.log('edit')
                        edit(node, textElement)
                    })

                iconBar.append("svg:image")
                    .attr('id', 'action')
                    .attr("xlink:href", "assets/icons/icons8-trash-32.png")
                    .attr('x', alignmentText >= 0 ? 60 : 40)
                    .attr('y', 0)
                    .attr('width', iconSize)
                    .attr("height", iconSize)
                    .on("click", (event, node) => {
                        console.log('remove')
                        remove(node)
                    })

                iconBar.selectAll('#action')
                    .transition()
                    .duration(400)
                    .attr('opacity', 1)
                open = true
            } else {
                node.selectAll('#action')
                    .transition()
                    .duration(300)
                    .attr('opacity', 0)
                    .remove();

                menu.transition().duration(400)
                    .attr("transform-origin", "center center")
                    .attr("transform", `rotate(0)`);

                rect.attr("width",bbox.width)

                node.select('#iconbar').transition().duration(500).remove()
                open = false
            }
        });

    }
}

export function removeEditNodes() {
    d3.select('#main').selectAll('g')
        .on("mouseleave", null)
        .on("mouseover", null)
        .selectAll('rect')
            .remove()
    killMenu()
}