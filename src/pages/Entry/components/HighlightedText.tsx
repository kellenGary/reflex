import { Platform, Text, type TextStyle } from 'react-native';

import { signalColor } from '@/lib/signals';
import type { Highlight, Signal } from '@/lib/types';

// Browsers let us set the underline's thickness and distance from the text; phones draw their own fixed underline.
const UNDERLINE_WEB = Platform.OS === 'web' ? { textDecorationThickness: 3, textUnderlineOffset: 4 } : {};

type Segment = { text: string; signal?: Signal };

/** Splits `text` into plain and highlighted runs. Overlapping or missing phrases are skipped. */
export function segment(text: string, highlights: Highlight[]): Segment[] {
  const spans = highlights
    .map((h) => ({ start: text.indexOf(h.text), length: h.text.length, signal: h.signal }))
    .filter((s) => s.start >= 0 && s.length > 0)
    .sort((a, b) => a.start - b.start);

  const out: Segment[] = [];
  let cursor = 0;
  for (const span of spans) {
    if (span.start < cursor) continue;
    if (span.start > cursor) out.push({ text: text.slice(cursor, span.start) });
    out.push({ text: text.slice(span.start, span.start + span.length), signal: span.signal });
    cursor = span.start + span.length;
  }
  if (cursor < text.length) out.push({ text: text.slice(cursor) });
  return out;
}

export function HighlightedText({ text, highlights, show }: { text: string; highlights: Highlight[]; show: boolean }) {
  return (
    <Text className="text-[19px] leading-8 text-ink">
      {segment(text, highlights).map((s, i) => (
        <Text
          key={i}
          style={
            show && s.signal
              ? ({
                  textDecorationLine: 'underline',
                  textDecorationColor: signalColor(s.signal),
                  textDecorationStyle: 'solid',
                  ...UNDERLINE_WEB,
                } as TextStyle)
              : undefined
          }
        >
          {s.text}
        </Text>
      ))}
    </Text>
  );
}
