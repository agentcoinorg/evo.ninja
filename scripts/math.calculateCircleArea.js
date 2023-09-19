if (typeof radius !== 'number' || radius <= 0) {
  throw new Error('Invalid radius. Please provide a positive number.');
}

return Math.PI * Math.pow(radius, 2);