import React, { useRef, useEffect } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ZoomIn, ZoomOut, Compass } from 'lucide-react';

export default function MapCanvas({
  stations = [],
  activeStationId = null,
  onSelectStation = () => {},
  onMapClick = () => {},
  selectedRoute = null, // fallback (unused)
  selectedRouteGps = null, // real GPS coordinates
  userRangeKm = 243,
  userCoordsCanvas = null, // fallback (unused)
  userCoordsGps = null
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);
  const userMarkerRef = useRef(null);
  const userRangeCircleRef = useRef(null);

  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([13.0473, 80.0945], 13); // Default to Poonamallee, Chennai

      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        maxZoom: 19
      }).addTo(map);

      // Add map click listener
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        if (onMapClickRef.current) {
          onMapClickRef.current(lng, lat);
        }
      });

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update User Marker & Range Circle
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous range circle
    if (userRangeCircleRef.current) {
      userRangeCircleRef.current.remove();
      userRangeCircleRef.current = null;
    }

    // Clear previous user marker
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (userCoordsGps) {
      const [lng, lat] = userCoordsGps;

      // Draw custom vehicle marker
      const userIcon = L.divIcon({
        className: 'user-gps-pin',
        html: `
          <div style="position: relative; width: 24px; height: 24px; display: flex; justify-content: center; align-items: center;">
            <div style="
              position: absolute;
              width: 24px;
              height: 24px;
              background-color: rgba(14, 165, 233, 0.4);
              border-radius: 50%;
              animation: user-pulse 1.8s infinite ease-in-out;
            "></div>
            <div style="
              width: 14px;
              height: 14px;
              background-color: #0ea5e9;
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              <div style="
                width: 0;
                height: 0;
                border-left: 3px solid transparent;
                border-right: 3px solid transparent;
                border-bottom: 5px solid white;
              "></div>
            </div>
          </div>
        `,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const userMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);
      userMarker.bindPopup('<strong style="font-size: 11px;">Your Vehicle</strong>');
      userMarkerRef.current = userMarker;

      // Range Circle in meters
      const rangeMeters = userRangeKm * 1000;
      const rangeCircle = L.circle([lat, lng], {
        radius: rangeMeters,
        color: 'rgba(14, 165, 233, 0.25)',
        fillColor: 'rgba(14, 165, 233, 0.03)',
        weight: 1.5,
        dashArray: '5, 5'
      }).addTo(map);
      userRangeCircleRef.current = rangeCircle;

      // Pan to user if there is no active route
      if (!selectedRouteGps) {
        map.panTo([lat, lng]);
      }
    }
  }, [userCoordsGps, userRangeKm, selectedRouteGps]);

  // Update Stations Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Clear previous markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    stations.forEach(st => {
      if (st.location && st.location.coordinates) {
        const [lng, lat] = st.location.coordinates;
        const isActive = st._id === activeStationId;

        // Custom pin color based on occupancy
        const slotsList = st.slots || [];
        const totalSlots = slotsList.length;
        const occupied = slotsList.filter(sl => sl.status === 'occupied').length;
        let color = '#10b981'; // Green
        if (occupied === totalSlots) color = '#f43f5e'; // Red
        else if (occupied > 0) color = '#f59e0b'; // Orange

        const iconHtml = `
          <div style="position: relative; width: 28px; height: 28px; display: flex; justify-content: center; align-items: center;">
            ${isActive ? `
              <div style="
                position: absolute;
                width: 28px;
                height: 28px;
                background-color: rgba(217, 70, 239, 0.3);
                border-radius: 50%;
                animation: user-pulse 1.5s infinite ease-in-out;
              "></div>
            ` : ''}
            <div style="
              width: 12px;
              height: 12px;
              background-color: ${color};
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            "></div>
          </div>
        `;

        const icon = L.divIcon({
          className: 'custom-station-pin',
          html: iconHtml,
          iconSize: [28, 28],
          iconAnchor: [14, 14]
        });

        const marker = L.marker([lat, lng], { icon })
          .addTo(map)
          .on('click', () => {
            onSelectStation(st._id);
            marker.openPopup();
          });

        const popupContent = `
          <div style="font-family: sans-serif; font-size: 11px; color: #1e293b; text-align: left;">
            <strong style="font-size: 12px; display: block; margin-bottom: 2px;">${st.name}</strong>
            <span style="color: #64748b; display: block; margin-bottom: 4px;">${st.location.address}</span>
            <div style="display: flex; gap: 4px; flex-wrap: wrap;">
              ${st.slots.map(s => `
                <span style="
                  padding: 1px 4px;
                  background-color: ${s.status === 'available' ? '#f0fdf4' : '#fef2f2'};
                  border: 1px solid ${s.status === 'available' ? '#bbf7d0' : '#fca5a5'};
                  color: ${s.status === 'available' ? '#166534' : '#991b1b'};
                  font-size: 8px;
                  font-weight: bold;
                  border-radius: 4px;
                ">${s.type}</span>
              `).join('')}
            </div>
          </div>
        `;
        marker.bindPopup(popupContent, { offset: L.point(0, -6) });

        if (isActive) {
          marker.openPopup();
        }

        markersRef.current.push(marker);
      }
    });
  }, [stations, activeStationId]);

  // Update Route Polyline
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (selectedRouteGps && selectedRouteGps.length > 1) {
      const latLngs = selectedRouteGps.map(pt => [pt[1], pt[0]]);
      
      const polyline = L.polyline(latLngs, {
        color: '#0ea5e9',
        weight: 5,
        opacity: 0.85,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      polylineRef.current = polyline;

      // Fit bounds to show entire route
      map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
    }
  }, [selectedRouteGps]);

  const handleZoom = (type) => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (type === 'in') map.zoomIn();
    if (type === 'out') map.zoomOut();
  };

  const handleRecenter = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (userCoordsGps) {
      map.setView([userCoordsGps[1], userCoordsGps[0]], 14);
    } else {
      map.setView([13.0473, 80.0945], 13);
    }
  };

  return (
    <div className="relative w-full h-[300px] md:h-[450px] rounded-3xl overflow-hidden border border-slate-200/60 shadow-inner">
      {/* Dynamic Keyframes for pulsing markers */}
      <style>{`
        @keyframes user-pulse {
          0% { transform: scale(0.8); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 0.3; }
          100% { transform: scale(0.8); opacity: 0.8; }
        }
        .leaflet-pane {
          z-index: 1 !important;
        }
        .leaflet-control-container {
          z-index: 10 !important;
        }
      `}</style>

      <div
        ref={mapContainerRef}
        className="w-full h-full block"
      />

      {/* Map Controls HUD */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2 z-[1000]">
        <button
          onClick={() => handleZoom('in')}
          className="p-2.5 bg-white/90 backdrop-blur hover:bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 transition-all active:scale-95"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => handleZoom('out')}
          className="p-2.5 bg-white/90 backdrop-blur hover:bg-white text-slate-700 rounded-xl shadow-md border border-slate-200 transition-all active:scale-95"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleRecenter}
          className="p-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl shadow-md flex items-center justify-center transition-all active:scale-95"
          title="Recenter Map"
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>

      {/* Map Legends Overlay */}
      <div className="absolute top-4 left-4 p-3 bg-white/90 backdrop-blur-md rounded-2xl border border-slate-200/50 flex flex-col gap-1.5 shadow-md z-[1000]">
        <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Map Legend</h4>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <div style={{ width: 10, height: 10, backgroundColor: '#0ea5e9', border: '1.5px solid white', borderRadius: '50%' }} />
          <span>Your Vehicle</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <div style={{ width: 10, height: 10, backgroundColor: '#10b981', border: '1.5px solid white', borderRadius: '50%' }} />
          <span>Station Available</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <div style={{ width: 10, height: 10, backgroundColor: '#f59e0b', border: '1.5px solid white', borderRadius: '50%' }} />
          <span>Occupied Charger</span>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <div style={{ width: 10, height: 10, backgroundColor: '#f43f5e', border: '1.5px solid white', borderRadius: '50%' }} />
          <span>Station Full</span>
        </div>
      </div>
    </div>
  );
}
