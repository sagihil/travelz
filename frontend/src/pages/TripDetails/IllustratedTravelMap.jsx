import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import './IllustratedTravelMap.css';

// ── Palette & icons ────────────────────────────────────────────────────────────
const DAY_COLORS = [
  '#2563eb','#16a34a','#d97706','#7c3aed',
  '#dc2626','#0891b2','#be185d','#ca8a04',
];
const dayColor  = (n) => DAY_COLORS[(Number(n) - 1) % DAY_COLORS.length];

const CAT_ICONS = {
  Landmark:'🗼', History:'🏛️', Architecture:'🏰', Nature:'🌿',
  Museum:'🎨', Beach:'🏖️', Religious:'🕌', Entertainment:'🎡',
  Park:'🌳', Adventure:'🧗', Shopping:'🛍️', Default:'📍',
};
const catIcon = (c) => CAT_ICONS[c] ?? CAT_ICONS.Default;

const MIN_SCALE       = 0.5;
const MAX_SCALE       = 6;
const CLUSTER_BASE_PX = 52;   // pixels between pin centres → triggers cluster
const SPIDER_PX       = 52;   // pixel radius for spiderfy spread

// Returns the CSS --ps variable value for a given map scale.
// Visual pin diameter = 34px * s * pinSF(s) = 34 / s^0.3
//   s=0.5 → ~40px  (bigger at overview zoom)
//   s=1   → 34px
//   s=2   → ~27px
//   s=3   → ~23px
//   s=5   → ~19px
function pinSF(s) {
  return 1 / Math.pow(s, 1.3);
}

// ── Geo lookup ────────────────────────────────────────────────────────────────
const CITY_COORDS = {
  'new york':{ lon:-74.0,lat:40.7 }, 'los angeles':{ lon:-118.2,lat:34.1 },
  'chicago':{ lon:-87.6,lat:41.9 }, 'miami':{ lon:-80.2,lat:25.8 },
  'toronto':{ lon:-79.4,lat:43.7 }, 'vancouver':{ lon:-123.1,lat:49.3 },
  'mexico city':{ lon:-99.1,lat:19.4 }, 'cancun':{ lon:-86.9,lat:21.2 },
  'rio de janeiro':{ lon:-43.2,lat:-22.9 }, 'sao paulo':{ lon:-46.6,lat:-23.5 },
  'buenos aires':{ lon:-58.4,lat:-34.6 }, 'lima':{ lon:-77.0,lat:-12.0 },
  'bogota':{ lon:-74.1,lat:4.7 },
  'london':{ lon:-0.1,lat:51.5 }, 'paris':{ lon:2.3,lat:48.9 },
  'berlin':{ lon:13.4,lat:52.5 }, 'amsterdam':{ lon:4.9,lat:52.4 },
  'rome':{ lon:12.5,lat:41.9 }, 'milan':{ lon:9.2,lat:45.5 },
  'barcelona':{ lon:2.2,lat:41.4 }, 'madrid':{ lon:-3.7,lat:40.4 },
  'lisbon':{ lon:-9.1,lat:38.7 }, 'athens':{ lon:23.7,lat:37.9 },
  'vienna':{ lon:16.4,lat:48.2 }, 'prague':{ lon:14.4,lat:50.1 },
  'warsaw':{ lon:21.0,lat:52.2 }, 'budapest':{ lon:19.0,lat:47.5 },
  'stockholm':{ lon:18.1,lat:59.3 }, 'oslo':{ lon:10.8,lat:59.9 },
  'copenhagen':{ lon:12.6,lat:55.7 }, 'zurich':{ lon:8.5,lat:47.4 },
  'brussels':{ lon:4.4,lat:50.9 }, 'dublin':{ lon:-6.3,lat:53.3 },
  'edinburgh':{ lon:-3.2,lat:55.9 }, 'santorini':{ lon:25.4,lat:36.4 },
  'mykonos':{ lon:25.3,lat:37.4 }, 'venice':{ lon:12.3,lat:45.4 },
  'florence':{ lon:11.3,lat:43.8 }, 'naples':{ lon:14.3,lat:40.9 },
  'istanbul':{ lon:29.0,lat:41.0 }, 'ankara':{ lon:32.9,lat:39.9 },
  'jerusalem':{ lon:35.2,lat:31.8 }, 'tel aviv':{ lon:34.8,lat:32.1 },
  'dubai':{ lon:55.3,lat:25.2 }, 'abu dhabi':{ lon:54.4,lat:24.5 },
  'riyadh':{ lon:46.7,lat:24.7 }, 'amman':{ lon:35.9,lat:31.9 },
  'petra':{ lon:35.4,lat:30.3 }, 'cairo':{ lon:31.2,lat:30.1 },
  'beirut':{ lon:35.5,lat:33.9 }, 'muscat':{ lon:58.6,lat:23.6 },
  'doha':{ lon:51.5,lat:25.3 }, 'kuwait city':{ lon:47.9,lat:29.4 },
  'tehran':{ lon:51.4,lat:35.7 }, 'baghdad':{ lon:44.4,lat:33.3 },
  'marrakech':{ lon:-8.0,lat:31.6 }, 'casablanca':{ lon:-7.6,lat:33.6 },
  'tunis':{ lon:10.2,lat:36.8 }, 'nairobi':{ lon:36.8,lat:-1.3 },
  'cape town':{ lon:18.4,lat:-33.9 }, 'johannesburg':{ lon:28.0,lat:-26.2 },
  'lagos':{ lon:3.4,lat:6.5 }, 'accra':{ lon:-0.2,lat:5.6 },
  'addis ababa':{ lon:38.7,lat:9.0 },
  'mumbai':{ lon:72.9,lat:19.1 }, 'delhi':{ lon:77.2,lat:28.6 },
  'bangalore':{ lon:77.6,lat:12.9 }, 'kolkata':{ lon:88.4,lat:22.6 },
  'karachi':{ lon:67.0,lat:24.9 }, 'kathmandu':{ lon:85.3,lat:27.7 },
  'beijing':{ lon:116.4,lat:39.9 }, 'shanghai':{ lon:121.5,lat:31.2 },
  'hong kong':{ lon:114.2,lat:22.3 }, 'tokyo':{ lon:139.7,lat:35.7 },
  'osaka':{ lon:135.5,lat:34.7 }, 'seoul':{ lon:127.0,lat:37.6 },
  'bangkok':{ lon:100.5,lat:13.8 }, 'singapore':{ lon:103.8,lat:1.4 },
  'kuala lumpur':{ lon:101.7,lat:3.1 }, 'jakarta':{ lon:106.8,lat:-6.2 },
  'bali':{ lon:115.2,lat:-8.7 }, 'hanoi':{ lon:105.8,lat:21.0 },
  'ho chi minh city':{ lon:106.7,lat:10.8 }, 'manila':{ lon:120.9,lat:14.6 },
  'taipei':{ lon:121.6,lat:25.0 },
  'sydney':{ lon:151.2,lat:-33.9 }, 'melbourne':{ lon:145.0,lat:-37.8 },
  'brisbane':{ lon:153.0,lat:-27.5 }, 'perth':{ lon:115.9,lat:-31.9 },
  'auckland':{ lon:174.8,lat:-36.9 },
};

