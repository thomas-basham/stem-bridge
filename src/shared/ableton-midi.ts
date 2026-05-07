export interface AbletonMidiNote {
  pitch: number;
  time: number;
  duration: number;
  velocity: number;
  offVelocity: number;
}

export interface AbletonMidiClip {
  id: string;
  trackName: string;
  clipName: string;
  arrangementTime: number;
  currentStart: number;
  currentEnd: number;
  loopStart: number;
  loopEnd: number;
  loopOn: boolean;
  notes: AbletonMidiNote[];
}

const ticksPerQuarterNote = 480;

const decodeXmlValue = (value: string): string => {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
};

const readAttribute = (source: string, name: string): string | null => {
  const match = source.match(new RegExp(`${name}="([^"]*)"`));
  return match ? decodeXmlValue(match[1]) : null;
};

const readValueNode = (source: string, nodeName: string): string | null => {
  const match = source.match(new RegExp(`<${nodeName}\\s+Value="([^"]*)"\\s*/>`));
  return match ? decodeXmlValue(match[1]) : null;
};

const readNumber = (value: string | null, fallback = 0): number => {
  if (value === null) {
    return fallback;
  }

  const parsedValue = Number(value);
  return Number.isFinite(parsedValue) ? parsedValue : fallback;
};

const readBoolean = (value: string | null): boolean => value === 'true';

const sanitizeTrackName = (value: string): string => {
  return value.trim() || 'Ableton MIDI Track';
};

export const sanitizeMidiFileName = (value: string): string => {
  const sanitized = value
    .split('')
    .map((character) => {
      const charCode = character.charCodeAt(0);
      return charCode <= 31 || /[<>:"/\\|?*]/.test(character) ? '-' : character;
    })
    .join('')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 120);

  return sanitized || 'Ableton MIDI Clip';
};

export const parseAbletonMidiClips = (xml: string): AbletonMidiClip[] => {
  const clips: AbletonMidiClip[] = [];
  const trackMatches = xml.matchAll(/<MidiTrack\b[^>]*>([\s\S]*?)<\/MidiTrack>/g);

  for (const trackMatch of trackMatches) {
    const trackXml = trackMatch[1];
    const trackName = sanitizeTrackName(
      readValueNode(trackXml, 'UserName') || readValueNode(trackXml, 'EffectiveName') || '',
    );
    const clipMatches = trackXml.matchAll(/<MidiClip\b([^>]*)>([\s\S]*?)<\/MidiClip>/g);

    for (const clipMatch of clipMatches) {
      const clipAttributes = clipMatch[1];
      const clipXml = clipMatch[2];
      const notes: AbletonMidiNote[] = [];
      const keyTrackMatches = clipXml.matchAll(/<KeyTrack\b[^>]*>([\s\S]*?)<\/KeyTrack>/g);

      for (const keyTrackMatch of keyTrackMatches) {
        const keyTrackXml = keyTrackMatch[1];
        const pitch = readNumber(readValueNode(keyTrackXml, 'MidiKey'), -1);

        if (pitch < 0 || pitch > 127) {
          continue;
        }

        const noteMatches = keyTrackXml.matchAll(/<MidiNoteEvent\b([^>]*)\/>/g);

        for (const noteMatch of noteMatches) {
          const noteAttributes = noteMatch[1];

          if (!readBoolean(readAttribute(noteAttributes, 'IsEnabled'))) {
            continue;
          }

          notes.push({
            pitch,
            time: readNumber(readAttribute(noteAttributes, 'Time')),
            duration: Math.max(0, readNumber(readAttribute(noteAttributes, 'Duration'))),
            velocity: Math.min(
              127,
              Math.max(1, Math.round(readNumber(readAttribute(noteAttributes, 'Velocity'), 100))),
            ),
            offVelocity: Math.min(
              127,
              Math.max(0, Math.round(readNumber(readAttribute(noteAttributes, 'OffVelocity'), 64))),
            ),
          });
        }
      }

      if (notes.length === 0) {
        continue;
      }

      const clipId = readAttribute(clipAttributes, 'Id') || String(clips.length + 1);
      const clipName = readValueNode(clipXml, 'Name') || '';

      clips.push({
        id: clipId,
        trackName,
        clipName: clipName.trim(),
        arrangementTime: readNumber(readAttribute(clipAttributes, 'Time')),
        currentStart: readNumber(readValueNode(clipXml, 'CurrentStart')),
        currentEnd: readNumber(readValueNode(clipXml, 'CurrentEnd')),
        loopStart: readNumber(readValueNode(clipXml, 'LoopStart')),
        loopEnd: readNumber(readValueNode(clipXml, 'LoopEnd')),
        loopOn: readBoolean(readValueNode(clipXml, 'LoopOn')),
        notes: notes.sort((left, right) => {
          if (left.time !== right.time) {
            return left.time - right.time;
          }

          return left.pitch - right.pitch;
        }),
      });
    }
  }

  return clips;
};

