// Hero system diagram: topology (shared with the server render) and the packet simulation.
// No imports on purpose: Hero.astro reads the topology at build time and the browser runs the rest.

export type Pt = [number, number];
export type NodeKind = 'edge' | 'service' | 'infra';

export interface NodeDef {
  id: string;
  label: string;
  kind: NodeKind;
  /** Position in percent of the stage. `compact: null` means the node is dropped on narrow stages. */
  wide: Pt;
  compact: Pt | null;
}

export interface EdgeDef {
  id: string;
  a: string;
  b: string;
  kind: 'http' | 'amqp';
  /** Simulated one-way latency in milliseconds. */
  ms: number;
  wide: Pt[];
  compact: Pt[] | null;
  /** Queue name shown beside the edge on wide stages. */
  label?: string;
}

// Service and queue names follow the Hospital Management System in cv.ts.
export const NODES: NodeDef[] = [
  { id: 'client', label: 'client', kind: 'edge', wide: [6, 52], compact: [13, 9] },
  { id: 'gateway', label: 'gateway', kind: 'edge', wide: [28, 52], compact: [50, 9] },
  { id: 'redis', label: 'Redis', kind: 'infra', wide: [28, 16], compact: [87, 9] },
  { id: 'appt', label: 'appointment-service', kind: 'service', wide: [57, 28], compact: [30, 47] },
  { id: 'pg', label: 'PostgreSQL', kind: 'infra', wide: [86, 28], compact: [81, 47] },
  { id: 'rabbit', label: 'RabbitMQ', kind: 'infra', wide: [57, 60], compact: [20, 88] },
  { id: 'workflow', label: 'workflow_service', kind: 'service', wide: [86, 60], compact: [70, 88] },
  { id: 'notify', label: 'notification_service', kind: 'service', wide: [86, 88], compact: null },
];

export const EDGES: EdgeDef[] = [
  { id: 'c-g', a: 'client', b: 'gateway', kind: 'http', ms: 5, wide: [[6, 52], [28, 52]], compact: [[13, 9], [50, 9]] },
  { id: 'g-r', a: 'gateway', b: 'redis', kind: 'http', ms: 1, wide: [[28, 52], [28, 16]], compact: [[50, 9], [87, 9]] },
  {
    id: 'g-a', a: 'gateway', b: 'appt', kind: 'http', ms: 4,
    wide: [[28, 52], [41, 52], [41, 28], [57, 28]],
    compact: [[50, 9], [50, 28], [30, 28], [30, 47]],
  },
  { id: 'a-p', a: 'appt', b: 'pg', kind: 'http', ms: 8, wide: [[57, 28], [86, 28]], compact: [[30, 47], [81, 47]] },
  { id: 'a-q', a: 'appt', b: 'rabbit', kind: 'amqp', ms: 2, wide: [[57, 28], [57, 60]], compact: [[20, 47], [20, 88]] },
  {
    id: 'q-w', a: 'rabbit', b: 'workflow', kind: 'amqp', ms: 2, label: 'statusQueue',
    wide: [[57, 60], [86, 60]], compact: [[20, 88], [70, 88]],
  },
  {
    id: 'q-n', a: 'rabbit', b: 'notify', kind: 'amqp', ms: 2, label: 'appointmentQueue',
    wide: [[57, 60], [57, 88], [86, 88]], compact: null,
  },
  { id: 'w-p', a: 'workflow', b: 'pg', kind: 'http', ms: 7, wide: [[86, 60], [86, 28]], compact: [[81, 88], [81, 47]] },
];

/** Stage width (px) under which the compact layout is used. Keep in sync with the container query in Hero.astro. */
export const COMPACT_BELOW = 560;

type Mode = 'wide' | 'compact';
type PacketKind = 'req' | 'res' | 'msg';

interface EdgeRT {
  def: EdgeDef;
  base: SVGPathElement;
  d: string;
  len: number;
  active: boolean;
}

interface Packet {
  el: SVGPathElement;
  edge: EdgeRT;
  rev: boolean;
  t: number;
  dur: number;
  size: number;
  done: () => void;
}

