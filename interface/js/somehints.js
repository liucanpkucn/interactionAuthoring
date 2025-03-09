function rem2px(rem) {
    let curg = _chart_object[0].canvas_part;
    let mainrectrect = curg.select(".mainrect").node().getBoundingClientRect();
    let factor = Math.min(mainrectrect.width / 1500, 1);
    return rem * parseFloat(getComputedStyle(document.documentElement).fontSize) * factor;
}
let hintinfo = {
    pos_ori: [null, null],
}

function createHintCirlce(hintSvg, cirw, color1) {
    let hintCircleG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${0}, ${0})`
        })
        // .attr("id", "dragHintCircle")
        .attr("class", "dragHints");
    hintCircleG
        .append("circle")
        .attr("r", rem2px(cirw / 4))
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", color1)
    hintCircleG
        .append("circle")
        .attr("r", rem2px(0.47 * cirw))
        .attr("cx", 0)
        .attr("cy", 0)
        .attr("fill", "none")
        .attr("stroke", color1)
        .attr("stroke-width", rem2px(0.08))
    return hintCircleG;
}
function createHintUpdownArrow(hintSvg, dw, color1, w=0.44, h=5.39) {
    let arrowWidth = dw * 1.0;
    let arrowHeight = dw * 0.5;

    let updownArrowWidth = dw * w;
    let updownArrowHeight = dw * h;

    let hintUpdownArrowG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${0}, ${0})`
        })
        .attr("class", "dragHintUpDownArrow")
    hintUpdownArrowG
        .append("path")
        .style("stroke", color1).style("stroke-width", rem2px(0.1)).style("fill", "none")
        .attr("d", function () {
            let str = `M${0},${-updownArrowHeight/2}L${0},${updownArrowHeight/2}`;
            return str;
        })
    hintUpdownArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${0},${-updownArrowHeight/2}L${-arrowHeight / 2},${-updownArrowHeight/2+arrowWidth}L${arrowHeight / 2},${-updownArrowHeight/2+arrowWidth}Z`;
            return str;
        })
    hintUpdownArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${0},${updownArrowHeight/2}L${-arrowHeight / 2},${updownArrowHeight/2 - arrowWidth}L${arrowHeight / 2},${updownArrowHeight/2 - arrowWidth}Z`;
            return str;
        })
    return hintUpdownArrowG;
}
function createHintLeftrightArrow(hintSvg, dw, color1, heightdelta=5.39) {
    let arrowWidth = dw * 1.0;
    let arrowHeight = dw * 0.5;

    let leftrightArrowWidth = dw * 0.44;
    let leftrightArrowHeight = dw * heightdelta;

    let hintLeftrightArrowG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${0}, ${0})`
        })
        .attr("class", "draghintLeftrightArrow")
    hintLeftrightArrowG
        .append("path")
        .style("stroke", color1).style("stroke-width", rem2px(0.1)).style("fill", "none")
        .attr("d", function () {
            let str = `M${-leftrightArrowHeight/2},${0}L${leftrightArrowHeight/2},${0}`;
            return str;
        })
    hintLeftrightArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${-leftrightArrowHeight/2},${0}L${-leftrightArrowHeight/2+arrowWidth},${-arrowHeight / 2}L${-leftrightArrowHeight/2+arrowWidth},${arrowHeight / 2}Z`;
            return str;
        })
    hintLeftrightArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${leftrightArrowHeight/2},${0}L${leftrightArrowHeight/2-arrowWidth},${-arrowHeight / 2}L${leftrightArrowHeight/2-arrowWidth},${arrowHeight / 2}Z`;
            return str;
        })
    return hintLeftrightArrowG;
}


function createHintDiv(canvasobj, px, py, extend=null) {
    let cid = "cid"+_chart_object.indexOf(canvasobj);
    let curg = canvasobj.canvas_part;
    let mainrectrect = curg.select(".mainrect").node().getBoundingClientRect();
    let node = d3.select(`.dragHint.${cid}`).node();
    let divWidth = mainrectrect.width;
    if (extend) {
        divWidth += rem2px(extend);
    }
    if (node) {
        let ret = d3.select(node).style("display", null);
        ret
            .style("left", mainrectrect.left)
            .style("top", mainrectrect.top)
            .style("width", divWidth)
            .style("height", mainrectrect.height)
        let svg = ret.select("svg").select("g");
        svg.selectAll("*").remove();
        svg
            .attr("transformori", function () {
                return `${px - mainrectrect.x},${py - mainrectrect.y}`
            })
            .attr("transform", function () {
                return `translate(${px - mainrectrect.x}, ${py - mainrectrect.y})`
            })
        return svg;
    }
    let hintDiv = d3.select("body")
        .append("div")
        .attr("class", `dragHint ${cid}`)
        .style("left", mainrectrect.left)
        .style("top", mainrectrect.top)
        .style("width", divWidth)
        .style("height", mainrectrect.height)
        .style("display", null)
        .style("pointer-events", "none")
    let hintSvg = hintDiv.append("svg")
        .style("width", "100%")
        .style("height", "100%")
        .append("g")
        .attr("transformori", function () {
            return `${px - mainrectrect.x},${py - mainrectrect.y}`
        })
        .attr("transform", function () {
            return `translate(${px - mainrectrect.x}, ${py - mainrectrect.y})`
        })
    return hintSvg;
}
// createHintDiv();
function addHint(canvasobj, e) {
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    let curg = canvasobj.canvas_part;
    let mainrectrect = curg.select(".mainrect").node().getBoundingClientRect();
    hintinfo.pos_ori = [px, py];
    let extendbydw = 4;
    let hintSvg = createHintDiv(canvasobj, px, py, extendbydw+1);
    let cirw = 1.4;
    let dw = rem2px(cirw);

    let color1 = "#434343";
    let color2 = "#7F7F7F";

    let hintCircleG = createHintCirlce(hintSvg, cirw, color1);

    let hintLeftArrowG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${-dw * 1.2}, ${0})`
        })
        .attr("id", "dragHintLeftArrow")
        .attr("class", "dragHints");

    let arrowWidth = dw * 1.0;
    let arrowHeight = dw * 0.5;
    let leftArrowWidth = dw * 6.68;
    let leftArrowHeight = dw * 1.17;
    hintLeftArrowG
        .append("path")
        .style("stroke", color1).style("stroke-width", rem2px(0.1)).style("fill", "none")
        .attr("d", function () {
            let str = `M${0},${0}S${-leftArrowWidth * 0.15},${-leftArrowWidth * 0.15},${-leftArrowWidth + arrowWidth},${-leftArrowHeight + arrowHeight / 2}`
            return str;
        })
    hintLeftArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${-leftArrowWidth + arrowWidth},${-leftArrowHeight}`;
            str += `L${-leftArrowWidth + arrowWidth},${-leftArrowHeight + arrowHeight}`;
            str += `L${-leftArrowWidth},${-leftArrowHeight + arrowHeight / 2}Z`;
            return str;
        })

    let rightArrowWidth = mainrectrect.right + rem2px(extendbydw/2+1) - px - dw * 1.2;
    let rightArrowHeight = dw * 1.63;
    let hintRightArrowG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${dw * 1.2}, ${0})`
        })
        .attr("id", "dragHintRightArrow")
        .attr("class", "dragHints");
    let p1x = rightArrowWidth/2-arrowWidth;
    let p1y = -rightArrowHeight-arrowHeight
    let p2x = rightArrowWidth;
    let p2y = -rightArrowHeight + arrowHeight * 2.5;
    let rag_rotate = 0;
    if (p1x != p2x) {
        rag_rotate = Math.atan((p2y-p1y)/(p2x-p1x))/Math.PI*180;
    }
    hintRightArrowG
        .append("path")
        .attr("class", "hra-1")
        .style("stroke", color1).style("stroke-width", rem2px(0.1)).style("fill", "none")
        .attr("d", function () {
            // let str = `M${0},${0}S${rightArrowWidth*0.15},${-rightArrowHeight*1.25},${rightArrowWidth-arrowWidth},${-rightArrowHeight+arrowHeight/2}`
            // let str = `M${0},${0}S${rightArrowWidth * 0.15},${-rightArrowHeight * 0.85},${rightArrowWidth / 3},${-rightArrowHeight}`
            // str += `A${rightArrowWidth*2/3},${rightArrowHeight-arrowHeight/2},${0},${0},${1},${rightArrowWidth - arrowWidth},${-rightArrowHeight + arrowHeight * 2}`;
            let str = `M${0},${0}Q${p1x},${p1y},${p2x},${p2y}`;
            return str;
        })
    hintRightArrowG
        .append("path")
        .attr("class", "hra-2")
        .attr("transform", () => {
            return `translate(${rightArrowWidth}, ${p2y}) rotate(${rag_rotate})`
        })
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${-arrowWidth},${ - arrowHeight / 2}`;
            str += `L${-arrowWidth},${arrowHeight / 2}`;
            str += `L${0},${0}Z`;
            return str;
        })
    if (extendbydw > 0) {
        let extend = rem2px(extendbydw);
        let rectH = rem2px(6);
        hintRightArrowG
            .append("path")
            .attr("class", "hra-3")
            .attr("transform", () => {
                return `translate(${rightArrowWidth}, ${p2y+rem2px(0.2)})`
            })
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
            .attr("d", function () {
                let str = `M${-extend/2},${0}`;
                str += `L${extend/2},${0}`;
                str += `L${extend/2},${rectH}`;
                str += `L${-extend/2},${rectH}Z`;
                return str;
            })
    }

    let hintDownArrowG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${0}, ${dw * 1})`
        })
        .attr("id", "dragHintDownArrow")
        .attr("class", "dragHints");

    let downArrowWidth = dw * 0.44;
    let downArrowHeight = dw * 5.39;
    hintDownArrowG
        .append("path")
        .style("stroke", color1).style("stroke-width", rem2px(0.1)).style("fill", "none")
        .attr("d", function () {
            let str = `M${0},${0}L${0},${downArrowHeight}`;
            return str;
        })
    hintDownArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${0},${0}L${-arrowHeight / 2},${arrowWidth}L${arrowHeight / 2},${arrowWidth}Z`;
            return str;
        })
    hintDownArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            let str = `M${0},${downArrowHeight}L${-arrowHeight / 2},${downArrowHeight - arrowWidth}L${arrowHeight / 2},${downArrowHeight - arrowWidth}Z`;
            return str;
        })

    let arrow2Width = dw * 0.8;
    let arrow2Height = dw * 0.4;
    let hintDownArrowExtraG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${0}, ${dw * 1})`
        })
        .attr("id", "dragHintDownArrowExtra")
        .attr("class", "dragHints");
    let downArrowExtraWidth = dw * 2.52;
    let downArrowExtraHeight = dw * 5.50;
    let re_y0 = downArrowHeight / 2 - downArrowExtraHeight / 2;
    let re_y1 = downArrowHeight / 2;
    let re_y2 = downArrowHeight / 2 + downArrowExtraHeight / 2;
    hintDownArrowExtraG
        .append("path")
        .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
        .attr("d", function () {
            let str = `M${-downArrowExtraWidth / 2},${re_y0}C${-downArrowExtraWidth / 2},${downArrowHeight * 0.5},${downArrowExtraWidth / 2},${downArrowHeight * 0.5},${downArrowExtraWidth / 2},${re_y2}`;
            return str;
        })
    hintDownArrowExtraG
        .append("path")
        .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
        .attr("d", function () {
            let str = `M${downArrowExtraWidth / 2},${re_y0}C${downArrowExtraWidth / 2},${downArrowHeight * 0.5},${-downArrowExtraWidth / 2},${downArrowHeight * 0.5},${-downArrowExtraWidth / 2},${re_y2}`;
            return str;
        })
    hintDownArrowExtraG
        .append("path")
        .style("fill", color2)
        .attr("d", function () {
            let str = `M${downArrowExtraWidth / 2},${re_y0}L${downArrowExtraWidth / 2 + arrow2Height / 2},${re_y0 + arrow2Width}L${downArrowExtraWidth / 2 - arrow2Height / 2},${re_y0 + arrow2Width}`;
            return str;
        })
    hintDownArrowExtraG
        .append("path")
        .style("fill", color2)
        .attr("d", function () {
            let str = `M${-downArrowExtraWidth / 2},${re_y0}L${-downArrowExtraWidth / 2 - arrow2Height / 2},${re_y0 + arrow2Width}L${-downArrowExtraWidth / 2 + arrow2Height / 2},${re_y0 + arrow2Width}`;
            return str;
        })
    hintDownArrowExtraG
        .append("path")
        .style("fill", color2)
        .attr("d", function () {
            let str = `M${downArrowExtraWidth / 2},${re_y2}L${downArrowExtraWidth / 2 + arrow2Height / 2},${re_y2 - arrow2Width}L${downArrowExtraWidth / 2 - arrow2Height / 2},${re_y2 - arrow2Width}`;
            return str;
        })
    hintDownArrowExtraG
        .append("path")
        .style("fill", color2)
        .attr("d", function () {
            let str = `M${-downArrowExtraWidth / 2},${re_y2}L${-downArrowExtraWidth / 2 - arrow2Height / 2},${re_y2 - arrow2Width}L${-downArrowExtraWidth / 2 + arrow2Height / 2},${re_y2 - arrow2Width}`;
            return str;
        })

    let leftArrowExtraHeight1 = dw * 4.22;
    let laeh1 = leftArrowExtraHeight1;
    let leftArrowExtraHeight2 = dw * 2.47;
    let leftArrowExtraHeight3 = dw * 0.86;
    let leftArrowExtraWidth = 6 * dw;
    let leftArrowExtraBar1 = 1.05 * dw;
    let leftArrowExtraBar2 = 0.5 * dw;
    let bardelta = 0.3 * dw;
    let leftArrowExtraHeights = [leftArrowExtraHeight1, leftArrowExtraHeight2, leftArrowExtraHeight3];
    let leftArrowExtraRotate = [4, 12, 24];
    let hintLeftArrowExtraG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${-leftArrowExtraWidth}, ${dw * 1.5})`
        })
        .attr("id", "dragHintDownArrowExtra")
        .attr("class", "dragHints");
    // if (canvasobj.dragOderStatus == 1) {
    //     hintLeftArrowExtraG
    //         .style("transform", () => {
    //             return `translate(${-leftArrowExtraWidth}px, ${dw * 1.5 + leftArrowExtraHeight1}px) rotateX(180deg)`
    //         })
    // }
    for (let hlae = 0; hlae < 3; ++hlae) {
        let r = leftArrowExtraHeights[hlae];
        hintLeftArrowExtraG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
            .attr("d", function () {
                let str = `M${0},${laeh1 - r}A${r},${r},${0},${0},${0},${-r},${laeh1}`;
                return str;
            })
        if (canvasobj.dragOderStatus == 1) {
            hintLeftArrowExtraG
                .append("path")
                .style("fill", color2)
                .attr("transform", function () {
                    return `translate(${0},${laeh1-r}) rotate(${-leftArrowExtraRotate[hlae]-90})`;
                })
                .attr("d", function () {
                    let str = `M${0},${0}L${arrow2Height / 2},${-arrow2Width}L${-arrow2Height / 2},${-arrow2Width}Z`;
                    return str;
                })
        } else {
            hintLeftArrowExtraG
                .append("path")
                .style("fill", color2)
                .attr("transform", function () {
                    return `translate(${-r}, ${laeh1}) rotate(${leftArrowExtraRotate[hlae]})`;
                })
                .attr("d", function () {
                    let str = `M${0},${0}L${arrow2Height / 2},${-arrow2Width}L${-arrow2Height / 2},${-arrow2Width}Z`;
                    return str;
                })
        }
        hintLeftArrowExtraG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
            .attr("d", function () {
                return `M${bardelta},${laeh1 - r - leftArrowExtraBar1 / 2}L${bardelta},${laeh1 - r + leftArrowExtraBar1 / 2}`
            })
        hintLeftArrowExtraG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${bardelta - leftArrowExtraBar2 / 2},${laeh1 - r - leftArrowExtraBar1 / 2}L${bardelta + leftArrowExtraBar2 / 2},${laeh1 - r - leftArrowExtraBar1 / 2}`
            })
        hintLeftArrowExtraG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${bardelta - leftArrowExtraBar2 / 2},${laeh1 - r + leftArrowExtraBar1 / 2}L${bardelta + leftArrowExtraBar2 / 2},${laeh1 - r + leftArrowExtraBar1 / 2}`
            })

        hintLeftArrowExtraG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
            .attr("d", function () {
                return `M${-r - leftArrowExtraBar1 / 2},${laeh1 + bardelta}L${-r + leftArrowExtraBar1 / 2},${laeh1 + bardelta}`
            })
        hintLeftArrowExtraG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${-r - leftArrowExtraBar1 / 2},${laeh1 + bardelta - leftArrowExtraBar2 / 2}L${-r - leftArrowExtraBar1 / 2},${laeh1 + bardelta + leftArrowExtraBar2 / 2}`;
            })
        hintLeftArrowExtraG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${-r + leftArrowExtraBar1 / 2},${laeh1 + bardelta - leftArrowExtraBar2 / 2}L${-r + leftArrowExtraBar1 / 2},${laeh1 + bardelta + leftArrowExtraBar2 / 2}`;
            })
    }

}
function moveHint(canvasobj, e) {
    let cid = "cid"+_chart_object.indexOf(canvasobj);
    if (!d3.select(`.dragHint.${cid}`).node()) {
        return;
    }
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    let [pxo, pyo] = hintinfo.pos_ori;
    let hintSvg = d3.select(`.dragHint.${cid}`).select("svg").select("g");
    let [txo, tyo] = hintSvg.attr("transformori").split(",").map(d => +d);
    let txn = txo + (px - pxo);
    let tyn = tyo + (py - pyo);
    hintSvg.attr("transform", function () {
        return `translate(${txn}, ${tyn})`;
    });
    if (hintSvg.select("#dragHintRightArrow").node() && hintSvg.select("#dragHintRightArrow").style("display")!="none") {
        let curg = canvasobj.canvas_part;
        let mainrectrect = curg.select(".mainrect").node().getBoundingClientRect();
        let extendbydw = 4;
        let cirw = 1.4;
        let dw = rem2px(cirw);
        let arrowWidth = dw * 1.0;
        let arrowHeight = dw * 0.5;
        let rightArrowWidth = mainrectrect.right + rem2px(extendbydw/2+1) - px - dw * 1.2;
        let rightArrowHeight = dw * 1.63;
        let hintRightArrowG = hintSvg.select("#dragHintRightArrow")
        let p1x = rightArrowWidth/2-arrowWidth;
        let p1y = -rightArrowHeight-arrowHeight
        let p2x = rightArrowWidth;
        let p2y = -rightArrowHeight + arrowHeight * 2.5;
        let rag_rotate = 0;
        if (p1x != p2x) {
            rag_rotate = Math.atan((p2y-p1y)/(p2x-p1x))/Math.PI*180;
        }
        hintRightArrowG.select(".hra-1")
            .attr("d", function () {
                let str = `M${0},${0}Q${p1x},${p1y},${p2x},${p2y}`;
                return str;
            })
        hintRightArrowG
            .select(".hra-2")
            .attr("transform", () => {
                return `translate(${rightArrowWidth}, ${p2y}) rotate(${rag_rotate})`
            })
            .attr("d", function () {
                let str = `M${-arrowWidth},${ - arrowHeight / 2}`;
                str += `L${-arrowWidth},${arrowHeight / 2}`;
                str += `L${0},${0}Z`;
                return str;
            })
        if (extendbydw > 0) {
            let extend = rem2px(extendbydw);
            let rectH = rem2px(6);
            hintRightArrowG
                .select(".hra-3")
                .attr("transform", () => {
                    return `translate(${rightArrowWidth}, ${p2y+rem2px(0.2)})`
                })
                .attr("d", function () {
                    let str = `M${-extend/2},${0}`;
                    str += `L${extend/2},${0}`;
                    str += `L${extend/2},${rectH}`;
                    str += `L${-extend/2},${rectH}Z`;
                    return str;
                })
        }
    }
    let extraRect = d3.select(`.dragHint.${cid}`).selectAll(".extraRect");
    extraRect.
        attr("transform", function() {
            let that = d3.select(this);
            let [txo, tyo] = that.select("rect").attr("transformori").split(",").map(d => +d);
            let ty = +that.select("rect").attr("transformType");
            let nx = txo-(px-pxo);
            let ny = tyo-(py-pyo);
            if (ty == 0) {
                ny = tyo;
            } else if (ty == 1) {
                nx = txo;
            }
            return `translate(${nx}, ${ny})`;
        })
}
function removeHintLater(canvasobj, t=500, proc=null) {
    let cid = "cid"+_chart_object.indexOf(canvasobj);
    let a = null;
    if (!d3.select(`.dragHint.${cid}`).node()) {
        if (proc) {
            proc();
        }
        return;
    }
    if (d3.select(`.dragHint.${cid}`).style("display") != "none") {
        a = setTimeout(
            () => {
                d3.select(`.dragHint.${cid}`).style("display", "none")
                if (proc) {
                    proc()
                }
            },
            t
        )
    } else {
        if (proc) { proc() }
    }
    return a;
}
function removeHint(canvasobj, proc=null) {
    let cid = "cid"+_chart_object.indexOf(canvasobj);
    if (!d3.select(`.dragHint.${cid}`).node()) {
        if (proc) {
            proc();
        }
        return;
    }
    d3.select(`.dragHint.${cid}`).style("display", "none");
    if (proc) {
        proc()
    }
}

function addHintForGY(canvasobj, e, f) {
    // should_y
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    hintinfo.pos_ori = [px, py];
    let hintSvg = createHintDiv(canvasobj, px, py);
    let cirw = 1.4;
    let dw = rem2px(cirw);
    let color1 = "#434343";
    let color2 = "#7F7F7F";

    let hintCircleG = createHintCirlce(hintSvg, cirw, color1);
    let hintUpdownArrowG = createHintUpdownArrow(hintSvg, dw, color1);

    let arrow2Width = dw * 0.6;
    let arrow2Height = dw * 0.3;
    let shouldG = d3.select(".should_y");
    let shouldBox = shouldG.node().getBoundingClientRect();

    let x0d = dw * 3;
    let xd = dw * 1;
    if (f == "should") {
        let height = 3.6 * dw;
        let hintForceG = hintSvg
            .append("g")
            .attr("transform", () => {
                return `translate(${x0d}, ${0})`
            })
            .attr("id", "dragHintForceShould")
            .attr("class", "dragHints");
        for (let i = 0; i < 3; ++i) {
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
                .attr("d", function () {
                    return `M${xd*i},${-height/2}L${xd*i},${height/2}`
                })
            hintForceG
                .append("path")
                .style("fill", color2)
                .attr("d", function () {
                    let str = `M${xd*i},${0}L${xd*i-arrow2Height/2},${-arrow2Width}L${xd*i+arrow2Height/2},${-arrow2Width}Z`;
                    return str;
                })
            hintForceG
                .append("path")
                .style("fill", color2)
                .attr("d", function () {
                    let str = `M${xd*i},${0}L${xd*i-arrow2Height/2},${arrow2Width}L${xd*i+arrow2Height/2},${arrow2Width}Z`;
                    return str;
                })
        }
    } else if (f == "larger") {
        let height = 0.6 * dw;
        let barW1 = xd * 2 + arrow2Height;
        let barW2 = arrow2Height;
        let hintForceG = hintSvg
            .append("g")
            .attr("transform", () => {
                return `translate(${x0d}, ${0})`
            })
            .attr("id", "dragHintForceLarger")
            .attr("class", "dragHints");
        hintForceG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${-barW2/2},${0}L${-barW2/2+barW1},${0}`
            })
        for (let i = 0; i < 3; ++i) {
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
                .attr("d", function () {
                    return `M${xd*i},${0}L${xd*i},${height}`
                })
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
                .attr("d", function () {
                    return `M${xd*i-barW2/2},${height}L${xd*i+barW2/2},${height}`
                })
        }
    } else if (f == "smaller") {
        let height = 0.6 * dw;
        let barW1 = xd * 2 + arrow2Height;
        let barW2 = arrow2Height;
        let hintForceG = hintSvg
            .append("g")
            .attr("transform", () => {
                return `translate(${x0d}, ${0})`
            })
            .attr("id", "dragHintForceSmaller")
            .attr("class", "dragHints");
        hintForceG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${-barW2/2},${0}L${-barW2/2+barW1},${0}`
            })
        for (let i = 0; i < 3; ++i) {
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
                .attr("d", function () {
                    return `M${xd*i},${rem2px(0.1)}L${xd*i},${-height}`
                })
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
                .attr("d", function () {
                    return `M${xd*i-barW2/2},${-height}L${xd*i+barW2/2},${-height}`
                })
        }
    } else {

    }
}

function addHintForGX(canvasobj, e, f) {
    // should_x
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    hintinfo.pos_ori = [px, py];
    let hintSvg = createHintDiv(canvasobj, px, py);
    let cirw = 1.4;
    let dw = rem2px(cirw);
    let color1 = "#434343";
    let color2 = "#7F7F7F";

    let hintCircleG = createHintCirlce(hintSvg, cirw, color1);
    let hintLeftrightArrowG = createHintLeftrightArrow(hintSvg, dw, color1);

    let arrow2Width = dw * 0.6;
    let arrow2Height = dw * 0.3;
    let shouldG = d3.select(".should_y");
    let shouldBox = shouldG.node().getBoundingClientRect();

    let x0d = dw * 3;
    let xd = dw * 1;
    if (f == "should") {
        // modified from y version
        let height = 3.6 * dw;
        let hintForceG = hintSvg
            .append("g")
            .attr("transform", () => {
                return `translate(${0}, ${x0d})`
            })
            .attr("id", "dragHintForceShould")
            .attr("class", "dragHints");
        for (let i = 0; i < 3; ++i) {
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
                .attr("d", function () {
                    return `M${-height/2},${xd*i}L${height/2},${xd*i}`
                })
            hintForceG
                .append("path")
                .style("fill", color2)
                .attr("d", function () {
                    let str = `M${0},${xd*i}L${-arrow2Width},${xd*i-arrow2Height/2}L${-arrow2Width},${xd*i+arrow2Height/2}Z`;
                    return str;
                })
            hintForceG
                .append("path")
                .style("fill", color2)
                .attr("d", function () {
                    let str = `M${0},${xd*i}L${arrow2Width},${xd*i-arrow2Height/2}L${arrow2Width},${xd*i+arrow2Height/2}Z`;
                    return str;
                })
        }
    } else if (f == "larger") {
        let height = 0.6 * dw;
        let barW1 = xd * 2 + arrow2Height;
        let barW2 = arrow2Height;
        let hintForceG = hintSvg
            .append("g")
            .attr("transform", () => {
                return `rotate(90) translate(${x0d}, ${0})`
                // rotate from smaller_x
            })
            .attr("id", "dragHintForceLarger")
            .attr("class", "dragHints");
        hintForceG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${-barW2/2},${0}L${-barW2/2+barW1},${0}`
            })
        for (let i = 0; i < 3; ++i) {
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
                .attr("d", function () {
                    return `M${xd*i},${-rem2px(0.1)}L${xd*i},${-height}`
                })
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
                .attr("d", function () {
                    return `M${xd*i-barW2/2},${-height}L${xd*i+barW2/2},${-height}`
                })
        }
    } else if (f == "smaller") {
        let height = 0.6 * dw;
        let barW1 = xd * 2 + arrow2Height;
        let barW2 = arrow2Height;
        let hintForceG = hintSvg
            .append("g")
            .attr("transform", () => {
                return `rotate(90) translate(${x0d}, ${0})`
                // rotate from larger_x
            })
            .attr("id", "dragHintForceSmaller")
            .attr("class", "dragHints");
        hintForceG
            .append("path")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
            .attr("d", function () {
                return `M${-barW2/2},${0}L${-barW2/2+barW1},${0}`
            })
        for (let i = 0; i < 3; ++i) {
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
                .attr("d", function () {
                    return `M${xd*i},${0}L${xd*i},${height}`
                })
            hintForceG
                .append("path")
                .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none")
                .attr("d", function () {
                    return `M${xd*i-barW2/2},${height}L${xd*i+barW2/2},${height}`
                })
        }
    }
}

