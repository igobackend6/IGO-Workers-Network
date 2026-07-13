import React, { useEffect, useRef, useState } from 'react';
import { Camera, X, RefreshCw, SwitchCamera } from 'lucide-react';
import { readImageFile } from '../utils';

interface CameraCaptureModalProps {
  lang: 'en' | 'ta';
  facingMode?: 'user' | 'environment';
  onCapture: (dataUrl: string) => void;
  onClose: () => void;
}

export default function CameraCaptureModal({ lang, facingMode = 'user', onCapture, onClose }: CameraCaptureModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentFacing, setCurrentFacing] = useState(facingMode);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setReady(false);
    setError('');

    if (!navigator.mediaDevices?.getUserMedia) {
      setError(lang === 'en' ? 'Camera not available on this device/browser.' : 'இந்த சாதனத்தில் கேமரா கிடைக்கவில்லை.');
      return;
    }

    navigator.mediaDevices.getUserMedia({ video: { facingMode: currentFacing }, audio: false })
      .then((stream) => {
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setReady(true);
      })
      .catch(() => {
        setError(lang === 'en' ? 'Could not access camera. You can upload a photo instead.' : 'கேமராவை அணுக முடியவில்லை. புகைப்படத்தை பதிவேற்றலாம்.');
      });

    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [currentFacing, lang]);

  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    onCapture(canvas.toDataURL('image/jpeg', 0.9));
  };

  const handleFileFallback = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      onCapture(await readImageFile(file));
    } catch (err: any) {
      setError(err.message || (lang === 'en' ? 'Only PNG and JPEG images are allowed.' : 'PNG மற்றும் JPEG படங்கள் மட்டுமே அனுமதிக்கப்படும்.'));
    }
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="bg-slate-900 border-2 border-white/10 rounded-3xl p-4 w-full max-w-sm shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-amber-400" />
            {lang === 'en' ? 'Camera Capture' : 'கேமரா படம்'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-slate-300 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {error ? (
          <div className="space-y-3">
            <p className="text-xs font-bold text-rose-300 bg-rose-500/10 border border-rose-500/25 rounded-xl p-3">{error}</p>
            <input type="file" accept="image/png,image/jpeg" ref={fileInputRef} className="hidden" onChange={handleFileFallback} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white font-black uppercase tracking-wider text-xs rounded-xl cursor-pointer"
            >
              {lang === 'en' ? 'Upload Photo Instead' : 'புகைப்படத்தை பதிவேற்றவும்'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-square">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              {!ready && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
                </div>
              )}
              <button
                type="button"
                onClick={() => setCurrentFacing((f) => (f === 'user' ? 'environment' : 'user'))}
                className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center rounded-full bg-black/60 hover:bg-black/80 text-white cursor-pointer"
                title={lang === 'en' ? 'Switch camera' : 'கேமராவை மாற்று'}
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            </div>
            <button
              type="button"
              disabled={!ready}
              onClick={handleCapture}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 border-b-4 border-amber-700 text-slate-950 font-black uppercase tracking-wider text-xs rounded-xl shadow-md transition-all active:translate-y-0.5 active:border-b-0 cursor-pointer disabled:opacity-50"
            >
              {lang === 'en' ? 'Capture Photo' : 'படம் எடு'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
