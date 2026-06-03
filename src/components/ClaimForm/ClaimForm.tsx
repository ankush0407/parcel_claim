import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, ChevronRight, ChevronLeft, Send } from 'lucide-react';
import { NewClaimFormData } from '../../types';
import { Step1Contact, Step2ShipmentClaim } from './FormSteps';
import EvidenceUpload from './EvidenceUpload';
import ReviewStep from './ReviewStep';
import clsx from 'clsx';
import { useAuth } from '../../auth/AuthContext';
import { fetchMerchantById, MerchantProfile, submitClaim } from '../../api/client';

const STEPS = [
  { id: 1, label: 'Contact Info' },
  { id: 2, label: 'Shipment & Claim' },
  { id: 3, label: 'Evidence' },
  { id: 4, label: 'Review' },
];

const initialData: NewClaimFormData = {
  contactName: '',
  contactEmail: '',
  contactCompany: '',
  contactPhone: '',
  contactRole: '',
  trackingNumber: '',
  claimType: '',
  commodityType: '',
  description: '',
  quantity: '',
  weight: '',
  unitCost: '',
  claimedAmount: '',
  currency: 'USD',
  // legacy fields
  bookingReference: '',
  carrier: '',
  service: '',
  origin: '',
  destination: '',
  shipDate: '',
  deliveryDate: '',
  dimensions: '',
  insuredValue: '',
  containerNumber: '',
  incidentDate: '',
  priority: 'medium',
  evidence: [],
};

function validateStep(step: number, data: NewClaimFormData): string[] {
  const errors: string[] = [];
  if (step === 1) {
    if (!data.contactName.trim()) errors.push('Full name is required');
    if (!data.contactEmail.trim()) errors.push('Email address is required');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail)) errors.push('Enter a valid email address');
    if (!data.contactCompany.trim()) errors.push('Company is required');
    if (!data.contactPhone.trim()) errors.push('Phone number is required');
  }
  if (step === 2) {
    if (!data.trackingNumber.trim()) errors.push('Tracking number is required');
    if (!data.claimType) errors.push('Claim type is required');
    if (!data.commodityType.trim()) errors.push('Item type is required');
    if (!data.quantity || isNaN(Number(data.quantity)) || Number(data.quantity) < 1) errors.push('Valid quantity is required');
    if (!data.unitCost || isNaN(Number(data.unitCost)) || Number(data.unitCost) <= 0) errors.push('Valid unit cost is required');
    if (!data.claimedAmount || isNaN(Number(data.claimedAmount)) || Number(data.claimedAmount) <= 0) errors.push('Valid claim amount is required');
    if (!data.description.trim() || data.description.trim().length < 20) errors.push('Item description must be at least 20 characters');
  }
  return errors;
}

