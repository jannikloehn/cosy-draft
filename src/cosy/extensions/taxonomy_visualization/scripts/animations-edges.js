//import * as d3 from "d3";
import {generateArrows, generateCircles} from "./edit-edges.js";

export function generateLinks(links, source, transition) {
    return new Promise((resolve) => {
        // Update the links…
        const link = gLink.selectAll('path')
            .data(links, d => `${d.source.id}-${d.target.id}`)
        const diagonal = d3.linkHorizontal().x(d => d.y).y(d => d.x);

        // Enter any new links at the parent's previous position.
        window.linkEnter = link.enter().append('path')
            .attr('id', d => {
                return 'link-' + validID(d.source.data.name) + '-' + validID(d.target.data.name)
            })
            .attr('d', () => {
                const o = {
                    x: source.x0,
                    y: source.y0
                };
                return diagonal({
                    source: o,
                    target: o
                });
            });

        // Transition links to their new position.
        link.merge(linkEnter)
            .transition(transition)
            .attr('d', (d) => {
                let offsetX = 0
                let offsetY = 0
                if(edgeMode) {
                    let parents = d.target.data.parents
                    offsetY = 10
                    if(parents.length > 1) {
                        parents.sort((a,b) => a.x - b.x || a.y - b.y)
                        let whichCircle = parents.findIndex(parent => parent.x === d.source.x && parent.y === d.source.y)
                        offsetX = Number(d3.select('#'+validID(d.target.data.name)+'-'+whichCircle).attr('cy'))
                    }
                }
                const modifiedTarget = {
                    x: d.target.x + offsetX,
                    y: d.target.y - offsetY
                };
                return diagonal({
                    source: { x: d.source.x, y: d.source.y },
                    target: modifiedTarget
                });
            })
            .on('end', resolve); // Resolve the promise when the transition ends

        // Transition exiting nodes to the parent's new position.
        link.exit()
            .transition(transition)
            .remove()
            .attr('d', () => {
                const o = {
                    x: source.x,
                    y: source.y
                };
                return diagonal({
                    source: o,
                    target: o
                });
            })
            .on('end', resolve); // Resolve the promise when the transition ends
    });
}

export function generateEdgeLinks(links, source, transition) {
    let allNodes = d3.select('#main').selectAll('g')
    generateCircles(allNodes)
        .then(() => {
            generateLinks(links, source, transition)
                .then(r => generateArrows(allNodes))
        })
}

