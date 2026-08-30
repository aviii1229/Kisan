import React, { useState } from 'react';
import { CheckCircle, ArrowRight, Calendar, Clock, MapPin, User, Phone, Package } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { InteractiveBookingData } from '../utils/voiceAssistantEngine';
import { speakText } from '../utils/sound';

interface InChatBookingCardProps {
  initialData: InteractiveBookingData;
  onBookSuccess?: (tokenNumber: string) => void;
}

export const InChatBookingCard: React.FC<InChatBookingCardProps> = ({ initialData, onBookSuccess }) => {
  const { centres, bookToken, setActiveTab } = useApp();
  const [formData, setFormData] = useState<InteractiveBookingData>(initialData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bookedTokenNumber, setBookedTokenNumber] = useState<string | null>(initialData.bookedTokenNumber || null);

  const handleBook = async () => {
    setIsSubmitting(true);
    try {
      const selectedCentre = centres.find(c => c.id === formData.centreId) || centres[0];
      const token = await bookToken({
        farmerName: formData.farmerName || 'Farmer',
        farmerName_te: formData.farmerName || 'Farmer',
        phone: formData.phone || '9876543210',
        centreId: selectedCentre.id,
        centreName: selectedCentre.name,
        cropId: formData.cropId,
        cropName: formData.cropName,
        quantityQuintals: formData.quantityQuintals || 50,
        vehicleType: 'Tractor-Trolley (टैक्टर)',
        vehicleNumber: 'UP 53 AA 5555',
        slotDate: new Date().toISOString().split('T')[0],
        slotTime: formData.slotTime
      });

      setBookedTokenNumber(token.tokenNumber);
      if (onBookSuccess) onBookSuccess(token.tokenNumber);

      speakText(`किसान मदद: बधाई हो! आपका टोकन ${token.tokenNumber} ${selectedCentre.name.split(' ')[0]} के लिए सफलतापूर्वक बुक हो गया है!`, 'hi');
    } catch (e: any) {
      alert(e.message || 'Token booking failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (bookedTokenNumber) {
    return (
      <div className="bg-emerald-950 text-white p-3.5 rounded-2xl border border-emerald-400/40 space-y-2.5 mt-2 font-sans shadow-lg">
        <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
          <CheckCircle className="w-4.5 h-4.5 text-emerald-400" />
          <span>टोकन बुक हो गया! (Digital Token Confirmed)</span>
        </div>
        <div className="bg-emerald-900/60 p-3 rounded-xl border border-emerald-500/30 text-xs font-mono space-y-1">
          <p className="text-emerald-200">Token Number: <span className="text-white font-black text-sm">{bookedTokenNumber}</span></p>
          <p className="text-emerald-300 text-[11px]">{formData.centreName.split(' ')[0]} • {formData.slotTime}</p>
          <p className="text-emerald-300 text-[10px]">{formData.farmerName} • {formData.quantityQuintals} Quintals {formData.cropName}</p>
        </div>
        <button
          onClick={() => {
            setActiveTab('queue');
          }}
          className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5"
        >
          <span>कतार स्थिति और QR पास देखें (View Pass)</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-purple-950 via-slate-950 to-purple-950 text-white p-4 rounded-2xl border border-purple-400/40 space-y-3 mt-2.5 font-sans text-xs shadow-xl">
      <div className="flex items-center justify-between border-b border-purple-800 pb-2">
        <span className="font-extrabold text-[10.5px] font-mono text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
          <Package className="w-4 h-4 text-purple-400" />
          In-Chat Token Booking Form
        </span>
        <span className="text-[9px] bg-purple-500/20 text-purple-200 border border-purple-400/30 px-2 py-0.5 rounded-md font-mono font-bold">
          Live Interactive
        </span>
      </div>

      <div className="space-y-2.5">
        <div>
          <label className="text-[9.5px] text-purple-300 font-bold block mb-1">Procurement Centre (मंडी):</label>
          <select
            value={formData.centreId}
            onChange={(e) => {
              const c = centres.find(ctr => ctr.id === e.target.value);
              setFormData(prev => ({ ...prev, centreId: e.target.value, centreName: c ? c.name : prev.centreName }));
            }}
            className="w-full bg-purple-900/90 border border-purple-700 rounded-xl px-3 py-1.5 text-white font-bold text-xs focus:outline-none"
          >
            {centres.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9.5px] text-purple-300 font-bold block mb-1">Farmer Name:</label>
            <input
              type="text"
              value={formData.farmerName}
              onChange={(e) => setFormData(prev => ({ ...prev, farmerName: e.target.value }))}
              className="w-full bg-purple-900/90 border border-purple-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[9.5px] text-purple-300 font-bold block mb-1">Phone Number:</label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full bg-purple-900/90 border border-purple-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[9.5px] text-purple-300 font-bold block mb-1">Crop (फसल):</label>
            <select
              value={formData.cropId}
              onChange={(e) => setFormData(prev => ({ ...prev, cropId: e.target.value, cropName: e.target.options[e.target.selectedIndex].text }))}
              className="w-full bg-purple-900/90 border border-purple-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:outline-none"
            >
              <option value="wheat">🌾 Wheat (Sharbati)</option>
              <option value="paddy-grade-a">🌾 Paddy (Grade A)</option>
              <option value="maize">🌽 Maize (Corn)</option>
              <option value="cotton-long">🌱 Cotton</option>
              <option value="soyabean">🌱 Soyabean</option>
              <option value="chana">🌱 Bengal Gram (Chana)</option>
            </select>
          </div>

          <div>
            <label className="text-[9.5px] text-purple-300 font-bold block mb-1">Quantity (Quintals):</label>
            <input
              type="number"
              value={formData.quantityQuintals}
              onChange={(e) => setFormData(prev => ({ ...prev, quantityQuintals: parseInt(e.target.value, 10) || 10 }))}
              className="w-full bg-purple-900/90 border border-purple-700 rounded-xl px-2.5 py-1.5 text-white text-xs font-bold focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[9.5px] text-purple-300 font-bold block mb-1">Preferred Time Slot:</label>
          <select
            value={formData.slotTime}
            onChange={(e) => setFormData(prev => ({ ...prev, slotTime: e.target.value }))}
            className="w-full bg-purple-900/90 border border-purple-700 rounded-xl px-3 py-1.5 text-white text-xs font-bold focus:outline-none"
          >
            <option value="08:30 AM - 09:30 AM">08:30 AM - 09:30 AM</option>
            <option value="09:30 AM - 10:30 AM">09:30 AM - 10:30 AM</option>
            <option value="10:30 AM - 11:30 AM">10:30 AM - 11:30 AM</option>
            <option value="11:30 AM - 12:30 PM">11:30 AM - 12:30 PM</option>
            <option value="02:00 PM - 03:00 PM">02:00 PM - 03:00 PM</option>
            <option value="03:00 PM - 04:00 PM">03:00 PM - 04:00 PM</option>
          </select>
        </div>
      </div>

      <button
        onClick={handleBook}
        disabled={isSubmitting}
        className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-1.5 border border-emerald-300 disabled:opacity-50 mt-1"
      >
        <CheckCircle className="w-4 h-4 text-slate-950" />
        <span>{isSubmitting ? 'टोकन जारी हो रहा है...' : 'कन्फर्म टोकन बुक करें (Book Token Now)'}</span>
      </button>
    </div>
  );
};
