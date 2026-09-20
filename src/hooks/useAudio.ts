import { useState, useEffect, useCallback } from 'react';
import { AlarmSound, AmbientSound } from '../types';
import { soundEngine } from '../services/audio';
import { storageService } from '../services/storage';

export function useAudio() {
  const [ambient, setAmbientState] = useState<AmbientSound>(() => storageService.getSettings().ambient_sound);
  const [ambientVolume, setAmbientVolumeState] = useState<number>(() => storageService.getSettings().ambient_volume);
  const [alarmSound, setAlarmSoundState] = useState<AlarmSound>(() => storageService.getSettings().alarm_sound);
  const [soundVolume, setSoundVolumeState] = useState<number>(() => storageService.getSettings().sound_volume);

  useEffect(() => {
    soundEngine.setAmbient(ambient, ambientVolume);
  }, [ambient, ambientVolume]);

  const setAmbient = useCallback((sound: AmbientSound) => {
    setAmbientState(sound);
    const settings = storageService.getSettings();
    storageService.saveSettings({ ...settings, ambient_sound: sound });
  }, []);

  const setAmbientVolume = useCallback((vol: number) => {
    setAmbientVolumeState(vol);
    soundEngine.setAmbientVolume(vol);
    const settings = storageService.getSettings();
    storageService.saveSettings({ ...settings, ambient_volume: vol });
  }, []);

  const setAlarmSound = useCallback((alarm: AlarmSound) => {
    setAlarmSoundState(alarm);
    const settings = storageService.getSettings();
    storageService.saveSettings({ ...settings, alarm_sound: alarm });
  }, []);

  const setSoundVolume = useCallback((vol: number) => {
    setSoundVolumeState(vol);
    const settings = storageService.getSettings();
    storageService.saveSettings({ ...settings, sound_volume: vol });
  }, []);

  const playAlarm = useCallback((overrideType?: AlarmSound) => {
    soundEngine.playAlarm(overrideType || alarmSound, soundVolume);
  }, [alarmSound, soundVolume]);

  const playClick = useCallback(() => {
    soundEngine.playClick();
  }, []);

  return {
    ambient,
    setAmbient,
    ambientVolume,
    setAmbientVolume,
    alarmSound,
    setAlarmSound,
    soundVolume,
    setSoundVolume,
    playAlarm,
    playClick,
  };
}
