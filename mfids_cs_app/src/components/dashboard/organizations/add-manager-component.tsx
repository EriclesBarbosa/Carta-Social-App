"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  UserPlus,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { ManagerFormStepper } from "./manager-form-stepper";
import {  Manager, Owner } from "@/types/type";

interface AddManagerComponentProps {
  owner: Owner;
  onComplete: (data: Manager) => Promise<Manager>;
  onFinish: () => void;
}

export function AddManagerComponent({ owner, onComplete, onFinish }: AddManagerComponentProps) {
  const [activeTab, setActiveTab] = useState("new");
  // const [isLoading, setIsLoading] = useState(false);
  // const [freeOwners, setFreeOwners] = useState<FreeOwner[]>([]);
  // const [searchTerm, setSearchTerm] = useState("");
  // const [selectedOwnerId, setSelectedOwnerId] = useState("");
  // const [assignmentError, setAssignmentError] = useState<string | null>(null);
  // const [assignmentSuccess, setAssignmentSuccess] = useState(false);

  // useEffect(() => {
  //   const fetchFreeOwners = async () => {
  //     setIsLoading(true);
  //     try {
  //       const response = await api.get<FreeOwner[]>("/organizacoes/proprietarios/free");
  //       setFreeOwners(response.data || []);
  //     } catch {
  //       toast.error("Não foi possível carregar a lista de proprietários disponíveis.");
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   if (activeTab === "existing") {
  //     fetchFreeOwners();
  //   }
  // }, [activeTab]);

  // const filteredOwners = freeOwners.filter(freeOwner => 
  //   freeOwner.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   freeOwner.nif.includes(searchTerm) ||
  //   (freeOwner.natureza_juridica && freeOwner.natureza_juridica.toLowerCase().includes(searchTerm.toLowerCase()))
  // );

  // const handleAssignOwnerAsManager = async () => {
  //   if (!selectedOwnerId) {
  //     setAssignmentError("Por favor, selecione um proprietário.");
  //     return;
  //   }

  //   setIsLoading(true);
  //   setAssignmentError(null);
  //   setAssignmentSuccess(false);

  //   try {
  //     const response = await api.post<ApiResponse>("/organizacoes/proprietarios/add", {
  //       IdProprietarioToGestor: parseInt(selectedOwnerId),
  //       idProprietario: owner.id,
  //       status: 1
  //     });

  //     if (response.data && response.data.operationStatus === "1") {
  //       setAssignmentSuccess(true);
  //       toast.success(response.data.operationDesc || "Gestor adicionado com sucesso!");
        
  //       setSelectedOwnerId("");
        
  //       if (typeof onFinish === 'function') {
  //         onFinish();
  //       }
  //     } else {
  //       setAssignmentError(response.data?.operationDesc || "Erro ao adicionar gestor.");
  //       toast.error(response.data?.operationDesc || "Erro ao adicionar gestor.");
  //     }
  //   } catch (error: any) {
  //     setAssignmentError("Erro ao conectar com o servidor. Tente novamente mais tarde.");
  //     toast.error(error.response?.data?.operationDesc || "Erro ao conectar com o servidor.");
  //   } finally {
  //     setIsLoading(false);
  //   }
  // };

  return (
    <Card className="border shadow-md overflow-hidden">
      <CardHeader className="bg-gray-50 pb-4 border-b">
        <CardTitle className="text-xl flex items-center">
          <div 
            className="w-8 h-8 rounded-full flex items-center justify-center mr-3"
            style={{ backgroundColor: "#028eab", color: "white" }}
          >
            <UserPlus className="h-4 w-4" />
          </div>
          Adicionar Gestor para {owner.nome}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <Tabs defaultValue="new" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-8">
            <TabsTrigger value="new">Novo Gestor</TabsTrigger>
            {/* <TabsTrigger value="existing">Proprietário Existente</TabsTrigger> */}
          </TabsList>
          
          <TabsContent value="new">
            
            <ManagerFormStepper
              owner={owner}
              onComplete={onComplete}
              onFinish={onFinish}
            />
          </TabsContent>
          
          {/* <TabsContent value="existing">
            <div className="p-4 bg-blue-50 rounded-lg mb-6">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: "#028eab" }}>
                  <Building className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-medium">Usar Proprietário Existente como Gestor</h3>
                  <p className="text-sm text-gray-600">
                    Selecione um proprietário já cadastrado para atuar como gestor
                  </p>
                </div>
              </div>
            </div>
            
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nome, NIF ou natureza jurídica..."
                className="pl-10 py-5 border-gray-300 bg-gray-50"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                disabled={isLoading}
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecione um Proprietário
              </label>
              <Select 
                value={selectedOwnerId} 
                onValueChange={setSelectedOwnerId}
                disabled={isLoading || freeOwners.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um proprietário..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredOwners.map((freeOwner) => (
                    <SelectItem key={freeOwner.id} value={freeOwner.id.toString()}>
                      <div className="flex items-center gap-2">
                        <span>{freeOwner.nome}</span>
                        <Badge variant="outline" className="text-xs">
                          {freeOwner.nif}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {freeOwners.length === 0 && !isLoading && (
                <p className="text-sm text-amber-600 mt-2">
                  Não há proprietários disponíveis para serem atribuídos como gestores.
                </p>
              )}
            </div>
            
            {selectedOwnerId && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-6">
                <h4 className="font-medium mb-2">Proprietário Selecionado</h4>
                {freeOwners.filter(o => o.id.toString() === selectedOwnerId).map(selectedOwner => (
                  <div key={selectedOwner.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center mr-3 text-white text-sm font-bold"
                        style={{ backgroundColor: "#028eab" }}
                      >
                        {selectedOwner.nome.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{selectedOwner.nome}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">NIF: {selectedOwner.nif}</Badge>
                          {selectedOwner.natureza_juridica && (
                            <Badge style={{ backgroundColor: "#028eab", color: "white" }} className="text-xs">
                              {selectedOwner.natureza_juridica}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <ExternalLink className="h-4 w-4 mr-1" /> Detalhes
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Detalhes do Proprietário</DialogTitle>
                          <DialogDescription>
                            Informações completas do proprietário selecionado
                          </DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4 my-4">
                          <div>
                            <h4 className="text-sm font-semibold">Nome:</h4>
                            <p>{selectedOwner.nome}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">NIF:</h4>
                            <p>{selectedOwner.nif}</p>
                          </div>
                          <div>
                            <h4 className="text-sm font-semibold">Natureza Jurídica:</h4>
                            <p>{selectedOwner.natureza_juridica || "N/A"}</p>
                          </div>
                          {selectedOwner.tipo_organizacao && (
                            <div>
                              <h4 className="text-sm font-semibold">Tipo:</h4>
                              <p>{selectedOwner.tipo_organizacao === "PG" ? "Proprietário-Gestor" : "Proprietário"}</p>
                            </div>
                          )}
                        </div>
                        
                        <DialogFooter>
                          <DialogClose asChild>
                            <Button variant="outline">Fechar</Button>
                          </DialogClose>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>
                ))}
              </div>
            )}
            
            {assignmentError && (
              <Alert variant="destructive" className="mb-6">
                <AlertCircle className="h-4 w-4 mr-2" />
                <AlertDescription>{assignmentError}</AlertDescription>
              </Alert>
            )}
            
            {assignmentSuccess && (
              <Alert className="mb-6 bg-green-50 border-green-300 text-green-800">
                <CheckCircle2 className="h-4 w-4 mr-2 text-green-600" />
                <AlertDescription>Proprietário atribuído como gestor com sucesso!</AlertDescription>
              </Alert>
            )}
            
            <div className="flex justify-end space-x-2 mt-8 pt-4 border-t">
              <Button 
                variant="outline" 
                onClick={() => typeof onFinish === 'function' && onFinish()}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button 
                style={{ backgroundColor: "#028eab" }}
                onClick={handleAssignOwnerAsManager}
                disabled={isLoading || !selectedOwnerId}

              >
                {isLoading ? (
                  <>
                    <div className="animate-spin h-4 w-4 mr-2 border-2 border-t-transparent rounded-full"></div>
                    Processando...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" /> 
                    Adicionar como Gestor
                  </>
                )}
              </Button>
            </div>
          </TabsContent> */}
        </Tabs>
      </CardContent>
    </Card>
  );
}