import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ProcurementCentre } from '../types';

interface MandiMapViewProps {
  onOpenBooking: (centre: ProcurementCentre) => void;
}

export const MandiMapView: React.FC<MandiMapViewProps> = ({ onOpenBooking }) => {
  const { centres, userLocation, isLocating, detectUserLocation } = useApp();
  const { lang, t } = useLanguage();

  // Create custom SVG markers based on Mandi status
  const createCustomIcon = (status: 'open' | 'closed' | 'break' | 'quota_full', name: string) => {
    const colors = {
      open: '#22c55e',       // Green
      closed: '#ef4444',     // Red
      break: '#f59e0b',      // Amber
      quota_full: '#3b82f6'  // Blue
    };
    
    const color = colors[status] || '#64748b';

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="34" fill="none">
        <path d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7 12 7 12s7-6.75 7-12c0-4.42-3.58-8-8-8z" fill="${color}" stroke="#ffffff" stroke-width="1.5"/>
        <circle cx="12" cy="10" r="4" fill="#ffffff"/>
      </svg>
    `;

    return L.divIcon({
      html: `<div style="display: flex; flex-direction: column; align-items: center;">${svg}</div>`,
      className: 'custom-mandi-marker',
      iconSize: [34, 34],
      iconAnchor: [17, 34],
      popupAnchor: [0, -32]
    });
  };

  const userIcon = L.divIcon({
    html: `
      <div style="position: relative; width: 20px; height: 20px;">
        <div style="position: absolute; width: 100%; height: 100%; border-radius: 50%; background-color: #3b82f6; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
        <div style="position: absolute; top: 4px; left: 4px; width: 12px; height: 12px; border-radius: 50%; background-color: #3b82f6; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.3);"></div>
      </div>
    `,
    className: 'custom-user-marker',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4 animate-fadeIn">
      {/* Map Header controls */}
      <div className="bg-paper rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="font-display font-bold text-lg text-slate-900 leading-tight">
            {t('mapTab')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Locate procurement yards and check operating status geographically
          </p>
        </div>

        <button
          onClick={detectUserLocation}
          disabled={isLocating}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer flex items-center gap-1.5"
        >
          {isLocating ? t('locating') : t('useLocationBtn')}
        </button>
      </div>

      {/* Leaflet Map container */}
      <div className="border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-[calc(100vh-240px)] min-h-[420px] max-h-[750px] relative z-10">
        <MapContainer
          center={userLocation || { lat: 26.7606, lng: 83.3732 }}
          zoom={11}
          style={{ width: '100%', height: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {/* User GPS location marker */}
          {userLocation && (
            <>
              <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
                <Popup>
                  <div className="text-xs font-bold text-slate-800">Your Current Position</div>
                </Popup>
              </Marker>
              {/* Proximity Circle boundaries (e.g. 15km radius) */}
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={15000}
                pathOptions={{ color: '#16a34a', fillColor: '#22c55e', fillOpacity: 0.05, weight: 1, dashArray: '5, 5' }}
              />
            </>
          )}

          {/* Mandi markers list */}
          {centres.map((c) => {
            const name = lang === 'te' && c.name_te ? c.name_te : lang === 'hi' && c.name_hi ? c.name_hi : c.name;
            const statusLabel = t(`mark${c.status.charAt(0).toUpperCase() + c.status.slice(1)}` as any) || c.status;
            
            return (
              <Marker
                key={c.id}
                position={[c.lat, c.lng]}
                icon={createCustomIcon(c.status, c.name)}
              >
                <Popup>
                  <div className="p-1 space-y-2 text-xs w-48 font-semibold">
                    <div>
                      <h4 className="font-bold text-slate-800 leading-snug">{name}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 uppercase">{c.type}</p>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-100 pt-1.5">
                      <span className="text-slate-500 font-medium">Status:</span>
                      <span className={`font-bold capitalize ${
                        c.status === 'open' ? 'text-green-600' : c.status === 'break' ? 'text-amber-500' : 'text-red-500'
                      }`}>
                        {statusLabel}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 font-medium">Wait Time:</span>
                      <span className="font-bold text-slate-800">
                        {c.queue.estimatedWaitTimeMinutes} mins
                      </span>
                    </div>

                    <div className="border-t border-slate-100 pt-2 flex justify-end">
                      <button
                        onClick={() => onOpenBooking(c)}
                        disabled={c.status === 'closed' || c.status === 'quota_full'}
                        className={`w-full py-1 text-[10px] font-bold text-center text-white rounded-lg transition ${
                          c.status === 'closed' || c.status === 'quota_full'
                            ? 'bg-slate-300 cursor-not-allowed'
                            : 'bg-agri-600 hover:bg-agri-500'
                        }`}
                      >
                        {t('bookTokenBtn')}
                      </button>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
};
export default MandiMapView;