interface Result {
  status: string;
  ms: number;
  route: string[];
}

export interface HeroSystem {
  /** Base edge paths, for the load choreography. */
  edgePaths(): SVGPathElement[];
  /** Begin ambient traffic (or paint the static frame when motion is reduced). */
  start(): void;
  /** Fire a visible request. With no target, alternates between scenarios. */
  send(target?: string): void;
  destroy(): void;
}

const SVG_NS = 'http://www.w3.org/2000/svg';
const rand = (min: number, max: number) => min + Math.random() * (max - min);

function pathD(pts: Pt[], w: number, h: number): string {
  const p = pts.map(([x, y]) => [Math.round((x / 100) * w) + 0.5, Math.round((y / 100) * h) + 0.5]);
  let d = `M${p[0][0]} ${p[0][1]}`;
  for (let i = 1; i < p.length; i++) {
    const [x, y] = p[i];
    const next = p[i + 1];
    if (!next) {
      d += `L${x} ${y}`;
      continue;
    }
    const [px, py] = p[i - 1];
    const inLen = Math.hypot(x - px, y - py);
    const outLen = Math.hypot(next[0] - x, next[1] - y);
    const r = Math.min(9, inLen / 2, outLen / 2);
    const ax = x - ((x - px) / inLen) * r;
    const ay = y - ((y - py) / inLen) * r;
    const bx = x + ((next[0] - x) / outLen) * r;
    const by = y + ((next[1] - y) / outLen) * r;
    d += `L${ax} ${ay}Q${x} ${y} ${bx} ${by}`;
  }
  return d;
}

