import React, { useEffect, useRef, useState } from "react";

// ============ COSTANTI ============
const W = 216;
const H = 384;
const HERO_X = 70;
const WATER_TOP = 320;
const STREET_TOP = 252;
const WALK_SPEED = 30;
const STOP_DISTANCE = 34; // distanza a cui si ferma davanti all'oggetto
const SKY_PARALLAX = 0.15; // il cielo scorre piu lentamente degli altri livelli
const CLOUD_PARALLAX = 0.25; // le nuvole scorrono piu in fretta del cielo, meno dei palazzi
const BUILDING_OVERLAP = 8; // incrocio totale tra palazzi consecutivi
const BUILDING_SIDE_MARGIN = 4; // margine laterale per lato che invade il corpo del vicino
const BUILDING_BOTTOM_MARGIN = 2; // ultime righe dello sprite che coprono la cima della salizada

type Ctx = CanvasRenderingContext2D;

function px(p: Ctx, x: number, y: number, w: number, h: number, c: string) {
  p.fillStyle = c;
  p.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
}

function shade(hex: string, f: number) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.min(255, Math.round(((n >> 16) & 255) * f));
  const g = Math.min(255, Math.round(((n >> 8) & 255) * f));
  const b = Math.min(255, Math.round((n & 255) * f));
  return "rgb(" + r + "," + g + "," + b + ")";
}

// ============ OGGETTI / INCONTRI ============
type EncDef = {
  word: string;
  hint: string;
  size: number; // altezza a terra (px logici)
  draw: (p: Ctx, x: number, groundY: number, t: number) => void;
};

const CAT: EncDef = {
  word: "gato", hint: "Falo gnaolar...", size: 20,
  draw: (p, x, gy, t) => {
    const bob = Math.round(Math.sin(t / 400) * 1);
    const c = "#e8a33d", d = shade("#e8a33d", 0.75), l = shade("#e8a33d", 1.2);
    const y = gy - 20 - bob;
    // coda
    px(p, x + 1, y + 8, 3, 2, c); px(p, x, y + 6, 2, 3, c); px(p, x, y + 4, 2, 3, d);
    // corpo
    px(p, x + 3, y + 9, 13, 6, c); px(p, x + 4, y + 8, 11, 2, l);
    // zampe
    px(p, x + 4, y + 15, 2, 4, c); px(p, x + 5, y + 18, 2, 2, "#f5deb3");
    px(p, x + 12, y + 15, 2, 4, c); px(p, x + 13, y + 18, 2, 2, "#f5deb3");
    // testa
    px(p, x + 13, y + 3, 8, 7, c);
    // orecchie
    px(p, x + 13, y + 1, 2, 3, d); px(p, x + 19, y + 1, 2, 3, d);
    px(p, x + 13, y + 1, 2, 1, "#c97b2c"); px(p, x + 19, y + 1, 2, 1, "#c97b2c");
    // strisce
    px(p, x + 15, y + 3, 1, 4, d); px(p, x + 18, y + 3, 1, 4, d);
    px(p, x + 6, y + 9, 1, 5, d); px(p, x + 9, y + 9, 1, 5, d);
    // occhi
    px(p, x + 15, y + 5, 2, 2, "#1a3c6e"); px(p, x + 18, y + 5, 2, 2, "#1a3c6e");
    px(p, x + 15, y + 5, 1, 1, "#fff"); px(p, x + 18, y + 5, 1, 1, "#fff");
    // muso e baffi
    px(p, x + 16, y + 8, 3, 2, "#f5deb3"); px(p, x + 17, y + 8, 1, 1, "#c46a6a");
    px(p, x + 14, y + 8, 2, 1, "#fff"); px(p, x + 19, y + 8, 2, 1, "#fff");
  },
};

const SEAGULL: EncDef = {
  word: "cocal", hint: "El zola sora el canal.", size: 18,
  draw: (p, x, gy, t) => {
    const flap = Math.sin(t / 150) > 0 ? -3 : 2;
    const c = "#f2f2f2", g = "#c9c9c9", b = "#e0e0e0";
    const y = gy - 28 + Math.round(Math.sin(t / 300) * 2);
    // corpo e testa
    px(p, x + 5, y + 10, 14, 6, c); px(p, x + 5, y + 15, 12, 2, g);
    px(p, x + 16, y + 10, 4, 4, c); px(p, x + 18, y + 8, 5, 4, c);
    px(p, x + 22, y + 9, 3, 2, "#f5a623"); px(p, x + 25, y + 9, 2, 1, "#f5a623");
    px(p, x + 20, y + 9, 1, 1, "#111");
    // ali
    px(p, x + 2, y + 10 + flap, 6, 3, b); px(p, x - 1, y + 11 + flap * 2, 4, 2, g);
    px(p, x + 8, y + 9 + flap, 8, 2, b);
    // coda e zampe
    px(p, x + 7, y + 15, 6, 2, "#5a5a5a"); px(p, x + 9, y + 17, 2, 4, "#f5a623");
  },
};

const CHAIR: EncDef = {
  word: "carega", hint: "Ti ghe senta incima.", size: 21,
  draw: (p, x, gy) => {
    const w = "#a3622c", d = "#7a4419", l = "#c07f45";
    const y = gy - 21;
    px(p, x + 4, y + 2, 3, 12, w); px(p, x + 5, y + 3, 1, 10, l);
    px(p, x + 4, y + 13, 16, 3, w); px(p, x + 5, y + 13, 14, 1, l);
    px(p, x + 4, y + 16, 2, 5, d); px(p, x + 17, y + 16, 2, 5, d);
    px(p, x + 6, y + 5, 12, 2, d); px(p, x + 6, y + 9, 12, 2, d);
  },
};

