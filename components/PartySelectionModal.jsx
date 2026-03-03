'use client';

import { useState } from 'react';
import { Users, Eye, HelpCircle, X } from 'lucide-react';

/**
 * PartySelectionModal
 *
 * Props:
 *   partyA        — { name, role } or null
 *   partyB        — { name, role } or null
 *   contractType  — string or null
 *   onSelect(selectedParty) — callback with 'party_a' | 'party_b' | 'reviewing' | 'unsure'
 *   onClose()     — called when user dismisses without selecting
 */
export default function PartySelectionModal({ partyA, partyB, contractType, onSelect, onClose }) {
  const [selected, setSelected] = useState(null);

  const hasNames = partyA?.name || partyB?.name;

  const options = hasNames
    ? [
        {
          id: 'party_a',
          name: partyA?.name || 'Party A',
          role: partyA?.role || 'First party in contract',
          icon: null,
        },
        {
          id: 'party_b',
          name: partyB?.name || 'Party B',
          role: partyB?.role || 'Second party in contract',
          icon: null,
        },
        {
          id: 'reviewing',
          name: 'I am reviewing for someone else',
          role: 'Neutral analysis of both sides',
          icon: <Eye className="w-5 h-5 text-[#6b7280]" />,
        },
        {
          id: 'unsure',
          name: "Not sure",
          role: 'Analyze from the less powerful party\'s perspective',
          icon: <HelpCircle className="w-5 h-5 text-[#6b7280]" />,
        },
      ]
    : [
        {
          id: 'party_a',
          name: 'Party A',
          role: 'First party in contract',
          icon: null,
        },
        {
          id: 'party_b',
          name: 'Party B',
          role: 'Second party in contract',
          icon: null,
        },
        {
          id: 'reviewing',
          name: 'I am reviewing for someone else',
          role: 'Neutral analysis of both sides',
          icon: <Eye className="w-5 h-5 text-[#6b7280]" />,
        },
        {
          id: 'unsure',
          name: 'Not sure',
          role: "Analyze from the less powerful party's perspective",
          icon: <HelpCircle className="w-5 h-5 text-[#6b7280]" />,
        },
      ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(26,23,20,0.5)' }}>
      <div className="bg-white rounded-2xl border border-[#e0d9ce] w-full max-w-[480px] overflow-hidden shadow-xl">

        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#fef3c7] flex items-center justify-center flex-shrink-0">
              <Users className="w-5 h-5 text-[#c8873a]" />
            </div>
            <div>
              <h2 className="text-[17px] font-semibold text-[#1a1714]">
                Before I analyze — which party are you?
              </h2>
              {contractType && (
                <p className="text-xs text-[#9a8f82] mt-0.5">{contractType}</p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#9a8f82] hover:text-[#1a1714] transition-colors p-1 flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="px-6 pb-4 space-y-2">
          {options.map((option) => {
            const isSelected = selected === option.id;
            const isNamedParty = option.id === 'party_a' || option.id === 'party_b';
            return (
              <button
                key={option.id}
                onClick={() => setSelected(option.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-[#c8873a] bg-[#fffbf5]'
                    : 'border-[#e5e7eb] bg-white hover:border-[#c8873a] hover:bg-[#fdfaf5]'
                }`}
              >
                {/* Avatar or icon */}
                {isNamedParty ? (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold ${
                    isSelected ? 'bg-[#c8873a] text-white' : 'bg-[#f5f0e8] text-[#6b7280]'
                  }`}>
                    {option.name.charAt(0).toUpperCase()}
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected ? 'bg-[#fef3c7]' : 'bg-[#f3f4f6]'
                  }`}>
                    {option.icon}
                  </div>
                )}

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className={`font-medium text-[14px] truncate ${
                    isSelected ? 'text-[#1a1714]' : 'text-[#374151]'
                  }`}>
                    {option.name}
                  </div>
                  <div className="text-xs text-[#9a8f82] mt-0.5 truncate">{option.role}</div>
                </div>

                {/* Radio dot */}
                <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                  isSelected ? 'border-[#c8873a]' : 'border-[#d1d5db]'
                }`}>
                  {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#c8873a]" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={() => selected && onSelect(selected)}
            disabled={!selected}
            className="w-full py-3 bg-[#c8873a] hover:bg-[#b5762f] text-white font-semibold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Analyze from this perspective
          </button>
        </div>
      </div>
    </div>
  );
}
