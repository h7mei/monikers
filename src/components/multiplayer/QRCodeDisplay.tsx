'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  roomId: string;
  className?: string;
}

export default function QRCodeDisplay({ roomId, className = '' }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateQR = async () => {
      try {
        const roomUrl = `${window.location.origin}/join/${roomId}/team-selection`;
        const dataUrl = await QRCode.toDataURL(roomUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        });
        setQrDataUrl(dataUrl);
      } catch (error) {
        console.error('Error generating QR code:', error);
      } finally {
        setIsLoading(false);
      }
    };

    generateQR();
  }, [roomId]);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="bg-white p-4 rounded-lg shadow-lg">
        <img src={qrDataUrl} alt="Room QR Code" className="w-48 h-48" />
      </div>
      <div className="mt-4 text-center">
        <p className="text-sm text-gray-400 mb-2">Room Code:</p>
        <p className="text-2xl font-mono font-bold text-blue-500 bg-gray-800 px-4 py-2 rounded-lg">
          {roomId.toUpperCase()}
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Scan QR code or enter code on mobile device
        </p>
      </div>
    </div>
  );
}
