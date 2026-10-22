import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Users, Plus, Search, UserCheck } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useOrganizationHooks } from "@/hooks/use-organizacoes";
import { toast } from "react-hot-toast";
import PermissionGate from "@/components/permission-gate";

export function AddGestorButton() {
  const [open, setOpen] = useState(false);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isProprietarioGestor, setIsProprietarioGestor] = useState(false);
  // const [codigoGestor, setCodigoGestor] = useState("");
  // const [codigoError, setCodigoError] = useState("");
  const router = useRouter();
  const { getOwners, updateOwner } = useOrganizationHooks();
  const { data: owners, isLoading: isLoadingOwners, refetch } = getOwners();

  // const validateCodigo = (value: string) => {
  //   if (value.length > 9) {
  //     setCodigoError("O código não pode ter mais de 9 caracteres");
  //     return false;
  //   }
  //   setCodigoError("");
  //   return true;
  // };

  const handleOpenDialog = () => {
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setSelectedOwner(null);
    setSearchTerm("");
    setIsProprietarioGestor(false);
    // setCodigoGestor("");
    // setCodigoError("");
  };

  const handleOwnerSelection = (ownerId: string) => {
    setSelectedOwner(ownerId);
    setIsProprietarioGestor(false);
    // setCodigoGestor("");
    // setCodigoError("");
  };

  // const handleCodigoGestorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const value = e.target.value;
    
  //   if (value.length <= 9) {
  //     setCodigoGestor(value);
  //     validateCodigo(value);
  //   } else {
  //     setCodigoError("O código não pode ter mais de 9 caracteres");
  //   }
  // };

  const handleContinueAsGestor = () => {
    if (!selectedOwner) {
      toast.error("Por favor, selecione um proprietário");
      return;
    }

    setIsLoading(true);
    router.push(`/dashboard/gestores/criar/${selectedOwner}`);
  };

  const handleUpdateToProprietarioGestor = async () => {
    if (!selectedOwner) {
      toast.error("Por favor, selecione um proprietário");
      return;
    }

    // if (!codigoGestor.trim()) {
    //   toast.error("Por favor, preencha o Código da Entidade Gestora");
    //   return;
    // }

    // if (codigoGestor.length > 9) {
    //   toast.error("O código não pode ter mais de 9 caracteres");
    //   return;
    // }

    try {
      setIsLoading(true);
      
      const selectedOwnerData = owners?.find(owner => owner.id?.toString() === selectedOwner);
      
      if (!selectedOwnerData) {
        toast.error("Proprietário não encontrado");
        return;
      }

      const updatedOwnerData = {
        id: selectedOwnerData.id,
        tipo_organizacao: "PG" as const,
      };

      await updateOwner(updatedOwnerData as any);
      
      await refetch();
      handleCloseDialog();
      router.push(`/dashboard/proprietarios/${selectedOwner}`);
      
    } catch (error: any) {
      console.error("Erro ao atualizar proprietário:", error);
      toast.error("Erro ao atualizar proprietário para Proprietário e Gestor");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOwners = owners?.filter(owner => 
    owner.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    owner.nif.includes(searchTerm)
  ) || [];

  //const isCodigoValid = codigoGestor.trim().length > 0 && codigoGestor.length <= 9 && !codigoError;

  return (
    <>
    <PermissionGate module="organizacao" action="create">
      <Button 
        style={{ backgroundColor: "#028eab", color: "white" }} 
        className="hover:bg-opacity-90"
        onClick={handleOpenDialog}
      >
        <Plus className="mr-2 h-4 w-4" /> Novo Gestor
      </Button>
</PermissionGate>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Selecione um Proprietário</DialogTitle>
            <DialogDescription>
              Selecione o proprietário para adicionar um gestor ou transformá-lo em Proprietário e Gestor.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400" />
              </div>
              <Input
                placeholder="Buscar proprietário por nome ou NIF..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 py-2 w-full"
              />
            </div>
            
            <ScrollArea className="h-48 rounded-md border p-2">
              {isLoadingOwners ? (
                <div className="flex justify-center items-center h-full">
                  <div className="animate-spin h-5 w-5 border-2 border-t-transparent rounded-full"></div>
                </div>
              ) : filteredOwners.length > 0 ? (
                <div className="space-y-1">
                  {filteredOwners.map((owner) => (
                    <div 
                      key={owner.id}
                      className={`
                        p-2 rounded-md cursor-pointer transition-colors
                        ${selectedOwner === owner.id?.toString() 
                          ? 'bg-blue-100 border border-blue-300' 
                          : 'hover:bg-gray-100 border border-transparent'}
                      `}
                      onClick={() => handleOwnerSelection(owner.id?.toString() || "")}
                    >
                      <div className="flex items-center">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{owner.nome}</p>
                          <p className="text-sm text-gray-500">NIF: {owner.nif}</p>
                        </div>
                        {selectedOwner === owner.id?.toString() && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500">
                  {searchTerm 
                    ? `Nenhum proprietário encontrado para "${searchTerm}"` 
                    : "Nenhum proprietário disponível"}
                </div>
              )}
            </ScrollArea>

            {selectedOwner && (
              <div className="space-y-4">
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <UserCheck className="h-5 w-5 text-amber-600" />
                      <Label htmlFor="proprietario-gestor" className="font-medium text-amber-800">
                        Proprietário e Gestor (PG)
                      </Label>
                    </div>
                    <Switch
                      id="proprietario-gestor"
                      checked={isProprietarioGestor}
                      onCheckedChange={setIsProprietarioGestor}
                    />
                  </div>
                  <p className="text-sm text-amber-700 mb-3">
                    Esta entidade também atuará como seu próprio gestor?
                  </p>
                  
                  {/* {isProprietarioGestor && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="codigo-gestor" className="text-sm font-medium text-amber-800">
                          Código da Entidade Gestora *
                        </Label>
                        <span className="text-xs text-gray-500">
                          {codigoGestor.length}/9
                        </span>
                      </div>
                      <Input
                        id="codigo-gestor"
                        placeholder="Digite o código da entidade gestora"
                        value={codigoGestor}
                        onChange={handleCodigoGestorChange}
                        className={`bg-white border-amber-300 focus:border-amber-500 ${
                          codigoError ? 'border-red-500 focus:border-red-500' : ''
                        }`}
                        maxLength={9}
                      />
                      {codigoError && (
                        <p className="text-xs text-red-600">{codigoError}</p>
                      )}
                      <p className="text-xs text-amber-600">
                        Máximo de 9 caracteres
                      </p>
                    </div>
                  )} */}
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog} disabled={isLoading}>
              Cancelar
            </Button>
            
            {selectedOwner && (
              <>
                {isProprietarioGestor ? (
                  <Button 
                    onClick={handleUpdateToProprietarioGestor}
                    disabled={ isLoading}
                    className="bg-amber-600 hover:bg-amber-700 text-white"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                        Salvando...
                      </>
                    ) : (
                      <>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Salvar como PG
                      </>
                    )}
                  </Button>
                ) : (
                  <Button 
                    onClick={handleContinueAsGestor}
                    disabled={isLoading}
                    style={{ backgroundColor: "#028eab" }}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                        Carregando...
                      </>
                    ) : (
                      <>
                        Adicionar Gestor <Users className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}