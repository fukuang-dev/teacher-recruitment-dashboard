export function deadlineDate(value) {
  if (!value) return null;
  const result = new Date(value.length === 10 ? value + "T23:59:59+08:00" : value);
  return Number.isNaN(+result) ? null : result;
}
export function expiredDeadline(value, now = Date.now()) {
  const deadline = deadlineDate(value);
  return deadline !== null && now > +deadline;
}
export function projectionChanged(before, after) {
  return before?.generated_at !== after?.generated_at ||
    JSON.stringify(before?.counts) !== JSON.stringify(after?.counts);
}

export function isCurrentRefresh(watched, current) {
  return Boolean(watched) && watched === current;
}
