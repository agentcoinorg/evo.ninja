const messages = [
  'Have a great day!',
  'You are doing great!',
  'Keep up the good work!',
  'You are amazing!',
  'Believe in yourself!'
];

const randomIndex = Math.floor(Math.random() * messages.length);

return messages[randomIndex];