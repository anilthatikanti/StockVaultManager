export const getAvatarLetters = (fullName: string): string => {
  const nameParts = fullName.trim().split(/\s+/);
  let letters = '';

  if (nameParts.length === 1) {
    letters = nameParts[0].charAt(0);
  } else {
    letters = nameParts[0].charAt(0) + nameParts[1].charAt(0);
  }

  return letters.toUpperCase();
};