const FIRE: EncDef = {
  word: "fogo", hint: "El scalda e el brusa.", size: 21,
  draw: (p, x, gy, t) => {
    const f1 = Math.round(Math.sin(t / 120) * 2);
    const f2 = Math.round(Math.cos(t / 90) * 2);
    const y = gy - 21;
    // legni
    px(p, x + 3, y + 18, 18, 3, "#6b4423"); px(p, x + 5, y + 16, 14, 3, "#54341b");
    // fiamme
    px(p, x + 6, y + 8 + f1, 12, 9, "#e2542c");
    px(p, x + 4, y + 12 + f2, 4, 5, "#e2542c"); px(p, x + 16, y + 12 + f2, 4, 5, "#e2542c");
    px(p, x + 8, y + 5 + f2, 8, 12, "#f2882c");
    px(p, x + 10, y + 2 + f1, 4, 10, "#ffd22c");
    px(p, x + 11, y + 12, 2, 4, "#fff2a8");
    // scintille
    px(p, x + 14 + f2, y - 1, 2, 2, "#ffd22c"); px(p, x + 7 - f1, y, 1, 2, "#f2882c");
  },
};

const LANTERN: EncDef = {
  word: "feral", hint: "El schiara la note", size: 21,
  draw: (p, x, gy, t) => {
    const glow = 0.75 + 0.25 * Math.sin(t / 300);
    const m = "#3a3f52", dm = "#262a38";
    const y = gy - 21;
    // alone
    p.fillStyle = "rgba(255,196,90," + 0.18 * glow + ")";
    p.fillRect(x + 3, y + 2, 18, 18);
    px(p, x + 10, y, 4, 3, m);
    px(p, x + 6, y + 3, 12, 2, m);
    px(p, x + 7, y + 5, 10, 10, m);
    px(p, x + 8, y + 6, 8, 8, "rgba(255,196,90," + glow + ")");
    px(p, x + 10, y + 8, 4, 4, "rgba(255,230,150," + Math.min(1, glow + 0.2) + ")");
    px(p, x + 7, y + 15, 10, 2, m);
    px(p, x + 8, y + 17, 8, 1, dm);
    px(p, x + 11, y + 18, 2, 3, dm);
  },
};

const ENCOUNTERS: EncDef[] = [CAT, SEAGULL, CHAIR, FIRE, LANTERN];
const ENC_SPACING = 260; // distanza nel mondo tra un incontro e il prossimo

// ============ CIELO ============
// gradiente di base: fallback finche il tile seamless non e caricato,
// e riempimento sotto il tile (fra i palazzi)
function drawSky(p: Ctx, camX: number, tile: HTMLImageElement | null, clouds: HTMLImageElement | null) {
  px(p, 0, 0, W, 60, "#7ec4e8");
  px(p, 0, 60, W, 40, "#93d0ef");
  px(p, 0, 100, W, 30, "#a9dcf5");
  const parallax = (img: HTMLImageElement, f: number) => {
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;
    const off = ((camX * f) % iw + iw) % iw;
    for (let x = -off; x < W; x += iw) {
      p.drawImage(img, Math.round(x), 0, iw, ih);
    }
  };
  // tile seamless che scorre (se caricato): parallasse lenta
  if (tile && tile.complete && tile.naturalWidth > 0) {
    parallax(tile, SKY_PARALLAX);
  }
  // sole: fisso, fuori dal tile (cosi non si ripete)
  px(p, 170, 20, 14, 14, "#fff3b0");
  px(p, 172, 18, 10, 18, "#fff3b0");
  px(p, 168, 22, 18, 10, "#fff3b0");
  // layer nuvole: sopra il cielo e il sole, sotto i palazzi (se caricato)
  if (clouds && clouds.complete && clouds.naturalWidth > 0) {
    parallax(clouds, CLOUD_PARALLAX);
  }
}

// ============ PALAZZI ============
// sistema elastico: ogni PNG dentro public/sprites/palazzi/ viene rilevato
// automaticamente alla build e usato nel mondo, con dimensioni libere
const BUILDING_URLS = import.meta.glob<string>("../public/sprites/palazzi/*.png", {
  eager: true,
  query: "?url",
  import: "default",
});
const FACADES = ["#c7645c", "#b78452", "#8d9a6b", "#a3785f", "#7f8ba8", "#c99a6a"];
const BUILDING_W = 90;
const SKYLINE = [90, 74, 100, 82];

function drawGothicWindow(p: Ctx, wx: number, wy: number) {
  // trifora gotica: tre archi a sesto acuto in cornice chiara
  px(p, wx - 2, wy - 2, 46, 32, "#e0d5c0");
  for (let k = 0; k < 3; k++) {
    const ax = wx + k * 14;
    px(p, ax, wy + 4, 12, 22, "#3d3a4e");
    px(p, ax + 2, wy + 1, 8, 4, "#3d3a4e");
    px(p, ax + 4, wy + 1, 4, 2, "#3d3a4e");
    px(p, ax + 2, wy + 4, 10, 19, "#5a6a8a");
    px(p, ax + 4, wy + 6, 3, 8, "#7a8ab0");
    px(p, ax + 11, wy + 1, 2, 25, "#e0d5c0");
  }
  px(p, wx + 5, wy, 4, 3, "#e0d5c0");
  px(p, wx + 19, wy, 4, 3, "#e0d5c0");
  px(p, wx + 33, wy, 4, 3, "#e0d5c0");
  px(p, wx - 2, wy + 29, 46, 2, "#cfc4ae");
}

