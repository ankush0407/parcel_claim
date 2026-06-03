import { NewClaimFormData } from '../../types';
import { getClaimTypeLabel } from '../../utils/helpers';
import { FileText } from 'lucide-react';

interface ReviewStepProps {
  data: NewClaimFormData;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold text-maersk-blue uppercase tracking-wider mb-3">{title}</h3>
      <div className="bg-gray-50 rounded-xl p-4 space-y-2">
        {children}
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <div className="flex gap-4 text-sm">
      <span className="text-gray-400 w-40 flex-shrink-0">{label}</span>
      <span className="text-maersk-navy font-medium">{value}</span>
    </div>
  );
}

export default function ReviewStep({ data }: ReviewStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-maersk-navy">Review & Confirm</h2>
        <p className="text-sm text-gray-500 mt-1">Please review all details before submitting your claim.</p>
      </div>

      <Section title="Contact Information">
        <Row label="Name" value={data.contactName} />
        <Row label="Email" value={data.contactEmail} />
        <Row label="Company" value={data.contactCompany} />
        <Row label="Phone" value={data.contactPhone} />
        <Row label="Role" value={data.contactRole} />
      </Section>

      <Section title="Shipment & Claim Details">
        <Row label="Tracking Number" value={data.trackingNumber} />
        <Row label="Claim Type" value={data.claimType ? getClaimTypeLabel(data.claimType) : undefined} />
        <Row label="Item Type" value={data.commodityType} />
        <Row label="Quantity" value={data.quantity} />
        <Row label="Unit Weight" value={data.weight} />
        <Row label="Unit Cost" value={data.unitCost ? `${data.currency} ${Number(data.unitCost).toLocaleString()}` : undefined} />
        <Row label="Claim Amount" value={data.claimedAmount ? `${data.currency} ${Number(data.claimedAmount).toLocaleString()}` : undefined} />
        {data.description && (
          <div className="text-sm pt-1">
            <span className="text-gray-400 block mb-1">Item Description</span>
            <p className="text-maersk-navy">{data.description}</p>
          </div>
        )}
      </Section>

      {data.evidence.length > 0 && (
        <Section title="Attached Evidence">
          {data.evidence.map((file, i) => (
            <div key={i} className="flex items-center gap-2 text-sm text-gray-600">
              <FileText className="w-3.5 h-3.5 text-maersk-blue" />
              {file.name}
            </div>
          ))}
        </Section>
      )}

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-700">
        <strong>Declaration:</strong> I confirm that the information provided above is accurate and complete to the best of my knowledge.
        I understand that submitting a fraudulent claim may result in legal action.
      </div>
    </div>
  );
}
