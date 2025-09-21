export function get_cookie(name) {
  const cookieArray = document.cookie.split('; ');
  const cookie = cookieArray.find(row => row.startsWith(`${name}=`));
  return cookie ? decodeURIComponent(cookie.split('=')[1]) : null;
}