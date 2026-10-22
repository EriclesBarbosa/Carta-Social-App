import React from 'react'

export default function LoadingData() {
  return (
    <div className="flex flex-col items-center justify-center h-64">
          <div
            className="animate-spin rounded-full h-12 w-12 border-4 border-t-transparent"
            style={{ borderColor: "#028eab transparent #f3f4f6 #f3f4f6" }}
          ></div>
          <p className="mt-4 text-lg font-medium text-gray-600">
            Carregando dados, por favor aguarde...
          </p>
    </div>
  )
}