export function createHeroSystem(root: HTMLElement, opts: { reduced: boolean }): HeroSystem | null {
  const stage = root.querySelector<HTMLElement>('[data-sys-stage]');
  if (!stage) return null;
  const { reduced } = opts;

  const statusEl = root.querySelector<HTMLElement>('[data-rd-status]');
  const msEl = root.querySelector<HTMLElement>('[data-rd-ms]');
  const routeEl = root.querySelector<HTMLElement>('[data-rd-route]');
  const readout = root.querySelector<HTMLElement>('[data-readout]');
  const sendBtn = root.querySelector<HTMLButtonElement>('[data-send]');

  const nodeEls = new Map<string, HTMLElement>();
  stage.querySelectorAll<HTMLElement>('[data-node]').forEach((el) => nodeEls.set(el.dataset.node!, el));
  const labelOf = (id: string) => NODES.find((n) => n.id === id)?.label ?? id;

  // ----- SVG layer -----
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'sys-live');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  const gEdges = document.createElementNS(SVG_NS, 'g');
  const gPackets = document.createElementNS(SVG_NS, 'g');
  svg.append(gEdges, gPackets);

  const edges: EdgeRT[] = EDGES.map((def) => {
    const base = document.createElementNS(SVG_NS, 'path');
    base.setAttribute('class', `sys-edge sys-edge--${def.kind}`);
    gEdges.appendChild(base);
    return { def, base, d: '', len: 0, active: false };
  });
  const edgeBetween = (a: string, b: string) =>
    edges.find((e) => e.active && ((e.def.a === a && e.def.b === b) || (e.def.a === b && e.def.b === a)));

  stage.prepend(svg);
  stage.classList.add('is-live');

  // ----- State -----
  let mode: Mode = 'wide';
  let w = 0;
  let h = 0;
  let gen = 0; // bumped whenever in-flight work must be abandoned
  let now = 0; // simulation clock, seconds; stops while paused
  let started = false;
  let visible = true;
  let raf = 0;
  let last = 0;
  let flip = 0;
  let queued = 0;
  const packets: Packet[] = [];
  const pool: SVGPathElement[] = [];
  const timers: { at: number; fn: () => void }[] = [];
  const hitTimers = new Map<string, number>();
  let routeTimer = 0;

  const after = (delay: number, fn: () => void) => {
    const g = gen;
    timers.push({ at: now + delay, fn: () => g === gen && fn() });
  };

  // ----- Layout -----
  function layout() {
    const rect = stage!.getBoundingClientRect();
    const nextW = Math.round(rect.width);
    const nextH = Math.round(rect.height);
    if (!nextW || !nextH || (nextW === w && nextH === h)) return;
    const nextMode: Mode = nextW < COMPACT_BELOW ? 'compact' : 'wide';
    const modeChanged = nextMode !== mode || w === 0;
    w = nextW;
    h = nextH;
    mode = nextMode;
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    svg.setAttribute('width', String(w));
    svg.setAttribute('height', String(h));

    for (const e of edges) {
      const pts = e.def[mode];
      e.active = !!pts;
      e.base.style.display = pts ? '' : 'none';
      if (!pts) continue;
      e.d = pathD(pts, w, h);
      e.base.setAttribute('d', e.d);
      e.len = e.base.getTotalLength();
    }

    if (modeChanged && started) {
      // Routes differ between layouts: drop what is in flight and start clean.
      reset();
      if (reduced) staticFrame();
      else scheduleAmbient(0.4);
    } else {
      for (const p of packets) dress(p);
      if (reduced && started) staticFrame();
    }
  }

  function reset() {
    gen++;
    timers.length = 0;
    while (packets.length) release(packets.pop()!);
    queued = 0;
    paintQueue();
  }

  // ----- Packets -----
  function dress(p: Packet) {
    p.el.setAttribute('d', p.edge.d);
    p.el.setAttribute('stroke-dasharray', `${p.size} ${p.edge.len + p.size * 2}`);
  }

  function place(p: Packet) {
    const s = (p.rev ? 1 - p.t : p.t) * p.edge.len;
    p.el.setAttribute('stroke-dashoffset', String(-(s - p.size / 2)));
  }

  function release(p: Packet) {
    p.el.style.display = 'none';
    pool.push(p.el);
  }

  function spawn(edge: EdgeRT, rev: boolean, kind: PacketKind, user: boolean, done: () => void, t = 0): Packet {
    const el = pool.pop() ?? gPackets.appendChild(document.createElementNS(SVG_NS, 'path'));
    el.setAttribute('class', `sys-pk sys-pk--${kind}${user ? ' is-user' : ''}`);
    el.style.display = '';
    // A request the visitor fired should answer promptly; ambient traffic stays calm.
    const speed = (mode === 'compact' ? 250 : 360) * (kind === 'msg' ? 0.8 : 1) * (user ? 1.7 : rand(0.92, 1.08));
    const size = (kind === 'res' ? 6 : 10) + (user ? 4 : 0);
    const p: Packet = { el, edge, rev, t, dur: Math.max(0.22, edge.len / speed), size, done };
    dress(p);
    place(p);
    packets.push(p);
    return p;
  }

  function hit(id: string) {
    const el = nodeEls.get(id);
    if (!el) return;
    el.classList.add('is-hit');
    window.clearTimeout(hitTimers.get(id));
    hitTimers.set(id, window.setTimeout(() => el.classList.remove('is-hit'), 170));
  }

  /** Move one packet hop by hop along a list of node ids. */
  function travel(path: string[], kind: PacketKind, user: boolean, onDone?: () => void) {
    const g = gen;
    const hop = (i: number) => {
      if (g !== gen) return;
      if (i >= path.length - 1) {
        onDone?.();
        return;
      }
      const edge = edgeBetween(path[i], path[i + 1]);
      if (!edge) return;
      spawn(edge, edge.def.a !== path[i], kind, user, () => {
        hit(path[i + 1]);
        after(0.06, () => hop(i + 1));
      });
    };
    hop(0);
  }

  function paintQueue() {
    const el = nodeEls.get('rabbit');
    if (el) el.dataset.q = String(Math.min(3, queued));
  }

  // ----- Scenarios -----
  const has = (id: string) => edges.some((e) => e.active && (e.def.a === id || e.def.b === id));

  function latency(path: string[]): number {
    let ms = 0;
    for (let i = 0; i < path.length - 1; i++) ms += (edgeBetween(path[i], path[i + 1])?.def.ms ?? 0) * 2;
    return Math.max(1, Math.round(ms * rand(0.85, 1.3) + rand(0, 3)));
  }

  /** Request out along `path`, response straight back. */
  function roundTrip(path: string[], user: boolean, onDone?: () => void) {
    travel(path, 'req', user, () => travel([...path].reverse(), 'res', user, onDone));
  }

  /** Message leaves appointment-service, waits on the queue, then a consumer picks it up. */
  function publish(consumer: string, user: boolean) {
    travel(['appt', 'rabbit'], 'msg', user, () => {
      queued++;
      paintQueue();
      after(rand(0.3, 0.8), () => {
        queued = Math.max(0, queued - 1);
        paintQueue();
        travel(['rabbit', consumer], 'msg', user, () => {
          if (consumer === 'workflow') roundTrip(['workflow', 'pg'], user);
        });
      });
    });
  }

  /** Write: stored in PostgreSQL, answered with 202, and an event goes out on the queue. */
  function write(consumers: string[], user: boolean, onDone?: () => void) {
    travel(['client', 'gateway', 'appt', 'pg'], 'req', user, () =>
      travel(['pg', 'appt'], 'res', user, () => {
        travel(['appt', 'gateway', 'client'], 'res', user, onDone);
        consumers.filter(has).forEach((c, i) => after(i * 0.14, () => publish(c, user)));
      }),
    );
  }

  const READ = ['client', 'gateway', 'appt', 'pg'];
  const CACHE = ['client', 'gateway', 'redis'];

  function plan(target?: string): { run: (done: () => void) => void; result: Result; edgesUsed: string[][] } {
    const t = target ?? (flip++ % 2 === 0 ? 'pg' : 'redis');
    if (t === 'rabbit' || t === 'workflow' || t === 'notify') {
      const consumer = t === 'notify' && has('notify') ? 'notify' : 'workflow';
      const tail = ['appt', 'rabbit', consumer];
      return {
        run: (done) => write([consumer], true, done),
        result: { status: '202 Accepted', ms: latency(READ), route: ['client', 'gateway', ...tail] },
        edgesUsed: [READ, tail],
      };
    }
    const path = t === 'redis' ? CACHE : READ.slice(0, Math.max(2, READ.indexOf(t) + 1));
    return {
      run: (done) => roundTrip(path, true, done),
      result: { status: '200 OK', ms: latency(path), route: path },
      edgesUsed: [path],
    };
  }

  function markRoute(paths: string[][], hold: number) {
    window.clearTimeout(routeTimer);
    edges.forEach((e) => e.base.classList.remove('is-route'));
    nodeEls.forEach((el) => el.classList.remove('is-route'));
    for (const path of paths) {
      path.forEach((id) => nodeEls.get(id)?.classList.add('is-route'));
      for (let i = 0; i < path.length - 1; i++) edgeBetween(path[i], path[i + 1])?.base.classList.add('is-route');
    }
    if (hold > 0) routeTimer = window.setTimeout(() => markRoute([], 0), hold);
  }

  function show(state: 'pending' | 'done', r: Result) {
    if (!readout || !statusEl || !msEl || !routeEl) return;
    readout.dataset.state = state;
    statusEl.textContent = state === 'pending' ? 'sent' : r.status;
    msEl.textContent = state === 'pending' ? '' : `${r.ms} ms`;
    routeEl.textContent = r.route.map(labelOf).join(' → ');
  }

  function send(target?: string) {
    const { run, result, edgesUsed } = plan(target);
    if (reduced) {
      markRoute(edgesUsed, 0);
      show('done', result);
      return;
    }
    markRoute(edgesUsed, 6000);
    show('pending', result);
    if (!started) start();
    run(() => show('done', result));
  }

  function scheduleAmbient(delay: number) {
    after(delay, () => {
      if (packets.length < 7) {
        const roll = Math.random();
        if (roll < 0.42) roundTrip(READ, false);
        else if (roll < 0.72) roundTrip(CACHE, false);
        else write(['workflow', 'notify'], false);
      }
      // Mostly calm, with the occasional request arriving right behind another.
      scheduleAmbient(Math.random() < 0.2 ? rand(0.25, 0.5) : rand(0.9, 2.4));
    });
  }

  /** Reduced motion: a frozen moment of the same traffic. */
  function staticFrame() {
    reset();
    const frozen: [string, string, PacketKind, number][] = [
      ['client', 'gateway', 'req', 0.62],
      ['gateway', 'appt', 'req', 0.5],
      ['pg', 'appt', 'res', 0.4],
      ['redis', 'gateway', 'res', 0.45],
      ['rabbit', 'workflow', 'msg', 0.55],
    ];
    for (const [a, b, kind, t] of frozen) {
      const edge = edgeBetween(a, b);
      if (edge) spawn(edge, edge.def.a !== a, kind, false, () => {}, t);
    }
    queued = 1;
    paintQueue();
    nodeEls.forEach((el, id) => el.classList.toggle('is-hit', id === 'gateway' || id === 'appt'));
  }

  // ----- Loop -----
  function tick(time: number) {
    raf = 0;
    const dt = Math.min(0.05, (time - last) / 1000);
    last = time;
    now += dt;

    for (let i = timers.length - 1; i >= 0; i--) {
      if (timers[i].at <= now) timers.splice(i, 1)[0].fn();
    }
    for (let i = packets.length - 1; i >= 0; i--) {
      const p = packets[i];
      p.t += dt / p.dur;
      if (p.t >= 1) {
        packets.splice(i, 1);
        release(p);
        p.done();
      } else {
        place(p);
      }
    }
    if (canRun()) raf = requestAnimationFrame(tick);
  }

  const canRun = () => !reduced && started && visible && !document.hidden;

  /** Resume after a pause without counting the time spent away. */
  function run() {
    if (raf || !canRun()) return;
    raf = requestAnimationFrame((t) => {
      last = t;
      raf = requestAnimationFrame(tick);
    });
  }

  function start() {
    if (started) return;
    started = true;
    stage!.classList.add('is-on');
    if (reduced) staticFrame();
    else {
      roundTrip(READ, false);
      scheduleAmbient(0.7);
      run();
    }
  }

  // ----- Pointer proximity (fine pointers only) -----
  let px = 0;
  let py = 0;
  let nearRaf = 0;
  const paintNear = () => {
    nearRaf = 0;
    nodeEls.forEach((el) => {
      const r = el.getBoundingClientRect();
      const dist = Math.hypot(px - (r.left + r.width / 2), py - (r.top + r.height / 2));
      el.style.setProperty('--near', Math.max(0, 1 - dist / 190).toFixed(2));
    });
  };
  const onMove = (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return;
    px = e.clientX;
    py = e.clientY;
    if (!nearRaf) nearRaf = requestAnimationFrame(paintNear);
  };
  const onLeave = () => nodeEls.forEach((el) => el.style.setProperty('--near', '0'));
  root.addEventListener('pointermove', onMove, { passive: true });
  root.addEventListener('pointerleave', onLeave);

  // ----- Wiring -----
  const onClick = (e: Event) => {
    const node = (e.target as Element).closest<HTMLElement>('[data-node]');
    if (node) send(node.dataset.node);
  };
  stage.addEventListener('click', onClick);
  const onSend = () => send();
  sendBtn?.addEventListener('click', onSend);

  const ro = new ResizeObserver(layout);
  ro.observe(stage);
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    run();
  });
  io.observe(stage);
  const onVis = () => run();
  document.addEventListener('visibilitychange', onVis);

  layout();

  return {
    edgePaths: () => edges.filter((e) => e.active).map((e) => e.base),
    start,
    send,
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      stage.removeEventListener('click', onClick);
      sendBtn?.removeEventListener('click', onSend);
      svg.remove();
      stage.classList.remove('is-live', 'is-on');
    },
  };
}