const encodeText = (value: string): number[] => {
  return Array.from(new TextEncoder().encode(value));
};

const encodeUInt16 = (value: number): number[] => [(value >> 8) & 0xff, value & 0xff];

const encodeUInt32 = (value: number): number[] => [
  (value >> 24) & 0xff,
  (value >> 16) & 0xff,
  (value >> 8) & 0xff,
  value & 0xff,
];

const encodeVariableLengthQuantity = (value: number): number[] => {
  let buffer = Math.max(0, Math.round(value)) & 0x7f;
  let nextValue = Math.max(0, Math.round(value)) >> 7;

  while (nextValue > 0) {
    buffer <<= 8;
    buffer |= (nextValue & 0x7f) | 0x80;
    nextValue >>= 7;
  }

  const bytes: number[] = [];

  while (true) {
    bytes.push(buffer & 0xff);

    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }

  return bytes;
};

const beatToTick = (beat: number): number => {
  return Math.max(0, Math.round(beat * ticksPerQuarterNote));
};

export const writeMidiClip = (clip: AbletonMidiClip): Uint8Array => {
  const events: Array<{ tick: number; order: number; bytes: number[] }> = [
    (() => {
      const trackNameBytes = encodeText(clip.trackName);
      return {
        tick: 0,
        order: 0,
        bytes: [
          0xff,
          0x03,
          ...encodeVariableLengthQuantity(trackNameBytes.length),
          ...trackNameBytes,
        ],
      };
    })(),
  ];

  clip.notes.forEach((note) => {
    const startTick = beatToTick(note.time);
    const endTick = beatToTick(note.time + note.duration);

    events.push({
      tick: startTick,
      order: 1,
      bytes: [0x90, note.pitch, note.velocity],
    });
    events.push({
      tick: endTick,
      order: 0,
      bytes: [0x80, note.pitch, note.offVelocity],
    });
  });

  events.sort((left, right) => {
    if (left.tick !== right.tick) {
      return left.tick - right.tick;
    }

    return left.order - right.order;
  });

  const trackBytes: number[] = [];
  let previousTick = 0;

  events.forEach((event) => {
    trackBytes.push(...encodeVariableLengthQuantity(event.tick - previousTick), ...event.bytes);
    previousTick = event.tick;
  });

  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  return new Uint8Array([
    ...encodeText('MThd'),
    ...encodeUInt32(6),
    ...encodeUInt16(0),
    ...encodeUInt16(1),
    ...encodeUInt16(ticksPerQuarterNote),
    ...encodeText('MTrk'),
    ...encodeUInt32(trackBytes.length),
    ...trackBytes,
  ]);
};

export const getMidiClipFileName = (clip: AbletonMidiClip, index: number): string => {
  const clipLabel = clip.clipName ? ` - ${clip.clipName}` : '';
  return `${sanitizeMidiFileName(`${index + 1}. ${clip.trackName}${clipLabel}`)}.mid`;
};
