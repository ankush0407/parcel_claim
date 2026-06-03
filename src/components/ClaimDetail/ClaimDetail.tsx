import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import {
  ArrowLeft,
  FileText,
  Image,
  Download,
  Paperclip,
  MessageSquare,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { Claim } from '../../types';
import { StatusBadge, TypeBadge, PriorityDot } from '../Claims/Badges';
import { formatCurrency, formatDate, formatFileSize } from '../../utils/helpers';
import ClaimTimeline from './ClaimTimeline';
import clsx from 'clsx';

interface ClaimDetailProps {
  claim: Claim;
}

type Tab = 'overview' | 'timeline' | 'evidence' | 'notes';

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex gap-3 py-2 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-gray-700 font-medium">{value}</span>
    </div>
  );
}

export default function ClaimDetail({ claim }: ClaimDetailProps) {
  const navigate = useNavigate();
    const { user } = useAuth();
    const isMerchant = user?.role === 'merchant';
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [noteText, setNoteText] = useState('');

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'timeline', label: 'Timeline', count: claim.timeline.length },
    { id: 'evidence', label: 'Evidence', count: claim.evidence.length },
    { id: 'notes', label: 'Notes', count: claim.notes.length },
  ];
  const trackingNumber = claim.shipment.trackingNumber || claim.trackingNumber;
  const trackingLink = trackingNumber
    ? `https://www.maersk.com/tracking/parcel/${encodeURIComponent(trackingNumber)}`
    : '';

  return (
    <div className="space-y-5">
      {/* Back + Header */}
      <div className="flex items-start justify-between">
        <div>
          <button
            onClick={() => navigate('/claims')}
            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-maersk-blue transition-colors mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Claims
          </button>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-maersk-navy">{claim.claimNumber}</h1>
            <StatusBadge status={claim.status} />
            <TypeBadge type={claim.type} />
            <div className="flex items-center gap-1.5">
              <PriorityDot priority={claim.priority} />
              <span className="text-xs text-gray-500 capitalize">{claim.priority} priority</span>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Filed {formatDate(claim.filedDate)}{!isMerchant && ` · ${claim.carrier}`} · {claim.contact.company}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors">
            <Download className="w-4 h-4" /> Export
          </button>
          {claim.status !== 'escalated' && claim.status !== 'approved' && claim.status !== 'rejected' && (
            <button className="flex items-center gap-1.5 px-3 py-2 border border-red-200 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors">
              <AlertTriangle className="w-4 h-4" /> Escalate
            </button>
          )}
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: 'Claimed Amount',
            value: formatCurrency(claim.claimedAmount, claim.currency),
            sub: claim.approvedAmount ? `Approved: ${formatCurrency(claim.approvedAmount, claim.currency)}` : undefined,
            color: 'border-maersk-blue',
          },
          {
            label: 'Days Open',
            value: `${claim.daysOpen} days`,
            sub: `SLA: ${formatDate(claim.slaDeadline)}`,
            color: claim.daysOpen > 45 ? 'border-red-400' : 'border-yellow-400',
          },
          ...(!isMerchant ? [{
            label: 'Carrier',
            value: claim.carrier,
            sub: undefined as string | undefined,
            color: 'border-gray-200',
          }] : []),
          {
            label: 'Assigned To',
            value: claim.assignedTo ?? 'Unassigned',
            sub: undefined as string | undefined,
            color: 'border-gray-200',
          },
        ].map(({ label, value, sub, color }) => (
          <div key={label} className={clsx('bg-white rounded-xl p-4 border-l-4 shadow-sm', color)}>
            <p className="text-xs text-gray-400 mb-1">{label}</p>
            <p className="text-base font-bold text-maersk-navy">{value}</p>
            {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <div className="flex gap-1">
          {tabs.map(({ id, label, count }) => (
            <div key={id} className="flex items-center">
              <button
                onClick={() => setActiveTab(id)}
                className={clsx(
                  'px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
                  activeTab === id
                    ? 'border-maersk-blue text-maersk-blue'
                    : 'border-transparent text-gray-500 hover:text-maersk-navy'
                )}
              >
                {label}
                {count !== undefined && count > 0 && (
                  <span className={clsx(
                    'ml-1.5 text-xs px-1.5 py-0.5 rounded-full',
                    activeTab === id ? 'bg-maersk-light text-maersk-blue' : 'bg-gray-100 text-gray-500'
                  )}>
                    {count}
                  </span>
                )}
              </button>

              {id === 'timeline' && trackingLink && (
                <a
                  href={trackingLink}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px border-transparent text-gray-500 hover:text-maersk-navy inline-flex items-center gap-1"
                >
                  Track
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Contact */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-maersk-navy mb-3">Contact Information</h3>
            <DetailRow label="Name" value={claim.contact.name} />
            <DetailRow label="Email" value={claim.contact.email} />
            <DetailRow label="Company" value={claim.contact.company} />
            <DetailRow label="Phone" value={claim.contact.phone} />
            <DetailRow label="Role" value={claim.contact.role} />
          </div>

          {/* Shipment */}
          <div className="bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-maersk-navy mb-3">Shipment Details</h3>
            <DetailRow label="Tracking #" value={claim.shipment.trackingNumber} />
            <DetailRow label="Order Number" value={claim.shipment.clientOrderNumber} />
            <DetailRow label="Client Name" value={claim.shipment.clientName} />
            <DetailRow label="Label Print Date" value={claim.shipment.labelPrintDate ? formatDate(claim.shipment.labelPrintDate) : undefined} />
            <DetailRow label="Origin Zip" value={claim.shipment.originZip} />
            <DetailRow label="Destination Zip" value={claim.shipment.destinationZip} />
            <DetailRow label="Last Tracking Event" value={claim.shipment.lastTrackingEvent} />
            <DetailRow label="Last Event Date" value={claim.shipment.lastTrackingEventDate ? formatDate(claim.shipment.lastTrackingEventDate) : undefined} />
            <DetailRow label="Shipping Charges" value={claim.shipment.shippingCharge != null ? formatCurrency(claim.shipment.shippingCharge, claim.shipment.currency) : undefined} />
            <DetailRow label="Item Value" value={claim.shipment.itemValue != null ? formatCurrency(claim.shipment.itemValue, claim.shipment.currency) : undefined} />
            <DetailRow label="Item Weight" value={claim.shipment.itemWeight} />
          </div>

          {/* Claim description */}
          <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm">
            <h3 className="text-sm font-semibold text-maersk-navy mb-3">Incident Description</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{claim.description}</p>
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-maersk-navy mb-5">Claim Activity</h3>
          <ClaimTimeline events={claim.timeline} />
        </div>
      )}

      {activeTab === 'evidence' && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-maersk-navy">Attached Evidence</h3>
            <button className="flex items-center gap-1.5 text-xs text-maersk-blue hover:text-maersk-navy border border-maersk-sky/30 px-3 py-1.5 rounded-lg transition-colors">
              <Paperclip className="w-3.5 h-3.5" /> Add Document
            </button>
          </div>
          {claim.evidence.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">No documents attached yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {claim.evidence.map((ev) => (
                <div key={ev.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100 hover:bg-maersk-pale hover:border-maersk-sky/30 transition-all group">
                  <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center flex-shrink-0">
                    {ev.type === 'photo' ? (
                      <Image className="w-4 h-4 text-blue-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-700 truncate">{ev.name}</p>
                    <p className="text-xs text-gray-400">
                      {formatFileSize(ev.size)} · {formatDate(ev.uploadedAt)}
                    </p>
                  </div>
                  <button className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-white text-gray-400 hover:text-maersk-blue transition-all">
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'notes' && (
        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h3 className="text-sm font-semibold text-maersk-navy">Internal Notes</h3>

          {claim.notes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No notes yet.</p>
          )}

          {claim.notes.map((note) => (
            <div key={note.id} className="bg-amber-50 border border-amber-200/60 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-amber-700">{note.createdBy}</span>
                <span className="text-xs text-gray-400">
                  {new Date(note.createdAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-sm text-gray-700">{note.content}</p>
            </div>
          ))}

          {/* Add note */}
          <div className="border-t border-gray-100 pt-4">
            <textarea
              rows={3}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-maersk-sky/30 focus:border-maersk-sky resize-none"
              placeholder="Add an internal note..."
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
            />
            <div className="flex justify-end mt-2">
              <button
                disabled={!noteText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 bg-maersk-blue text-white text-sm rounded-lg hover:bg-maersk-navy disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <MessageSquare className="w-4 h-4" /> Add Note
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
