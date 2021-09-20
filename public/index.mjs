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

function find_intersection(a1, a2, b1, b2) {
    function check_intersection(A,B,C,D) {
        // https://stackoverflow.com/a/9997374/10372825
        function ccw(A,B,C) {
            return (C.y-A.y) * (B.x-A.x) > (B.y-A.y) * (C.x-A.x);
        }
        return ccw(A,C,D) != ccw(B,C,D) && ccw(A,B,C) != ccw(A,B,D);
    }
    const a_slope = (a2.y-a1.y)/(a2.x-a1.x);
    const b_slope = (b2.y-b1.y)/(b2.x-b1.x);
    if (a_slope === b_slope || !check_intersection(a1, a2, b1, b2)) return null;
    const intersect_x = (a_slope*a1.x - b_slope*b1.x + b1.y - a1.y)/(a_slope - b_slope)
    const intersect_y = a_slope * (intersect_x - a1.x) + a1.y;
    return { x: intersect_x, y: intersect_y };
}

function convert_segments_to_points(segments) {
    // TODO
}

function update_basepath_debug(path_points) {
    const path_debug = document.getElementById("base-path-segment-debug");
    const path_debug_string = `M ${path_points[0].x} ${path_points[0].y}` + path_points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    path_debug.setAttributeNS(null, 'd', path_debug_string);
}

function update_svg(segment_approx_length, segment_spacing) {
    const path_points = get_points(basepath, segment_approx_length);
    //update_basepath_debug(path_points);
    const segs = convert_points_to_segments(path_points);
    let offset_segs = offset_segments(segs, segment_spacing);
    for (let i=1; i<offset_segs.length; ++i) {
        let lhs = offset_segs[i-1];
        let final_idx = null;
        let final_intersect = null;
        for (let j=i; j<offset_segs.length; ++j) {      // TODO: how to make intersections not n^2 
            let rhs = offset_segs[j];
            let this_intersect = find_intersection(...lhs, ...rhs);
            if (this_intersect !== null) {
                final_intersect = this_intersect;
                final_idx = j;
            }
        }
        if (final_intersect !== null) {
            offset_segs[i-1][1]         = final_intersect;
            offset_segs[final_idx][0]   = final_intersect;
            offset_segs = offset_segs.slice(0, i) + offset_segs.slice(final_idx);
        }
    }
    update_basepath_debug(offset_segs.flat());
}

(() => {
    const input_seg_len = document.getElementById('input-segment-approx-length');
    const input_spacing = document.getElementById('input-spacing');

    input_seg_len.setAttributeNS(null, 'max', basepath.getTotalLength());

    function update_graphic() {
        update_svg(parseInt(input_seg_len.value), parseInt(input_spacing.value));
    }
    input_seg_len.addEventListener("mousemove", update_graphic);
    input_spacing.addEventListener("mousemove", update_graphic);
})();

