export type AssistantTodayEnv = Record<string, string | undefined>;

export function getAssistantToday(
  env: AssistantTodayEnv = process.env,
  clock: () => Date = () => new Date(),
): Date {
  const override = env.ASSISTANT_TODAY?.trim();

  if (!override) {
    return clock();
  }

  const normalizedOverride = /^\d{4}-\d{2}-\d{2}$/.test(override)
    ? `${override}T12:00:00.000Z`
    : override;
  const date = new Date(normalizedOverride);

  return Number.isNaN(date.getTime()) ? clock() : date;
}