function drawBuilding(p: Ctx, i: number, bx: number) {
  const bh = SKYLINE[((i % 4) + 4) % 4];
  const c = FACADES[((i % FACADES.length) + FACADES.length) % FACADES.length];
  const top = 70 + (110 - bh);
  const bottom = STREET_TOP;
  const isGothic = ((i % 4) + 4) % 4 === 0; // un palazzo su quattro ha le trifore
  // facciata
  px(p, bx, top, BUILDING_W - 4, bottom - top, c);
  px(p, bx, top, BUILDING_W - 4, 4, shade(c, 0.72));       // cornicione
  px(p, bx, bottom - 6, BUILDING_W - 4, 6, shade(c, 0.6)); // zoccolo

  // finestre
  for (let r = 0; r < 3; r++) {
    const wy = top + 14 + r * 34;
    if (isGothic) {
      if (wy + 31 > bottom - 12) break;
      drawGothicWindow(p, bx + 20, wy);
    } else {
      if (wy + 24 > bottom - 10) break;
      for (let col = 0; col < 2; col++) {
        const wx = bx + 10 + col * 36;
        if (wx + 16 > bx + BUILDING_W - 8) break;
        const lit = (Math.abs(i * 3 + r * 5 + col * 7) % 5) === 0;
        px(p, wx, wy + 4, 16, 20, "#3d3a4e");
        px(p, wx + 2, wy, 12, 5, "#3d3a4e");
        px(p, wx + 2, wy + 5, 12, 17, lit ? "#ffd98c" : "#6b6a85");
        px(p, wx + 7, wy + 5, 1, 17, "#3d3a4e");
      }
    }
  }

  // tetto a falda in terracotta con comignolo
  const rw = BUILDING_W - 4;
  px(p, bx - 3, top - 8, rw + 6, 8, "#a8543c");
  px(p, bx - 3, top - 8, rw + 6, 2, "#c06a4e");
  px(p, bx - 3, top, rw + 6, 2, shade("#a8543c", 0.7));
  px(p, bx - 6, top - 5, 4, 5, "#94452f");
  px(p, bx + rw + 1, top - 5, 4, 5, "#94452f");
  px(p, bx + rw - 18, top - 20, 7, 13, "#7a3b2a");
  px(p, bx + rw - 19, top - 22, 9, 3, "#8d4a35");
  px(p, bx + rw - 18, top - 10, 7, 2, shade("#7a3b2a", 0.7));

  // porta d'ingresso con arco, divisione ante e gradino
  const dx = bx + (BUILDING_W - 4) / 2 - 9;
  const dy = bottom - 34;
  px(p, dx - 2, dy - 2, 22, 36, "#d9cfb8");
  px(p, dx, dy, 18, 32, "#3d3a4e");
  px(p, dx + 1, dy - 6, 16, 8, "#3d3a4e");
  px(p, dx + 2, dy + 2, 14, 28, "#5d4632");
  px(p, dx + 8, dy + 2, 1, 28, shade("#5d4632", 0.6));
  px(p, dx + 4, dy + 12, 3, 3, "#c9a227");
  px(p, dx + 11, dy + 12, 3, 3, "#c9a227");
  px(p, dx - 3, dy + 30, 24, 4, "#cfc4ae");
}

function drawBuildings(p: Ctx, camX: number) {
  const spacing = BUILDING_W;
  const first = Math.floor(camX / spacing) - 1;
  for (let k = 0; k < 5; k++) {
    const i = first + k;
    const bx = i * spacing - camX;
    drawBuilding(p, i, bx);
  }
}

type BuildingWorld = { items: { img: HTMLImageElement; x: number }[]; nextX: number; lastIdx: number };

// palazzi elastici: prende a caso i PNG rilevati in public/sprites/palazzi/, uno dopo l'altro
// attacco a incrocio: il successivo entra di BUILDING_OVERLAP px e vince nella fascia A,
// mentre il margine destro del precedente (ridisegnato sopra tutto) vince nella fascia B
// ritorna true se ha disegnato con gli sprite, false se serve il fallback procedurale
function drawBuildingsElastic(p: Ctx, camX: number, imgs: HTMLImageElement[], world: BuildingWorld): boolean {
  const ready = imgs.filter((im) => im.complete && im.naturalWidth > 0);
  if (ready.length === 0) return false;

  // genera tutti i palazzi necessari a coprire lo schermo e un po' oltre
  while (world.nextX < camX + W + 80) {
    let idx = Math.floor(Math.random() * ready.length);
    if (ready.length > 1 && idx === world.lastIdx) idx = (idx + 1) % ready.length;
    world.lastIdx = idx;
    const img = ready[idx];
    world.items.push({ img, x: world.nextX });
    world.nextX += img.naturalWidth - BUILDING_OVERLAP;
  }
  // scarta a monte i palazzi ormai fuori schermo
  while (world.items.length && world.items[0].x + world.items[0].img.naturalWidth < camX - 80) {
    world.items.shift();
  }

  // primo passaggio: tutti i palazzi interi (il successivo copre il precedente nella fascia A)
  const visible: { sx: number; img: HTMLImageElement }[] = [];
  for (const it of world.items) {
    const sx = Math.round(it.x - camX);
    const w = it.img.naturalWidth;
    if (sx < W && sx + w > 0) {
      p.drawImage(it.img, sx, STREET_TOP + BUILDING_BOTTOM_MARGIN - it.img.naturalHeight, w, it.img.naturalHeight);
      visible.push({ sx, img: it.img });
    }
  }
  // secondo passaggio: le strisce di margine destro ridisegnate sopra tutto, cosicche
  // gli elementi del margine del precedente sporgono sul successivo (fascia B)
  const m = BUILDING_SIDE_MARGIN;
  for (const v of visible) {
    const w = v.img.naturalWidth;
    const h = v.img.naturalHeight;
    const yTop = STREET_TOP + BUILDING_BOTTOM_MARGIN - h;
    p.drawImage(v.img, w - m, 0, m, h, v.sx + w - m, yTop, m, h);
  }
  return true;
}

