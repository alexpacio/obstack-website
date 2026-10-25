/**
 * The demo recording, as a catalogue. The Grafana signals clip and its chapter, so the home page and /demo quote the same titles and run times.
 * The retired incident recordings and original catalogue are retained in the archive.
 *
 * Every clip ships as `/videos/obstack-<id>.mp4`, `/videos/<id>-en.vtt` and
 * `/videos/<id>-poster.jpg`; `VideoPlayer` derives those three paths from `id`.
 */

export interface Clip {
  id: string;
  /** Mono label in the player's title bar. */
  label: string;
  /** Run time in seconds, straight off the file. */
  seconds: number;
  /** Spoken-language description of what the clip shows, for screen readers. */
  alt: string;
}

export interface Chapter extends Clip {
  /** Chapter heading on /demo. */
  title: string;
  text: string;
}

export const JOURNEY: Clip = {
  id: 'grafana',
  label: 'Grafana / signals',
  seconds: 48,
  alt: 'Application metrics, OTLP logs and a distributed trace in Grafana.',
};

export const CHAPTERS: readonly Chapter[] = [{
  ...JOURNEY,
  title: 'Explore your signals',
  text: 'Open Grafana, inspect application metrics, search OTLP logs and follow a request through its trace.',
}];

/** `131` → `2:11`, the run time as a player shows it. */
export function runTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
