import React from 'react';

interface MnaCardProps {
  mna: any; // using any to avoid strict type import issues
  isUrdu: boolean;
}

const placeholder = '/images/placeholder_profile_card.png'; // ensure this path works or use existing placeholder asset

export const MnaCard: React.FC<MnaCardProps> = ({ mna, isUrdu }) => {
  const imageUrl = mna.profileImageUrl || mna.imageUrl || placeholder;
  return (
    <div className="p-5 rounded-2xl border border-red-500/30 bg-[#0c1322] space-y-4 max-w-xl relative overflow-hidden shadow-lg">
      {/* Background gradient */}
      <div
        className="absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none"
        style={{ background: `radial-gradient(circle, ${mna.partyColor}15 0%, transparent 70%)` }}
      />
      <div className="flex items-center gap-4">
        <div
          className="w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center text-lg font-black text-white"
          style={{ background: `linear-gradient(135deg, ${mna.partyColor}88, ${mna.partyColor})` }}
        >
          {imageUrl ? (
            <img src={imageUrl} alt={mna.name} className="w-full h-full rounded-full object-cover" />
          ) : (
            mna.name.split(' ').map((w: string) => w[0]).join('').slice(0, 2)
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-base font-black text-white truncate">
            {isUrdu ? mna.nameUrdu : mna.name}
          </h4>
          <p className="text-xs text-red-400 font-semibold mt-0.5">
            {isUrdu ? mna.constituencyUrdu || mna.constituency : mna.constituency}
          </p>
          <span
            className="inline-block px-2 py-0.5 rounded text-[10px] font-bold text-white mt-1"
            style={{ background: mna.partyColor }}
          >
            {isUrdu ? mna.partyUrdu : mna.party}
          </span>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-[#7f8ea4] block">AI Grade</span>
          <span className="text-2xl font-black text-white bg-red-600/30 border border-red-500/40 px-3 py-1 rounded-xl block mt-0.5 text-center">
            {mna.attendancePercent >= 80 ? 'A' : mna.attendancePercent >= 65 ? 'B' : mna.attendancePercent >= 50 ? 'C' : 'D'}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 py-2 border-y border-white/5">
        <div className="text-center">
          <div className="text-[10px] text-[#7f8ea4]">{isUrdu ? 'حاضری' : 'Attendance'}</div>
          <div className="text-sm font-bold text-white mt-0.5">{mna.attendancePercent}%</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#7f8ea4]">{isUrdu ? 'بل پیش کیے' : 'Bills Sponsored'}</div>
          <div className="text-sm font-bold text-white mt-0.5">{mna.billsSponsored || 0}</div>
        </div>
        <div className="text-center">
          <div className="text-[10px] text-[#7f8ea4]">{isUrdu ? 'سوالات' : 'Questions Raised'}</div>
          <div className="text-sm font-bold text-white mt-0.5">{mna.questionsRaised || 0}</div>
        </div>
      </div>
      {/* Contact Info */}
      <div className="text-sm text-white space-y-1">
        {mna.address && (
          <div>
            <span className="font-semibold">{isUrdu ? 'پتی:' : 'Address:'}</span> {mna.address}
          </div>
        )}
        {mna.phone && (
          <div>
            <span className="font-semibold">{isUrdu ? 'فون:' : 'Phone:'}</span> {mna.phone}
          </div>
        )}
      </div>
    </div>
  );
};

export default MnaCard;