export default function ClaimForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<NewClaimFormData>(initialData);
  const [errors, setErrors] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [claimNumber, setClaimNumber] = useState('');
  const [merchantProfile, setMerchantProfile] = useState<MerchantProfile | null>(null);

  // Auto-populate contact fields from merchant onboarding data
  useEffect(() => {
    if (user?.role === 'merchant' && user.merchantIds.length > 0) {
      fetchMerchantById(user.merchantIds[0]).then(({ merchant }) => {
        setMerchantProfile(merchant);
        setData(prev => ({
          ...prev,
          contactName: user.fullName || prev.contactName,
          contactEmail: user.email || prev.contactEmail,
          contactCompany: merchant.displayName || prev.contactCompany,
          contactPhone: merchant.contactPhone || prev.contactPhone,
        }));
      }).catch(() => {
        // Fall back to user-only info if merchant fetch fails
        setData(prev => ({
          ...prev,
          contactName: user.fullName || prev.contactName,
          contactEmail: user.email || prev.contactEmail,
        }));
      });
    }
  }, [user]);

  const update = (patch: Partial<NewClaimFormData>) => setData(prev => ({ ...prev, ...patch }));

  const next = () => {
    const errs = validateStep(currentStep, data);
    if (errs.length) { setErrors(errs); return; }
    setErrors([]);
    setCurrentStep(s => s + 1);
  };

  const back = () => {
    setErrors([]);
    setCurrentStep(s => s - 1);
  };

  const submit = async () => {
    if (!user) return;
    setSubmitting(true);
    try {
      const result = await submitClaim({
        userId: user.id,
        trackingNumber: data.trackingNumber,
        claimType: data.claimType,
        description: data.description,
        claimedAmount: data.claimedAmount,
        currency: data.currency,
        priority: data.priority,
      });
      setClaimNumber(result.claimNumber);
      setSubmitted(true);
    } catch {
      setErrors(['Failed to submit claim. Please try again.']);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
          <Check className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-xl font-bold text-maersk-navy mb-2">Claim Submitted Successfully</h2>
        <p className="text-gray-500 text-sm mb-2">Your claim reference number is:</p>
        <p className="text-2xl font-bold text-maersk-blue mb-4">{claimNumber}</p>

        <p className="text-sm text-gray-500 mb-6 max-w-sm">
          You will receive a confirmation email at <strong>{data.contactEmail}</strong>. Our team will review your claim within 2 business days.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => navigate('/claims')}
            className="px-5 py-2.5 bg-maersk-blue text-white rounded-lg text-sm font-medium hover:bg-maersk-navy transition-colors"
          >
            View All Claims
          </button>
          <button
            onClick={() => { setData(initialData); setCurrentStep(1); setSubmitted(false); }}
            className="px-5 py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Submit Another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Step progress */}
      <div className="flex items-center mb-8">
        {STEPS.map((step, idx) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all',
                currentStep > step.id
                  ? 'bg-green-500 text-white'
                  : currentStep === step.id
                  ? 'bg-maersk-blue text-white ring-4 ring-maersk-sky/20'
                  : 'bg-gray-100 text-gray-400'
              )}>
                {currentStep > step.id ? <Check className="w-4 h-4" /> : step.id}
              </div>
              <p className={clsx(
                'text-xs mt-1 whitespace-nowrap hidden sm:block',
                currentStep === step.id ? 'text-maersk-blue font-medium' : 'text-gray-400'
              )}>
                {step.label}
              </p>
            </div>
            {idx < STEPS.length - 1 && (
              <div className={clsx(
                'flex-1 h-0.5 mx-2 mb-4 transition-all',
                currentStep > step.id ? 'bg-green-400' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>

      {/* Form card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 md:p-8">
        {/* Step content */}
        {currentStep === 1 && <Step1Contact data={data} onChange={update} isMerchant={user?.role === 'merchant'} merchantProfile={merchantProfile} />}
        {currentStep === 2 && <Step2ShipmentClaim data={data} onChange={update} />}
        {currentStep === 3 && (
          <EvidenceUpload
            files={data.evidence}
            onChange={files => update({ evidence: files })}
          />
        )}
        {currentStep === 4 && <ReviewStep data={data} />}

        {/* Validation errors */}
        {errors.length > 0 && (
          <div className="mt-5 bg-red-50 border border-red-200 rounded-lg p-4 space-y-1">
            {errors.map((err, i) => (
              <p key={i} className="text-xs text-red-600">• {err}</p>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-5 border-t border-gray-100">
          <button
            type="button"
            onClick={back}
            disabled={currentStep === 1}
            className="flex items-center gap-1.5 px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>

          <p className="text-xs text-gray-400">Step {currentStep} of {STEPS.length}</p>

          {currentStep < STEPS.length ? (
            <button
              type="button"
              onClick={next}
              className="flex items-center gap-1.5 px-5 py-2 bg-maersk-blue text-white rounded-lg text-sm font-medium hover:bg-maersk-navy transition-colors"
            >
              Continue <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={submit}
              disabled={submitting}
              className="flex items-center gap-1.5 px-5 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" /> {submitting ? 'Submitting…' : 'Submit Claim'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