const COUNTRY_COORDS = {
  'israel':{ lon:35.0,lat:31.5 }, 'jordan':{ lon:36.5,lat:31.0 },
  'france':{ lon:2.3,lat:46.2 }, 'germany':{ lon:10.5,lat:51.2 },
  'italy':{ lon:12.6,lat:42.5 }, 'spain':{ lon:-3.7,lat:40.4 },
  'greece':{ lon:22.0,lat:39.1 }, 'turkey':{ lon:35.2,lat:39.0 },
  'egypt':{ lon:30.8,lat:26.8 }, 'usa':{ lon:-98.6,lat:39.5 },
  'united states':{ lon:-98.6,lat:39.5 }, 'uk':{ lon:-3.4,lat:55.4 },
  'united kingdom':{ lon:-3.4,lat:55.4 }, 'england':{ lon:-1.5,lat:52.4 },
  'japan':{ lon:138.3,lat:36.2 }, 'china':{ lon:104.2,lat:35.9 },
  'india':{ lon:78.9,lat:20.6 }, 'australia':{ lon:133.8,lat:-25.3 },
  'brazil':{ lon:-51.9,lat:-14.2 }, 'canada':{ lon:-96.8,lat:56.1 },
  'thailand':{ lon:100.9,lat:15.9 }, 'singapore':{ lon:103.8,lat:1.4 },
  'uae':{ lon:53.8,lat:23.4 }, 'united arab emirates':{ lon:53.8,lat:23.4 },
  'south africa':{ lon:25.1,lat:-29.0 }, 'kenya':{ lon:37.9,lat:0.0 },
  'morocco':{ lon:-7.1,lat:31.8 }, 'portugal':{ lon:-8.2,lat:39.4 },
  'netherlands':{ lon:5.3,lat:52.1 }, 'belgium':{ lon:4.5,lat:50.5 },
  'switzerland':{ lon:8.2,lat:46.8 }, 'austria':{ lon:14.6,lat:47.5 },
  'sweden':{ lon:18.1,lat:59.3 }, 'norway':{ lon:10.8,lat:59.9 },
  'denmark':{ lon:10.0,lat:56.3 }, 'iran':{ lon:53.7,lat:32.4 },
  'iraq':{ lon:43.7,lat:33.2 }, 'saudi arabia':{ lon:45.1,lat:23.9 },
  'indonesia':{ lon:113.9,lat:-0.8 }, 'malaysia':{ lon:109.7,lat:3.1 },
  'philippines':{ lon:122.0,lat:13.0 }, 'vietnam':{ lon:108.3,lat:14.1 },
  'south korea':{ lon:127.8,lat:36.6 }, 'taiwan':{ lon:120.9,lat:23.7 },
  'new zealand':{ lon:172.5,lat:-41.3 }, 'mexico':{ lon:-102.6,lat:23.6 },
  'argentina':{ lon:-63.6,lat:-38.4 }, 'chile':{ lon:-71.5,lat:-35.7 },
  'peru':{ lon:-75.0,lat:-9.2 }, 'colombia':{ lon:-74.3,lat:4.6 },
  'nigeria':{ lon:8.7,lat:9.1 }, 'ethiopia':{ lon:40.5,lat:9.1 },
  'tanzania':{ lon:34.9,lat:-6.4 }, 'lebanon':{ lon:35.9,lat:33.9 },
  'syria':{ lon:38.8,lat:35.0 }, 'qatar':{ lon:51.2,lat:25.3 },
  'bahrain':{ lon:50.6,lat:26.1 }, 'kuwait':{ lon:47.5,lat:29.3 },
  'oman':{ lon:57.0,lat:21.0 }, 'pakistan':{ lon:69.3,lat:30.4 },
  'nepal':{ lon:84.1,lat:28.4 }, 'myanmar':{ lon:95.9,lat:19.2 },
  'cambodia':{ lon:104.9,lat:12.6 }, 'laos':{ lon:102.5,lat:18.2 },
};

