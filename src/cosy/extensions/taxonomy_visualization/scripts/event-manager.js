//import * as d3 from 'd3'
import {sendSelections} from "../main.js";
import {update} from "./collapsible-tree.js";
let div = null
let elementCount = 0

export class Backend {
     activateMarking () {
        nodeEnter.selectAll('text').on('click', (e, d) => {
            let curr = d3.select('#node'+validID(d.data.name)).select('text')
            if(!curr.attr("font-weight")) {
                curr.attr("fill", "green")
                    .attr("font-weight", "bold")
                    .attr('font-size', '12px');
                elementCount++
                selectedElements.push(d.data.name)

                if(div === null) {
                    div = document.createElement("div")
                    div.id = "marked"
                    div.setAttribute('class', 'marked')
                    document.getElementById('markedComponents').appendChild(div)
                    // logic for passing info to fusion
                }
                div.textContent = this.generateSelected()
                console.log(selectedElements)

            } else {
                curr.attr("fill", "black")
                    .attr("font-weight", null)
                    .attr('font-size', '12px');
                elementCount--
                selectedElements.splice(selectedElements.findIndex(ele => ele === d.data.name), 1)
                div.textContent = this.generateSelected()
                if (elementCount === 0) {
                    div.textContent = ""
                    delete document.getElementById('markedComponents').removeChild(div)
                    div = null
                }
            }
            let headerHeight = document.getElementById('sticky-header').offsetHeight
            if (window.marginTop !== headerHeight) {
                window.marginTop = headerHeight
                update(root)
            }
            sendSelections()
        })
    }
    generateSelected () {
        return "[" + selectedElements.map((ele, i) => {
            return i > 0 ? ' ' + ele : ele
        }) + "]"
    }
    deactivateMarking() {
        nodeEnter.selectAll('text').on('click', null)
    }
}