// ============ SALIZADA (con leggera prospettiva) ============
function drawStreet(p: Ctx, camX: number) {
  const depth = WATER_TOP - STREET_TOP; // 68 px di profondita
  // campitura: piu chiara in lontananza (lontano = in alto)
  px(p, 0, STREET_TOP, W, 22, "#9a968f");
  px(p, 0, STREET_TOP + 22, W, 24, "#8f8b86");
  px(p, 0, STREET_TOP + 46, W, depth - 46, "#847f7a");
  px(p, 0, STREET_TOP, W, 2, "#a8a49e");
  px(p, 0, WATER_TOP - 3, W, 3, "#5f5c58");
  // basoli: le file lontane sono piu sottili e strette, quelle vicine piu grandi
  const rows = [
    { y: STREET_TOP + 2, h: 8,  sw: 16, off: 0 },  // lontano: pietre piccole
    { y: STREET_TOP + 11, h: 10, sw: 20, off: 10 },
    { y: STREET_TOP + 22, h: 12, sw: 24, off: 5 },
    { y: STREET_TOP + 35, h: 14, sw: 28, off: 14 },
    { y: STREET_TOP + 50, h: 15, sw: 32, off: 7 }, // vicino: pietre grandi
  ];
  for (let r = 0; r < rows.length; r++) {
    const { y, h, sw, off } = rows[r];
    // tutta la salizada scorre come un blocco unico: stessa velocita per ogni fila
    const scroll = camX;
    const n = Math.ceil(W / sw) + 2;
    const firstIdx = Math.floor(scroll / sw);
    for (let s = 0; s < n; s++) {
      const i = firstIdx + s;
      const sx = i * sw + off - scroll;
      if (sx > W) break;
      // pietra con variazione di tono
      const tone = ((i + r * 3) % 3);
      const c = tone === 0 ? "#7d7974" : tone === 1 ? "#86827c" : "#75716d";
      px(p, sx + 1, y, sw - 2, h - 1, c);
      px(p, sx + 1, y, sw - 2, 1, shade(c, 1.18));       // luce sopra
      px(p, sx + 1, y + h - 2, sw - 2, 1, shade(c, 0.8)); // ombra sotto
    }
  }
}

// ============ ACQUA ============
function drawWater(p: Ctx, camX: number, t: number) {
  px(p, 0, WATER_TOP, W, 8, "#3f6d8e");
  px(p, 0, WATER_TOP + 8, W, H - WATER_TOP - 8, "#35607f");
  for (let row = 0; row < 3; row++) {
    const yy = WATER_TOP + 10 + row * 12;
    for (let s = 0; s < 6; s++) {
      const wx = ((s * 48 + t * 0.001 * WALK_SPEED - camX * 0.5) % (W + 48) + W + 48) % (W + 48) - 24;
      px(p, wx, yy + Math.sin(t / 500 + s + row) * 1.5, 24, 2, row % 2 ? "#4b7d9e" : "#5d8fae");
    }
  }
  for (let k = 0; k < 6; k++) {
    const rx = ((k * 42 - camX * 0.5) % (W + 42) + W + 42) % (W + 42) - 21;
    px(p, rx, WATER_TOP + 4, 4, 12, "rgba(255,217,140,0.22)");
  }
}

