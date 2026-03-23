import {checkInRepository} from './checkInRepository';
import {habitRepository} from './habitRepository';
import {tagRepository} from './tagRepository';
import {getDatabase} from './database';
import {ulid} from '../../utils/ulid';
import {Habit} from '../../types';
import {subDays} from 'date-fns';
import {formatDateString} from '../../utils/dateUtils';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

const NOTES = [
  'In a hole in the ground there lived a hobbit.',
  'When Mr. Bilbo Baggins of Bag End announced that he would shortly be celebrating his eleventy-first birthday with a party of special magnificence, there was much talk and excitement in Hobbiton.',
  'Frodo and Sam gazed out in mingled loathing and wonder on this hateful land.',
  'Pippin looked out from the shelter of Gandalf\u2019s cloak.',
  'Aragorn sped on up the hill.',
  'Frodo was lying face upward on the ground and the monster was bending over him.',
  'The clouds swirled and a cold rain fell upon the ruined fields of the Pelennor.',
];

export const testDataService = {
  async generateCheckIns(days: number): Promise<number> {
    const tags = await tagRepository.loadAllTags();
    const tagIds = tags.map(t => t.id);
    let total = 0;

    for (let d = days; d >= 0; d--) {
      const date = subDays(new Date(), d);
      const count = randomInt(1, 3);

      for (let i = 0; i < count; i++) {
        const hour = randomInt(7, 21);
        const minute = randomInt(0, 59);
        const ts = new Date(date);
        ts.setHours(hour, minute, 0, 0);

        const numTags = randomInt(2, 4);
        const selectedTags = pickRandom(tagIds, numTags);

        const note =
          Math.random() < 0.1
            ? NOTES[randomInt(0, NOTES.length - 1)]
            : undefined;

        await checkInRepository.save({
          id: ulid(),
          timestamp: ts.getTime(),
          tagIds: selectedTags,
          note,
          source: 'manual',
        });
        total++;
      }
    }
    return total;
  },

  async generateHabitCompletions(
    habits: Habit[],
    days: number,
  ): Promise<number> {
    let total = 0;

    for (const habit of habits) {
      for (let d = days; d >= 0; d--) {
        if (Math.random() > 0.7) {
          continue;
        }

        const date = subDays(new Date(), d);
        const dateStr = formatDateString(date);
        const completedAt = new Date(date);
        completedAt.setHours(randomInt(7, 21), randomInt(0, 59), 0, 0);

        await habitRepository.saveCompletion({
          id: ulid(),
          habitId: habit.id,
          date: dateStr,
          count: 1,
          completedAt: completedAt.getTime(),
          source: 'manual',
        });
        total++;
      }
    }
    return total;
  },

  async clearAllData(): Promise<void> {
    const db = getDatabase();
    await db.execute('DELETE FROM check_in_tags');
    await db.execute('DELETE FROM check_ins');
    await db.execute('DELETE FROM habit_completions');
    await db.execute('DELETE FROM notification_outcomes');
  },
};
