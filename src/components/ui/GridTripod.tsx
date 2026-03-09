"use client";

type Corner = "left-bottom-corner" | "right-bottom-corner" | "left-top-corner" | "right-top-corner";

export function GridTripod({ corner, className }: { corner: Corner; className?: string }) {
  const isLeft = corner.startsWith("left");
  return (
    <div className={`grid-box-tripod-wrap ${corner}${className ? ` ${className}` : ""}`}>
      <div className="grid-box-horizontal-line" />
      {isLeft ? (
        <div className="grid-box-vertical-line-right" />
      ) : (
        <div className="grid-box-vertical-line-left" />
      )}
    </div>
  );
}