// ============ GONDOLIERE ============
function drawGondolier(p: Ctx, t: number, walking: boolean, sheet: HTMLImageElement | null) {
  const x = HERO_X;
  // niente bob procedurale: il movimento verticale e gia nei frame dello sprite
  const y = 226;
  // se lo sprite sheet e caricato, usiamo i frame PNG (frame da 24x48)
  if (sheet && sheet.complete && sheet.naturalWidth > 0) {
    const fw = 24, fh = 48;
    const nFrames = Math.max(1, Math.floor(sheet.naturalWidth / fw));
    const frame = walking ? Math.floor(t / 150) % nFrames : 0;
    p.drawImage(sheet, frame * fw, 0, fw, fh, x, y - 2, fw, fh);
    return;
  }
  // fallback: disegno procedurale (finche lo sprite non e disponibile)
  const cycle = t / 150;
  const step = walking ? Math.floor(cycle) % 2 : 0;

  const skin = "#d9a066", skinD = "#b07a45";
  const shirt = "#f0f0f0", shirtD = "#c9c9c9", red = "#c0392b";
  const pant = "#3a3f52", hat = "#e8e4da", hatD = "#c2bcae";

  if (step === 0) {
    px(p, x + 9, y + 30, 3, 9, pant); px(p, x + 8, y + 39, 5, 3, "#222");
  } else {
    px(p, x + 11, y + 30, 3, 7, pant); px(p, x + 13, y + 37, 5, 3, "#222");
  }
  if (step === 0) {
    px(p, x + 14, y + 30, 3, 8, pant); px(p, x + 15, y + 38, 5, 3, "#222");
  } else {
    px(p, x + 12, y + 30, 3, 9, pant); px(p, x + 11, y + 39, 5, 3, "#222");
  }

  px(p, x + 7, y + 16, 11, 15, shirt);
  px(p, x + 7, y + 19, 11, 2, red);
  px(p, x + 7, y + 23, 11, 2, shirtD);
  px(p, x + 7, y + 27, 11, 2, red);
  px(p, x + 7, y + 16, 11, 1, shirtD);
  px(p, x + 9, y + 15, 7, 3, red);
  px(p, x + 9, y + 17, 7, 2, shade("#c0392b", 0.8));

  const armSwing = walking ? (step === 0 ? 0 : 2) : 0;
  px(p, x + 4, y + 18 + armSwing, 3, 10, shirt);
  px(p, x + 4, y + 27 + armSwing, 3, 3, skin);
  px(p, x + 18, y + 20 - armSwing, 3, 10, shirt);
  px(p, x + 18, y + 29 - armSwing, 3, 3, skin);

  px(p, x + 8, y + 5, 9, 11, skin);
  px(p, x + 8, y + 5, 9, 2, skinD);
  px(p, x + 8, y + 9, 2, 2, "#222");
  px(p, x + 12, y + 12, 4, 1, skinD);
  px(p, x + 12, y + 13, 3, 1, skinD);

  px(p, x + 6, y + 3, 13, 2, hat);
  px(p, x + 8, y - 2, 9, 5, hat);
  px(p, x + 8, y, 9, 2, red);
  px(p, x + 6, y + 5, 13, 1, hatD);
}

// Gondoliere che cade: braccia alzate, gambe unite, espressione sorpresa
function drawGondolierFalling(p: Ctx, y: number, t: number) {
  const x = HERO_X;
  const skin = "#d9a066", skinD = "#b07a45";
  const shirt = "#f0f0f0", shirtD = "#c9c9c9", red = "#c0392b";
  const pant = "#3a3f52", hat = "#e8e4da", hatD = "#c2bcae";

  // gambe unite
  px(p, x + 11, y + 30, 3, 9, pant); px(p, x + 10, y + 39, 5, 3, "#222");

  // corpo
  px(p, x + 7, y + 16, 11, 15, shirt);
  px(p, x + 7, y + 19, 11, 2, red);
  px(p, x + 7, y + 23, 11, 2, shirtD);
  px(p, x + 7, y + 27, 11, 2, red);
  px(p, x + 9, y + 15, 7, 3, red);

  // braccia alzate in alto (panico!)
  px(p, x + 4, y + 6, 3, 11, shirt);  px(p, x + 4, y + 2, 3, 5, skin);
  px(p, x + 18, y + 6, 3, 11, shirt); px(p, x + 18, y + 2, 3, 5, skin);

  // testa
  px(p, x + 8, y + 5, 9, 11, skin);
  px(p, x + 8, y + 5, 9, 2, skinD);
  px(p, x + 8, y + 9, 2, 2, "#fff"); px(p, x + 8, y + 9, 1, 1, "#222"); // occhio sbarato
  px(p, x + 12, y + 9, 2, 2, "#fff"); px(p, x + 13, y + 9, 1, 1, "#222");
  px(p, x + 11, y + 13, 3, 2, "#8b4a3a"); // bocca aperta

  // cappello che vola via
  px(p, x + 6, y + 3, 13, 2, hat);
  px(p, x + 8, y - 2, 9, 5, hat);
  px(p, x + 8, y, 9, 2, red);
  px(p, x + 6, y + 5, 13, 1, hatD);
}

// ============ COMPONENTE ============
type Phase = "title" | "walking" | "stopped" | "correct" | "wrong" | "falling" | "gameover";
type Mode = "normale" | "esperto" | "esplora";

