import { geographyApi } from "@/services/geography.service";
import { DomainItem, GeographicItem } from "@/types/type";
import { useQuery } from "@tanstack/react-query";

export type SelectableItem = DomainItem | GeographicItem;

export const useGeographic = () => {
  const islands = useQuery({
    queryKey: ["geography", "islands"],
    queryFn: geographyApi.getIslands,
  });

  const useGetCounties = (islandId?: string) => {
    return useQuery<SelectableItem[]>({
      queryKey: ["geography", "counties", islandId],
      queryFn: () => geographyApi.getCountiesByIsland(islandId!),
      enabled: !!islandId,
    });
  };

  const useGetParishes = (countyId?: string) => {
    return useQuery<SelectableItem[]>({
      queryKey: ["geography", "parishes", countyId],
      queryFn: () => geographyApi.getParishesByCounty(countyId!),
      enabled: !!countyId,
    });
  };

  const useGetZones = (parishId?: string) => {
    return useQuery<SelectableItem[]>({
      queryKey: ["geography", "zones", parishId],
      queryFn: () => geographyApi.getZonesByParish(parishId!),
      enabled: !!parishId,
    });
  };

  const useGetLugar = (zoneId?: string) => {
    return useQuery<SelectableItem[]>({
      queryKey: ["geography", "zones", zoneId],
      queryFn: () => geographyApi.getLugarByZones(zoneId!),
      enabled: !!zoneId,
    });
  };

  return {
    islands,
    useGetCounties,
    useGetParishes,
    useGetZones,
    useGetLugar,
  };
};