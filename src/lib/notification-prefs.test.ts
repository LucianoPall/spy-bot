import { describe, it, expect } from 'vitest';
import {
  getNotificationPrefs,
  DEFAULT_NOTIFICATION_PREFS,
  NOTIFICATION_PREFS_METADATA_KEY,
} from './notification-prefs';

describe('getNotificationPrefs', () => {
  it('retorna os defaults quando metadata é null/undefined', () => {
    expect(getNotificationPrefs(null)).toEqual(DEFAULT_NOTIFICATION_PREFS);
    expect(getNotificationPrefs(undefined)).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it('retorna os defaults quando não há a chave de prefs', () => {
    expect(getNotificationPrefs({ outra_coisa: 1 })).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it('lê prefs completas do metadata', () => {
    const prefs = {
      emailNewClones: false,
      weeklyDigest: true,
      lowCreditsAlert: false,
    };
    const result = getNotificationPrefs({ [NOTIFICATION_PREFS_METADATA_KEY]: prefs });
    expect(result).toEqual(prefs);
  });

  it('mescla prefs parciais com os defaults', () => {
    const result = getNotificationPrefs({
      [NOTIFICATION_PREFS_METADATA_KEY]: { weeklyDigest: true },
    });
    expect(result).toEqual({
      emailNewClones: DEFAULT_NOTIFICATION_PREFS.emailNewClones,
      weeklyDigest: true,
      lowCreditsAlert: DEFAULT_NOTIFICATION_PREFS.lowCreditsAlert,
    });
  });

  it('ignora valores de tipo errado e usa default', () => {
    const result = getNotificationPrefs({
      [NOTIFICATION_PREFS_METADATA_KEY]: {
        emailNewClones: 'sim',
        weeklyDigest: 1,
        lowCreditsAlert: null,
      },
    });
    expect(result).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });

  it('tolera prefs não-objeto (string/array)', () => {
    expect(
      getNotificationPrefs({ [NOTIFICATION_PREFS_METADATA_KEY]: 'corrompido' })
    ).toEqual(DEFAULT_NOTIFICATION_PREFS);
  });
});
