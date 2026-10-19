import { addDays, type HebrewOnah } from './hebrewCalendar';
import { minhagRegistry } from './minhagim';
import { makeResult, ohrZaruaBefore, tag, uniqueOnot, type Target } from './results';
import type { Chumrot, Minhag, Period, VesetResult } from './types';

/**
 * Onah beinonit, counted from the latest period only (pass the latest period).
 * Day 30 counts the period day as day 1 (29 days later); the base onot come from the minhag.
 * Chumrot:
 * - Ohr Zarua: also the onah before each base onah
 * - Kreisi uPleisi: the whole halachic day of day 30 (never day 31)
 * - both on and the period is at night: `nightConflict` picks both / only one
 * - Chavot Daat: day 31 as well, same onot; Ohr Zarua there only with `ohrZaruaOnDay31`
 * Source: Shulchan Aruch Yoreh De'ah 189:2; rules as set in docs/חישובי-עונות-v1.docx §2.
 */
export function calcOnahBeinonit(
  latest: Period,
  minhag: Minhag,
  chumrot: Chumrot,
): VesetResult[] {
  const baseOnot = minhagRegistry[minhag].beinonitOnot(latest.onah);
  const day30 = addDays(latest.dateHebrew, 29);

  const conflict =
    chumrot.ohrZarua && chumrot.kreisiUpleisi && latest.onah === 'night';
  const ohrZarua =
    chumrot.ohrZarua && !(conflict && chumrot.nightConflict === 'kreisiUpleisi');
  const kreisiUpleisi =
    chumrot.kreisiUpleisi && !(conflict && chumrot.nightConflict === 'ohrZarua');

  const day30Base: HebrewOnah[] = baseOnot.map((onah) => ({ date: day30, onah }));
  const targets: Target[] = tag(day30Base, 'main');
  if (kreisiUpleisi) {
    // The other onah of day 30; the base onot keep their own reason.
    const added: HebrewOnah[] = (['night', 'day'] as const)
      .filter((onah) => !baseOnot.includes(onah))
      .map((onah) => ({ date: day30, onah }));
    targets.push(...tag(added, 'kreisiUpleisi'));
  }
  if (ohrZarua) {
    targets.push(...ohrZaruaBefore(day30Base));
  }

  if (chumrot.chavotDaat) {
    const day31 = addDays(latest.dateHebrew, 30);
    const day31Base: HebrewOnah[] = baseOnot.map((onah) => ({ date: day31, onah }));
    targets.push(...tag(day31Base, 'chavotDaat'));
    if (chumrot.ohrZarua && chumrot.ohrZaruaOnDay31) {
      targets.push(...ohrZaruaBefore(day31Base));
    }
  }

  return uniqueOnot(targets).map((target) =>
    makeResult('onahBeinonit', latest, target, minhag),
  );
}

