import {update} from './collapsible-tree.js'
import {saveTaxonomy, renameNode} from "../main.js";
//import * as d3 from "d3";
import {editNodes, removeEditNodes} from "./edit-nodes.js";

export function add(event, parentNode) {
    console.log('node ', parentNode)
    console.log('event ', event)
    let nodeName = generateFourDigitHash()
    // update taxonomy
    taxonomyData[parentNode.data.name].push(nodeName)
    taxonomyData[nodeName] = []

    let newNode = d3.hierarchy({
        name: nodeName,
        parents: [parentNode]
    })
    newNode.parent = parentNode
    newNode.id = Date.now()
    newNode.depth = parentNode.depth + 1
    parentNode.children = !parentNode._children ? [] : parentNode._children
    if(parentNode.children.length > 0) {
        console.log('override ', newNode.x, ' with ', parentNode.children[parentNode.children.length - 1].x + 25 )
        newNode.x = parentNode.children[parentNode.children.length - 1].x + 25
    } else {
        newNode.x = parentNode.x
    }
    newNode.y = Number(parentNode.y) + globalY
    console.log(newNode)
    globalCoordinates[nodeName] = {x: Number(newNode.x).toFixed(2), y: Number(newNode.y).toFixed(2)}
    parentNode.children.push(newNode)
    parentNode._children = parentNode.children

    // update circle color and text
    d3.select('#node'+ validID(parentNode.data.name)).select('circle')
        .attr('fill', '#555')
    d3.select('#node'+validID(parentNode.data.name)).select('text')
        .attr('x', -alignmentNode)
        .attr('text-anchor', 'end')

    update(parentNode)

    setTimeout(() => {
        const textElement = d3.select('#node'+nodeName).select('text')
        edit(newNode, textElement)
    }, 300)

    killMenu()
    saveTaxonomy()
}

export function edit(node, textElement) {
    console.log('log node: ', node)
    const textBBox = textElement.node().getBoundingClientRect()
    console.log(textElement.node().getBoundingClientRect())

    const bbox = {
        x: textBBox.x,
        y: textBBox.y,
        width: textBBox.width,
        height: textBBox.height
    }

    let id = "edit" + validID(node.data.name)

    // https://css-tricks.com/the-cleanest-trick-for-autogrowing-textareas/
    const div = document.createElement("div")
    div.setAttribute("class", "grow-wrap")
    div.id = "edit" + id
    div.style.position = "absolute"
    div.style.left = bbox.x + window.scrollX + "px";
    div.style.top = bbox.y - 2 + window.scrollY +"px";
    div.style.width = bbox.width + 10 + "px";
    div.style.height = bbox.height + "px";

    const textarea = document.createElement("textarea")
    textarea.value = node.data.name

    textarea.setAttribute("oninput",  "this.parentNode.dataset.replicatedValue = this.value")
    textarea.rows = 1;
    div.appendChild(textarea)
    d3.select('#collapsible-tree').append(() => div)

    textarea.focus()

    let shouldTriggerBlur = true

    textarea.addEventListener("blur", function (e) {
        console.log('blur')
        if (shouldTriggerBlur) {
            renameNode(node.data.name, textarea.value)
            save(node, node.data.name, textarea.value, id, e)
            saveTaxonomy()
        }
    })

    textarea.addEventListener("keydown", function(e) {
        console.log('keydown ', e)
        if (e.key === "Enter") {
            shouldTriggerBlur = false
            e.stopPropagation()
            renameNode(node.data.name, textarea.value)
            save(node, node.data.name, textarea.value, id, e)
            saveTaxonomy()
        } else if (e.key === "Escape") {
            save(node, node.data.name, node.data.name, id, e)
        }
    })

    removeEditNodes()
    editNodes()
    killMenu()

}
function save(node, oldNodeName, newNodeName, id, e) {
    e.preventDefault()
    console.log('renaming ', oldNodeName, ' to ', newNodeName)
    if (oldNodeName === newNodeName) {
        console.log('no change')
    } else if (taxonomyData[newNodeName] === undefined) {
        console.log('rename')
        // create node
        taxonomyData[newNodeName] = []
        // add to parent
        taxonomyData[node.parent.data.name].push(newNodeName)
        // add children
        if (taxonomyData[oldNodeName].length > 0) {
            taxonomyData[oldNodeName].forEach(child => {
                taxonomyData[newNodeName].push(child)
            })
        }
        // remove old node
        let i = taxonomyData[node.parent.data.name].findIndex(value => value === oldNodeName)
        taxonomyData[node.parent.data.name].splice(i, 1)
        delete taxonomyData[oldNodeName]
        node.data.name = newNodeName
        d3.select('#node'+ validID(oldNodeName))
            .attr('id', 'node'+validID(newNodeName))
            .select('text').text(newNodeName)

        update(node)

    } else {
        console.log('element exists already')
    }
    d3.select("#edit"+id).remove()
}

export function remove(node) {
    //delete from parent
    let parentIndex = taxonomyData[node.parent.data.name].findIndex((name) => name === node.data.name)
    taxonomyData[node.parent.data.name].splice(parentIndex, 1)
    console.log(taxonomyData)

    removeChildren(node.data.name)
    delete taxonomyData[node.data.name]

    let parents = node.data.parents
    parents.forEach(parent => {
        parent.children.forEach((child, index) => {
            if(child.data.name === node.data.name) {
                parent._children.splice(index, 1)
                if(parent.children.length === 0) {
                    parent.children = null
                    parent._children = null
                    d3.select('#node'+ validID(parent.data.name)).select('circle')
                        .attr('fill', '#999')
                    d3.select('#node'+validID(parent.data.name)).select('text')
                        .attr('x', alignmentNode)
                        .attr('text-anchor', 'start')
                }
            }
        })
    })
    d3.select('#node'+validID(node.data.name)).remove()
    update(parents[0])
    killMenu()
    saveTaxonomy()
}

function removeChildren(root) {
    //delete children
    console.log('root: ', root)
    if (taxonomyData[root] && taxonomyData[root].length > 0) {
        while (taxonomyData[root].length > 0) {
            let child = taxonomyData[root].pop()
            if (taxonomyData[child] && taxonomyData[child].length > 0) {
                removeChildren(child)
            }
            delete taxonomyData[child]
        }
    }
}

export function killMenu() {
    d3.selectAll('#menu').remove()
    d3.selectAll('#iconbar').remove()
    d3.selectAll("#dots").remove()
}

function generateRandomChar() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const randomIndex = Math.floor(Math.random() * characters.length);
    return characters.charAt(randomIndex);
}

function generateFourDigitHash() {
    let hash = '';
    for (let i = 0; i < 4; i++) {
        hash += generateRandomChar();
    }
    return hash;
}