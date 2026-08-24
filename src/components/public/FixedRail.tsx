import LocalTime from './LocalTime';

/** Rail metadata tetap di bawah layar — © | jam lokal | scroll cue.
 *  Pola khas situs nominasi Awwwards (ala .aside Izanami). */
export default function FixedRail({ siteName }: { siteName: string }) {
  return (
    <div className="fixed-rail" aria-hidden="true">
      <span>© {new Date().getFullYear()} {siteName}</span>
      <LocalTime />
      <span className="rail-scroll">Scroll</span>
    </div>
  );
}
