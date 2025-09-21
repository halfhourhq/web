export function generate_ics({ title, start, end, description, location }) {

  const format_date = date => date.toISOString().replace(/-|:|\.\d{3}/g, "")
  const escape_ics = text => text.replace(/[,\\;]/g, (match) => `\\${match}`)

  const ics_content = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elela//EN",
    "BEGIN:VEVENT",
    `UID:${Date.now()}@elela.online`, // Unique ID
    `DTSTAMP:${format_date(new Date())}`,
    `DTSTART:${format_date(start)}`,
    `DTEND:${format_date(end)}`,
    `SUMMARY:${escape_ics(title)}`,
    `DESCRIPTION:${escape_ics(description)}`,
    `LOCATION:${escape_ics(location)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n"); // Use `\r\n` for ICS compliance

  return new Blob([ics_content], { type: "text/calendar;charset=utf-8" });
}

export function add_to_calendar({ title, start, end, description, location }) {
  const ics_blob = generate_ics({ title, start, end, description, location })
  const ics_url = URL.createObjectURL(ics_blob)

  const download_link = document.createElement("a");
  download_link.href = ics_url;
  download_link.download = `${title.replace(/\s+/g, "_")}.ics`
  document.body.appendChild(download_link)
  download_link.click()
  document.body.removeChild(download_link)
}