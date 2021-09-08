"use strict";

const basepath = document.getElementById('base-path');

function get_segments(dom_path, segment_approx_length) {
    const tot_len = dom_path.getTotalLength();
    let points = [];
    for (let consumed=0; consumed < tot_len; consumed += segment_approx_length) {
        points.push(dom_path.getPointAtLength(consumed));
    }
    points.push(dom_path.getPointAtLength(tot_len));
    return points;
}

function update_basepath_debug(segment_approx_length) {
    const path_points = get_segments(basepath, segment_approx_length);
    const path_debug = document.getElementById("base-path-segment-debug");
    const path_debug_string = `M ${path_points[0].x} ${path_points[0].y}` + path_points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    path_debug.setAttributeNS(null, 'd', path_debug_string);
}

(() => {
    const input_seg_len = document.getElementById('input-segment-approx-length');
    input_seg_len.setAttributeNS(null, 'max', basepath.getTotalLength());
    input_seg_len.addEventListener("mousemove", e => {
        update_basepath_debug(parseInt(e.target.value));
    });
})();

