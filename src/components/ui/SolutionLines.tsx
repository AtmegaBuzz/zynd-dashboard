"use client";

const LINE_PATTERN = [
  "solution-shape-from-top",
  "solution-line-card-big",
  "solution-line-card-middle",
  "solution-line-card-low",
  "solution-line-card-middle",
  "solution-line-card-big",
  "solution-line-card-biggest",
  "solution-line-card-big",
  "solution-line-card-middle",
  "solution-line-card-low",
  "solution-line-card-middle",
  "solution-line-card-big",
  "solution-line-card-biggest",
  "solution-line-card-big",
  "solution-line-card-middle",
  "solution-line-card-low",
  "solution-line-card-middle",
  "solution-line-card-big",
  "solution-line-card-biggest",
  "solution-line-card-big",
  "solution-line-card-middle",
  "solution-line-card-low",
  "solution-line-card-middle",
  "solution-line-card-big",
  "solution-line-card-biggest",
  "solution-line-card-big",
  "solution-line-card-middle",
  "solution-line-card-low",
  "solution-line-card-middle",
  "solution-line-card-big",
];

export function SolutionLinesTop() {
  return (
    <div className="solution-top-lines-wrap">
      {LINE_PATTERN.map((cls, i) => (
        <div key={i} className={`${cls} top`} />
      ))}
    </div>
  );
}

export function SolutionLinesBottom() {
  return (
    <div className="solution-bottom-lines-wrap">
      {LINE_PATTERN.map((cls, i) => (
        <div key={i} className={`${cls} bottom`} />
      ))}
    </div>
  );
}
