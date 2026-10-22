"use client";

import React, { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useEquipmentHooks } from "@/hooks/use-equipament";
import { Equipment } from "@/types/type";
import { MapPin, Target, Map, Satellite } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MAP_TYPES = {
  streets: {
    name: "Ruas",
    url: "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    attribution: '© OpenStreetMap contributors',
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

interface EquipmentMapProps {
  className?: string;
}

interface ClusterGroup {
  lat: number;
  lng: number;
  count: number;
  equipments: Equipment[];
  id: string;
}

const MapComponent = dynamic(
  () => Promise.resolve(({ validEquipments }: { validEquipments: Equipment[] }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);
    const markersRef = useRef<any[]>([]);
    const [isMapReady, setIsMapReady] = useState(false);
    const [currentZoom, setCurrentZoom] = useState(8);
    const [mapType, setMapType] = useState<keyof typeof MAP_TYPES>("hybrid");

    const calculateDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
      const R = 6371;
      const dLat = ((lat2 - lat1) * Math.PI) / 180;
      const dLng = ((lng2 - lng1) * Math.PI) / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };

    const createClusters = (equipments: Equipment[], zoom: number): ClusterGroup[] => {
      if (zoom >= 12) {
        return equipments.map((eq) => ({
          lat: parseFloat(eq.latitude!.toString()),
          lng: parseFloat(eq.longitude!.toString()),
          count: 1,
          equipments: [eq],
          id: `single-${eq.id}`,
        }));
      }

      const clusters: ClusterGroup[] = [];
      const processed = new Set<number>();
      const maxDistance = zoom < 8 ? 50 : zoom < 10 ? 25 : 10;

      equipments.forEach((equipment, index) => {
        if (processed.has(index)) return;

        const lat = parseFloat(equipment.latitude!.toString());
        const lng = parseFloat(equipment.longitude!.toString());

        if (isNaN(lat) || isNaN(lng)) return;

        const clusterEquipments = [equipment];
        processed.add(index);

        equipments.forEach((otherEquipment, otherIndex) => {
          if (processed.has(otherIndex)) return;

          const otherLat = parseFloat(otherEquipment.latitude!.toString());
          const otherLng = parseFloat(otherEquipment.longitude!.toString());

          if (isNaN(otherLat) || isNaN(otherLng)) return;

          const distance = calculateDistance(lat, lng, otherLat, otherLng);

          if (distance <= maxDistance) {
            clusterEquipments.push(otherEquipment);
            processed.add(otherIndex);
          }
        });

        if (clusterEquipments.length === 1) {
          clusters.push({
            lat,
            lng,
            count: 1,
            equipments: clusterEquipments,
            id: `single-${equipment.id}`,
          });
        } else {
          const centerLat = clusterEquipments.reduce((sum, eq) => sum + parseFloat(eq.latitude!.toString()), 0) / clusterEquipments.length;
          const centerLng = clusterEquipments.reduce((sum, eq) => sum + parseFloat(eq.longitude!.toString()), 0) / clusterEquipments.length;

          clusters.push({
            lat: centerLat,
            lng: centerLng,
            count: clusterEquipments.length,
            equipments: clusterEquipments,
            id: `cluster-${Date.now()}-${Math.random()}`,
          });
        }
      });

      return clusters;
    };

    const centerOnEquipments = () => {
      if (!mapInstanceRef.current || validEquipments.length === 0) return;

      const L = window.L;
      const bounds = L.latLngBounds(
        validEquipments.map((eq) => [
          parseFloat(eq.latitude!.toString()),
          parseFloat(eq.longitude!.toString()),
        ])
      );

      mapInstanceRef.current.fitBounds(bounds, { padding: [20, 20] });
    };

    const updateTileLayer = () => {
      if (!mapInstanceRef.current || typeof window === "undefined" || !window.L) return;
      
      const L = window.L;
      const map = mapInstanceRef.current;
      const selectedMapType = MAP_TYPES[mapType];

      map.eachLayer((layer: any) => {
        if (layer instanceof L.TileLayer) {
          map.removeLayer(layer);
        }
      });

      L.tileLayer(selectedMapType.url, {
        attribution: selectedMapType.attribution,
        maxZoom: 18,
      }).addTo(map);
    };

    const updateMarkers = () => {
      if (!mapInstanceRef.current || typeof window === "undefined" || !window.L) return;

      const L = window.L;
      const map = mapInstanceRef.current;

      markersRef.current.forEach((marker) => {
        try {
          map.removeLayer(marker);
        } catch (e) {
          console.warn("Erro ao remover marcador:", e);
        }
      });
      markersRef.current = [];

      const clusters = createClusters(validEquipments, currentZoom);

      clusters.forEach((cluster) => {
        try {
          let marker;

          if (cluster.count === 1) {
            const equipment = cluster.equipments[0];
            const customIcon = L.divIcon({
              className: "custom-equipment-marker",
              html: `
                <div style="
                  background: linear-gradient(135deg, #028eab, #025a6b); 
                  border-radius: 50%; 
                  width: 36px; 
                  height: 36px; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  color: white; 
                  border: 3px solid white; 
                  box-shadow: 0 8px 25px rgba(2, 142, 171, 0.4);
                  cursor: pointer;
                  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                  position: relative;
                ">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                    <circle cx="12" cy="12" r="3" fill="white" opacity="0.9"/>
                  </svg>
                  <div style="
                    position: absolute;
                    top: -2px;
                    right: -2px;
                    width: 12px;
                    height: 12px;
                    background: #10b981;
                    border-radius: 50%;
                    border: 2px solid white;
                  "></div>
                </div>
              `,
              iconSize: [36, 36],
              iconAnchor: [18, 18],
            });

            marker = L.marker([cluster.lat, cluster.lng], { icon: customIcon }).addTo(map);

            const popupContent = `
              <div style="font-family: system-ui; min-width: 300px; max-width: 350px; border-radius: 12px; overflow: hidden;">
                <div style="background: linear-gradient(135deg, #028eab, #025a6b); color: white; padding: 16px;">
                  <h3 style="margin: 0; font-size: 18px; font-weight: 700;">${equipment.nome}</h3>
                  <p style="margin: 8px 0 0 0; opacity: 0.9;">${equipment.codigo || "Sem código"}</p>
                </div>
                <div style="padding: 16px; background: white;">
                  ${typeof equipment.contato === "object" && equipment.contato ? `
                    ${equipment.contato.telemovel ? `<p><strong>📱 Telemóvel:</strong> ${equipment.contato.telemovel}</p>` : ""}
                    ${equipment.contato.telefone ? `<p><strong>☎️ Telefone:</strong> ${equipment.contato.telefone}</p>` : ""}
                    ${equipment.contato.email ? `<p><strong>✉️ Email:</strong> ${equipment.contato.email}</p>` : ""}
                  ` : `<p>Informações de contato não disponíveis</p>`}
                </div>
              </div>
            `;

            marker.bindPopup(popupContent, {
              maxWidth: 350,
              className: "custom-popup",
            });
          } else {
            const clusterIcon = L.divIcon({
              className: "custom-cluster-marker",
              html: `
                <div style="
                  background: linear-gradient(135deg, #028eab, #025a6b); 
                  border-radius: 50%; 
                  width: 48px; 
                  height: 48px; 
                  display: flex; 
                  align-items: center; 
                  justify-content: center; 
                  color: white; 
                  font-weight: 700; 
                  border: 4px solid white; 
                  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                  cursor: pointer;
                  font-size: 16px;
                ">
                  ${cluster.count}
                </div>
              `,
              iconSize: [48, 48],
              iconAnchor: [24, 24],
            });

            marker = L.marker([cluster.lat, cluster.lng], { icon: clusterIcon }).addTo(map);

            marker.on("click", () => {
              map.setView([cluster.lat, cluster.lng], Math.min(currentZoom + 3, 16));
            });
          }

          markersRef.current.push(marker);
        } catch (error) {
          console.error("Erro ao criar marcador:", error);
        }
      });
    };

    useEffect(() => {
      if (!mapRef.current || isMapReady) return;

      const initMap = async () => {
        try {
          await new Promise((resolve) => {
            if (typeof window !== "undefined" && (window as any).L) {
              resolve((window as any).L);
              return;
            }

            const script = document.createElement("script");
            script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
            script.crossOrigin = "";
            script.onload = () => resolve((window as any).L);
            document.head.appendChild(script);

            const link = document.createElement("link");
            link.rel = "stylesheet";
            link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
            link.crossOrigin = "";
            document.head.appendChild(link);
          });

          const L = (window as any).L;

          delete (L.Icon.Default.prototype as any)._getIconUrl;
          L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
          });

          const map = L.map(mapRef.current!, {
            minZoom: 6,
            maxZoom: 18,
            zoomControl: true,
          }).setView([15.1333, -23.6167], 8);

          const selectedMapType = MAP_TYPES[mapType];
          L.tileLayer(selectedMapType.url, {
            attribution: selectedMapType.attribution,
            maxZoom: 18,
          }).addTo(map);

          map.on("zoomend", () => {
            setCurrentZoom(map.getZoom());
          });

          mapInstanceRef.current = map;
          setIsMapReady(true);
        } catch (error) {
          console.error("Erro ao inicializar mapa:", error);
        }
      };

      const timer = setTimeout(initMap, 100);
      return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
      if (isMapReady && validEquipments.length > 0) {
        updateMarkers();
      }
    }, [isMapReady, validEquipments, currentZoom]);

    useEffect(() => {
      if (isMapReady) {
        updateTileLayer();
      }
    }, [isMapReady, mapType]);

    const selectedMapType = MAP_TYPES[mapType];
    const IconComponent = selectedMapType.icon;

    return (
      <div className="space-y-4">
        {/* Controles FORA do mapa */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <IconComponent className="h-4 w-4 text-gray-600" />
              <Select value={mapType} onValueChange={(value: keyof typeof MAP_TYPES) => setMapType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="!z-[9999]">
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

            <Badge variant="secondary" style={{ backgroundColor: "#028eab", color: "white" }}>
              {validEquipments.length} equipamentos
            </Badge>
          </div>

          <Button
            onClick={centerOnEquipments}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Target className="h-4 w-4" />
            Centralizar
          </Button>
        </div>

        {/* Mapa SIMPLES */}
        <div
          ref={mapRef}
          className="w-full h-[600px] rounded-lg border"
        />

        {validEquipments.length === 0 && (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum equipamento localizado
            </h3>
            <p className="text-gray-600">
              Adicione coordenadas aos equipamentos para visualizá-los no mapa.
            </p>
          </div>
        )}
      </div>
    );
  }),
  { ssr: false }
);

const EquipmentMapPage: React.FC<EquipmentMapProps> = ({ className = "" }) => {
  const { getEquipments } = useEquipmentHooks();
  const { data: equipments = [], isLoading } = getEquipments();

  const validEquipments = equipments.filter(
    (eq) =>
      eq.latitude &&
      eq.longitude &&
      !isNaN(parseFloat(eq.latitude.toString())) &&
      !isNaN(parseFloat(eq.longitude.toString()))
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[600px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#028eab] mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <MapComponent validEquipments={validEquipments} />
    </div>
  );
};

export default EquipmentMapPage;