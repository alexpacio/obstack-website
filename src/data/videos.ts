/**
 * The demo recording, as a catalogue. One full journey plus the chapters it is
 * cut from, so the home page and /demo quote the same titles and run times.
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
  id: 'journey',
  label: 'Obstack / a real incident journey',
  seconds: 131,
  alt:
    'Obstack demo: explore metrics, logs and traces in Grafana, review a PageRoot alarm, then investigate with Aurora.',
};

export const CHAPTERS: readonly Chapter[] = [
  {
    id: 'grafana',
    label: 'Grafana / signals',
    seconds: 48,
    title: 'Explore your signals',
    text:
      'Open Grafana, inspect application metrics, search OTLP logs and follow a request through its trace.',
    alt: 'Application metrics, OTLP logs and a distributed trace in Grafana.',
  },
  {
    id: 'pageroot',
    label: 'PageRoot / the alarm',
    seconds: 23,
    title: 'Review the alarm',
    text:
      'Open a PageRoot alert group and inspect the alarm raised by real Python application failures.',
    alt: 'A PageRoot alert group raised by Python application failures.',
  },
  {
    id: 'aurora',
    label: 'Aurora / the investigation',
    seconds: 48,
    title: 'Investigate with context',
    text:
      'Review Aurora incidents and ask the model to retrieve the evidence through the Grafana and PageRoot MCP servers.',
    alt: 'Aurora answering an incident question with evidence pulled through MCP.',
  },
];

/** `131` → `2:11`, the run time as a player shows it. */
export function runTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}
