import React from "react";
import { Button } from "../ui/button";
import { ArrowLeft } from "lucide-react";

export default function CardNoDataError({
  title,
  description,
  buttonOnClick,
  buttonText,
}: {
  title: string;
  description: string;
  buttonOnClick: () => void;
  buttonText: string;
}) {
  return (
    <div className="p-8 bg-red-50 rounded-lg border border-red-200 text-center">
      <h2 className="text-xl font-bold text-red-700 mb-2"> {title}</h2>
      <p className="text-red-600 mb-6">{description}</p>
      <Button
        variant="outline"
        className="mt-2"
        onClick={() => buttonOnClick()}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        {buttonText}
      </Button>
    </div>
  );
}
