export const ALARM_SOUNDS = [
  { id: 'gentle_chime', name: 'Gentle Chime', description: 'Soft, calming chime' },
  { id: 'morning_bell', name: 'Morning Bell', description: 'Traditional church bell' },
  { id: 'soft_harp', name: 'Soft Harp', description: 'Gentle harp melody' },
  { id: 'worship_tune', name: 'Worship Tune', description: 'Uplifting short melody' },
  { id: 'prayer_call', name: 'Prayer Call', description: 'Peaceful prayer reminder' },
  { id: 'digital_alarm', name: 'Digital Alarm', description: 'Standard digital beep' },
  { id: 'faith_alert', name: 'Faith Alert', description: 'Inspiring alert tone' },
  { id: 'gentle_nudge', name: 'Gentle Nudge', description: 'Soft reminder tap' },
  { id: 'hallelujah', name: 'Hallelujah', description: 'Joyful short tune' },
  { id: 'silent', name: 'Silent (Vibrate)', description: 'Vibration only' },
];

const SOUND_FREQUENCIES = {
  gentle_chime: { notes: [523.25, 659.25, 783.99], durations: [0.15, 0.15, 0.3], delay: 0.1 },
  morning_bell: { notes: [392, 392, 523.25, 523.25], durations: [0.3, 0.3, 0.4, 0.6], delay: 0.2 },
  soft_harp: { notes: [261.63, 329.63, 392, 523.25], durations: [0.2, 0.2, 0.2, 0.4], delay: 0.15 },
  worship_tune: { notes: [523.25, 587.33, 659.25, 783.99, 659.25, 587.33], durations: [0.15, 0.15, 0.15, 0.3, 0.15, 0.3], delay: 0.1 },
  prayer_call: { notes: [440, 440, 523.25, 440, 392], durations: [0.2, 0.2, 0.3, 0.2, 0.4], delay: 0.15 },
  digital_alarm: { notes: [800, 600, 800, 600], durations: [0.1, 0.1, 0.1, 0.2], delay: 0.05 },
  faith_alert: { notes: [587.33, 739.99, 880, 587.33], durations: [0.12, 0.12, 0.25, 0.25], delay: 0.08 },
  gentle_nudge: { notes: [440, 523.25], durations: [0.1, 0.2], delay: 0.1 },
  hallelujah: { notes: [523.25, 659.25, 783.99, 1046.5, 783.99, 659.25, 523.25], durations: [0.1, 0.1, 0.1, 0.3, 0.1, 0.1, 0.4], delay: 0.08 },
};

export const AudioService = {
  audioContext: null,
  gainNode: null,
  isPlaying: false,
  volume: 0.7,

  getContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  },

  async playAlarm(soundId = 'gentle_chime', volume = 0.7) {
    if (this.isPlaying) return;
    this.volume = volume;

    if (soundId === 'silent') {
      this.isPlaying = true;
      await new Promise(resolve => {
        navigator.vibrate?.([200, 100, 200, 100, 200]);
        setTimeout(() => { this.isPlaying = false; resolve(); }, 2000);
      });
      return;
    }

    try {
      const ctx = this.getContext();
      const config = SOUND_FREQUENCIES[soundId] || SOUND_FREQUENCIES.gentle_chime;

      this.isPlaying = true;
      await this._playSequence(ctx, config);
      this.isPlaying = false;
    } catch (e) {
      console.warn('Audio playback failed:', e);
      this.isPlaying = false;
    }
  },

  async _playSequence(ctx, config) {
    return new Promise((resolve) => {
      const { notes, durations, delay } = config;
      let totalTime = ctx.currentTime + 0.05;

      this.gainNode = ctx.createGain();
      this.gainNode.gain.value = this.volume * 0.3;
      this.gainNode.connect(ctx.destination);

      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        osc.type = i < notes.length - 1 ? 'sine' : 'triangle';
        osc.frequency.value = freq;

        const noteGain = ctx.createGain();
        noteGain.gain.setValueAtTime(this.volume * 0.3, totalTime);
        noteGain.gain.exponentialRampToValueAtTime(0.001, totalTime + durations[i]);

        osc.connect(noteGain);
        noteGain.connect(this.gainNode);

        osc.start(totalTime);
        osc.stop(totalTime + durations[i] + 0.05);

        totalTime += durations[i] + delay;
      });

      setTimeout(resolve, (totalTime - ctx.currentTime) * 1000 + 200);
    });
  },

  playAlarmLoop(soundId = 'gentle_chime', interval = 5000, times = 3) {
    let count = 0;
    const play = async () => {
      if (count < times) {
        await this.playAlarm(soundId);
        count++;
        setTimeout(play, interval);
      }
    };
    play();
  },

  stopAlarm() {
    this.isPlaying = false;
    if (this.audioContext) {
      this.audioContext.close().catch(() => {});
      this.audioContext = null;
    }
  },

  async snooze(snoozeMinutes = 5) {
    this.stopAlarm();
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, snoozeMinutes * 60 * 1000);
    });
  },

  vibrate(pattern = [200, 100, 200]) {
    if (navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  },
};
