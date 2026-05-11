/* viewer.client.js — pan/zoom for the macro atlas SVG. No deps; wires
 * onto any element marked [data-pan-zoom-viewport] containing one
 * [data-atlas-svg] SVG. Mouse wheel zooms around the cursor; drag pans;
 * toolbar buttons handle +/-/Fit; keyboard arrows pan. */

(function () {
  'use strict';

  const viewport = document.querySelector('[data-pan-zoom-viewport]');
  if (!viewport) return;
  const svg = viewport.querySelector('[data-atlas-svg]');
  if (!svg) return;

  const initial = svg.getAttribute('viewBox');
  if (!initial) return;
  const [ix, iy, iw, ih] = initial.split(/\s+/).map(Number);
  const state = { x: ix, y: iy, w: iw, h: ih };

  function apply() {
    svg.setAttribute('viewBox', `${state.x} ${state.y} ${state.w} ${state.h}`);
  }

  function zoom(factor, cx, cy) {
    const newW = Math.max(40, Math.min(state.w * factor, iw * 8));
    const newH = newW * (state.h / state.w);
    if (cx == null) { cx = state.x + state.w / 2; cy = state.y + state.h / 2; }
    state.x = cx - (cx - state.x) * (newW / state.w);
    state.y = cy - (cy - state.y) * (newH / state.h);
    state.w = newW;
    state.h = newH;
    apply();
  }

  function clientToSvg(evt) {
    const rect = svg.getBoundingClientRect();
    const xRatio = (evt.clientX - rect.left) / rect.width;
    const yRatio = (evt.clientY - rect.top) / rect.height;
    return { x: state.x + xRatio * state.w, y: state.y + yRatio * state.h };
  }

  viewport.addEventListener('wheel', function (evt) {
    if (!evt.ctrlKey && !evt.metaKey && Math.abs(evt.deltaY) < 4 && Math.abs(evt.deltaX) < 4) return;
    evt.preventDefault();
    const factor = evt.deltaY > 0 ? 1.1 : 1 / 1.1;
    const pt = clientToSvg(evt);
    zoom(factor, pt.x, pt.y);
  }, { passive: false });

  let dragging = null;
  viewport.addEventListener('pointerdown', function (evt) {
    if (evt.button !== 0) return;
    dragging = { x: evt.clientX, y: evt.clientY };
    viewport.classList.add('is-grabbing');
    viewport.setPointerCapture(evt.pointerId);
  });
  viewport.addEventListener('pointermove', function (evt) {
    if (!dragging) return;
    const rect = svg.getBoundingClientRect();
    const dx = ((evt.clientX - dragging.x) / rect.width) * state.w;
    const dy = ((evt.clientY - dragging.y) / rect.height) * state.h;
    state.x -= dx;
    state.y -= dy;
    dragging = { x: evt.clientX, y: evt.clientY };
    apply();
  });
  function endDrag(evt) {
    if (!dragging) return;
    dragging = null;
    viewport.classList.remove('is-grabbing');
    try { viewport.releasePointerCapture(evt.pointerId); } catch (e) { /* ignore */ }
  }
  viewport.addEventListener('pointerup', endDrag);
  viewport.addEventListener('pointercancel', endDrag);
  viewport.addEventListener('pointerleave', endDrag);

  document.addEventListener('keydown', function (evt) {
    if (evt.target && (evt.target.tagName === 'INPUT' || evt.target.tagName === 'TEXTAREA')) return;
    const step = state.w * 0.08;
    if (evt.key === 'ArrowLeft') { state.x -= step; apply(); }
    else if (evt.key === 'ArrowRight') { state.x += step; apply(); }
    else if (evt.key === 'ArrowUp') { state.y -= step; apply(); }
    else if (evt.key === 'ArrowDown') { state.y += step; apply(); }
    else if (evt.key === '+' || evt.key === '=') { zoom(1 / 1.2); }
    else if (evt.key === '-' || evt.key === '_') { zoom(1.2); }
    else if (evt.key === '0') { state.x = ix; state.y = iy; state.w = iw; state.h = ih; apply(); }
  });

  document.querySelectorAll('[data-pan-zoom="zoom-in"]').forEach((btn) => btn.addEventListener('click', () => zoom(1 / 1.2)));
  document.querySelectorAll('[data-pan-zoom="zoom-out"]').forEach((btn) => btn.addEventListener('click', () => zoom(1.2)));
  document.querySelectorAll('[data-pan-zoom="fit"]').forEach((btn) => btn.addEventListener('click', () => {
    state.x = ix; state.y = iy; state.w = iw; state.h = ih; apply();
  }));
})();
