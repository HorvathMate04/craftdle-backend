export function getCurrentDate(){
    let now = new Date();
    let offset = now.getTimezoneOffset();
    offset = Math.abs(offset / 60);
    now.setHours(now.getHours() + offset);
    return now
}