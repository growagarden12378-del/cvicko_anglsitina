import { DONATE_URL } from '@/lib/config';

export default function Support() {
  return (
    <div className="donate">
      <span>Páči sa ti táto stránka?</span>
      <a href={DONATE_URL} target="_blank" rel="noopener noreferrer">Prispieť</a>
    </div>
  );
}
