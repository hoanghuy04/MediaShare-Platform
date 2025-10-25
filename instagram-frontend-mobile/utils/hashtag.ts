export const extractHashtags = (text: string): string[] => {
  const hashtagRegex = /#[\w\u00C0-\u024F\u1E00-\u1EFF]+/g;
  const matches = text.match(hashtagRegex);
  if (!matches) return [];
  return [...new Set(matches.map(tag => tag.slice(1)))];
};
