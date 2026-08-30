import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Calendar, Clock, Truck, User, Landmark, Scale, AlertTriangle, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useLanguage } from '../context/LanguageContext';
import { ProcurementCentre, SlotAvailability, DigitalToken } from '../types';

interface TokenBookingModalProps {
  centre: ProcurementCentre;
  onClose: () => void;
  onSuccess: (token: DigitalToken) => void;
}

export const TokenBookingModal: React.FC<TokenBookingModalProps> = ({ centre, onClose, onSuccess }) => {
  const { bookToken, fetchSlotAvailability, farmer } = useApp();
  const { lang, t } = useLanguage();

  const [step, setStep] = useState<1 | 2>(1);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Form Fields
  const [farmerName, setFarmerName] = useState<string>(farmer?.name || '');
  const [phone, setPhone] = useState<string>(farmer?.phone || '');
  const [cropId, setCropId] = useState<string>(centre.acceptedCrops[0]?.cropId || '');
  const [quantity, setQuantity] = useState<string>('25');
  const [vehicleType, setVehicleType] = useState<string>('Tractor-Trolley (ట్రాక్టర్ / ट्रैक्टर)');
  const [vehicleNumber, setVehicleNumber] = useState<string>('');
  const [aadhaar, setAadhaar] = useState<string>('');
  const [passbook, setPassbook] = useState<string>('');

  // Slot Picker Fields
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    // Default to tomorrow
    today.setDate(today.getDate() + 1);
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [slotsAvailability, setSlotsAvailability] = useState<SlotAvailability[]>([]);
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);

  // Load slot availabilities when date is changed
  useEffect(() => {
    const loadSlots = async () => {
      setLoadingSlots(true);
      try {
        const slots = await fetchSlotAvailability(centre.id, selectedDate);
        setSlotsAvailability(slots);
        // Reset selected slot if not valid on new date
        setSelectedSlot('');
      } catch (e) {
        console.error('Failed to load slots', e);
      } finally {
        setLoadingSlots(false);
      }
    };
    if (centre.id && selectedDate) {
      loadSlots();
    }
  }, [centre.id, selectedDate, fetchSlotAvailability]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!farmerName.trim() || !phone.trim()) {
      setError('Farmer Name and Phone are required.');
      return;
    }
    if (!/^\d{10}$/.test(phone)) {
      setError('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (!cropId) {
      setError('Please select a crop commodity.');
      return;
    }
    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError('Please enter a valid grain quantity in quintals.');
      return;
    }
    if (!vehicleNumber.trim()) {
      setError('Please enter a transport vehicle plate number.');
      return;
    }
    if (!/^\d{4}$/.test(aadhaar)) {
      setError('Please provide the last 4 digits of your Aadhaar Card.');
      return;
    }
    if (!passbook.trim()) {
      setError('Bank passbook / government registration ID is required.');
      return;
    }

    setStep(2);
  };

  const handleConfirmBooking = async () => {
    setError('');
    if (!selectedSlot) {
      setError('Please select a delivery time slot.');
      return;
    }

    const selectedCropObj = centre.acceptedCrops.find(c => c.cropId === cropId);
    if (!selectedCropObj) return;

    setLoading(true);
    try {
      const token = await bookToken({
        farmerName,
        farmerName_te: farmerName,
        phone,
        centreId: centre.id,
        centreName: centre.name,
        cropId,
        cropName: selectedCropObj.name,
        quantityQuintals: parseFloat(quantity),
        vehicleType,
        vehicleNumber: vehicleNumber.toUpperCase().trim(),
        slotDate: selectedDate,
        slotTime: selectedSlot,
        aadhaarLast4: aadhaar,
        passbookNo: passbook.trim()
      });

      onSuccess(token);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Slot booking failed. Please try a different time.');
    } finally {
      setLoading(false);
    }
  };

  // Auth Gate: If farmer is not logged in, show login-required screen
  if (!farmer) {
    return createPortal(
      <div
        className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center p-4">
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-[#FFFDF8] rounded-3xl shadow-lifted w-full max-w-md relative animate-fadeIn overflow-hidden border border-slate-200 paper-bg-texture p-10 text-center space-y-5"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-100 border border-amber-200 flex items-center justify-center">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="font-display font-black text-slate-900 text-lg">Login Required</h3>
            <p className="text-sm text-slate-500 font-semibold leading-relaxed max-w-xs mx-auto">
              You must log in with your registered phone number before booking a procurement token at <strong className="text-slate-700">{centre.name.split('(')[0].trim()}</strong>.
            </p>
            <p className="text-[10px] text-slate-400 font-bold flex items-center justify-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Your data is private and visible only to you
            </p>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="min-h-full flex items-center justify-center p-0 sm:p-4">
        <div
          onClick={(e) => e.stopPropagation()}
          className="bg-[#FFFDF8] sm:rounded-3xl shadow-lifted w-full max-w-lg relative animate-fadeIn overflow-hidden min-h-screen sm:min-h-0 sm:my-8 border border-slate-200 flex flex-col paper-bg-texture"
        >
          {/* Sticky Header */}
          <div className="bg-gradient-to-r from-agri-850 to-agri-950 px-6 py-5 text-white sticky top-0 z-10">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-amber-300" />
              Book Digital E-Token Slot
            </h2>
            <p className="text-[11px] text-agri-100 mt-1 uppercase tracking-wide font-semibold">
              {centre.name}
            </p>
          </div>

          <div className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {step === 1 ? (
              /* Step 1: Farmer & Delivery Details */
              <form onSubmit={handleNextStep} className="space-y-3.5 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block">Farmer Name</label>
                    <input
                      type="text"
                      required
                      value={farmerName}
                      onChange={(e) => setFarmerName(e.target.value)}
                      placeholder="Enter Full Name"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block">Phone Number</label>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      value={phone}
                      onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                      placeholder="10-digit Mobile"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block">Select Crop</label>
                    <select
                      value={cropId}
                      onChange={(e) => setCropId(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500 cursor-pointer"
                    >
                      {centre.acceptedCrops.map((c) => (
                        <option key={c.cropId} value={c.cropId}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block">Estimated Weight (Quintals)</label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={1000}
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      placeholder="e.g. 50"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block">Vehicle Class</label>
                    <select
                      value={vehicleType}
                      onChange={(e) => setVehicleType(e.target.value)}
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500 cursor-pointer"
                    >
                      <option value="Tractor-Trolley (ట్రాక్టర్ / ट्रैक्टर)">Tractor-Trolley</option>
                      <option value="Mini-Truck (DCM / बोलेरो)">Mini-Truck (DCM)</option>
                      <option value="Large Truck (లారీ / ट्रक)">Large Truck (Lorry)</option>
                      <option value="Bullock Cart (ఎడ్లబండి / बैलगाड़ी)">Bullock Cart</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-500 block">Vehicle Plate No.</label>
                    <input
                      type="text"
                      required
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      placeholder="e.g. UP53AT5678"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-slate-500 block">Aadhaar Card (Last 4 digits)</label>
                    <input
                      type="password"
                      required
                      maxLength={4}
                      value={aadhaar}
                      onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXX"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                  <div>
                    <label className="text-slate-500 block">Bank Passbook / Reg ID</label>
                    <input
                      type="text"
                      required
                      value={passbook}
                      onChange={(e) => setPassbook(e.target.value)}
                      placeholder="e.g. UP-GKP-2026-99"
                      className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full mt-4 py-3 bg-agri-600 hover:bg-agri-500 text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                >
                  Continue to Delivery Scheduler
                </button>
              </form>
            ) : (
              /* Step 2: Date & Slot Scheduling */
              <div className="space-y-4 text-xs font-semibold">
                <div>
                  <label className="text-slate-500 block">Select Delivery Date</label>
                  <div className="relative mt-1">
                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="date"
                      value={selectedDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setSelectedDate(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 font-bold focus:outline-none focus:ring-2 focus:ring-agri-500"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-slate-500 block flex items-center justify-between">
                    <span>Select Time Slot</span>
                    {loadingSlots && <span className="text-[10px] text-slate-400">Loading spots...</span>}
                  </label>

                  <div className="grid grid-cols-2 gap-2">
                    {slotsAvailability.map((s) => (
                      <button
                        key={s.slotTime}
                        type="button"
                        disabled={s.isFull}
                        onClick={() => setSelectedSlot(s.slotTime)}
                        className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all btn-active-press ${
                          s.isFull
                            ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-60 active:animate-shake'
                            : selectedSlot === s.slotTime
                            ? 'bg-agri-50 border-agri-600 text-agri-800 shadow-sm scale-105'
                            : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <span className="font-bold text-xs">{s.slotTime}</span>
                        <span className={`text-[10px] mt-0.5 ${
                          s.isFull ? 'text-red-500' : s.remaining <= 3 ? 'text-amber-600' : 'text-slate-400'
                        }`}>
                          {s.isFull ? 'Slot Full' : `${s.remaining} spots left`}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[11px] text-amber-800 leading-relaxed font-semibold">
                  Note: A slot reservation limits gate entry to that window, helping prevent queues. Ensure you check-in during your booked slot.
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => setStep(1)}
                    className="py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleConfirmBooking}
                    disabled={loading || !selectedSlot}
                    className="py-3 bg-agri-600 hover:bg-agri-500 text-white font-bold text-xs rounded-xl shadow-md transition disabled:opacity-60 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {loading ? 'Processing...' : 'Confirm & Generate Pass'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};
