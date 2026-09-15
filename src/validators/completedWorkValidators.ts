import {
  ensurePlainObject,
  optionalDate,
  optionalTrimmedString,
  requireTrimmedString,
} from "./common";

export interface CompletedWorkInput {
  title_en: string;
  title_as: string;
  description_en?: string | null;
  description_as?: string | null;
  work_date?: string | null;
}

export function validateCompletedWorkInput(body: unknown): CompletedWorkInput {
  const obj = ensurePlainObject(body);

  const title_en = requireTrimmedString(obj.title_en, "title_en", 300);
  const title_as = requireTrimmedString(obj.title_as, "title_as", 300);
  const description_en = optionalTrimmedString(obj.description_en, "description_en", 5000);
  const description_as = optionalTrimmedString(obj.description_as, "description_as", 5000);
  const work_date = optionalDate(obj.work_date, "work_date");

  return { title_en, title_as, description_en, description_as, work_date };
}
