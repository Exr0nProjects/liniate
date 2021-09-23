"use strict";

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

function create_path(path_points) {
    if (path_points.length <= 0) return;
    const new_path = document.createElementNS('http://www.w3.org/2000/svg',"path");
    const path_string = `M ${path_points[0].x} ${path_points[0].y}` + path_points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    new_path.setAttributeNS(null, 'd', path_string);
    return new_path;
}

function resolve_segments(offset_segs) {
    let resolved_segs = [];
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
            resolved_segs.push([offset_segs[i-1][0], final_intersect]);
            offset_segs[final_idx][0] = final_intersect;
            i = final_idx;
        } else {
            resolved_segs.push(offset_segs[i-1]);
        }
    }
    return resolved_segs;
}

function create_parallel_path(basepath, segment_approx_length, segment_spacing) {
    const resolved_segs = resolve_segments(offset_segments(
        convert_points_to_segments(
            get_points(basepath, segment_approx_length)
        ), segment_spacing)).flat();
    return create_path(resolved_segs);
}

(() => {
    const svg           = document.getElementById('display-graphic');
    const svg_children  = document.getElementById('generated-path-wrapper');
    const input_seg_len = document.getElementById('input-segment-approx-length');
    const input_spacing = document.getElementById('input-spacing');
    const basepath      = document.getElementById('base-path');

    const svg_diagonal  = Math.sqrt(Math.pow(svg.viewBox.baseVal.width, 2) + Math.pow(svg.viewBox.baseVal.height, 2));

    input_seg_len.setAttributeNS(null, 'max', basepath.getTotalLength());

    function update_graphic() {
        while (svg_children.firstChild) svg_children.removeChild(svg_children.lastChild);
        const spacing = parseInt(input_spacing.value)/10.0;
        const doc_frag = document.createDocumentFragment();
        for (let cur=basepath, shift=spacing; shift < svg_diagonal; shift += spacing) {
            cur = create_parallel_path(cur, parseInt(input_seg_len.value), spacing);
            if (!cur) break;
            doc_frag.appendChild(cur);
        }
        
        for (let cur=basepath, shift=spacing; shift < svg_diagonal; shift += spacing) {
            cur = create_parallel_path(cur, parseInt(input_seg_len.value), -spacing);
            if (!cur) break;
            doc_frag.appendChild(cur);
        }
        svg_children.appendChild(doc_frag);
        // https://stackoverflow.com/questions/7676006/obtaining-an-original-svg-viewbox-via-javascript
        // https://stackoverflow.com/questions/10546135/appending-path-child-within-svg-using-javascript/10546700
    }
    input_seg_len.addEventListener("mousemove", update_graphic);
    input_spacing.addEventListener("mousemove", update_graphic);
})();

