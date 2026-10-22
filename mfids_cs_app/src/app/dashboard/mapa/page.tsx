import { ClientLayout } from "@/components/client-layout";
import EquipmentMapPage from "@/components/mapa/EquipmentModal";

export default function MapPage() {
  return (
    <ClientLayout className="max-w-full" title="Mapa dos Equipamentos">
      <div className="flex-1">
        <EquipmentMapPage className="h-full" />
      </div>
    </ClientLayout>
  );
}
