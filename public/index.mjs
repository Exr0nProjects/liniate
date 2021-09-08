"use strict";

const basepath = document.getElementById('base-path');

function get_points(dom_path, segment_approx_length) {
    const tot_len = dom_path.getTotalLength();
    let points = [];
    for (let consumed=0; consumed < tot_len; consumed += segment_approx_length) {
        points.push(dom_path.getPointAtLength(consumed));
    }
    points.push(dom_path.getPointAtLength(tot_len));
    return points;
}

function convert_points_to_segments(points) {
    var segments = [];
    for (let i=1; i<points.length; ++i) {
        segments.push([points[i-1], points[i]]);
    }
    return segments;
}

function offset_segments(segments, dist) {
    function offset_segment(a, b, dist) {
        const len = Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
        const dx = (a.y - b.y)/len * dist;
        const dy =  (b.x - a.x)/len * dist;
        return [{ x: a.x-dx, y: a.y-dy }, { x: b.x-dx, y: b.y-dy }];
    }
    return segments.map(seg => offset_segment(...seg, dist));
}

function convert_segments_to_points(segments) {
    // TODO
}

function update_basepath_debug(path_points) {
    const path_debug = document.getElementById("base-path-segment-debug");
    const path_debug_string = `M ${path_points[0].x} ${path_points[0].y}` + path_points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    path_debug.setAttributeNS(null, 'd', path_debug_string);
}

function update_svg(segment_approx_length) {
    const path_points = get_points(basepath, segment_approx_length);
    //update_basepath_debug(path_points);
    const segs = convert_points_to_segments(path_points);
    const offset_segs = offset_segments(segs, segment_approx_length);
    //console.log(path_points, segs);
    console.log(offset_segs, offset_segs.flat());
    update_basepath_debug(offset_segs.flat());
}

(() => {
    const input_seg_len = document.getElementById('input-segment-approx-length');
    input_seg_len.setAttributeNS(null, 'max', basepath.getTotalLength());
    input_seg_len.addEventListener("mousemove", e => {
        update_svg(parseInt(e.target.value));
    });
})();

