import React from 'react'
import { Button } from '../ui/button'
import { ArrowLeft, ChevronRight, Pencil, User } from 'lucide-react'
import { Badge } from '../ui/badge'
import { Tooltip, TooltipContent, TooltipTrigger } from '../ui/tooltip'
import { useRouter } from 'next/navigation'

export default function CardHeaderPage({ owner, isGestor }: { owner: any, isGestor?: boolean }) {
    const router = useRouter();
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div>
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Button
                    variant="ghost" 
                    onClick={() => router.push(`/dashboard/${isGestor ? 'gestores' : 'proprietarios'}`)}
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    {isGestor ? "Gestores" : "Proprietarios"}
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <Button 
                    variant="ghost" 
                    onClick={() => router.push(`/dashboard/${isGestor ? 'gestores' : 'proprietarios'}/${owner.id}`)}
                    className="p-0 h-auto font-normal hover:bg-transparent"
                    size="sm"
                  >
                    {owner.nome}
                  </Button>
                  <ChevronRight className="h-3 w-3 mx-1" />
                  <span className="font-medium">Editar</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-lg font-bold"
                    style={{ backgroundColor: "#028eab" }}
                  >
                    <Pencil className="h-5 w-5" />
                  </div>
                  <div>
                    <h1 className="text-xl md:text-xl font-bold">Editar {isGestor ? "Gestor" : "Proprietário"}</h1>
                    <div className="flex items-center mt-1">
                      <span className="text-sm text-gray-500 mr-2">
                        <User className="inline h-3 w-3 mr-1" />
                        {owner.nome}
                      </span>
                      <Badge
                        className="font-medium" 
                        style={{ backgroundColor: "#028eab", color: "white" }}
                      >
                        {owner.natureza_juridica === "Outro (ESPECIFIQUE)" ? owner.natureza_juridica_outro : owner.natureza_juridica}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="outline" 
                      onClick={() => router.push(`/dashboard/${isGestor ? 'gestores' : 'proprietarios'}/${owner.id}`)}
                      className="border-gray-300"
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Voltar para Detalhes
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Voltar para os detalhes do {isGestor ? "gestor" : "proprietário"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
        </div>
  )
}
