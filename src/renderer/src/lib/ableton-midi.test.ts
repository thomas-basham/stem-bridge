import { describe, expect, it } from 'vitest';
import { getMidiClipFileName, parseAbletonMidiClips, writeMidiClip } from '@shared/ableton-midi';

const abletonXml = `
<Ableton>
  <LiveSet>
    <Tracks>
      <MidiTrack Id="12">
        <Name>
          <EffectiveName Value="1-Midnight Chase Bass" />
          <UserName Value="" />
        </Name>
        <MidiClip Id="3" Time="16">
          <CurrentStart Value="16" />
          <CurrentEnd Value="48" />
          <Loop>
            <LoopStart Value="0" />
            <LoopEnd Value="32" />
            <LoopOn Value="false" />
          </Loop>
          <Name Value="Bass Clip" />
          <Notes>
            <KeyTracks>
              <KeyTrack Id="0">
                <Notes>
                  <MidiNoteEvent Time="4" Duration="0.5" Velocity="100" OffVelocity="64" IsEnabled="true" NoteId="1" />
                  <MidiNoteEvent Time="5" Duration="0.5" Velocity="100" OffVelocity="64" IsEnabled="false" NoteId="2" />
                </Notes>
                <MidiKey Value="53" />
              </KeyTrack>
              <KeyTrack Id="1">
                <Notes>
                  <MidiNoteEvent Time="0" Duration="1" Velocity="80" OffVelocity="32" IsEnabled="true" NoteId="3" />
                </Notes>
                <MidiKey Value="57" />
              </KeyTrack>
            </KeyTracks>
          </Notes>
        </MidiClip>
      </MidiTrack>
    </Tracks>
  </LiveSet>
</Ableton>`;

describe('Ableton MIDI extraction', () => {
  it('extracts enabled MIDI notes from Ableton XML clips', () => {
    const clips = parseAbletonMidiClips(abletonXml);

    expect(clips).toHaveLength(1);
    expect(clips[0]).toMatchObject({
      id: '3',
      trackName: '1-Midnight Chase Bass',
      clipName: 'Bass Clip',
      arrangementTime: 16,
      currentStart: 16,
      currentEnd: 48,
      loopStart: 0,
      loopEnd: 32,
      loopOn: false,
    });
    expect(clips[0].notes).toEqual([
      {
        pitch: 57,
        time: 0,
        duration: 1,
        velocity: 80,
        offVelocity: 32,
      },
      {
        pitch: 53,
        time: 4,
        duration: 0.5,
        velocity: 100,
        offVelocity: 64,
      },
    ]);
  });

  it('writes a standard MIDI file for an extracted clip', () => {
    const [clip] = parseAbletonMidiClips(abletonXml);
    const midiFile = writeMidiClip(clip);
    const header = String.fromCharCode(...midiFile.slice(0, 4));
    const trackHeader = String.fromCharCode(...midiFile.slice(14, 18));

    expect(header).toBe('MThd');
    expect(trackHeader).toBe('MTrk');
    expect(midiFile.length).toBeGreaterThan(32);
    expect(getMidiClipFileName(clip, 0)).toBe('1. 1-Midnight Chase Bass - Bass Clip.mid');
  });
});
