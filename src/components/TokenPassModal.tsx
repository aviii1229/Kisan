import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Download,
  Share2,
  Printer,
  ShieldCheck,
  Calendar,
  Clock,
  Truck,
  User,
  Package,
  FileText
} from 'lucide-react';
import { DigitalToken } from '../types';
import { useLanguage } from '../context/LanguageContext';
import { generateTokenPdf } from '../utils/pdfExport';

interface TokenPassModalProps {
  token: DigitalToken | null;
  onClose: () => void;
}

export const TokenPassModal: React.FC<TokenPassModalProps> = ({ token, onClose }) => {
  const { lang, t } = useLanguage();
  const [qrUrl, setQrUrl] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (token) {
      const qrData = JSON.stringify({
        token: token.tokenNumber,
        centre: token.centreName,
        farmer: token.farmerName,
        crop: token.cropName,
        qty: token.quantityQuintals,
        slot: `${token.slotDate} ${token.slotTime}`,
        vehicle: token.vehicleNumber
      });

      QRCode.toDataURL(qrData, { width: 280, margin: 1 })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [token]);

  // Safety net: Escape always closes the modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  if (!token) return null;

  const handleDownload = async () => {
    try {
      setIsExporting(true);
      await generateTokenPdf(token);
      setIsExporting(false);
    } catch (e) {
      console.error('PDF export failed:', e);
      setIsExporting(false);
    }
  };

  const handleShareWhatsApp = () => {
    const text = `🌾 *Kisan H Official Delivery Pass*\nToken: *${token.tokenNumber}*\nFarmer: ${token.farmerName}\nCentre: ${token.centreName}\nCrop: ${token.cropName} (${token.quantityQuintals} Quintals)\nSlot: ${token.slotDate} (${token.slotTime})\nVehicle: ${token.vehicleNumber}`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-3 sm:p-6">
        <div
          onClick={(e) => e.stopPropagation()}
          className="ticket-stub w-full max-w-lg shadow-2xl overflow-hidden relative max-h-[95vh] flex flex-col my-4 border border-slate-200"
        >
          {/* Pass Header */}
          <div className="p-6 bg-gradient-to-r from-agri-800 via-agri-900 to-slate-900 bg-grain text-white relative text-center">
            <button
              onClick={onClose}
              className="absolute top-5 right-5 p-2 rounded-full bg-paper/10 hover:bg-paper/20 text-white transition-all btn-active-press cursor-pointer z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-paper/15 text-xs font-semibold mb-2 -rotate-1">
              <ShieldCheck className="w-4 h-4 text-amber-300" />
              <span>{t('govtAuth')}</span>
            </div>

            <h2 className="font-display text-xl sm:text-2xl font-bold tracking-tight">
              {t('passTitle')}
            </h2>
            <p className="text-xs text-agri-100 mt-0.5 font-bold uppercase tracking-wider">
              Smart Grain Procurement Entry Authorization
            </p>
          </div>

          {/* Perforated tear-line between header stub and body */}
          <div className="ticket-perforation" />

          {/* Pass Printable Body */}
          <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-[#FFFDF8] paper-bg-texture">
            {/* Token Big Badge */}
            <div className="p-4 rounded-2xl bg-white border-2 border-dashed border-agri-400 shadow-xs text-center relative animate-stamp-in">
              <span className="stamp-badge absolute -top-4 left-1/2 -translate-x-1/2 bg-white text-agri-700 text-[9px] font-extrabold rotate-2">
                Official Token
              </span>
              <div className="text-3xl font-black text-ink tracking-wider font-mono mt-2">
                {token.tokenNumber}
              </div>

              {/* QR Code */}
              {qrUrl && (
                <div className="my-3 flex justify-center">
                  <img
                    src={qrUrl}
                    alt="Token QR Code"
                    className="w-44 h-44 rounded-xl border border-slate-200 p-1 bg-white shadow-xs"
                  />
                </div>
              )}

              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                {t('scanInstruction')}
              </p>
            </div>

            {/* Details Table */}
            <div className="bg-white rounded-2xl p-4 border border-slate-200 space-y-3 text-xs font-semibold text-slate-650">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-agri-600" />
                  <span>Farmer Name:</span>
                </span>
                <span className="font-bold text-slate-900 text-sm">
                  {token.farmerName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Mobile Phone:</span>
                <span className="font-bold text-slate-900 font-mono">
                  +91 {token.phone}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500">Procurement Centre:</span>
                <span className="font-bold text-slate-900 text-right max-w-[220px] leading-tight">
                  {token.centreName}
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-agri-600" />
                  <span>Crop & Quantity:</span>
                </span>
                <span className="font-bold text-agri-800">
                  {token.cropName} ({token.quantityQuintals} Quintals)
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Truck className="w-3.5 h-3.5 text-agri-600" />
                  <span>Vehicle:</span>
                </span>
                <span className="font-bold text-slate-900 font-mono">
                  {token.vehicleType} ({token.vehicleNumber})
                </span>
              </div>

              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <span className="text-slate-500 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-agri-600" />
                  <span>Allocated Slot:</span>
                </span>
                <span className="font-bold text-amber-700">
                  {token.slotDate} | {token.slotTime}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-500">Passbook ID:</span>
                <span className="font-bold text-slate-700 font-mono">
                  {token.passbookNo}
                </span>
              </div>
            </div>
          </div>

          {/* Modal Action Buttons */}
          <div className="ticket-perforation p-4 sm:p-6 bg-slate-50 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200">
            <button
              onClick={handleShareWhatsApp}
              className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all btn-active-press cursor-pointer shadow-xs border border-emerald-700 flex items-center justify-center space-x-1.5"
            >
              <Share2 className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isExporting}
              className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all btn-active-press cursor-pointer shadow-xs border border-slate-950 flex items-center justify-center space-x-1.5"
            >
              <Download className="w-4 h-4" />
              <span>{isExporting ? 'Generating...' : t('downloadPdf')}</span>
            </button>

            <button
              onClick={handlePrint}
              className="p-2.5 rounded-xl bg-white border border-slate-350 hover:bg-slate-50 text-slate-700 transition-all btn-active-press cursor-pointer"
              title={t('printPass')}
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default TokenPassModal;
