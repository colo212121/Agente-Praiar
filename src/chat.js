import React from 'react';

export default function Chat({ mensajes, loading }) {
  return (
    <div className="flex flex-col gap-3 p-4 bg-gray-100 rounded h-[400px] overflow-y-auto">
      {mensajes.map((msg, idx) => (
        <div key={idx} className={`self-${msg.rol === 'user' ? 'end' : 'start'}`}>
          <div className={`p-2 rounded-lg ${msg.rol === 'user' ? 'bg-blue-200' : 'bg-green-100'}`}>
            <b>{msg.rol === 'user' ? 'Vos' : 'Asistente'}:</b> {String(msg.texto)}
          </div>
        </div>
      ))}
      {loading && (
        <div className="self-start text-gray-500">Pensando...</div>
      )}
    </div>
  );
}