function addHintForForce(canvasobj, e, forcetype, directiontype) {
    console.log("hint force", canvasobj, e, forcetype, directiontype)
    if (directiontype == "y") {
        addHintForGY(canvasobj, e, forcetype);
    }
    collision_x_button
    if (directiontype == "x") {
        addHintForGX(canvasobj, e, forcetype);
    }
}
function addHintForAxis(canvasobj, e) {
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    let curg = canvasobj.canvas_part;
    hintinfo.pos_ori = [px, py];
    let mainrectrect = curg.select(".mainrect").node().getBoundingClientRect();
    let cirw = 1.4;
    let dw = rem2px(cirw);
    let leftArrowWidth = dw * 25.68;
    let leftArrowHeight = dw * 8.17;
    leftArrowHeight = py - mainrectrect.top - rem2px(6);
    leftArrowWidth = px - (mainrectrect.left + mainrectrect.right) / 2;
    let p1x = -leftArrowWidth * 0.4;
    let p1y = -leftArrowHeight * 1.0
    let arrowWidth = dw * 1.0;
    let arrowHeight = dw * 0.5;
    let arcstr = "";
    let arrowstr = "";

    arcstr = `M${0},${0}S${p1x},${p1y},${-leftArrowWidth+arrowWidth},${-leftArrowHeight}`
    arrowstr = `M${-leftArrowWidth + arrowWidth},${-leftArrowHeight - arrowHeight/2}`;
    arrowstr += `L${-leftArrowWidth + arrowWidth},${-leftArrowHeight + arrowHeight/2}`;
    arrowstr += `L${-leftArrowWidth},${-leftArrowHeight}Z`;
    let cx = -leftArrowWidth-rem2px(1), cy = -leftArrowHeight;
    let extraRect = null;
    let extraRectIdx = -1;
    for (let ele of e.path) {
        if ((ele.tagName == "g") && (ele.id == "smaller_y_button")) {
            leftArrowHeight = mainrectrect.bottom - py - rem2px(6);
            p1x = -leftArrowWidth * 0.4;
            p1y = leftArrowHeight * 1.0
            arcstr = `M${0},${0}S${p1x},${p1y},${-leftArrowWidth+arrowWidth},${leftArrowHeight}`;
            arrowstr = `M${-leftArrowWidth + arrowWidth},${leftArrowHeight - arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth + arrowWidth},${leftArrowHeight + arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth},${leftArrowHeight}Z`;
            cx = -leftArrowWidth - rem2px(1);
            cy = leftArrowHeight;
            extraRectIdx = 0;
            break;
        } else if ((ele.tagName == "g") && (ele.id == "larger_y_button")) {
            leftArrowHeight = py - mainrectrect.top - rem2px(6);
            p1x = -leftArrowWidth * 0.4;
            p1y = leftArrowHeight * 1.0
            arcstr = `M${0},${0}S${p1x},${p1y},${-leftArrowWidth+arrowWidth},${leftArrowHeight}`;
            arrowstr = `M${-leftArrowWidth + arrowWidth},${leftArrowHeight - arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth + arrowWidth},${leftArrowHeight + arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth},${leftArrowHeight}Z`;
            cx = -leftArrowWidth - rem2px(1);
            cy = leftArrowHeight;
            extraRectIdx = 0;
            break;
        } else if ((ele.tagName == "g") && (ele.id == "should_y_button")) {
            leftArrowHeight = (mainrectrect.top + mainrectrect.bottom) / 2 - py + rem2px(3);
            p1x = -leftArrowWidth * 0.4;
            p1y = leftArrowHeight * 1.0
            arcstr = `M${0},${0}S${p1x},${p1y},${-leftArrowWidth+arrowWidth},${leftArrowHeight}`;
            arrowstr = `M${-leftArrowWidth + arrowWidth},${leftArrowHeight - arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth + arrowWidth},${leftArrowHeight + arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth},${leftArrowHeight}Z`;
            cx = -leftArrowWidth - rem2px(1);
            cy = leftArrowHeight;
            extraRectIdx = 0;
            break;
        } else if ((ele.tagName == "g") && (ele.id == "smaller_x_button")) {
            leftArrowHeight = (mainrectrect.top + mainrectrect.bottom) / 2 - py + rem2px(3);
            leftArrowWidth = px - (mainrectrect.left + mainrectrect.width * 3 / 4);
            p1x = -leftArrowWidth * 0.4;
            p1y = leftArrowHeight * 1.0
            arcstr = `M${0},${0}S${p1x},${p1y},${-leftArrowWidth+arrowWidth},${leftArrowHeight}`;
            arrowstr = `M${-leftArrowWidth + arrowWidth},${leftArrowHeight - arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth + arrowWidth},${leftArrowHeight + arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth},${leftArrowHeight}Z`;
            cx = -leftArrowWidth - rem2px(1);
            cy = leftArrowHeight;
            extraRectIdx = 1;
            break;
        } else if ((ele.tagName == "g") && (ele.id == "larger_x_button")) {
            leftArrowHeight = (mainrectrect.top + mainrectrect.bottom) / 2 - py + rem2px(3);
            leftArrowWidth = px - (mainrectrect.left + mainrectrect.width * 1 / 4);
            p1x = -leftArrowWidth * 0.4;
            p1y = leftArrowHeight * 1.0
            arcstr = `M${0},${0}S${p1x},${p1y},${-leftArrowWidth+arrowWidth},${leftArrowHeight}`;
            arrowstr = `M${-leftArrowWidth + arrowWidth},${leftArrowHeight - arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth + arrowWidth},${leftArrowHeight + arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth},${leftArrowHeight}Z`;
            cx = -leftArrowWidth - rem2px(1);
            cy = leftArrowHeight;
            extraRectIdx = 1;
            break;
        } else if ((ele.tagName == "g") && (ele.id == "should_x_button")) {
            leftArrowHeight = (mainrectrect.top + mainrectrect.bottom) / 2 - py + rem2px(3);
            leftArrowWidth = px - (mainrectrect.left + mainrectrect.width * 2 / 4);
            p1x = -leftArrowWidth * 0.4;
            p1y = leftArrowHeight * 1.0
            arcstr = `M${0},${0}S${p1x},${p1y},${-leftArrowWidth+arrowWidth},${leftArrowHeight}`;
            arrowstr = `M${-leftArrowWidth + arrowWidth},${leftArrowHeight - arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth + arrowWidth},${leftArrowHeight + arrowHeight/2}`;
            arrowstr += `L${-leftArrowWidth},${leftArrowHeight}Z`;
            cx = -leftArrowWidth - rem2px(1);
            cy = leftArrowHeight;
            extraRectIdx = 1;
            break;
        } else if ((ele.tagName == "g") && (ele.id == "collision_x_button")) {
            // stay
            break;
        }
    }
    let extraRectS = [
        {x: mainrectrect.x -px + rem2px(4), w: mainrectrect.width - rem2px(8), y: cy-dw/4, h: dw/2},
        {x: cx - dw/4, w: dw/2, y: mainrectrect.top - py + rem2px(4), h: mainrectrect.height - rem2px(8)}
    ];
    extraRect = extraRectS[extraRectIdx];
    // hintinfo.pos_ori = [px, py];
    let hintSvg = createHintDiv(canvasobj, px, py);
    let color1 = "#434343";
    let color2 = "#7F7F7F";

    let hintCircleG = createHintCirlce(hintSvg, cirw, color1);
    let hintLeftArrowG = hintSvg
        .append("g")
        .attr("transform", () => {
            return `translate(${0}, ${0})`
        })
        .attr("id", "dragHintLeftArrow")
        .attr("class", "dragHints");
    hintLeftArrowG
        .append("path")
        .style("stroke", color1).style("stroke-width", rem2px(0.1)).style("fill", "none")
        .attr("d", function () {
            return arcstr;
        })
    hintLeftArrowG
        .append("path")
        .style("fill", color1)
        .attr("d", function () {
            return arrowstr;
        })
    if (extraRectIdx == -1) {
        let hintCircleG2 = createHintCirlce(hintSvg, cirw, color1);
        hintCircleG2
            .attr("transform", () => {
                return `translate(${cx}, ${cy})`
            })
    }
    if (extraRectIdx != -1) {
        let hintRect = hintSvg
            .append("g")
            .attr("class", "dragHints extraRect");
        hintRect.append("rect")
            .style("stroke", color2).style("stroke-width", rem2px(0.1)).style("fill", "none").style("stroke-dasharray", "0.2rem 0.2rem")
            .attr("x", extraRect.x)
            .attr("y", extraRect.y)
            .attr("width", extraRect.w)
            .attr("height", extraRect.h)
            .attr("transformori", "0,0")
            .attr("transformType", extraRectIdx)
    }
}


