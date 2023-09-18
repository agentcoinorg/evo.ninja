const date = new Date();

// Get the UTC offset in minutes
const utcOffset = date.getTimezoneOffset();

// Convert the timezone to a number (e.g. 'UTC+3' to 3)
const timezoneNumber = Number(timezone.replace('UTC', ''));

// Calculate the timezone offset in minutes
const timezoneOffset = timezoneNumber * 60;

// Calculate the time difference in minutes
const difference = timezoneOffset - utcOffset;

// Add the difference to the current date
const adjustedDate = new Date(date.getTime() + difference * 60000);

return adjustedDate.toISOString();