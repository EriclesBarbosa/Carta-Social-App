"use client";

import React, { useEffect, useState, useRef } from "react";
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import { Maximize2, Minimize2, Map, Satellite, Navigation, RefreshCw } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MAP_TYPES = {
  streets: {
    name: "Ruas",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://osm.org/copyright">OpenStreetMap</a>',
    icon: Map
  },
  satellite: {
    name: "Satélite",
    url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>',
    icon: Satellite
  },
  terrain: {
    name: "Terreno",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attribution: '&copy; <a href="https://opentopomap.org/">OpenTopoMap</a>',
    icon: Map
  },
  hybrid: {
    name: "Híbrido",
    url: "https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}",
    attribution: '&copy; <a href="https://www.google.com/maps">Google</a>',
    icon: Satellite
  }
};

interface LocationPickerModalProps {
  onLocationSelect: (lat: number, lng: number, accuracy?: number) => void;
  defaultPosition?: { lat: number; lng: number };
}

// Componente para capturar cliques no mapa
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function LocationPickerModal({ onLocationSelect, defaultPosition }: LocationPickerModalProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mapType, setMapType] = useState<keyof typeof MAP_TYPES>("hybrid");
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const initialized = useRef(false);
  const watchId = useRef<number | null>(null);

  // Fix para ícones do Leaflet
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
  });

  const customIcon = new L.Icon({
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    setIsLoading(true);

    if (watchId.current) {
      navigator.geolocation.clearWatch(watchId.current);
    }

    const highAccuracyOptions = {
      enableHighAccuracy: true,
      timeout: 15000, // 15 segundos
      maximumAge: 0,
    };

    let attempts = 0;
    const maxAttempts = 3;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const newPosition = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        
        setPosition(newPosition);
        setAccuracy(pos.coords.accuracy);
        setIsLoading(false);
        
        if (pos.coords.accuracy < 50) {
          setIsGettingLocation(false);
          return;
        }
        
        watchId.current = navigator.geolocation.watchPosition(
          (watchPos) => {
            attempts++;
            
            const watchPosition = {
              lat: watchPos.coords.latitude,
              lng: watchPos.coords.longitude,
            };
            
            setPosition(watchPosition);
            setAccuracy(watchPos.coords.accuracy);
            
            if (watchPos.coords.accuracy < 20 || attempts >= maxAttempts) {
              setIsGettingLocation(false);
              if (watchId.current) {
                navigator.geolocation.clearWatch(watchId.current);
                watchId.current = null;
              }
            }
          },
          () => {
            setIsGettingLocation(false);
            if (watchId.current) {
              navigator.geolocation.clearWatch(watchId.current);
              watchId.current = null;
            }
          },
          { ...highAccuracyOptions, timeout: 5000 }
        );
        
        setTimeout(() => {
          setIsGettingLocation(false);
          if (watchId.current) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }
        }, 8000);
      },
      () => {
        setPosition({ lat: 15.1111, lng: -23.6167 });
        setAccuracy(null);
        setIsLoading(false);
        setIsGettingLocation(false);
      },
      highAccuracyOptions
    );
  };

  useEffect(() => {
    if (!open || initialized.current) return;
    initialized.current = true;

    if (defaultPosition?.lat && defaultPosition?.lng) {
      setPosition({
        lat: parseFloat(defaultPosition.lat.toString()),
        lng: parseFloat(defaultPosition.lng.toString()),
      });
      getCurrentLocation();
    } else {
      getCurrentLocation();
    }
  }, [open, defaultPosition]);

  useEffect(() => {
    return () => {
      if (watchId.current) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, []);

  const handleLocationChange = (lat: number, lng: number) => {
    setPosition({ lat, lng });
    setAccuracy(null);
  };

  const selectedMapType = MAP_TYPES[mapType];

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        if (!val) {
          initialized.current = false;
          setIsLoading(false);
          setIsGettingLocation(false);
          if (watchId.current) {
            navigator.geolocation.clearWatch(watchId.current);
            watchId.current = null;
          }
        }
        setOpen(val);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" className="flex items-center gap-2">
          <Navigation className="h-4 w-4" />
          Detectar Localização
        </Button>
      </DialogTrigger>

      <DialogContent 
        className={`flex flex-col transition-all duration-300 ${
          isFullscreen 
            ? "max-w-full w-screen h-screen m-0 rounded-none" 
            : "max-w-4xl w-full h-[600px]"
        }`}
      >
        <div className="flex items-center justify-between">
          <DialogTitle>Selecionar Localização</DialogTitle>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              disabled={isGettingLocation}
              className="h-8 flex items-center gap-2"
            >
              { isGettingLocation && <RefreshCw className={`h-4 w-4 ${isGettingLocation ? 'animate-spin' : ''}`} /> }
              {isGettingLocation ? 'Pesquisando...' : 'Localização Atual'}
            </Button>

            <div className="flex items-center gap-2">
              <Select value={mapType} onValueChange={(value: keyof typeof MAP_TYPES) => setMapType(value)}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MAP_TYPES).map(([key, type]) => {
                    const TypeIcon = type.icon;
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <TypeIcon className="h-4 w-4" />
                          {type.name}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="h-8"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex-1 border rounded-md overflow-hidden mt-4 relative">
          {isLoading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 z-50">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-sm text-gray-600">
                  {isGettingLocation ? "🛰️ Buscando GPS preciso..." : "Carregando mapa..."}
                </p>
              </div>
            </div>
          ) : position ? (
            <MapContainer 
              center={position} 
              zoom={18} 
              style={{ height: "100%", width: "100%" }}
              key={`${position.lat}-${position.lng}-${mapType}`}
            >
              <TileLayer
                attribution={selectedMapType.attribution}
                url={selectedMapType.url}
                maxZoom={20}
              />
              <Marker
                draggable
                position={position}
                icon={customIcon}
                eventHandlers={{
                  dragend: (e) => {
                    const marker = e.target;
                    const newPos = marker.getLatLng();
                    handleLocationChange(newPos.lat, newPos.lng);
                  },
                }}
              />
              <MapClickHandler onLocationChange={handleLocationChange} />
            </MapContainer>
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <p className="text-gray-600">Erro ao carregar o mapa</p>
            </div>
          )}
        </div>

        {position && (
          <div className="mt-3 p-3 bg-gray-50 rounded text-sm">
            <div className="flex items-center justify-between">
              <div>
                <strong>Coordenadas:</strong> {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
                {accuracy && (
                  <div className="text-xs mt-1 flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${
                      accuracy < 10 ? 'bg-green-500' : 
                      accuracy < 20 ? 'bg-yellow-500' : 
                      'bg-red-500'
                    }`}></span>
                    <span className="text-gray-600">
                      Precisão GPS: ±{Math.round(accuracy)}m
                      {accuracy < 10 && ' (Excelente)'}
                      {accuracy >= 10 && accuracy < 20 && ' (Boa)'}
                      {accuracy >= 20 && ' (Regular)'}
                    </span>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 text-right">
                <div>Arraste o marcador para ajustar</div>
                <div>Ou clique no mapa</div>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 mt-4 pt-2 border-t">
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button
            onClick={() => {
              if (position) {
                onLocationSelect(position.lat, position.lng, accuracy || undefined);
              }
              setOpen(false);
            }}
            disabled={!position}
          >
            Confirmar Localização
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}