function addHintForAxisClick(canvasobj, e) {
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    // hintinfo.pos_ori = [px, py];
    let hintSvg = createHintDiv(canvasobj, px, py);
    let cirw = 1.4;
    let dw = rem2px(cirw);
    let color1 = "#434343";
    let color2 = "#7F7F7F";

    let hintCircleG = createHintCirlce(hintSvg, cirw, color1);

    let arrowWidth = dw * 1.0;
    let arrowHeight = dw * 0.5;

    let updownArrowHeightbydw = 13;
    let hintUpdownArrowG = createHintUpdownArrow(hintSvg, dw, color1, 0.44, updownArrowHeightbydw);
    hintUpdownArrowG
        .attr("transform", () => {
            return `translate(${0}, ${updownArrowHeightbydw * dw/2 + rem2px(1)})`
        })
}
function addHintForAxisDone(canvasobj, e, deltax) {
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    let hintSvg = createHintDiv(canvasobj, px, py);
    let cirw = 1.4;
    let dw = rem2px(cirw);
    let color1 = "#434343";
    let color2 = "#7F7F7F";

    let hintCircleG = createHintCirlce(hintSvg, cirw, color1);
    hintCircleG
        .attr("transform", () => {
            return `translate(${deltax}, ${0})`
        })
}
function addHintForXY(canvasobj, e, t) {
    let px = 0, py = 0;
    if (e.sourceEvent) {
        px = e.sourceEvent.pageX;
        py = e.sourceEvent.pageY;
    } else {
        px = e.pageX;
        py = e.pageY;
    }
    let curg = canvasobj.canvas_part;
    let mainrectrect = curg.select(".mainrect").node().getBoundingClientRect();
    hintinfo.pos_ori = [px, py];
    let extendbydw = 6;
    let hintSvg = createHintDiv(canvasobj, px, py, extendbydw+2);
    let cirw = 1.4;
    let dw = rem2px(cirw);

    let color1 = "#434343";
    let color2 = "#7F7F7F";

    // let hintCircleG = createHintCirlce(hintSvg, cirw, color1);
    if (t=="x") {
        let hintLeftrightArrowG = createHintLeftrightArrow(hintSvg, dw, color1, 8);
    } else {
        let hintUpdownArrowG = createHintUpdownArrow(hintSvg, dw, color1);
    }
}
