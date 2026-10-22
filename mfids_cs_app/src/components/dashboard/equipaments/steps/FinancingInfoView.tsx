"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface FinancingSource {
  fonte: string;
  contexto: string;
  domain_fonte_fin?: number;
}

interface FinancingInfoViewProps {
  fontesFinanciamento?: FinancingSource[];
  title?: string;
  sourceDescriptions?: Record<number, string>;
}

export function FinancingInfoView({ 
  fontesFinanciamento = [],
  title = "Fontes de Financiamento",
  sourceDescriptions = {}
}: FinancingInfoViewProps) {
  const fontesConstrucao = fontesFinanciamento.filter(
    fonte => ["construção", "1", "CONSTRUÇÃO"].includes(fonte.contexto)
  );
  
  const fontesRemodelacao = fontesFinanciamento.filter(
    fonte => ["remodelação", "2", "REMODELAÇÃO"].includes(fonte.contexto)
  );
  
  const outrasContextos = fontesFinanciamento.filter(
    fonte => !["construção", "1", "CONSTRUÇÃO", "remodelação", "2", "REMODELAÇÃO"].includes(fonte.contexto)
  );

  if (fontesFinanciamento.length === 0) {
    return null;
  }

  const renderFonte = (fonte: FinancingSource) => {
    const isOutro = typeof fonte.fonte === "string" && fonte.fonte.startsWith("Outro: ");
    const descricaoFonte = sourceDescriptions[fonte.domain_fonte_fin ?? 0];

    if (isOutro) {
      return (
        <div className="font-medium text-blue-700">{fonte.fonte}</div>
      );
    }

    return (
      <>
        <div className="font-medium text-blue-700">
          {descricaoFonte || fonte.fonte}
        </div>
        <Badge className={`mt-1 ${fonte.fonte === "1" 
          ? "bg-green-100 text-green-800 hover:bg-green-200" 
          : "bg-red-100 text-red-800 hover:bg-red-200"}`}>
          {fonte.fonte === "1" ? "Sim" : "Não"}
        </Badge>
      </>
    );
  };

  return (
    <Card className="border shadow-sm overflow-hidden">
      <CardHeader className="bg-gray-50 pb-3">
        <CardTitle className="flex items-center text-lg">
          <Clock className="mr-2 h-5 w-5" style={{ color: "#028eab" }} />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        {fontesConstrucao.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Fontes de financiamento da construção</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fontesConstrucao.map((fonte, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  {renderFonte(fonte)}
                  <div className="text-sm text-gray-600 mt-1">Financiamento para construção</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {fontesRemodelacao.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Fontes de financiamento da remodelação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {fontesRemodelacao.map((fonte, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  {renderFonte(fonte)}
                  <div className="text-sm text-gray-600 mt-1">Financiamento para remodelação</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {outrasContextos.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Outras fontes de financiamento</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {outrasContextos.map((fonte, index) => (
                <div key={index} className="bg-gray-50 p-3 rounded border">
                  {renderFonte(fonte)}
                  <div className="text-sm text-gray-600 mt-1">Contexto: {fonte.contexto}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
