import { NewClaimFormData, ClaimType } from '../../types';
import { MerchantProfile } from '../../api/client';
import { Lock } from 'lucide-react';

interface StepProps {
  data: NewClaimFormData;
  onChange: (patch: Partial<NewClaimFormData>) => void;
}

interface Step1Props extends StepProps {
  isMerchant?: boolean;
  merchantProfile?: MerchantProfile | null;
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky transition-all';
const labelCls = 'block text-xs font-medium text-gray-600 mb-1';

export function Step1Contact({ data, onChange, isMerchant, merchantProfile }: Step1Props) {
  const lockedCls = 'w-full px-3 py-2.5 text-sm border border-gray-100 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed';
  const autoFilledFields = isMerchant && merchantProfile
    ? new Set(['contactName', 'contactEmail', 'contactCompany', 'contactPhone'])
    : new Set<string>();

  function field(id: keyof NewClaimFormData) {
    return autoFilledFields.has(id);
  }

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-maersk-navy">Contact Information</h2>
        <p className="text-sm text-gray-500 mt-1">Provide the contact details for the claim. This person will receive updates about the claim.</p>
      </div>

      {isMerchant && merchantProfile && (
        <div className="flex items-center gap-2 px-3 py-2 bg-maersk-light border border-maersk-sky/30 rounded-lg text-xs text-maersk-blue">
          <Lock className="w-3.5 h-3.5 flex-shrink-0" />
          <span>Contact details have been pre-filled from your company's onboarding profile. You can update them if needed.</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Full Name <span className="text-red-500">*</span></label>
          {field('contactName') ? (
            <div className="relative">
              <input type="text" className={lockedCls} value={data.contactName} readOnly />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          ) : (
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Sarah Mitchell"
              value={data.contactName}
              onChange={e => onChange({ contactName: e.target.value })}
              required
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Email Address <span className="text-red-500">*</span></label>
          {field('contactEmail') ? (
            <div className="relative">
              <input type="email" className={lockedCls} value={data.contactEmail} readOnly />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          ) : (
            <input
              type="email"
              className={inputCls}
              placeholder="e.g. sarah@company.com"
              value={data.contactEmail}
              onChange={e => onChange({ contactEmail: e.target.value })}
              required
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Company / Organisation <span className="text-red-500">*</span></label>
          {field('contactCompany') ? (
            <div className="relative">
              <input type="text" className={lockedCls} value={data.contactCompany} readOnly />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          ) : (
            <input
              type="text"
              className={inputCls}
              placeholder="e.g. Global Trade Group"
              value={data.contactCompany}
              onChange={e => onChange({ contactCompany: e.target.value })}
              required
            />
          )}
        </div>
        <div>
          <label className={labelCls}>Phone Number <span className="text-red-500">*</span></label>
          {field('contactPhone') ? (
            <div className="relative">
              <input type="tel" className={lockedCls} value={data.contactPhone} readOnly />
              <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
            </div>
          ) : (
            <input
              type="tel"
              className={inputCls}
              placeholder="e.g. +1-212-555-0100"
              value={data.contactPhone}
              onChange={e => onChange({ contactPhone: e.target.value })}
              required
            />
          )}
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Job Role / Title</label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Logistics Manager"
            value={data.contactRole}
            onChange={e => onChange({ contactRole: e.target.value })}
          />
        </div>
      </div>
    </div>
  );
}

const claimTypes: { value: ClaimType; label: string; description: string; icon: string }[] = [
  { value: 'lost', label: 'Lost Shipment', description: 'Shipment cannot be located or was never delivered', icon: '🔍' },
  { value: 'damaged', label: 'Damaged Goods', description: 'Cargo arrived with physical damage', icon: '📦' },
  { value: 'late_delivery', label: 'Late Delivery', description: 'Shipment delivered past the guaranteed date', icon: '⏱' },
  { value: 'missing_items', label: 'Missing Items', description: 'Partial delivery — some items not received', icon: '❓' },
  { value: 'shortage', label: 'Shortage', description: 'Quantity received is less than quantity shipped', icon: '📊' },
  { value: 'wrong_delivery', label: 'Wrong Delivery', description: 'Incorrect shipment delivered to address', icon: '🔄' },
];

export function Step2ShipmentClaim({ data, onChange }: StepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-maersk-navy">Shipment & Claim Details</h2>
        <p className="text-sm text-gray-500 mt-1">Provide the tracking number, claim type, and item details.</p>
      </div>

      {/* Tracking number */}
      <div>
        <label className={labelCls}>Tracking / AWB Number <span className="text-red-500">*</span></label>
        <input
          type="text"
          className={inputCls}
          placeholder="e.g. MAEU1234567890"
          value={data.trackingNumber}
          onChange={e => onChange({ trackingNumber: e.target.value })}
          required
        />
      </div>

      {/* Claim type cards */}
      <div>
        <label className={labelCls}>Claim Type <span className="text-red-500">*</span></label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
          {claimTypes.map(({ value, label, description, icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => onChange({ claimType: value })}
              className={`p-3 rounded-xl border-2 text-left transition-all ${
                data.claimType === value
                  ? 'border-maersk-blue bg-maersk-light'
                  : 'border-gray-200 hover:border-maersk-sky/50 hover:bg-gray-50'
              }`}
            >
              <span className="text-xl">{icon}</span>
              <p className={`text-xs font-semibold mt-1 ${data.claimType === value ? 'text-maersk-navy' : 'text-gray-700'}`}>{label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 leading-tight">{description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Item details grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Item Type <span className="text-red-500">*</span></label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. Electronics, Automotive Parts"
            value={data.commodityType}
            onChange={e => onChange({ commodityType: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Quantity <span className="text-red-500">*</span></label>
          <input
            type="number"
            className={inputCls}
            placeholder="e.g. 50"
            min="1"
            step="1"
            value={data.quantity}
            onChange={e => onChange({ quantity: e.target.value })}
            required
          />
        </div>
        <div>
          <label className={labelCls}>Unit Weight <span className="text-xs text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            className={inputCls}
            placeholder="e.g. 2.5 kg"
            value={data.weight}
            onChange={e => onChange({ weight: e.target.value })}
          />
        </div>
        <div>
          <label className={labelCls}>Unit Cost <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <select
              className="px-2.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 bg-gray-50"
              value={data.currency}
              onChange={e => onChange({ currency: e.target.value })}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>SGD</option>
              <option>AUD</option>
            </select>
            <input
              type="number"
              className={`${inputCls} flex-1`}
              placeholder="0.00"
              min="0"
              step="0.01"
              value={data.unitCost}
              onChange={e => onChange({ unitCost: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Claim Amount <span className="text-red-500">*</span></label>
          <div className="flex gap-2">
            <select
              className="px-2.5 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 bg-gray-50"
              value={data.currency}
              onChange={e => onChange({ currency: e.target.value })}
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>SGD</option>
              <option>AUD</option>
            </select>
            <input
              type="number"
              className={`${inputCls} flex-1`}
              placeholder="0.00"
              min="0"
              step="0.01"
              value={data.claimedAmount}
              onChange={e => onChange({ claimedAmount: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="sm:col-span-2">
          <label className={labelCls}>Item Description <span className="text-red-500">*</span></label>
          <textarea
            className={`${inputCls} resize-none`}
            rows={4}
            placeholder="Describe the items and the issue — what happened, when it was discovered, and any immediate actions taken..."
            value={data.description}
            onChange={e => onChange({ description: e.target.value })}
            required
          />
        </div>
      </div>
    </div>
  );
}
