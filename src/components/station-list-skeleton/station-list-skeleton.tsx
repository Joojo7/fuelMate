"use client";

const SKELETON_COUNT = 8;

function SkeletonRow({ index }: { index: number }) {
  return (
    <div className="tm-list-item" style={{ opacity: 1 - index * 0.08 }}>
      <div className="d-flex justify-content-between align-items-start">
        <div>
          <div className="d-flex align-items-center gap-2 mb-1">
            <span className="tm-skeleton" style={{ width: 48, height: 10 }} />
            <span className="tm-skeleton" style={{ width: 120 + (index % 3) * 30, height: 12 }} />
            <span className="tm-skeleton" style={{ width: 28, height: 10 }} />
          </div>
          <span className="tm-skeleton d-block" style={{ width: 160, height: 10 }} />
        </div>
        <div className="text-end">
          <span className="tm-skeleton d-block ms-auto" style={{ width: 48, height: 16 }} />
          <span className="tm-skeleton d-block ms-auto mt-1" style={{ width: 36, height: 10 }} />
        </div>
      </div>
      <div className="d-flex gap-1 mt-1">
        <span className="tm-skeleton" style={{ width: 42, height: 14 }} />
        <span className="tm-skeleton" style={{ width: 36, height: 14 }} />
        <span className="tm-skeleton" style={{ width: 50, height: 14 }} />
      </div>
    </div>
  );
}

export default function StationListSkeleton() {
  return (
    <div>
      <div className="px-3 py-2 d-flex gap-1">
        {[40, 36, 48, 24].map((w, i) => (
          <span key={i} className="tm-skeleton" style={{ width: w, height: 20, borderRadius: 10 }} />
        ))}
      </div>
      <div className="px-3 py-2">
        <span className="tm-skeleton" style={{ width: 120, height: 10 }} />
      </div>
      {Array.from({ length: SKELETON_COUNT }, (_, i) => (
        <SkeletonRow key={i} index={i} />
      ))}
    </div>
  );
}