const CONTINENTS = [
  { id:'na',  d:'M 88,58 L 162,48 L 198,65 L 248,95 L 270,155 L 280,210 L 262,272 L 238,318 L 198,348 L 162,358 L 128,332 L 95,272 L 68,202 L 68,138 Z' },
  { id:'gl',  d:'M 358,38 L 422,32 L 438,55 L 422,82 L 392,92 L 362,72 Z' },
  { id:'sa',  d:'M 192,372 L 248,356 L 282,382 L 292,445 L 272,492 L 232,500 L 192,488 L 168,452 L 162,402 Z' },
  { id:'uk',  d:'M 452,185 L 472,168 L 488,178 L 490,202 L 472,212 L 455,208 Z' },
  { id:'sc',  d:'M 482,168 L 508,140 L 532,125 L 540,148 L 528,172 L 508,190 L 488,190 Z' },
  { id:'eu',  d:'M 448,248 L 495,232 L 538,235 L 558,258 L 555,290 L 532,308 L 498,312 L 462,300 L 445,275 Z' },
  { id:'af',  d:'M 455,295 L 538,280 L 578,308 L 592,372 L 585,442 L 555,492 L 510,500 L 470,488 L 442,455 L 430,395 L 430,335 Z' },
  { id:'ar',  d:'M 558,298 L 618,282 L 668,302 L 672,342 L 648,370 L 612,375 L 578,358 L 558,328 Z' },
  { id:'ru',  d:'M 538,122 L 698,98 L 818,100 L 898,120 L 932,162 L 892,198 L 818,212 L 738,228 L 678,238 L 638,230 L 598,218 L 562,198 L 540,168 Z' },
  { id:'si',  d:'M 598,232 L 658,228 L 700,252 L 715,298 L 695,345 L 648,362 L 608,342 L 592,300 Z' },
  { id:'se',  d:'M 730,258 L 788,250 L 812,275 L 798,312 L 765,328 L 738,315 L 725,288 Z' },
  { id:'ea',  d:'M 752,178 L 852,168 L 902,195 L 900,238 L 868,262 L 820,265 L 772,250 L 752,220 Z' },
  { id:'jp',  d:'M 890,182 L 918,175 L 928,198 L 912,212 L 895,208 Z' },
  { id:'au',  d:'M 772,370 L 858,360 L 912,385 L 918,430 L 895,465 L 848,478 L 800,468 L 768,438 L 762,398 Z' },
  { id:'nz',  d:'M 932,432 L 948,420 L 955,438 L 942,458 L 928,458 Z' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function toPos(lon, lat) {
  return { x: ((lon + 180) / 360) * 100, y: ((85 - lat) / 170) * 100 };
}

function getPinPos(attr) {
  const city    = (attr.city    || '').toLowerCase().trim();
  const country = (attr.country || '').toLowerCase().trim();
  if (CITY_COORDS[city])       return toPos(CITY_COORDS[city].lon,       CITY_COORDS[city].lat);
  if (COUNTRY_COORDS[country]) return toPos(COUNTRY_COORDS[country].lon, COUNTRY_COORDS[country].lat);
  const h = ((attr.id ?? 0) * 17 + 31) % 100;
  return { x: 10 + (h * 0.7), y: 25 + (h * 0.45) % 45 };
}

// Build clusters + spiderfy data for the current zoom level.
// clusterThreshold and spiderRadius are in map-% units, derived from pixel
// constants so the visual distance stays consistent as you zoom.
function buildMapData(sorted, scale, containerW) {
  const W   = containerW || 800;
  const clusterPct = (CLUSTER_BASE_PX / (W * scale)) * 100;
  const spiderPct  = (SPIDER_PX       / (W * scale)) * 100;

  // ── Base positions ─────────────────────────────────────────────────────────
  const basePositions = {};
  sorted.forEach(a => { basePositions[a.id] = getPinPos(a); });

  // ── Step 1: cluster by pixel-equivalent distance ───────────────────────────
  const assigned = new Set();
  const groups   = [];

  sorted.forEach(attr => {
    if (assigned.has(attr.id)) return;
    const pos   = basePositions[attr.id];
    const group = { center: { ...pos }, attrs: [attr] };
    assigned.add(attr.id);

    sorted.forEach(other => {
      if (assigned.has(other.id)) return;
      const op = basePositions[other.id];
      if (Math.hypot(pos.x - op.x, pos.y - op.y) < clusterPct) {
        group.attrs.push(other);
        assigned.add(other.id);
      }
    });

    if (group.attrs.length > 1) {
      group.center.x = group.attrs.reduce((s, a) => s + basePositions[a.id].x, 0) / group.attrs.length;
      group.center.y = group.attrs.reduce((s, a) => s + basePositions[a.id].y, 0) / group.attrs.length;
    }

    groups.push(group);
  });

  // ── Step 2: spiderfy single-attr groups that share the same map position ───
  // Two attractions in the same city get the exact same coords from getPinPos.
  const displayPositions = {};
  const spiderLines      = []; // [{cx, cy, px, py, color}] → SVG legs

  // Collect single-attr groups, bucket by rounded position
  const singlesByPos = {};
  groups.forEach(g => {
    if (g.attrs.length > 1) {
      // Cluster group: display position = base position (cluster renders at center)
      g.attrs.forEach(a => { displayPositions[a.id] = basePositions[a.id]; });
      return;
    }
    const a   = g.attrs[0];
    const pos = basePositions[a.id];
    const key = `${pos.x.toFixed(1)},${pos.y.toFixed(1)}`;
    if (!singlesByPos[key]) singlesByPos[key] = { center: { ...pos }, items: [] };
    singlesByPos[key].items.push(a);
  });

  Object.values(singlesByPos).forEach(({ center, items }) => {
    if (items.length === 1) {
      displayPositions[items[0].id] = basePositions[items[0].id];
      return;
    }
    // Spread in a circle
    const n = items.length;
    items.forEach((a, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const dx    = spiderPct * Math.cos(angle);
      const dy    = spiderPct * Math.sin(angle);
      displayPositions[a.id] = { x: center.x + dx, y: center.y + dy };
      spiderLines.push({
        cx: center.x, cy: center.y,
        px: center.x + dx, py: center.y + dy,
        color: dayColor(a.TripAttraction?.dayNumber ?? 1),
      });
    });
  });

  return { groups, displayPositions, basePositions, spiderLines };
}

// ── MapView ───────────────────────────────────────────────────────────────────
function MapView({ sorted, onRemove, canAdd, onAdd, newIds, activeId, setActiveId, highlightDay, focusRef, transform, setTransform, containerRef }) {
  const routeKey     = useRef(0);
  const isDragging   = useRef(false);
  const dragStart    = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const touchState   = useRef({ lastDist: null });
  const transformRef = useRef(transform);
  useEffect(() => { transformRef.current = transform; }, [transform]);
  useEffect(() => { routeKey.current += 1; }, [sorted]);

  // Track container width for pixel-accurate cluster threshold
  const [containerW, setContainerW] = useState(800);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setContainerW(el.clientWidth || 800);
    const ro = new ResizeObserver(([e]) => setContainerW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef]);

  // Hover tooltip (rendered outside canvas so it never gets map-scaled)
  const [hoveredId,  setHoveredId]  = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const { groups, displayPositions, spiderLines } = useMemo(
    () => buildMapData(sorted, transform.scale, containerW),
    [sorted, transform.scale, containerW],
  );

  // ── Zoom toward a point ─────────────────────────────────────────────────────
  const zoomAt = useCallback((factor, clientX, clientY) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    setTransform(prev => {
      const ns = Math.max(MIN_SCALE, Math.min(MAX_SCALE, prev.scale * factor));
      const r  = ns / prev.scale;
      return { scale: ns, x: cx - r * (cx - prev.x), y: cy - r * (cy - prev.y) };
    });
  }, [containerRef, setTransform]);

  // ── Zoom buttons (toward center) ────────────────────────────────────────────
  const zoomCenter = useCallback((factor) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    zoomAt(factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  }, [containerRef, zoomAt]);

  // ── Drag ────────────────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY, tx: transformRef.current.x, ty: transformRef.current.y };
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging.current) return;
    setTransform(prev => ({
      ...prev,
      x: dragStart.current.tx + (e.clientX - dragStart.current.x),
      y: dragStart.current.ty + (e.clientY - dragStart.current.y),
    }));
  }, [setTransform]);

  const handleMouseUp = useCallback(() => { isDragging.current = false; }, []);

  // ── Touch ────────────────────────────────────────────────────────────────────
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchState.current.lastDist = Math.hypot(dx, dy);
      touchState.current.midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
      touchState.current.midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
    } else if (e.touches.length === 1) {
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, tx: transformRef.current.x, ty: transformRef.current.y };
    }
  }, []);

  const handleTouchMove = useCallback((e) => {
    e.preventDefault();
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (touchState.current.lastDist) {
        zoomAt(dist / touchState.current.lastDist,
          (e.touches[0].clientX + e.touches[1].clientX) / 2,
          (e.touches[0].clientY + e.touches[1].clientY) / 2);
      }
      touchState.current.lastDist = dist;
    } else if (e.touches.length === 1) {
      setTransform(prev => ({
        ...prev,
        x: dragStart.current.tx + (e.touches[0].clientX - dragStart.current.x),
        y: dragStart.current.ty + (e.touches[0].clientY - dragStart.current.y),
      }));
    }
  }, [zoomAt, setTransform]);

  const handleTouchEnd = useCallback(() => { touchState.current.lastDist = null; }, []);

  // ── Wheel ────────────────────────────────────────────────────────────────────
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    zoomAt(e.deltaY > 0 ? 0.85 : 1.18, e.clientX, e.clientY);
  }, [zoomAt]);

  // Register non-passive listeners
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const opts = { passive: false };
    el.addEventListener('wheel',      handleWheel,      opts);
    el.addEventListener('touchstart', handleTouchStart, opts);
    el.addEventListener('touchmove',  handleTouchMove,  opts);
    el.addEventListener('touchend',   handleTouchEnd);
    return () => {
      el.removeEventListener('wheel',      handleWheel);
      el.removeEventListener('touchstart', handleTouchStart);
      el.removeEventListener('touchmove',  handleTouchMove);
      el.removeEventListener('touchend',   handleTouchEnd);
    };
  }, [containerRef, handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // ── Expose focus function ────────────────────────────────────────────────────
  const focusOnAttr = useCallback((attr) => {
    setTransform(prev => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return prev;
      const pos       = getPinPos(attr);
      const targetS   = Math.max(prev.scale, 2.8);
      return {
        scale: targetS,
        x: rect.width  / 2 - (pos.x / 100 * rect.width)  * targetS,
        y: rect.height / 2 - (pos.y / 100 * rect.height) * targetS,
      };
    });
  }, [containerRef, setTransform]);
  useEffect(() => { if (focusRef) focusRef.current = focusOnAttr; }, [focusOnAttr, focusRef]);

  // ── SVG route ────────────────────────────────────────────────────────────────
  // Route follows base positions so the line doesn't jump when spiderfied
  const basePositions = useMemo(() => {
    const m = {};
    sorted.forEach(a => { m[a.id] = getPinPos(a); });
    return m;
  }, [sorted]);

  const routePts  = sorted.map(a => { const p = basePositions[a.id]; return `${p.x * 10},${p.y * 5}`; }).join(' ');
  const planePath = sorted.map(a => { const p = basePositions[a.id]; return `${p.x * 10} ${p.y * 5}`; }).join(' L ');

  // Hover tooltip handler — fired by SinglePin/ClusterPin
  const handlePinHover = useCallback((id, e) => {
    if (!id) { setHoveredId(null); return; }
    const pinRect  = e.currentTarget.getBoundingClientRect();
    const contRect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
    setHoveredId(id);
    setTooltipPos({
      x: pinRect.left + pinRect.width / 2 - contRect.left,
      y: pinRect.top                       - contRect.top,
    });
  }, [containerRef]);

  const hoveredAttr = hoveredId ? sorted.find(a => a.id === hoveredId) : null;

  return (
    <div
      className="map-view"
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{ cursor: isDragging.current ? 'grabbing' : 'grab' }}
    >
      {/* Transformable canvas — CSS var --ms lets children counter-scale labels */}
      <div
        className="map-canvas"
        style={{
          transform: `translate(${transform.x}px,${transform.y}px) scale(${transform.scale})`,
          transformOrigin: '0 0',
          '--ms': transform.scale,
        }}
      >
        {/* Decorative SVG world map */}
        <svg className="map-svg" viewBox="0 0 1000 500" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="ocean-g" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%"   stopColor="#cce8f5"/>
              <stop offset="100%" stopColor="#9dcfe8"/>
            </linearGradient>
            <filter id="land-shadow" x="-5%" y="-5%" width="110%" height="110%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#0000001a"/>
            </filter>
            <clipPath id={`rc-${routeKey.current}`}>
              <rect x="0" y="0" height="500" width="0">
                <animate attributeName="width" from="0" to="1000" dur="2.2s" begin="0.4s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1"/>
              </rect>
            </clipPath>
          </defs>

          <rect width="1000" height="500" fill="url(#ocean-g)"/>
          {[100,200,300,400].map(y => <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#a8d4e8" strokeWidth="0.6" opacity="0.5"/>)}
          {[125,250,375,500,625,750,875].map(x => <line key={x} x1={x} y1="0" x2={x} y2="500" stroke="#a8d4e8" strokeWidth="0.6" opacity="0.5"/>)}
          {CONTINENTS.map(c => <path key={c.id} d={c.d} fill="#e5d9be" stroke="#ccc0a0" strokeWidth="1.5" filter="url(#land-shadow)"/>)}

          {sorted.length > 1 && (
            <polyline points={routePts} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeDasharray="6 9" strokeLinecap="round" clipPath={`url(#rc-${routeKey.current})`} opacity="0.75"/>
          )}

          {/* Spider legs */}
          {spiderLines.map((sl, i) => (
            <line key={`sl-${i}`}
              x1={sl.cx * 10} y1={sl.cy * 5}
              x2={sl.px * 10} y2={sl.py * 5}
              stroke={sl.color} strokeWidth="1.2" opacity="0.45" strokeLinecap="round"/>
          ))}

          {sorted.length > 1 && (
            <>
              <path id="plane-path" d={`M ${planePath}`} fill="none"/>
              <text fontSize="20" textAnchor="middle" dominantBaseline="middle">✈
                <animateMotion dur="2.8s" begin="0.4s" fill="freeze" rotate="auto">
                  <mpath href="#plane-path"/>
                </animateMotion>
              </text>
            </>
          )}
        </svg>

        {/* Pins layer */}
        <div className="map-pins">
          {groups.map((group, gi) => {
            if (group.attrs.length === 1) {
              const attr = group.attrs[0];
              return (
                <SinglePin
                  key={attr.id}
                  attr={attr}
                  displayPos={displayPositions[attr.id]}
                  scale={transform.scale}
                  newIds={newIds}
                  activeId={activeId}
                  setActiveId={setActiveId}
                  highlightDay={highlightDay}
                  onHoverPin={handlePinHover}
                />
              );
            }
            return (
              <ClusterPin
                key={`cl-${gi}`}
                group={group}
                highlightDay={highlightDay}
                onHoverPin={handlePinHover}
                scale={transform.scale}
                onClick={() => {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  setTransform(prev => {
                    const ns = Math.min(MAX_SCALE, prev.scale * 2.2);
                    return {
                      scale: ns,
                      x: rect.width  / 2 - (group.center.x / 100 * rect.width)  * ns,
                      y: rect.height / 2 - (group.center.y / 100 * rect.height) * ns,
                    };
                  });
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Hover tooltip — outside canvas so it never gets map-scaled */}
      {hoveredAttr && (
        <PinTooltip attr={hoveredAttr} x={tooltipPos.x} y={tooltipPos.y}/>
      )}

      {/* Zoom controls */}
      <div className="map-controls">
        <button className="map-ctrl-btn" onClick={() => zoomCenter(1.35)} title="Zoom in">+</button>
        <button className="map-ctrl-btn" onClick={() => zoomCenter(0.74)} title="Zoom out">−</button>
        <button className="map-ctrl-btn map-ctrl-reset" onClick={() => setTransform({ scale: 1, x: 0, y: 0 })} title="Reset view">⊙</button>
      </div>

      <div className="map-hint">Scroll to zoom · Drag to pan</div>

      {canAdd && (
        <button className="map-add-fab" onClick={e => { e.stopPropagation(); onAdd(); }} title="Add attraction">+</button>
      )}
    </div>
  );
}

// ── Hover tooltip (rendered OUTSIDE canvas, unaffected by map transform) ──────
function PinTooltip({ attr, x, y }) {
  const day   = attr.TripAttraction?.dayNumber ?? 1;
  const color = dayColor(day);
  return (
    <div className="map-pin-tooltip" style={{ left: x, top: y }}>
      <div className="pin-tt-name">{attr.name}</div>
      <div className="pin-tt-row">
        <span className="pin-tt-day" style={{ background:`${color}22`, color, borderColor:`${color}55` }}>Day {day}</span>
        {attr.rating && <span className="pin-tt-rating">⭐ {attr.rating}</span>}
      </div>
      <div className="pin-tt-loc">📍 {[attr.city, attr.country].filter(Boolean).join(', ')}</div>
    </div>
  );
}

// ── Single pin ─────────────────────────────────────────────────────────────────
// --ps (pin-scale factor) drives pin size via CSS; labels counter-scale
// separately.  Both animate via CSS transition for smooth zoom feel.
function SinglePin({ attr, displayPos, scale, newIds, activeId, setActiveId, highlightDay, onHoverPin }) {
  const day   = attr.TripAttraction?.dayNumber ?? 1;
  const color = dayColor(day);
  const isNew = newIds.has(attr.id);
  const isDim = highlightDay !== null && highlightDay !== day;
  const isAct = activeId === attr.id;

  // Zoom thresholds: icon-only → day badge → name
  const showDay  = scale >= 1.4;
  const showName = scale >= 2.8;

  // Label counter-scale keeps text at a stable ~11px visual size
  const labelCS = `scale(${(1 / scale).toFixed(4)})`;

  return (
    <div
      className={`map-pin-wrap${isNew ? ' map-pin-wrap--new' : ''}${isDim ? ' map-pin-wrap--dim' : ''}${isAct ? ' map-pin-wrap--active' : ''}`}
      style={{ left: `${displayPos.x}%`, top: `${displayPos.y}%`, '--ps': pinSF(scale).toFixed(4) }}
      onClick={e => { e.stopPropagation(); setActiveId(isAct ? null : attr.id); }}
      onMouseEnter={e => onHoverPin(attr.id, e)}
      onMouseLeave={() => onHoverPin(null, null)}
    >
      <div className="map-pin" style={{ background: color, boxShadow: `0 0 0 4px ${color}44` }}>
        <span className="map-pin-icon">{catIcon(attr.category)}</span>
      </div>

      {showDay && !showName && (
        <div className="map-pin-zoom-label map-pin-zoom-label--day"
          style={{ color, transform: labelCS, transformOrigin: 'center top' }}>
          D{day}
        </div>
      )}
      {showName && (
        <div className="map-pin-zoom-label map-pin-zoom-label--name"
          style={{ color, transform: labelCS, transformOrigin: 'center top' }}>
          {attr.name.length > 16 ? attr.name.slice(0, 14) + '…' : attr.name}
        </div>
      )}
    </div>
  );
}

// ── Cluster pin ────────────────────────────────────────────────────────────────
function ClusterPin({ group, highlightDay, onClick, onHoverPin, scale }) {
  const days  = [...new Set(group.attrs.map(a => a.TripAttraction?.dayNumber ?? 1))];
  const isDim = highlightDay !== null && !days.includes(highlightDay);

  const firstDay  = group.attrs[0]?.TripAttraction?.dayNumber ?? 1;
  const ringColor = dayColor(firstDay);
  const bgColor   = '#4f46e5';

  return (
    <div
      className={`map-cluster${isDim ? ' map-pin-wrap--dim' : ''}`}
      style={{ left: `${group.center.x}%`, top: `${group.center.y}%`, '--ps': pinSF(scale).toFixed(4) }}
      onClick={e => { e.stopPropagation(); onClick(); }}
      onMouseEnter={() => onHoverPin(null, null)}
      onMouseLeave={() => onHoverPin(null, null)}
      title={`${group.attrs.length} attractions — click to zoom in`}
    >
      <div className="map-cluster-bubble"
        style={{ background: bgColor, boxShadow: `0 0 0 4px ${ringColor}44` }}>
        <span className="map-cluster-count">{group.attrs.length}</span>
      </div>
    </div>
  );
}

// ── Detail card (modal) ───────────────────────────────────────────────────────
function DetailCard({ attr, onClose, onRemove, onGoToDay }) {
  if (!attr) return null;
  const day   = attr.TripAttraction?.dayNumber ?? 1;
  const color = dayColor(day);

  return (
    <div className="mdc-overlay" onClick={onClose}>
      <div className="mdc-card" onClick={e => e.stopPropagation()}>
        <button className="mdc-close" onClick={onClose}>×</button>
        <div className="mdc-header">
          <span className="mdc-cat-icon">{catIcon(attr.category)}</span>
          <div className="mdc-header-text">
            <div className="mdc-name">{attr.name}</div>
            <div className="mdc-loc">📍 {[attr.city, attr.country].filter(Boolean).join(', ')}</div>
          </div>
        </div>
        <div className="mdc-chips">
          <span className="mdc-chip" style={{ background:`${color}20`, color, borderColor:`${color}55` }}>Day {day}</span>
          {attr.rating    && <span className="mdc-chip">⭐ {attr.rating}</span>}
          {attr.category  && <span className="mdc-chip">{catIcon(attr.category)} {attr.category}</span>}
        </div>
        {attr.description && <p className="mdc-desc">{attr.description}</p>}
        {attr.TripAttraction?.notes && (
          <div className="mdc-notes">📝 <em>{attr.TripAttraction.notes}</em></div>
        )}
        <div className="mdc-actions">
          <button
            className="mdc-btn-day"
            style={{ borderColor: color, color }}
            onClick={() => { onGoToDay(day); onClose(); }}
          >
            Go to Day {day} ↓
          </button>
          {onRemove && (
            <button className="mdc-btn-remove" onClick={() => { onRemove(attr.id); onClose(); }}>
              Remove from Trip
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Itinerary section ─────────────────────────────────────────────────────────
function ItinerarySection({ byDay, days, highlightDay, setHighlightDay, activeId, setActiveId, onFocusOnMap, onRemove, collapsedDays, toggleDay, newIds }) {
  // Auto-scroll to day when pin is clicked
  useEffect(() => {
    if (!activeId) return;
    for (const d of days) {
      if (byDay[d]?.some(a => a.id === activeId)) {
        document.getElementById(`itin-day-${d}`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        break;
      }
    }
  }, [activeId]); // eslint-disable-line

  return (
    <div className="itin-root">
      <div className="itin-header">
        <span className="itin-header-icon">🗓</span>
        <h3 className="itin-header-title">Day-by-Day Itinerary</h3>
        <span className="itin-header-count">{days.length} {days.length === 1 ? 'day' : 'days'} · {Object.values(byDay).flat().length} stops</span>
      </div>

      <div className="itin-timeline">
        {/* Departure */}
        <div className="itin-node">
          <div className="itin-node-icon">✈️</div>
          <span className="itin-node-label">Departure</span>
        </div>

        {days.map((day, dayIdx) => {
          const color      = dayColor(day);
          const attrs      = byDay[day];
          const isHilit    = highlightDay === day;
          const isCollapsed = collapsedDays.has(day);

          // Main city for this day
          const cityTally = {};
          attrs.forEach(a => { if (a.city) cityTally[a.city] = (cityTally[a.city] || 0) + 1; });
          const mainCity = Object.entries(cityTally).sort((a,b) => b[1]-a[1])[0]?.[0] || '';

          // Travel icon when city changes between days
          const prevDay  = dayIdx > 0 ? days[dayIdx - 1] : null;
          const prevAttrs = prevDay ? byDay[prevDay] : [];
          const prevCityTally = {};
          prevAttrs.forEach(a => { if (a.city) prevCityTally[a.city] = (prevCityTally[a.city] || 0) + 1; });
          const prevCity = Object.entries(prevCityTally).sort((a,b) => b[1]-a[1])[0]?.[0] || '';
          const cityChanged = prevDay && prevCity && mainCity && prevCity !== mainCity;

          const estHours = (attrs.length * 1.5).toFixed(1);

          return (
            <React.Fragment key={day}>
              {/* Travel connector */}
              {dayIdx > 0 && (
                <div className={`itin-connector${cityChanged ? ' itin-connector--travel' : ''}`}>
                  <div className="itin-connector-line" style={{ borderColor: cityChanged ? '#a78bfa' : color }}/>
                  {cityChanged && <span className="itin-connector-icon">✈</span>}
                  <div className="itin-connector-line" style={{ borderColor: cityChanged ? '#a78bfa' : color }}/>
                </div>
              )}

              <div
                id={`itin-day-${day}`}
                className={`itin-day${isHilit ? ' itin-day--hilit' : ''}`}
                style={{ '--day-color': color }}
              >
                {/* Day header — click to highlight + collapse */}
                <div
                  className="itin-day-hdr"
                  onClick={() => {
                    setHighlightDay(isHilit ? null : day);
                    toggleDay(day);
                  }}
                >
                  <div className="itin-day-badge" style={{ background: color }}>{day}</div>
                  <div className="itin-day-meta">
                    <span className="itin-day-label" style={{ color }}>Day {day}</span>
                    {mainCity && <span className="itin-day-city">📍 {mainCity}</span>}
                  </div>
                  <div className="itin-day-stats">
                    <span>{attrs.length} {attrs.length === 1 ? 'stop' : 'stops'}</span>
                    <span>~{estHours}h</span>
                  </div>
                  <span className={`itin-chevron${isCollapsed ? '' : ' itin-chevron--open'}`}>›</span>
                </div>

                {/* Attractions */}
                {!isCollapsed && (
                  <div className="itin-day-body">
                    {attrs.map((attr, ai) => {
                      const isAct = activeId === attr.id;
                      const isNew = newIds.has(attr.id);
                      return (
                        <div
                          key={attr.id}
                          className={`itin-stop${isAct ? ' itin-stop--active' : ''}${isNew ? ' itin-stop--new' : ''}`}
                          onClick={() => {
                            setActiveId(isAct ? null : attr.id);
                            if (!isAct) onFocusOnMap?.(attr);
                          }}
                        >
                          <div className="itin-stop-num" style={{ background: color }}>{ai + 1}</div>
                          <div className="itin-stop-info">
                            <span className="itin-stop-name">{attr.name}</span>
                            <div className="itin-stop-tags">
                              <span>{catIcon(attr.category)} {attr.category}</span>
                              {attr.rating && <span>⭐ {attr.rating}</span>}
                            </div>
                            {attr.TripAttraction?.notes && (
                              <div className="itin-stop-notes">📝 {attr.TripAttraction.notes}</div>
                            )}
                          </div>
                          {onRemove && (
                            <button className="itin-stop-rm" onClick={e => { e.stopPropagation(); onRemove(attr.id); }} title="Remove">×</button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </React.Fragment>
          );
        })}

        {/* End */}
        <div className="itin-node itin-node--end">
          <div className="itin-node-icon">🏁</div>
          <span className="itin-node-label">End of Journey</span>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function IllustratedTravelMap({ attractions, onRemove, onAdd, canAdd }) {
  const [transform,     setTransform]     = useState({ scale: 1, x: 0, y: 0 });
  const [activeId,      setActiveId]      = useState(null);
  const [highlightDay,  setHighlightDay]  = useState(null);
  const [collapsedDays, setCollapsedDays] = useState(new Set());
  const [newIds,        setNewIds]        = useState(new Set());
  const [aiToast,       setAiToast]       = useState(null);
  const containerRef = useRef(null);
  const focusRef     = useRef(null);
  const prevIds      = useRef(new Set());

  // Detect AI-added attractions
  useEffect(() => {
    const cur   = new Set((attractions || []).map(a => a.id));
    const added = [...cur].filter(id => !prevIds.current.has(id));
    if (added.length > 0 && prevIds.current.size > 0) {
      setNewIds(new Set(added));
      const names = (attractions || []).filter(a => added.includes(a.id)).map(a => `${a.name} (${a.city})`).join(', ');
      setAiToast(`✨ AI added: ${names}`);
      // Expand the days that received new attractions
      const newDays = new Set(
        (attractions || []).filter(a => added.includes(a.id)).map(a => a.TripAttraction?.dayNumber).filter(Boolean)
      );
      setCollapsedDays(prev => { const n = new Set(prev); newDays.forEach(d => n.delete(d)); return n; });
      setTimeout(() => { setNewIds(new Set()); setAiToast(null); }, 4500);
    }
    prevIds.current = cur;
  }, [attractions]);

  const toggleDay = useCallback((day) => {
    setCollapsedDays(prev => { const n = new Set(prev); n.has(day) ? n.delete(day) : n.add(day); return n; });
  }, []);

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!attractions || attractions.length === 0) {
    return (
      <div className="itm-empty">
        <div className="itm-empty-globe">🌍</div>
        <h3 className="itm-empty-title">Start Building Your Journey</h3>
        <p className="itm-empty-text">Ask the AI Travel Agent for recommendations,<br/>or add attractions manually to plan your trip.</p>
        {canAdd && <button className="btn-add" onClick={onAdd}>+ Add First Attraction</button>}
      </div>
    );
  }

  // ── Sort & group ────────────────────────────────────────────────────────────
  const sorted = [...attractions].sort((a, b) => {
    const da = a.TripAttraction?.dayNumber ?? 99, db = b.TripAttraction?.dayNumber ?? 99;
    const oa = a.TripAttraction?.orderInDay ?? 99, ob = b.TripAttraction?.orderInDay ?? 99;
    return da !== db ? da - db : oa - ob;
  });

  const byDay = {};
  sorted.forEach(a => { const d = a.TripAttraction?.dayNumber ?? 1; if (!byDay[d]) byDay[d] = []; byDay[d].push(a); });
  const days = Object.keys(byDay).map(Number).sort((a, b) => a - b);

  const totalDays       = Math.max(...sorted.map(a => a.TripAttraction?.dayNumber ?? 1));
  const uniqueCountries = [...new Set(sorted.map(a => a.country).filter(Boolean))];
  const storyStops      = [...new Map(sorted.map(a => [a.city || a.country, a.city || a.country])).values()];

  const activeAttr = activeId ? sorted.find(a => a.id === activeId) : null;

  const goToDay = (day) => {
    setHighlightDay(day);
    setCollapsedDays(prev => { const n = new Set(prev); n.delete(day); return n; });
    setTimeout(() => document.getElementById(`itin-day-${day}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 60);
  };

  return (
    <div className="itm-root">
      {aiToast && <div className="itm-ai-toast">{aiToast}</div>}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="itm-header">
        <div className="itm-header-left">
          <span className="itm-header-globe">🗺️</span>
          <span className="itm-header-title">Travel Route</span>
          <div className="itm-preview-dots">
            {days.map(d => <span key={d} className="itm-preview-dot" style={{ background: dayColor(d) }} title={`Day ${d}`}/>)}
          </div>
        </div>
        <div className="itm-header-right">
          {canAdd && <button className="btn-add itm-add-btn" onClick={onAdd}>+ Add</button>}
        </div>
      </div>

      {/* ── Summary bar ─────────────────────────────────────────── */}
      <div className="itm-summary">
        <div className="itm-stat"><span className="itm-stat-icon">✈️</span><strong>{uniqueCountries.length}</strong><span>Countries</span></div>
        <div className="itm-stat-sep"/>
        <div className="itm-stat"><span className="itm-stat-icon">📍</span><strong>{sorted.length}</strong><span>Attractions</span></div>
        <div className="itm-stat-sep"/>
        <div className="itm-stat"><span className="itm-stat-icon">📅</span><strong>{totalDays}</strong><span>Days</span></div>
        {uniqueCountries.length > 0 && (
          <><div className="itm-stat-sep"/>
          <div className="itm-stat-countries">{uniqueCountries.slice(0,5).join(' · ')}{uniqueCountries.length > 5 && ` +${uniqueCountries.length - 5}`}</div></>
        )}
      </div>

      {/* ── Story bar ───────────────────────────────────────────── */}
      {storyStops.length > 1 && (
        <div className="itm-story">
          {storyStops.map((stop, i) => (
            <React.Fragment key={i}>
              <span className="itm-story-stop" style={{ animationDelay:`${i*0.1}s` }}>{stop}</span>
              {i < storyStops.length - 1 && <span className="itm-story-arrow">✈</span>}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* ── Map ─────────────────────────────────────────────────── */}
      <MapView
        sorted={sorted}
        onRemove={onRemove}
        canAdd={canAdd}
        onAdd={onAdd}
        newIds={newIds}
        activeId={activeId}
        setActiveId={setActiveId}
        highlightDay={highlightDay}
        focusRef={focusRef}
        transform={transform}
        setTransform={setTransform}
        containerRef={containerRef}
      />

      {/* ── Detail card ─────────────────────────────────────────── */}
      {activeAttr && (
        <DetailCard
          attr={activeAttr}
          onClose={() => setActiveId(null)}
          onRemove={onRemove}
          onGoToDay={goToDay}
        />
      )}

      {/* ── Itinerary section ────────────────────────────────────── */}
      <ItinerarySection
        byDay={byDay}
        days={days}
        highlightDay={highlightDay}
        setHighlightDay={setHighlightDay}
        activeId={activeId}
        setActiveId={setActiveId}
        onFocusOnMap={(attr) => focusRef.current?.(attr)}
        onRemove={onRemove}
        collapsedDays={collapsedDays}
        toggleDay={toggleDay}
        newIds={newIds}
      />
    </div>
  );
}

export default IllustratedTravelMap;
