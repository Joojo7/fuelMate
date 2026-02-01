import {
  HUD_GREEN,
  ORIGIN_PIN_COLOR,
  DESTINATION_PIN_COLOR,
  STATUS_COLOR_CLOSED,
  STATUS_COLOR_CLOSING_SOON,
  STATUS_COLOR_UNKNOWN,
} from "@/lib/constants";
import { BRAND_COLORS } from "@/lib/types";
import L from "leaflet";

// ─── Brand logo SVGs (14×14 viewBox) ────────────────
const BRAND_LOGO_SVG: Record<string, string> = {
  bp: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#009b3a"/><text x="7" y="9.5" font-size="6" font-weight="bold" fill="#ffcc00" text-anchor="middle" font-family="sans-serif">bp</text></svg>`,
  shell: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 14 14"><path d="M7 1 L9 5 L13 5 L10 8 L11 12 L7 10 L3 12 L4 8 L1 5 L5 5 Z" fill="#fbce07" stroke="#dd1d21" stroke-width="0.8"/></svg>`,
  caltex: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#00a5b5"/><path d="M7 2 L8.2 5.5 L12 5.5 L9 7.8 L10 11.5 L7 9 L4 11.5 L5 7.8 L2 5.5 L5.8 5.5 Z" fill="#e21836"/></svg>`,
  "caltex-workshop": `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#00a5b5"/><path d="M4 3.5C4.8 2.7 6 2.5 7 3L5.5 4.5L5.5 6L7 6L8.5 4.5C9 5.5 8.8 6.7 8 7.5L10.5 10C10.8 10.3 10.8 10.8 10.5 11.1L10.1 11.5C9.8 11.8 9.3 11.8 9 11.5L6.5 9C5.7 9.8 4.5 10 3.5 9.5L5 8L5 6.5L3.5 6.5L2 8C1.5 7 1.7 5.8 2.5 5L4 3.5Z" fill="#f5a623"/></svg>`,
  totalenergies: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 14 14"><circle cx="7" cy="7" r="6" fill="#ed1c24"/><text x="7" y="9.5" font-size="5" font-weight="bold" fill="#fff" text-anchor="middle" font-family="sans-serif">TE</text></svg>`,
};

const GAS_PUMP_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="#0a0a0a" viewBox="0 0 256 256"><path d="M241,69.66,221.66,50.34a8,8,0,0,0-11.32,11.32L229.66,81A8,8,0,0,1,232,86.63V168a8,8,0,0,1-16,0V128a24,24,0,0,0-24-24H176V56a24,24,0,0,0-24-24H72A24,24,0,0,0,48,56V208H32a8,8,0,0,0,0,16H192a8,8,0,0,0,0-16H176V120h16a8,8,0,0,1,8,8v40a24,24,0,0,0,48,0V86.63A23.85,23.85,0,0,0,241,69.66ZM64,56a8,8,0,0,1,8-8h80a8,8,0,0,1,8,8v72a8,8,0,0,1-8,8H72a8,8,0,0,1-8-8Z"/></svg>`;

// ─── Icon factories ─────────────────────────────────

function createStationIcon(color: string, brand?: string, size = 30, selected = false): L.DivIcon {
  const pinH = size + 10;
  const borderW = selected ? 3 : 2;
  const shadow = selected
    ? `0 0 24px ${color}, 0 0 48px ${color}88, 0 0 72px ${color}44, 0 2px 10px rgba(0,0,0,0.7)`
    : `0 0 12px ${color}88, 0 2px 6px rgba(0,0,0,0.5)`;
  const dotSize = selected ? 8 : 6;
  const logoSvg = brand && BRAND_LOGO_SVG[brand] ? BRAND_LOGO_SVG[brand] : GAS_PUMP_SVG;
  const pulse = selected
    ? `<div style="
        position:absolute;top:${-(size * 0.35)}px;left:${-(size * 0.35)}px;
        width:${size * 1.7}px;height:${size * 1.7}px;
        border-radius:50%;
        border:2px solid ${color};
        opacity:0.6;
        animation:marker-pulse 1.5s ease-out infinite;
      "></div>`
    : "";
  const keyframes = selected
    ? `<style>@keyframes marker-pulse{0%{transform:scale(0.7);opacity:0.7}100%{transform:scale(1.3);opacity:0}}</style>`
    : "";
  return L.divIcon({
    className: "",
    html: `${keyframes}<div style="
      width:${size}px;height:${pinH}px;position:relative;
      display:flex;flex-direction:column;align-items:center;
      z-index:${selected ? 1000 : 1};
    ">
      <div style="
        width:${size}px;height:${size}px;position:relative;
        border-radius:50% 50% 50% 0;
        transform:rotate(-45deg);
        background:${color};
        border:${borderW}px solid rgba(255,255,255,${selected ? 0.8 : 0.3});
        box-shadow:${shadow};
        display:flex;align-items:center;justify-content:center;
      ">
        ${pulse}
        <div style="transform:rotate(45deg);display:flex;">${logoSvg}</div>
      </div>
      <div style="
        width:${dotSize}px;height:${dotSize}px;
        background:${color};
        border-radius:50%;
        margin-top:2px;
        box-shadow:0 0 ${selected ? 10 : 4}px ${color}88;
      "></div>
    </div>`,
    iconSize: [size, pinH],
    iconAnchor: [size / 2, pinH],
    popupAnchor: [0, -pinH],
  });
}

function createPinIcon(color: string, label: string): L.DivIcon {
  return L.divIcon({
    className: "",
    html: `<div style="
      display:flex;align-items:center;justify-content:center;
      width:32px;height:32px;border-radius:50%;background:${color};
      border:3px solid rgba(255,255,255,0.3);box-shadow:0 2px 8px rgba(0,0,0,0.4);
      color:#0a0a0a;font-weight:bold;font-size:13px;
    ">${label}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
}

// ─── Cached station icon lookup ─────────────────────

const STATUS_COLORS: Record<string, string> = {
  closed: STATUS_COLOR_CLOSED,
  "closing-soon": STATUS_COLOR_CLOSING_SOON,
};

const iconCache = new Map<string, L.DivIcon>();

export function getStationIcon(brand: string, status: string, selected = false): L.DivIcon {
  const key = `${brand}:${status}:${selected ? "sel" : "def"}`;
  if (iconCache.has(key)) return iconCache.get(key)!;

  const brandColor = BRAND_COLORS[brand]?.primary;
  const color =
    STATUS_COLORS[status] ??
    (status === "unknown" ? (brandColor || STATUS_COLOR_UNKNOWN) : (brandColor || HUD_GREEN));

  const icon = createStationIcon(color, brand, selected ? 42 : 30, selected);
  iconCache.set(key, icon);
  return icon;
}

// ─── Trip pin icons (singleton) ─────────────────────

export const originIcon = createPinIcon(ORIGIN_PIN_COLOR, "A");
export const destinationIcon = createPinIcon(DESTINATION_PIN_COLOR, "B");
