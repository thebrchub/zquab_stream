export const MAX_USERNAME_LENGTH = 30;
export const MAX_AVATAR_URL_LENGTH = 512;

export const createZAvatarURL = (username: string, variant: number) => {
  const url = new URL('https://api.dicebear.com/9.x/lorelei/svg');
  url.searchParams.set('seed', `${username}-${variant}`);
  url.searchParams.set('size', '128');
  url.searchParams.set('backgroundColor', 'b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf');
  return url.toString();
};