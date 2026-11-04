/// <reference lib="dom" />
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useRef } from 'react';
import { useTheme } from 'tamagui';
import { branding as brand } from '../branding';
import type { Coordinate } from '../services/types';
import { useApp } from '../state/AppContext';
import { icons } from '.';
import type { RideMapProps } from './RideMap';

const DEFAULT_TILES = {
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
};

const ZOOM = 15;

const toLatLng = ({ latitude, longitude }: Coordinate): L.LatLngTuple => [latitude, longitude];

const dot = (html: string, size: number) => L.divIcon({ html, className: '', iconSize: [size, size], iconAnchor: [size / 2, size / 2] });

const circle = (size: number, background: string, border: string, borderWidth: number, inner = '') =>
    `<div style="box-sizing:border-box;width:${size}px;height:${size}px;border-radius:50%;background:${background};border:${borderWidth}px solid ${border};display:flex;align-items:center;justify-content:center">${inner}</div>`;

/** Leaflet stands in for the native map on the web, with the same props. */
export function RideMap({ center, pickup, dropoff, route, car, showRider, insets = { top: 120, bottom: 320 } }: RideMapProps) {
    const theme = useTheme();
    const { scheme } = useApp();
    const container = useRef<HTMLDivElement>(null);
    const map = useRef<L.Map>(null);
    const layers = useRef<L.LayerGroup>(null);
    const carMarker = useRef<L.Marker>(null);
    const routeKey = route?.map((point) => `${point.latitude},${point.longitude}`).join('|');
    const colors = { route: theme.route.val, surface: theme.surface.val, accent: theme.accent.val, on: theme.on.val, halo: theme.halo.val };

    useEffect(() => {
        if (!container.current) {
            return;
        }
        const instance = L.map(container.current, { zoomControl: false, attributionControl: false }).setView(toLatLng(center), ZOOM);
        const tiles = brand.webMapTiles ?? DEFAULT_TILES;
        L.tileLayer(tiles.url, { attribution: tiles.attribution, maxZoom: 19 }).addTo(instance);
        L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(instance);
        layers.current = L.layerGroup().addTo(instance);
        map.current = instance;
        // Screens underneath are hidden, so the map needs telling when it's shown again.
        const observer = new ResizeObserver(() => instance.invalidateSize());
        observer.observe(container.current);
        return () => {
            observer.disconnect();
            instance.remove();
            map.current = null;
        };
        // The map is created once. The effects below keep it up to date.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Keeps the attribution above the floating cards.
    useEffect(() => {
        const control = container.current?.querySelector<HTMLElement>('.leaflet-bottom.leaflet-left');
        if (control) {
            control.style.bottom = `${insets.bottom}px`;
        }
    }, [insets.bottom]);

    useEffect(() => {
        const pane = map.current?.getPanes().tilePane;
        if (pane) {
            pane.style.filter = scheme === 'dark' ? 'invert(1) hue-rotate(180deg) saturate(0.3) brightness(0.85)' : '';
        }
    }, [scheme]);

    useEffect(() => {
        if (!route?.length) {
            map.current?.setView(toLatLng(center), ZOOM);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center.latitude, center.longitude, routeKey]);

    // Refit only when the route changes, not on every car position update.
    useEffect(() => {
        if (route?.length) {
            map.current?.fitBounds(L.latLngBounds(route.map(toLatLng)), { paddingTopLeft: [48, insets.top], paddingBottomRight: [48, insets.bottom] });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeKey]);

    useEffect(() => {
        const group = layers.current;
        if (!group) {
            return;
        }
        group.clearLayers();
        if (route?.length) {
            L.polyline(route.map(toLatLng), { color: colors.route, weight: 6, lineJoin: 'round', lineCap: 'round' }).addTo(group);
        }
        if (showRider) {
            const puck = circle(20, colors.route, colors.surface, 4);
            L.marker(toLatLng(center), { icon: dot(circle(60, colors.halo, 'transparent', 0, puck), 60), interactive: false, keyboard: false }).addTo(group);
        }
        if (pickup) {
            L.marker(toLatLng(pickup), { icon: dot(circle(22, colors.surface, colors.route, 5), 22), title: 'Pickup', keyboard: false }).addTo(group);
        }
        if (dropoff) {
            L.marker(toLatLng(dropoff), { icon: dot(circle(22, colors.route, colors.surface, 3), 22), title: 'Dropoff', keyboard: false }).addTo(group);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeKey, showRider, center.latitude, center.longitude, pickup?.latitude, pickup?.longitude, dropoff?.latitude, dropoff?.longitude, ...Object.values(colors)]);

    // The car moves often, so it's updated on its own rather than redrawing everything.
    useEffect(() => {
        if (!car) {
            carMarker.current?.remove();
            carMarker.current = null;
            return;
        }
        if (carMarker.current) {
            carMarker.current.setLatLng(toLatLng(car));
        } else if (map.current) {
            const svg = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="${colors.on}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="${icons.car}"/></svg>`;
            carMarker.current = L.marker(toLatLng(car), { icon: dot(circle(38, colors.accent, colors.surface, 3, svg), 38), title: 'Your driver', zIndexOffset: 1000, keyboard: false }).addTo(map.current);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [car?.latitude, car?.longitude]);

    return <div ref={container} style={{ position: 'absolute', inset: 0, zIndex: 0, background: theme.raised.val }} />;
}