const MODES: { id: Mode; label: string; desc: string }[] = [
  { id: "normale", label: "NORMALE", desc: "Scrivi el nome dei ogeti che te cati par la strada." },
  { id: "esperto", label: "ESPERTO", desc: "Le parole no le gavara indreture." },
  { id: "esplora", label: "ESPLORA", desc: "Le parole le te vien mostra diretamente, senza competizion." },
];

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [phase, setPhase] = useState<Phase>("title");
  const [mode, setMode] = useState<Mode>("normale");
  const [paused, setPaused] = useState(false);
  const [input, setInput] = useState("");
  const [encIdx, setEncIdx] = useState(0); // indice incontro corrente
  const [score, setScore] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // sprite sheet del gondoliere: caricata se il PNG esiste in public/sprites/
  const sheetRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = "./sprites/gondoliere/gondolier_walking.png";
    img.onload = () => { sheetRef.current = img; };
  }, []);

  // tile del cielo: caricato se il PNG esiste in public/sprites/
  const skyRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = "./sprites/scena/sky_tile.png";
    img.onload = () => { skyRef.current = img; };
  }, []);

  // layer nuvole: caricato se il PNG esiste in public/sprites/
  const cloudsRef = useRef<HTMLImageElement | null>(null);
  useEffect(() => {
    const img = new Image();
    img.src = "./sprites/scena/clouds_tile.png";
    img.onload = () => { cloudsRef.current = img; };
  }, []);

  // sprites dei palazzi: uno HTMLImageElement per ogni PNG rilevato
  const buildingsImgsRef = useRef<HTMLImageElement[]>([]);
  useEffect(() => {
    buildingsImgsRef.current = Object.values(BUILDING_URLS).map((url) => {
      const img = new Image();
      img.src = url;
      return img;
    });
  }, []);

  // stato del mondo mutabile, gestito dal loop
  const g = useRef({
    camX: 100,                       // posizione mondo della camera
    nextEncWorld: 0,                // posizione mondo del prossimo incontro
    enc: 0,                          // indice incontro corrente (sincronizzato con encIdx)
    fallT: 0,                        // timer della caduta in acqua
    splash: 0,                       // timer dello splash
    buildings: {
      items: [] as { img: HTMLImageElement; x: number }[],
      nextX: 0,
      lastIdx: -1,
    },
  });

  const resetBuildings = () => {
    g.current.buildings = { items: [], nextX: 0, lastIdx: -1 };
  };

  // sequenza incontri: ordine casuale, poi ripetuta a rotazione
  const shuffle = (arr: EncDef[]) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const [seq, setSeq] = useState<EncDef[]>(() => shuffle(ENCOUNTERS));
  const encAt = (i: number) => seq[((i % seq.length) + seq.length) % seq.length];
  const encWorldPos = (i: number) => 300 + i * ENC_SPACING;

  // posizioni iniziali
  useEffect(() => {
    g.current.camX = 100;
    g.current.nextEncWorld = encWorldPos(0);
  }, []);

  useEffect(() => {
    if (phase === "stopped" && mode !== "esplora" && !paused) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [phase, mode, paused]);

  const resetWorld = () => {
    g.current.camX = 100;
    g.current.enc = 0;
    g.current.fallT = 0;
    g.current.splash = 0;
    resetBuildings();
    setSeq(shuffle(ENCOUNTERS));
    setEncIdx(0); setScore(0); setInput("");
  };

  const startGame = (m: Mode) => {
    resetWorld();
    setMode(m);
    setPhase("walking");
  };

  // esplora: il giocatore ha visto la parola, riparte senza sfida
  const vaVanti = () => {
    if (phase !== "stopped" || mode !== "esplora") return;
    g.current.enc += 1;
    setEncIdx((i) => i + 1);
    setPhase("walking");
  };

  const submit = () => {
    if (phase !== "stopped" || mode === "esplora") return;
    const enc = encAt(g.current.enc);
    const ok = input.trim().toLowerCase() === enc.word;
    setPhase(ok ? "correct" : "wrong");
    if (ok) setScore((s) => s + 10);
    if (ok) {
      setTimeout(() => {
        // l'oggetto superato "resta indietro": passiamo al prossimo incontro
        g.current.enc += 1;
        setEncIdx((i) => i + 1);
        setInput("");
        setPhase("walking");
      }, 1100);
    } else {
      // dopo il messaggio d'errore: salto e caduta in acqua
      setTimeout(() => {
        g.current.fallT = 0; // azzera il timer della caduta
        setPhase("falling");
      }, 1100);
    }
  };

  // ============ LOOP DI RENDERING ============
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const p = canvas.getContext("2d");
    if (!p) return;

    let raf = 0;
    let last = performance.now();
    let camX = g.current.camX;
    let stoppedCam = false;

    const loop = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;

      const enc = encAt(g.current.enc);
      const encX = encWorldPos(g.current.enc); // posizione mondo dell'oggetto

      // schermo-x dell'oggetto (posizione sullo schermo)
      const encScreenX = encX - camX;

      // FERMATA: quando l'oggetto arriva a STOP_DISTANCE davanti al gondoliere
      // (con pausa attiva tutto e congelato: camera e fisica non avanzano)
      if (phase === "walking" && !paused && encScreenX <= HERO_X + STOP_DISTANCE) {
        camX = encX - HERO_X - STOP_DISTANCE; // allinea l'oggetto davanti al gondoliere
        stoppedCam = true;
        setPhase("stopped");
      }

      if (phase === "walking" && !paused && !stoppedCam) camX += WALK_SPEED * dt;

      // CADUTA: un solo salto, poi caduta con gravita fino a scomparire sott'acqua
      let fallOffset = 0;
      let splashT = 0;
      let heroVisible = true;
      if ((phase === "falling" || phase === "gameover") && !paused) {
        g.current.fallT += dt;
        const ft = g.current.fallT;
        const jumpDur = 0.25;
        if (ft < jumpDur) {
          // UN solo saltello verso l'alto (quarto d'arco, niente discesa)
          fallOffset = -Math.sin((ft / jumpDur) * (Math.PI / 2)) * 10;
        } else {
          // caduta libera con gravita, solo verso il basso
          const ft2 = ft - jumpDur;
          fallOffset = -10 + 0.5 * 400 * ft2 * ft2;
        }
        // splash: una sola volta, quando i piedi passano il livello dell'acqua
        const waterLine = WATER_TOP - 2;
        if (226 + fallOffset + 39 >= waterLine) {
          if (g.current.splash === 0) g.current.splash = 0.0001;
          g.current.splash += dt;
          splashT = g.current.splash;
        }
        // sparisce sott'acqua quando la testa scende sotto il pelo
        if (226 + fallOffset >= WATER_TOP + 6) heroVisible = false;
        // dopo che e scomparso, mostra il game over
        if (phase === "falling" && !heroVisible && g.current.splash > 0.9) {
          setPhase("gameover");
        }
      }

      g.current.camX = camX;
      p.imageSmoothingEnabled = false;

      drawSky(p, camX, skyRef.current, cloudsRef.current);
      // prima la strada (sotto), poi i palazzi: le ultime 2 righe dello sprite
      // coprono la cima della salizada, senza fessure
      drawStreet(p, camX);
      if (!drawBuildingsElastic(p, camX, buildingsImgsRef.current, g.current.buildings)) {
        drawBuildings(p, camX);
      }
      drawWater(p, camX, now);

      // oggetti: quello corrente e quello appena superato (che arretra ed esce di scena)
      for (let j = g.current.enc - 1; j <= g.current.enc + 1; j++) {
        if (j < 0) continue;
        const e = encAt(j);
        const ex = encWorldPos(j) - camX;
        if (ex > -60 && ex < W + 60) {
          e.draw(p, ex, STREET_TOP + 44, now);
        }
      }

      // gondoliere: cammina solo in "walking"; braccia alzate durante la caduta
      const walkingNow = phase === "walking" && !paused;
      const falling = (phase === "falling" || phase === "gameover") && heroVisible;
      if (falling) {
        drawGondolierFalling(p, 226 + fallOffset, now);
        // splash: gocce e anello
        if (splashT > 0 && splashT < 0.8) {
          const rr = splashT * 30;
          px(p, HERO_X - 2 - rr, WATER_TOP + 2, 4, 3, "#cfe8f5");
          px(p, HERO_X + 16 + rr, WATER_TOP + 2, 4, 3, "#cfe8f5");
          for (let d = 0; d < 4; d++) {
            const da = (d / 4) * Math.PI - Math.PI / 2;
            px(p, HERO_X + 7 + Math.cos(da + splashT * 2) * rr * 0.6, WATER_TOP - 6 - Math.abs(Math.sin(da)) * (14 - splashT * 12), 3, 3, "#e8f5fb");
          }
        }
      } else {
        drawGondolier(p, now, walkingNow, sheetRef.current);
      }

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [phase, paused]);

  const currentEnc = encAt(encIdx);
  const showMessage =
    phase === "correct" ? { ok: true } : phase === "wrong" ? { ok: false } : null;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center gap-3 bg-[#141020] p-4">
      <div className="relative" style={{ width: "min(92vw, 380px)", aspectRatio: "9/16" }}>
        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          className="w-full h-full"
          style={{
            imageRendering: "pixelated",
            borderRadius: 8,
            border: "3px solid #3a2f4a",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
          }}
        />

        {/* SCHERMATA INIZIALE: scelta della modalita */}
        {phase === "title" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/45 px-4" style={{ borderRadius: 8 }}>
            <div className="text-center">
              <div className="text-[#ffd22c] text-3xl font-black tracking-wide" style={{ fontFamily: "'Playfair Display', Georgia, 'Times New Roman', serif" }}>
                SPASSIZADA A VENEZIA
              </div>
              <div className="text-white/80 text-[11px] mt-2 tracking-[0.3em]" style={{ fontFamily: "monospace" }}>
                IMPARA EL VENETO
              </div>
            </div>
            {MODES.map((m) => (
              <button
                key={m.id}
                onClick={() => startGame(m.id)}
                className="w-full text-left px-4 py-2 bg-[#c0392b] hover:bg-[#e74c3c] transition-colors"
                style={{ fontFamily: "monospace", border: "3px solid #ffd22c", boxShadow: "4px 4px 0 #7a1f14" }}
              >
                <div className="text-white text-base font-bold tracking-widest">{m.label}</div>
                <div className="text-white/80 text-[10px] mt-0.5 leading-snug">{m.desc}</div>
              </button>
            ))}
          </div>
        )}

        {/* HUD: pausa a sinistra, punti a destra */}
        {(phase === "walking" || phase === "stopped") && (
          <div className="absolute top-2 left-2 right-2 flex justify-between items-center text-[11px] font-bold">
            <button
              onClick={() => setPaused(true)}
              className="flex items-center gap-1 bg-black/50 hover:bg-black/70 text-white/90 px-2.5 py-1.5"
              style={{ fontFamily: "monospace", borderRadius: 4 }}
              aria-label="pausa"
            >
              <span className="inline-block w-[3px] h-3 bg-current" />
              <span className="inline-block w-[3px] h-3 bg-current" />
            </button>
            {mode === "esplora" ? (
              <span className="bg-black/50 text-[#9fd4f0] px-2 py-1" style={{ fontFamily: "monospace" }}>ESPLORA</span>
            ) : (
              <span className="bg-black/50 text-[#ffd22c] px-2 py-1" style={{ fontFamily: "monospace" }}>PUNTI {score}</span>
            )}
          </div>
        )}

        {/* MENU DI PAUSA */}
        {paused && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60" style={{ borderRadius: 8 }}>
            <div className="text-[#ffd22c] text-2xl font-black tracking-[0.25em]" style={{ fontFamily: "monospace" }}>
              PAUSA
            </div>
            <button
              onClick={() => setPaused(false)}
              className="px-6 py-2 bg-[#3d7a4f] text-white text-sm font-bold tracking-wider hover:bg-[#4d9a63]"
              style={{ fontFamily: "monospace", border: "2px solid #ffd22c" }}
            >
              TORNA AL ZOGO
            </button>
            <button
              onClick={() => {
                resetWorld();
                setPaused(false);
                setPhase("walking");
              }}
              className="px-6 py-2 bg-[#c0392b] text-white text-sm font-bold tracking-wider hover:bg-[#e74c3c]"
              style={{ fontFamily: "monospace", border: "2px solid #ffd22c" }}
            >
              SCOMENZA DA CAO
            </button>
            <button
              onClick={() => {
                resetWorld();
                setPaused(false);
                setPhase("title");
              }}
              className="px-6 py-2 bg-[#3a3226] text-white/90 text-sm font-bold tracking-wider hover:bg-[#52483a]"
              style={{ fontFamily: "monospace", border: "2px solid #ffd22c" }}
            >
              TORNA AL MENÙ
            </button>
          </div>
        )}

        {/* VIGNETTA: compare sopra il gondoliere e l'oggetto fermi */}
        {phase === "stopped" && !showMessage && (
          <div
            className="absolute left-3 right-3"
            style={{ top: "14%" }}
          >
            <div
              className="border-2 bg-[#fdf6e3] p-3"
              style={{ borderColor: "#3a3226", borderRadius: 4, boxShadow: "4px 4px 0 #3a3226" }}
            >
              <div className="text-[10px] text-[#8a6d3b] tracking-widest mb-1" style={{ fontFamily: "monospace" }}>
                {mode === "esplora" ? "TI GA CATÀ:" : "COSSA XELO QUESTO?"}
              </div>
              {mode === "esplora" ? (
                <>
                  <div className="text-base font-black text-[#2c2620] mb-1" style={{ fontFamily: "monospace" }}>
                    {currentEnc.word.toUpperCase()}
                  </div>
                  <div className="text-sm text-[#2c2620] mb-3" style={{ fontFamily: "monospace" }}>
                    {currentEnc.hint}
                  </div>
                  <button
                    onClick={vaVanti}
                    className="px-4 py-1.5 bg-[#3d7a4f] text-white text-xs font-bold border-2 border-[#3a3226]"
                    style={{ fontFamily: "monospace" }}
                  >
                    VA VANTI
                  </button>
                </>
              ) : (
                <>
                  {mode === "normale" && (
                    <div className="text-sm text-[#2c2620] mb-2" style={{ fontFamily: "monospace" }}>
                      {currentEnc.hint}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <input
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
                      placeholder="scrivi in veneto..."
                      className="flex-1 min-w-0 px-2 py-1.5 text-sm bg-white border-2 border-[#3a3226] outline-none"
                      style={{ fontFamily: "monospace" }}
                    />
                    <button
                      onClick={submit}
                      className="px-3 py-1.5 bg-[#3d7a4f] text-white text-xs font-bold border-2 border-[#3a3226]"
                      style={{ fontFamily: "monospace" }}
                    >
                      AVANTI
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* feedback esito */}
        {showMessage && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40" style={{ borderRadius: 8 }}>
            <div
              className={"px-6 py-4 border-2 text-center " + (showMessage.ok ? "bg-[#e8f5e9] border-[#2e7d32]" : "bg-[#fdecea] border-[#c0392b]")}
              style={{ borderRadius: 4, boxShadow: "4px 4px 0 #3a3226" }}
            >
              <div className={"text-lg font-black " + (showMessage.ok ? "text-[#2e7d32]" : "text-[#c0392b]")} style={{ fontFamily: "monospace" }}>
                {showMessage.ok ? "BENON! ✓" : "NO..."}
              </div>
              {!showMessage.ok && (
                <div className="text-xs text-[#2c2620] mt-1" style={{ fontFamily: "monospace" }}>
                  Se ghe dise "{currentEnc.word}"
                </div>
              )}
            </div>
          </div>
        )}

        {/* GAME OVER */}
        {phase === "gameover" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d2035]/85" style={{ borderRadius: 8 }}>
            <div className="text-[#9fd4f0] text-3xl font-black" style={{ fontFamily: "monospace" }}>SPLASH!</div>
            <div className="text-white/80 text-xs px-8 text-center leading-relaxed" style={{ fontFamily: "monospace" }}>
              El gondolier xe finio in aqua.<br />
              Punti totali: <span className="text-[#ffd22c] font-bold">{score}</span> · Incontri: {encIdx}
            </div>
            <button
              onClick={() => {
                resetWorld();
                setPhase("title");
              }}
              className="mt-2 px-6 py-2 bg-[#c0392b] text-white text-sm font-bold tracking-wider hover:bg-[#e74c3c]"
              style={{ fontFamily: "monospace", border: "2px solid #ffd22c" }}
            >
              TENTA DANOVO
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => {
          resetWorld();
          setPhase("title");
        }}
        className="px-4 py-1.5 bg-[#3a3226] text-white/70 text-[11px] font-bold tracking-wider hover:bg-[#52483a]"
        style={{ fontFamily: "monospace", border: "2px solid #ffd22c" }}
      >
        RICOMINCIA
      </button>
      <div className="text-white/40 text-[10px] text-center max-w-[380px]" style={{ fontFamily: "monospace" }}>
        Il gondoliere si ferma davanti all'oggetto e la vignetta compare sopra i due.
      </div>
    </div>
  );
}
