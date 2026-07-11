class AudioSynthesizer {
  private ctx: AudioContext | null = null;
  private masterVolume: GainNode | null = null;
  private musicVolume: GainNode | null = null;
  private sfxVolume: GainNode | null = null;
  
  private isMusicPlaying = false;
  private musicInterval: any = null;

  public musicEnabled = true;
  public sfxEnabled = true;

  constructor() {
    // Lazy initialisation to prevent browser autoplay warnings
  }

  private init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtxClass();
      
      // Setup Gain Nodes
      this.masterVolume = this.ctx.createGain();
      this.masterVolume.gain.setValueAtTime(0.5, this.ctx.currentTime);
      this.masterVolume.connect(this.ctx.destination);

      this.musicVolume = this.ctx.createGain();
      this.musicVolume.gain.setValueAtTime(0.3, this.ctx.currentTime);
      this.musicVolume.connect(this.masterVolume);

      this.sfxVolume = this.ctx.createGain();
      this.sfxVolume.gain.setValueAtTime(0.6, this.ctx.currentTime);
      this.sfxVolume.connect(this.masterVolume);
    } catch (e) {
      console.warn('Web Audio API not supported on this device');
    }
  }

  public resume() {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolume(pct: number) {
    this.resume();
    if (this.masterVolume && this.ctx) {
      this.masterVolume.gain.setValueAtTime(Math.max(0, Math.min(1, pct)), this.ctx.currentTime);
    }
  }

  // Plays a standard synth note
  private playNote(freq: number, duration: number, type: OscillatorType = 'sine', gainStart = 0.2, fadeTime = 0.1) {
    this.resume();
    if (!this.ctx || !this.sfxEnabled || !this.sfxVolume) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

    gainNode.gain.setValueAtTime(gainStart, this.ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(this.sfxVolume);

    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }

  // SFX: Correct answer chime
  public playCorrect() {
    this.resume();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    
    // Quick ascending C5 - E5 chime
    this.playNote(523.25, 0.15, 'triangle', 0.25); // C5
    setTimeout(() => {
      this.playNote(659.25, 0.25, 'sine', 0.2); // E5
    }, 100);
  }

  // SFX: Wrong answer buzzer
  public playWrong() {
    this.resume();
    if (!this.ctx) return;
    
    // Buzz sound decaying down
    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.4);

    gainNode.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.4);

    osc.connect(gainNode);
    gainNode.connect(this.sfxVolume!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.4);
  }

  // SFX: Beep warning
  public playBeep() {
    this.playNote(880, 0.08, 'sine', 0.15);
  }

  // SFX: Rope pulling friction strain
  public playRopePull() {
    this.resume();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gainNode = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(280, this.ctx.currentTime + 0.3);

    gainNode.gain.setValueAtTime(0.25, this.ctx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.3);

    osc.connect(gainNode);
    gainNode.connect(this.sfxVolume!);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.3);
  }

  // SFX: Round start fanfare
  public playRoundStart() {
    this.resume();
    if (!this.ctx) return;
    
    const scale = [261.63, 329.63, 392.00, 523.25]; // C major chord
    scale.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.3, 'sine', 0.15);
      }, idx * 80);
    });
  }

  // SFX: Celebration / Victory fanfare
  public playVictory() {
    this.resume();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99, 1046.50]; // Arpeggio C Major
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        this.playNote(freq, 0.4, 'sine', 0.2);
      }, idx * 100);
    });

    // Final triumphant chord
    setTimeout(() => {
      this.playNote(523.25, 1.2, 'triangle', 0.15);
      this.playNote(659.25, 1.2, 'sine', 0.15);
      this.playNote(783.99, 1.2, 'sine', 0.15);
      this.playNote(1046.50, 1.2, 'sine', 0.15);
    }, 800);
  }

  // Background Music: Loop of procedural synth music
  public startMusic() {
    this.resume();
    if (!this.musicEnabled || this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Simple procedurally generated rhythmic low-frequency ambient notes (arpeggiator loop)
    let beat = 0;
    const melody = [
      130.81, 146.83, 164.81, 196.00, // C3, D3, E3, G3
      130.81, 164.81, 196.00, 220.00  // C3, E3, G3, A3
    ];

    this.musicInterval = setInterval(() => {
      if (!this.ctx || !this.musicEnabled || !this.musicVolume) return;
      
      const currentNote = melody[beat % melody.length];
      
      // Base synth chord
      const osc = this.ctx.createOscillator();
      const gainNode = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(currentNote, this.ctx.currentTime);

      gainNode.gain.setValueAtTime(0.06, this.ctx.currentTime);
      gainNode.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.9);

      osc.connect(gainNode);
      gainNode.connect(this.musicVolume);

      osc.start();
      osc.stop(this.ctx.currentTime + 1.0);

      beat++;
    }, 1000);
  }

  public stopMusic() {
    if (this.musicInterval) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
    this.isMusicPlaying = false;
  }

  public toggleMusic() {
    this.musicEnabled = !this.musicEnabled;
    if (this.musicEnabled) {
      this.startMusic();
    } else {
      this.stopMusic();
    }
  }

  public toggleSfx() {
    this.sfxEnabled = !this.sfxEnabled;
  }
}

export const audio = new AudioSynthesizer();
export default audio;
