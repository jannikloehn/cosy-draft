//import * as d3 from "d3";
import {update} from "./collapsible-tree.js";
import {saveTaxonomy} from "../main.js";
import {remove} from "./actions-nodes.js";
import {DataStructures} from "./data-structures.js";

export function addEdge(node, sourceNode, targetNode, e, d) {
    if(!window.taxonomyData[sourceNode].includes(d.data.name)) {
        window.taxonomyData[sourceNode].push(d.data.name)
        d.data.parents.push(node)

        // update depth of child node...
        let globalDepth = DataStructures.getNodesWithDepth(taxonomyData, taxonomyRoot)
        root.descendants().forEach(node => {
            globalCoordinates[node.data.name].y = (globalDepth[node.data.name] * globalY).toFixed(0)
        })
        const attributes = d3.select("#node"+validID(sourceNode))
        attributes.select('circle').attr('fill', '#555')

        saveTaxonomy()
        let links = root.links()
        links.push({source: node, target: d})
        node.children = null
        setTimeout(() => {
            update(d)
        },350)

        node._children ? node._children.push(d) : node._children = [d]
        node.children = node._children
        node.data.children = node._children
        update(d)
    }
}

export function removeEdge(source, target) {
    let el = d3.select('#link-'+validID(source.data.name)+'-'+validID(target.data.name))
    if(el) {
        let lastElement = 0
        Object.entries(taxonomyData).forEach(node => {
            node[1].forEach(edge => {
                if (edge === target.data.name) {
                    lastElement++
                }
            })
        })
        if(lastElement === 1) {
            let warningString = "Do you want to proceed? This will delete the following components:\n"
            warningString += target.data.name + ', '
            if(target._children) {
                target._children.forEach(child => {
                    console.log(child.data.name, ' parents length: ',child.data.parents.length, 'node ', child)
                    if(child.data.parents.length === 1) {
                        warningString += child.data.name + ', '
                    }
                })
            }
            warningString = warningString.endsWith(', ') ? warningString.slice(0, -2) : warningString
            let proceed = window.confirm(warningString);
            if (proceed) {
                // User clicked 'OK', proceed with the action
                remove(target)
            }
        } else {
            // find index of sorted parent
            let parents = target.data.parents
            if(parents.length > 1) {
                parents.sort((a,b) => a.x - b.x || a.y - b.y)
                let whichCircle = parents.findIndex(parent => parent.x === source.x && parent.y === source.y)
                d3.select('#'+ validID(target.data.name) + '-' + whichCircle).remove()
            }

            el.remove()
            console.log('removed? ', d3.select('#link-'+validID(source.data.name)+'-'+validID(target.data.name)))

            let nodes = root.descendants()
            nodes.forEach(node => {
                if (node.data.name === source.data.name) {
                    console.log('hello ', node.data.name, ' obj: ', node)
                    node._children.forEach(child => {
                        if(child.data.name === target.data.name) {
                            console.log('here is ', child.data.name, ' obj: ', child)
                        }
                    })
                }
            })

            let childToRemove = source._children.findIndex(child => child.data.name === target.data.name)
            source.children.splice(childToRemove, 1)
            source._children.splice(childToRemove, 1)

            let parentToRemove = target.data.parents.findIndex(parent => parent.data.name === source.data.name)
            target.data.parents.splice(parentToRemove, 1)

            let taxonomyIndex = taxonomyData[source.data.name].findIndex(name => name === target.data.name)
            taxonomyData[source.data.name].splice(taxonomyIndex, 1)

            //Remove link from d3 data
            let allLinks = root.links()
            allLinks.forEach((link, index) => {
                if(link.source.data.name === source.data.name && link.target.data.name === target.data.name) {
                    allLinks.splice(index, 1)
                }
            })
            saveTaxonomy()
            let globalDepth = DataStructures.getNodesWithDepth(taxonomyData, taxonomyRoot)
            root.descendants().forEach(node => {
                globalCoordinates[node.data.name].y = (globalDepth[node.data.name] * globalY).toFixed(0)
            })
            setTimeout(() => {
                update(source)
            },350)
        }
    }

}